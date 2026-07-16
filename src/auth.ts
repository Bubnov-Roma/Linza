import type { Adapter } from "@auth/core/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { writeUserAuditLog } from "@/actions/admin/admin-user-actions";
import { createAdminNotification } from "@/actions/notification-actions";
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

		// ── Вход по invite-токену ──────────────────────────────
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
		// вход по паролю
		Credentials({
			id: "password",
			name: "Password",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;

				const email = credentials.email as string;
				const password = credentials.password as string;

				const user = await prisma.user.findUnique({
					where: { email },
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
						role: true,
						isBlocked: true,
						password: true,
						nickname: true,
						extraPhone: true,
						phone: true,
					},
				});

				if (!user || user.isBlocked || !user.password) return null;

				const isValid = await bcrypt.compare(password, user.password);
				if (!isValid) return null;

				return {
					id: user.id,
					name: user.name,
					email: user.email,
					image: user.image,
					role: user.role,
					nickname: user.nickname,
					extraPhone: user.extraPhone,
					phone: user.phone,
				};
			},
		}),
	],
	events: {
		async signIn({ user, account, isNewUser }) {
			if (user?.id) {
				// Логируем вход в историю клиента
				await writeUserAuditLog(user.id, user.id, user.name ?? "Клиент", {
					action: "Вход в систему",
					meta: {
						provider: account?.provider,
						isNewUser: isNewUser ?? false,
					},
				});
				// Отправляем уведомление админу о новом пользователе
				// Для Credentials провайдеров NextAuth не всегда корректно ставит флаг isNewUser,
				// поэтому надежнее дополнительно проверить дату создания аккаунта в БД.
				const dbUser = await prisma.user.findUnique({
					where: { id: user.id },
					select: { createdAt: true },
				});
				const isNewlyCreated =
					dbUser?.createdAt && Date.now() - dbUser.createdAt.getTime() < 60_000;

				if (isNewUser || isNewlyCreated) {
					await createAdminNotification({
						type: "userRegistered",
						userId: user.id,
						entityType: "user",
					});
				}
			}
		},
		async signOut(payload) {
			let userId: string | undefined;
			let userName = "Клиент";

			// Проверяем, есть ли token (используется при JWT-стратегии)
			if ("token" in payload && payload.token) {
				userId = payload.token.sub;
				userName = payload.token.name || "Клиент";
			}
			// Проверяем, есть ли session (используется при database-стратегии)
			else if ("session" in payload && payload.session) {
				// В PrismaAdapter интерфейс сессии имеет поле userId
				userId = payload.session.userId;
				// Имя в сырой сессии БД не хранится, поэтому останется дефолтное "Клиент"
			}

			if (userId) {
				await writeUserAuditLog(userId, userId, userName, {
					action: "Выход из системы",
				});
			}
		},
	},
});
