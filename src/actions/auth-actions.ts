"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { transporter } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

// --- In-memory rate limiter (для одного инстанса; для multi-instance — Redis) ---
const rl = new Map<string, { count: number; resetAt: number }>();

function allow(key: string, max: number, windowMs: number): boolean {
	const now = Date.now();
	const entry = rl.get(key);
	if (!entry || now > entry.resetAt) {
		rl.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}
	if (entry.count >= max) return false;
	entry.count++;
	return true;
}

// Очищаем устаревшие записи раз в час, чтобы не росла память
setInterval(
	() => {
		const now = Date.now();
		for (const [key, val] of rl.entries()) {
			if (now > val.resetAt) rl.delete(key);
		}
	},
	60 * 60 * 1000
);
// -------------------------------------------------------------------------------

export async function sendOtpCode(email: string, turnstileToken?: string) {
	try {
		// 1. Проверка Cloudflare Turnstile
		if (!turnstileToken) {
			return { error: "Не пройдена проверка безопасности" };
		}

		const verifyRes = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
			}
		);

		const verifyData = await verifyRes.json();
		if (!verifyData.success) {
			return {
				error: "Подозрение на бота. Обновите страницу и попробуйте снова.",
			};
		}
		// --- Rate limiting ---
		const headersList = await headers();
		const ip =
			headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			headersList.get("x-real-ip") ??
			"unknown";

		// 5 запросов в 10 минут на IP
		if (!allow(`ip:${ip}`, 5, 10 * 60_000)) {
			return {
				error: "Слишком много запросов с вашего IP. Попробуйте позже.",
			};
		}
		// 3 запроса в 10 минут на email
		if (!allow(`email:${email}`, 3, 10 * 60_000)) {
			return {
				error: "Слишком много запросов для этого адреса. Попробуйте позже.",
			};
		}

		// --- Валидация email (базовая проверка формата) ---
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email) || email.length > 254) {
			return { error: "Некорректный email" };
		}

		// --- Генерация кода ---
		const code = Math.floor(100000 + Math.random() * 900000).toString();
		const expires = new Date(Date.now() + 5 * 60 * 1000);

		await prisma.verificationToken.deleteMany({
			where: { identifier: email },
		});
		await prisma.verificationToken.create({
			data: { identifier: email, token: code, expires },
		});

		// --- Отправка ---

		await transporter.sendMail({
			from: `"Linza" <${process.env.EMAIL_FROM}>`,
			to: email,
			subject: "Ваш код для входа в Linza",
			html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 400px;">
          <h2>Код подтверждения</h2>
          <p>Ваш код для авторизации:</p>
          <h1 style="letter-spacing: 5px; color: #3b82f6;">${code}</h1>
          <p style="color: #888; font-size: 13px;">Код действителен 5 минут.<br>
          Если вы не запрашивали этот код — просто проигнорируйте письмо.</p>
        </div>
      `,
		});

		transporter.close();
		return { success: true };
	} catch (error) {
		console.error("Ошибка при отправке OTP:", error);
		return { error: "Не удалось отправить код" };
	}
}

/**
 * Устанавливает пароль для текущего залогиненного пользователя.
 * Используется на странице /dashboard/set-password после перехода по инвайту,
 * и в будущем — для смены пароля из профиля.
 */
export async function setPasswordAction(
	newPassword: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Не авторизован" };
		}

		if (newPassword.length < 8) {
			return {
				success: false,
				error: "Пароль должен содержать минимум 8 символов",
			};
		}

		const hash = await bcrypt.hash(newPassword, 10);

		await prisma.user.update({
			where: { id: session.user.id },
			data: { password: hash },
		});

		return { success: true };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка сохранения пароля",
		};
	}
}

/**
 * Отправляет OTP-код сброса пароля на email авторизованного пользователя.
 * Капча не нужна — пользователь уже в системе.
 * Rate-limit: 3 запроса / 10 мин на userId + 3 / 10 мин на IP.
 */
export async function sendPasswordResetOtpAction(): Promise<{
	success?: boolean;
	error?: string;
}> {
	try {
		const session = await auth();
		if (!session?.user?.id || !session.user.email) {
			return { error: "Не авторизован" };
		}

		const { id: userId, email } = session.user;

		// Rate-limit по userId
		if (!allow(`pwd-reset-user:${userId}`, 3, 10 * 60_000)) {
			return { error: "Слишком много запросов. Попробуйте через 10 минут." };
		}

		// Rate-limit по IP
		const headersList = await headers();
		const ip =
			headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			headersList.get("x-real-ip") ??
			"unknown";

		if (!allow(`pwd-reset-ip:${ip}`, 5, 10 * 60_000)) {
			return { error: "Слишком много запросов с вашего IP. Попробуйте позже." };
		}

		// Генерируем 6-значный код, храним с префиксом чтобы не конфликтовать
		// с обычными OTP-токенами авторизации для того же email
		const code = Math.floor(100000 + Math.random() * 900000).toString();
		const identifier = `pwd-reset:${email}`;
		const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

		await prisma.verificationToken.deleteMany({ where: { identifier } });
		await prisma.verificationToken.create({
			data: { identifier, token: code, expires },
		});

		await transporter.sendMail({
			from: `"Linza" <${process.env.EMAIL_FROM}>`,
			to: email,
			subject: "Сброс пароля Linza",
			html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 400px;">
          <h2>Сброс пароля</h2>
          <p>Вы запросили сброс пароля. Введите этот код для подтверждения:</p>
          <h1 style="letter-spacing: 8px; color: #3b82f6; font-size: 36px;">${code}</h1>
          <p style="color: #888; font-size: 13px;">
            Код действителен 10 минут.<br>
            Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
            Ваш пароль останется без изменений.
          </p>
        </div>
      `,
		});

		transporter.close();
		return { success: true };
	} catch (error) {
		console.error("Ошибка отправки OTP сброса пароля:", error);
		return { error: "Не удалось отправить код. Попробуйте позже." };
	}
}

/**
 * Проверяет OTP и сохраняет новый пароль.
 * Токен удаляется сразу после проверки (одноразовый).
 */
export async function resetPasswordWithOtpAction(
	code: string,
	newPassword: string
): Promise<{ success?: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id || !session.user.email) {
			return { error: "Не авторизован" };
		}

		const { id: userId, email } = session.user;

		if (newPassword.length < 8) {
			return { error: "Пароль должен содержать минимум 8 символов" };
		}

		const identifier = `pwd-reset:${email}`;

		const tokenRecord = await prisma.verificationToken.findFirst({
			where: { identifier, token: code },
		});

		if (!tokenRecord) {
			return { error: "Неверный код" };
		}

		if (tokenRecord.expires < new Date()) {
			// Чистим просроченный токен
			await prisma.verificationToken.deleteMany({ where: { identifier } });
			return { error: "Код истёк. Запросите новый." };
		}

		const hash = await bcrypt.hash(newPassword, 10);

		// Транзакция: удаляем токен и сохраняем пароль атомарно
		await prisma.$transaction([
			prisma.verificationToken.delete({
				where: { identifier_token: { identifier, token: code } },
			}),
			prisma.user.update({
				where: { id: userId },
				data: { password: hash },
			}),
		]);

		return { success: true };
	} catch (error) {
		console.error("Ошибка сброса пароля:", error);
		return { error: "Ошибка сохранения пароля. Попробуйте снова." };
	}
}
