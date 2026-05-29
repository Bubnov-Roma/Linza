"use server";

import type {
	SupportMessage,
	SupportPlatform,
	SupportThread,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
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

		revalidatePath("/support");
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

		revalidatePath("/support");
		revalidatePath(`/support/${data.threadId}`);
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
