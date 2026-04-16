"use server";

import { headers } from "next/headers";
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

export async function sendOtpCode(email: string) {
	try {
		// --- Rate limiting ---
		const headersList = await headers();
		const ip =
			headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			headersList.get("x-real-ip") ??
			"unknown";

		// 5 запросов в 10 минут на IP
		if (!allow(`ip:${ip}`, 5, 10 * 60_000)) {
			return { error: "Слишком много запросов с вашего IP. Попробуйте позже." };
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
		const expires = new Date(Date.now() + 10 * 60 * 1000);

		await prisma.verificationToken.deleteMany({ where: { identifier: email } });
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
          <p style="color: #888; font-size: 13px;">Код действителен 10 минут.<br>
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
