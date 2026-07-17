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

/**
 * Отправляет обращение из формы поддержки на email компании
 * и высылает клиенту подтверждение о принятии заявки.
 */
export async function sendSupportEmailAction(data: {
	name: string;
	email: string;
	message: string;
	turnstileToken: string;
}): Promise<{ success: boolean; error?: string }> {
	try {
		// 1. Проверка Cloudflare Turnstile
		if (!data.turnstileToken) {
			return { success: false, error: "Не пройдена проверка безопасности" };
		}

		const verifyRes = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${data.turnstileToken}`,
			}
		);

		const verifyData = await verifyRes.json();
		if (!verifyData.success) {
			return {
				success: false,
				error: "Подозрение на бота. Обновите страницу и попробуйте снова.",
			};
		}

		// 2. Rate Limiting для защиты от спама
		const headersList = await headers();
		const ip =
			headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			headersList.get("x-real-ip") ??
			"unknown";

		// Ограничение: 3 сообщения за 10 минут с одного IP/Email
		if (!allow(`support-ip:${ip}`, 3, 10 * 60_000)) {
			return {
				success: false,
				error: "Слишком много обращений. Попробуйте позже.",
			};
		}
		if (!allow(`support-email:${data.email}`, 3, 10 * 60_000)) {
			return {
				success: false,
				error: "Вы уже отправили запрос. Пожалуйста, подождите.",
			};
		}

		// 3. Валидация входных данных
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email) || data.email.length > 254) {
			return { success: false, error: "Некорректный email" };
		}
		if (!data.message.trim() || data.message.length > 5000) {
			return { success: false, error: "Сообщение пустое или слишком длинное" };
		}

		const companyEmail = process.env.SUPPORT_EMAIL || "support@linzarental.ru";

		// 4. Отправка письма Администратору (Менеджеру)
		await transporter.sendMail({
			from: `"Linza Support Form" <${process.env.EMAIL_FROM}>`,
			to: companyEmail,
			replyTo: data.email,
			subject: `📩 Новое обращение: от ${data.name || "Гостя"}`,
			html: `
				<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
					<div style="font-size: 20px; font-weight: bold; color: #3b82f6; margin-bottom: 20px;">Linza CRM</div>
					<h2 style="font-size: 18px; margin-bottom: 10px; color: #1e293b;">Новый запрос в службу поддержки</h2>
					<p><b>Имя:</b> ${data.name || "Не указано"}</p>
					<p><b>Email для связи:</b> <a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a></p>
					<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
					<p style="font-weight: bold; margin-bottom: 5px;">Текст сообщения:</p>
					<div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; white-space: pre-wrap; color: #475569; line-height: 1.5;">${data.message.trim()}</div>
				</div>
			`,
		});

		// 5. Отправка письма Клиенту (Подтверждение)
		await transporter.sendMail({
			from: `"Linza" <${process.env.EMAIL_FROM}>`,
			to: data.email,
			subject: "Ваше обращение в поддержку Linza принято",
			html: `
				<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
					<!-- Логотип-заглушка в стиле Linza -->
					<div style="display: inline-block; padding: 6px 12px; background-color: #3b82f6; color: #fff; font-weight: bold; font-size: 16px; border-radius: 6px; margin-bottom: 20px;">
						Linza
					</div>
					<h2 style="font-size: 18px; margin-top: 0; color: #1e293b;">Здравствуйте, ${data.name || "!"}</h2>
					<p style="font-size: 14px; color: #475569; line-height: 1.5;">
						Мы получили ваше сообщение и уже направили его дежурному менеджеру. 
						Обычно ответ занимает не более 1–2 часов в рабочее время.
					</p>
					<div style="margin: 20px 0; padding: 12px; background-color: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 4px; font-size: 13px; color: #64748b;">
						<strong>Копия вашего вопроса:</strong><br />
						<span style="font-style: italic;">"${data.message.trim().slice(0, 150)}${data.message.length > 150 ? "..." : ""}"</span>
					</div>
					<p style="font-size: 12px; color: #94a3b8; margin-top: 25px;">
						Это автоматическое уведомление. Отвечать на него не нужно.<br />
						Если вы хотите дополнить свой вопрос, дождитесь ответа менеджера.
					</p>
				</div>
			`,
		});

		transporter.close();
		return { success: true };
	} catch (error) {
		console.error("Ошибка при обработке формы поддержки:", error);
		return {
			success: false,
			error: "Не удалось отправить сообщение. Попробуйте позже.",
		};
	}
}
