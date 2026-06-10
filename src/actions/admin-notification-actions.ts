"use server";

import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { CreateNotificationParams, DbAdminNotification } from "@/types";

// ─── WRITE (fire-and-forget) ──────────────────────────────────────────────────

/**
 * Записывает уведомление в БД.
 * Не бросает исключений — ошибки только логируются,
 * чтобы не блокировать основную операцию.
 */
export async function createAdminNotification(
	params: CreateNotificationParams
): Promise<void> {
	try {
		await prisma.adminNotification.create({
			data: {
				type: params.type,
				userId: params.userId ?? null,
				entityId: params.entityId ?? null,
				entityType: params.entityType ?? null,
				payload: (params.payload ?? {}) as Prisma.InputJsonValue,
			},
		});
	} catch (err) {
		console.error("[AdminNotification] Ошибка записи:", err);
	}
}

// ─── READ (для поллера) ───────────────────────────────────────────────────────

export interface NotificationPollResult {
	// Счётчики для бейджей в сайдбаре (существующая логика)
	pendingBookings: number;
	pendingApps: number;
	pendingStudio: number;
	pendingChats: number;
	// Новые уведомления с момента lastSeenAt
	newNotifications: DbAdminNotification[];
	// Общее число непрочитанных
	unreadCount: number;
}

/**
 * Один запрос вместо 4 отдельных — возвращает все счётчики
 * и новые уведомления для тостов.
 */
export async function pollAdminNotificationsAction(
	lastSeenAt: string | null // ISO-строка, клиент передаёт при каждом поллинге
): Promise<NotificationPollResult> {
	const empty: NotificationPollResult = {
		pendingBookings: 0,
		pendingApps: 0,
		pendingStudio: 0,
		pendingChats: 0,
		newNotifications: [],
		unreadCount: 0,
	};

	try {
		const session = await auth();
		const role = session?.user?.role;
		if (role !== "ADMIN" && role !== "MANAGER") return empty;

		const since = lastSeenAt ? new Date(lastSeenAt) : null;

		const [
			pendingBookings,
			pendingApps,
			pendingStudio,
			pendingChats,
			newNotifications,
			unreadCount,
		] = await Promise.all([
			prisma.booking.count({ where: { status: "PENDING_REVIEW" } }),
			prisma.clientApplication.count({ where: { status: "PENDING" } }),
			prisma.studioBooking.count({ where: { status: "PENDING_REVIEW" } }),
			prisma.supportThread.count({ where: { status: "WAITING_FOR_ADMIN" } }),

			// Уведомления новее lastSeenAt (для тостов)
			since
				? prisma.adminNotification.findMany({
						where: { createdAt: { gt: since } },
						orderBy: { createdAt: "desc" },
						take: 20,
						include: { user: { select: { name: true, email: true } } },
					})
				: Promise.resolve([]),

			prisma.adminNotification.count({ where: { isRead: false } }),
		]);

		return {
			pendingBookings,
			pendingApps,
			pendingStudio,
			pendingChats,
			newNotifications: newNotifications.map((n) => ({
				...n,
				payload: n.payload as Record<string, unknown>,
			})),
			unreadCount,
		};
	} catch (err) {
		console.error("[pollAdminNotifications]", err);
		return empty;
	}
}

// ─── MARK READ ────────────────────────────────────────────────────────────────

export async function markNotificationsReadAction(
	ids: string[]
): Promise<void> {
	if (!ids.length) return;
	try {
		await prisma.adminNotification.updateMany({
			where: { id: { in: ids } },
			data: { isRead: true },
		});
	} catch (err) {
		console.error("[markNotificationsRead]", err);
	}
}

export async function markAllNotificationsReadAction(): Promise<void> {
	try {
		await prisma.adminNotification.updateMany({
			where: { isRead: false },
			data: { isRead: true },
		});
	} catch (err) {
		console.error("[markAllNotificationsRead]", err);
	}
}

// ─── LIST (для панели) ────────────────────────────────────────────────────────

export async function getAdminNotificationsAction(opts?: {
	limit?: number;
	onlyUnread?: boolean;
}): Promise<DbAdminNotification[]> {
	try {
		const session = await auth();
		const role = session?.user?.role;
		if (role !== "ADMIN" && role !== "MANAGER") return [];

		const notifications = await prisma.adminNotification.findMany({
			...(opts?.onlyUnread ? { where: { isRead: false } } : {}),
			orderBy: { createdAt: "desc" },
			take: opts?.limit ?? 50,
			include: { user: { select: { name: true, email: true } } },
		});

		return notifications.map((n) => ({
			...n,
			payload: n.payload as Record<string, unknown>,
		}));
	} catch {
		return [];
	}
}
