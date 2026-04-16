import type { Adapter } from "@auth/core/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
	...authConfig,
	adapter: PrismaAdapter(prisma) as Adapter,
	providers: [
		...authConfig.providers,

		// ── Вход по OTP-коду ──────────────────────────────────
		Credentials({
			id: "otp",
			name: "OTP",
			credentials: {
				email: { label: "Email", type: "email" },
				code: { label: "Code", type: "text" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.code) return null;

				const email = credentials.email as string;
				const code = credentials.code as string;

				const tokenRecord = await prisma.verificationToken.findFirst({
					where: { identifier: email, token: code },
				});

				if (!tokenRecord || tokenRecord.expires < new Date()) {
					throw new Error("Неверный или просроченный код");
				}

				let user = await prisma.user.findUnique({ where: { email } });

				if (!user) {
					user = await prisma.user.create({
						data: { email },
					});
				}

				await prisma.verificationToken.delete({
					where: {
						identifier_token: { identifier: email, token: code },
					},
				});

				return user;
			},
		}),

		// ── Вход по invite-токену (новый) ──────────────────────────────
		// Используется только из signInByUserId() на сервере.
		// Клиентский signIn("invite", ...) намеренно не предусмотрен —
		// consumeInviteTokenAction проверяет токен ДО вызова этого провайдера,
		// поэтому здесь мы уже доверяем userId и просто отдаём пользователя.
		Credentials({
			id: "invite",
			name: "Invite",
			credentials: {
				userId: { label: "User ID", type: "text" },
			},
			async authorize(credentials) {
				if (!credentials?.userId) return null;

				const userId = credentials.userId as string;

				// Проверяем что пользователь существует и не заблокирован
				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
						role: true,
						isBlocked: true,
					},
				});

				if (!user || user.isBlocked) return null;

				// Возвращаем объект совместимый с NextAuth User
				return {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
					role: user.role,
				};
			},
		}),
	],
});
