"use server";

import type {
	SupportMessage,
	SupportPlatform,
	SupportThread,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAdminNotification } from "@/actions/notification-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type DbSupportThread = SupportThread & {
	user: { id: string; name: string | null; email: string | null };
	messages: Array<{
		id: string;
		content: string;
		createdAt: Date;
		isAdmin: boolean;
		authorId: string;
		isEdited: boolean;
		editedAt: Date | null;
		author?: { name: string | null };
		readBy: Array<{ adminId: string; readAt: Date }>;
	}>;
};

export type DbSupportMessage = SupportMessage & {
	author?: { name: string | null };
	readBy: Array<{ adminId: string; readAt: Date }>;
};

// ─── AUTH HELPERS ────────────────────────────────────────────────────────────

async function requireAuth(): Promise<
	{ ok: true; userId: string } | { ok: false; error: string }
> {
	const session = await auth();
	if (!session?.user?.id) return { ok: false, error: "Требуется авторизация" };
	return { ok: true, userId: session.user.id };
}

async function requireAdminOrManager(): Promise<
	{ ok: true; userId: string } | { ok: false; error: string }
> {
	const session = await auth();
	const role = session?.user?.role;
	if (!session?.user?.id) return { ok: false, error: "Требуется авторизация" };
	if (role !== "ADMIN" && role !== "MANAGER")
		return { ok: false, error: "Недостаточно прав" };
	return { ok: true, userId: session.user.id };
}

// ─── CLIENT: CREATE & MANAGE THREADS ──────────────────────────────────────────

/**
 * Создать новый поток чата (клиент инициирует)
 */
export async function createSupportThreadAction(data: {
	subject: string;
	platform?: SupportPlatform;
	initialMessage?: string;
	contactInfo?: string;
}): Promise<{ success: boolean; thread?: DbSupportThread; error?: string }> {
	const authResult = await requireAuth();
	if (!authResult.ok) return { success: false, error: authResult.error };

	if (!data.subject.trim()) {
		return { success: false, error: "Тема обязательна" };
	}

	try {
		const createData: Parameters<
			typeof prisma.supportThread.create
		>[0]["data"] = {
			userId: authResult.userId,
			subject: data.subject.trim(),
			platform: data.platform || "WEBSITE",
			status: "OPEN",
			contactInfo: data.contactInfo?.trim() || null,
		};

		// Добавляем сообщение только если оно передано
		if (data.initialMessage?.trim()) {
			createData.messages = {
				create: {
					authorId: authResult.userId,
					isAdmin: false,
					content: data.initialMessage.trim(),
				},
			};
		}

		const thread = await prisma.supportThread.create({
			data: createData,
			include: {
				user: { select: { id: true, name: true, email: true } },
				messages: {
					include: {
						author: { select: { name: true } },
						readBy: true,
					},
					orderBy: { createdAt: "asc" },
				},
			},
		});

		await createAdminNotification({
			type: "supportMessageClient",
			userId: authResult.userId,
			entityId: thread.id,
			entityType: "supportThread",
			payload: { subject: data.subject },
		});

		revalidatePath("/dashboard/support");
		return { success: true, thread };
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Неизвестная ошибка";
		return { success: false, error: msg };
	}
}

/**
 * Получить все потоки текущего пользователя
 */
export async function getUserSupportThreadsAction(): Promise<
	DbSupportThread[]
> {
	const authResult = await requireAuth();
	if (!authResult.ok) return [];

	return prisma.supportThread.findMany({
		where: { userId: authResult.userId },
		include: {
			user: { select: { id: true, name: true, email: true } },
			messages: {
				include: {
					author: { select: { name: true } },
					readBy: true,
				},
				orderBy: { createdAt: "asc" },
			},
		},
		orderBy: { lastMessageAt: "desc" },
	});
}

/**
 * Получить конкретный поток по ID
 */
export async function getSupportThreadAction(
	threadId: string
): Promise<{ success: boolean; thread?: DbSupportThread; error?: string }> {
	const authResult = await requireAuth();
	if (!authResult.ok) return { success: false, error: authResult.error };

	const thread = await prisma.supportThread.findUnique({
		where: { id: threadId },
		include: {
			user: { select: { id: true, name: true, email: true } },
			messages: {
				include: {
					author: { select: { name: true } },
					readBy: true,
				},
				orderBy: { createdAt: "asc" },
			},
		},
	});

	if (!thread) return { success: false, error: "Поток не найден" };

	// Проверка доступа: только клиент или админ могут видеть
	if (thread.userId !== authResult.userId) {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Недостаточно прав" };
		}
	}

	return { success: true, thread };
}

// ─── MESSAGING ───────────────────────────────────────────────────────────────

/**
 * Отправить сообщение в поток (клиент или админ)
 */
export async function sendSupportMessageAction(data: {
	threadId: string;
	content: string;
}): Promise<{ success: boolean; message?: DbSupportMessage; error?: string }> {
	const authResult = await requireAuth();
	if (!authResult.ok) return { success: false, error: authResult.error };

	if (!data.content.trim()) {
		return { success: false, error: "Сообщение не может быть пустым" };
	}

	try {
		// Проверка доступа к потоку
		const thread = await prisma.supportThread.findUnique({
			where: { id: data.threadId },
			select: { userId: true },
		});

		if (!thread) return { success: false, error: "Поток не найден" };

		const session = await auth();
		const isAdmin =
			session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

		// Только клиент или админ могут отправлять в этот поток
		if (thread.userId !== authResult.userId && !isAdmin) {
			return { success: false, error: "Недостаточно прав" };
		}

		const message = await prisma.supportMessage.create({
			data: {
				threadId: data.threadId,
				authorId: authResult.userId,
				isAdmin,
				content: data.content.trim(),
			},
			include: {
				author: { select: { name: true } },
				readBy: true,
			},
		});

		// Обновляем lastMessageAt в потоке
		await prisma.supportThread.update({
			where: { id: data.threadId },
			data: {
				lastMessageAt: new Date(),
				status: isAdmin ? "WAITING_FOR_CLIENT" : "WAITING_FOR_ADMIN",
			},
		});

		if (!isAdmin) {
			// const isFirstMessage = thread.messages?.length === 0; // нет — используем флаг
			// Определяем: новый тред или ответ
			// Смотрим на количество сообщений в треде ДО отправки
			const msgCount = await prisma.supportMessage.count({
				where: { threadId: data.threadId },
			});
			await createAdminNotification({
				type: msgCount <= 1 ? "supportMessageClient" : "supportMessageReply",
				userId: authResult.userId,
				entityId: data.threadId,
				entityType: "supportThread",
			});
		}

		revalidatePath("/support");
		revalidatePath(`/dashboard/support/${data.threadId}`);
		revalidatePath("/admin/support");
		return { success: true, message };
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Неизвестная ошибка";
		return { success: false, error: msg };
	}
}

// ─── ADMIN: THREAD MANAGEMENT ────────────────────────────────────────────────

/**
 * Получить все потоки (для админа)
 */
export async function getAllSupportThreadsAction(): Promise<DbSupportThread[]> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return [];

	return prisma.supportThread.findMany({
		include: {
			user: { select: { id: true, name: true, email: true } },
			messages: {
				include: {
					author: { select: { name: true } },
					readBy: true,
				},
				orderBy: { createdAt: "asc" },
			},
		},
		orderBy: { lastMessageAt: "desc" },
	});
}

/**
 * Получить потоки конкретного клиента (для админа)
 */
export async function getClientSupportThreadsAction(
	userId: string
): Promise<{ success: boolean; threads?: DbSupportThread[]; error?: string }> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return { success: false, error: authResult.error };

	// Проверяем, существует ли пользователь
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});

	if (!user) return { success: false, error: "Пользователь не найден" };

	const threads = await prisma.supportThread.findMany({
		where: { userId },
		include: {
			user: { select: { id: true, name: true, email: true } },
			messages: {
				include: {
					author: { select: { name: true } },
					readBy: true,
				},
				orderBy: { createdAt: "asc" },
			},
		},
		orderBy: { lastMessageAt: "desc" },
	});

	return { success: true, threads };
}

/**
 * Закрыть поток (админ)
 */
export async function closeSupportThreadAction(
	threadId: string
): Promise<{ success: boolean; error?: string }> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return { success: false, error: authResult.error };

	try {
		const thread = await prisma.supportThread.findUnique({
			where: { id: threadId },
			select: { status: true },
		});

		if (!thread) return { success: false, error: "Поток не найден" };

		await prisma.supportThread.update({
			where: { id: threadId },
			data: { status: "CLOSED" },
		});

		revalidatePath("/admin/support");
		revalidatePath(`/admin/support/${threadId}`);
		return { success: true };
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Неизвестная ошибка";
		return { success: false, error: msg };
	}
}

/**
 * Переоткрыть закрытый поток (админ)
 */
export async function reopenSupportThreadAction(
	threadId: string
): Promise<{ success: boolean; error?: string }> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return { success: false, error: authResult.error };

	try {
		await prisma.supportThread.update({
			where: { id: threadId },
			data: { status: "OPEN" },
		});

		revalidatePath("/admin/support");
		return { success: true };
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Неизвестная ошибка";
		return { success: false, error: msg };
	}
}

// ─── ADMIN: MESSAGE READ TRACKING ────────────────────────────────────────────

/**
 * Отметить сообщение как прочитанное админом
 */
export async function markSupportMessageAsReadAction(
	messageId: string
): Promise<{ success: boolean; error?: string }> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return { success: false, error: authResult.error };

	try {
		// Проверяем, существует ли сообщение
		const message = await prisma.supportMessage.findUnique({
			where: { id: messageId },
			select: { id: true },
		});

		if (!message) return { success: false, error: "Сообщение не найдено" };

		// Если уже есть запись о прочтении этим админом, не создаём дублю
		await prisma.supportMessageRead.upsert({
			where: {
				messageId_adminId: {
					messageId,
					adminId: authResult.userId,
				},
			},
			update: {
				readAt: new Date(),
			},
			create: {
				messageId,
				adminId: authResult.userId,
			},
		});

		return { success: true };
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Неизвестная ошибка";
		return { success: false, error: msg };
	}
}

/**
 * Получить информацию о том, кто и когда прочитал сообщение
 */
export async function getMessageReadsAction(messageId: string): Promise<{
	success: boolean;
	reads?: Array<{ adminId: string; adminName?: string; readAt: Date }>;
	error?: string;
}> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return { success: false, error: authResult.error };

	try {
		const reads = await prisma.supportMessageRead.findMany({
			where: { messageId },
			include: {
				admin: { select: { name: true } },
			},
		});

		const formatted = reads.map((r) => {
			const item: { adminId: string; readAt: Date; adminName?: string } = {
				adminId: r.adminId,
				readAt: r.readAt,
			};
			if (r.admin.name) {
				item.adminName = r.admin.name;
			}
			return item;
		});

		return { success: true, reads: formatted };
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Неизвестная ошибка";
		return { success: false, error: msg };
	}
}

/**
 * Получить свежие данные потока для polling (клиент или админ)
 */
export async function pollSupportThreadAction(
	threadId: string,
	lastMessageAt: Date
): Promise<{
	hasUpdates: boolean;
	thread?: DbSupportThread;
	error?: string;
}> {
	const authResult = await requireAuth();
	if (!authResult.ok) return { hasUpdates: false, error: authResult.error };

	const thread = await prisma.supportThread.findUnique({
		where: { id: threadId },
		select: { lastMessageAt: true },
	});

	if (!thread) return { hasUpdates: false, error: "Поток не найден" };

	// Если ничего не изменилось — не тянем полные данные
	if (new Date(thread.lastMessageAt) <= new Date(lastMessageAt)) {
		return { hasUpdates: false };
	}

	// Есть обновления — возвращаем полный тред
	const full = await prisma.supportThread.findUnique({
		where: { id: threadId },
		include: {
			user: { select: { id: true, name: true, email: true } },
			messages: {
				include: {
					author: { select: { name: true } },
					readBy: true,
				},
				orderBy: { createdAt: "asc" },
			},
		},
	});

	if (!full) {
		return { hasUpdates: true };
	}

	return { hasUpdates: true, thread: full };
}

/**
 * Получить список тредов для polling (список для клиента/админа)
 * Возвращает только если lastMessageAt самого свежего треда изменился
 */
export async function pollSupportThreadsAction(params: {
	role: "client" | "admin";
	latestThreadAt: Date;
}): Promise<{ hasUpdates: boolean; threads?: DbSupportThread[] }> {
	const authResult = await requireAuth();
	if (!authResult.ok) return { hasUpdates: false };

	const isAdmin = params.role === "admin";

	if (isAdmin) {
		const adminCheck = await requireAdminOrManager();
		if (!adminCheck.ok) return { hasUpdates: false };
	}

	// Смотрим только самый свежий тред
	const latest = isAdmin
		? await prisma.supportThread.findFirst({
				orderBy: { lastMessageAt: "desc" },
				select: { lastMessageAt: true },
			})
		: await prisma.supportThread.findFirst({
				where: { userId: authResult.userId },
				orderBy: { lastMessageAt: "desc" },
				select: { lastMessageAt: true },
			});

	if (!latest) return { hasUpdates: false };
	if (new Date(latest.lastMessageAt) <= new Date(params.latestThreadAt)) {
		return { hasUpdates: false };
	}

	// Есть обновления
	const threads = isAdmin
		? await prisma.supportThread.findMany({
				include: {
					user: { select: { id: true, name: true, email: true } },
					messages: {
						include: { author: { select: { name: true } }, readBy: true },
						orderBy: { createdAt: "asc" },
					},
				},
				orderBy: { lastMessageAt: "desc" },
			})
		: await prisma.supportThread.findMany({
				where: { userId: authResult.userId },
				include: {
					user: { select: { id: true, name: true, email: true } },
					messages: {
						include: { author: { select: { name: true } }, readBy: true },
						orderBy: { createdAt: "asc" },
					},
				},
				orderBy: { lastMessageAt: "desc" },
			});

	return { hasUpdates: true, threads };
}

/**
 * Поиск пользователей для инициации треда (только админ)
 */
export async function searchUsersForSupportAction(query: string): Promise<{
	success: boolean;
	users?: Array<{
		id: string;
		name: string | null;
		email: string | null;
		phone: string | null;
	}>;
	error?: string;
}> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return { success: false, error: authResult.error };

	if (!query.trim() || query.trim().length < 2) {
		return { success: true, users: [] };
	}

	const q = query.trim().toLowerCase();

	const users = await prisma.user.findMany({
		where: {
			OR: [
				{ name: { contains: q, mode: "insensitive" } },
				{ email: { contains: q, mode: "insensitive" } },
			],
			role: "USER",
		},
		select: {
			id: true,
			name: true,
			email: true,
			clientApplication: {
				select: {
					applicationData: true,
				},
			},
		},
		take: 20,
		orderBy: { name: "asc" },
	});

	// Вытаскиваем телефон из applicationData если есть
	const mapped = users.map((u) => {
		const appData = u.clientApplication?.applicationData as {
			personalData?: { phone?: string };
		} | null;
		return {
			id: u.id,
			name: u.name,
			email: u.email,
			phone: appData?.personalData?.phone ?? null,
		};
	});

	return { success: true, users: mapped };
}

/**
 * Создать тред от имени админа (инициация)
 */
export async function createSupportThreadByAdminAction(data: {
	userId: string;
	subject: string;
	initialMessage: string;
	platform?: SupportPlatform;
	contactInfo?: string;
}): Promise<{ success: boolean; thread?: DbSupportThread; error?: string }> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return { success: false, error: authResult.error };

	if (!data.subject.trim()) {
		return { success: false, error: "Тема обязательна" };
	}
	if (!data.initialMessage.trim()) {
		return { success: false, error: "Сообщение обязательно" };
	}

	const targetUser = await prisma.user.findUnique({
		where: { id: data.userId },
		select: { id: true },
	});
	if (!targetUser) return { success: false, error: "Пользователь не найден" };

	const thread = await prisma.supportThread.create({
		data: {
			userId: data.userId,
			subject: data.subject.trim(),
			platform: data.platform || "WEBSITE",
			status: "WAITING_FOR_CLIENT",
			contactInfo: data.contactInfo?.trim() || null,
			messages: {
				create: {
					authorId: authResult.userId,
					isAdmin: true,
					content: data.initialMessage.trim(),
				},
			},
		},
		include: {
			user: { select: { id: true, name: true, email: true } },
			messages: {
				include: {
					author: { select: { name: true } },
					readBy: true,
				},
				orderBy: { createdAt: "asc" },
			},
		},
	});

	revalidatePath("/admin/support");
	revalidatePath(`/dashboard/support`);
	return { success: true, thread };
}

/**
 * Редактировать сообщение (только админ, только своё)
 */
export async function editSupportMessageAction(data: {
	messageId: string;
	content: string;
}): Promise<{ success: boolean; error?: string }> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return { success: false, error: authResult.error };

	if (!data.content.trim()) {
		return { success: false, error: "Сообщение не может быть пустым" };
	}

	const message = await prisma.supportMessage.findUnique({
		where: { id: data.messageId },
		select: { authorId: true, isAdmin: true, threadId: true },
	});

	if (!message) return { success: false, error: "Сообщение не найдено" };
	if (!message.isAdmin)
		return {
			success: false,
			error: "Можно редактировать только сообщения администратора",
		};
	if (message.authorId !== authResult.userId) {
		return {
			success: false,
			error: "Можно редактировать только свои сообщения",
		};
	}

	await prisma.supportMessage.update({
		where: { id: data.messageId },
		data: {
			content: data.content.trim(),
			isEdited: true,
			editedAt: new Date(),
		},
	});

	revalidatePath(`/admin/support/thread/${message.threadId}`);
	return { success: true };
}

/**
 * Количество тредов, ожидающих ответа админа (для поллинга)
 */
export async function getPendingChatsCountAction(): Promise<number> {
	const authResult = await requireAdminOrManager();
	if (!authResult.ok) return 0;

	return prisma.supportThread.count({
		where: { status: "WAITING_FOR_ADMIN" },
	});
}

/**
 * Есть ли у клиента непрочитанные ответы от админа (для поллинга)
 */
export async function getClientUnreadChatsCountAction(): Promise<number> {
	const authResult = await requireAuth();
	if (!authResult.ok) return 0;

	// Треды клиента где последнее сообщение от админа
	const threads = await prisma.supportThread.findMany({
		where: { userId: authResult.userId },
		select: {
			messages: {
				orderBy: { createdAt: "desc" },
				take: 1,
				select: { isAdmin: true },
			},
		},
	});

	return threads.filter((t) => t.messages[0]?.isAdmin === true).length;
}
