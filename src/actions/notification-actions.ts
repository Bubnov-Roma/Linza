"use server";

import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { prisma } from "@/lib/prisma";
import type {
	ApplicationStatus,
	CreateNotificationParams,
	DbAdminNotification,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientNotificationResult {
	// Чаты: сколько тредов с последним сообщением от админа
	unreadChats: number;
	// Новые сообщения от админа с lastPolledAt
	newChatMessages: {
		threadId: string;
		threadSubject: string;
		messageContent: string;
		createdAt: string;
	}[];
	// Изменения статуса анкеты
	applicationStatusChanged: {
		newStatus: ApplicationStatus;
		changedAt: string;
		clarificationThreadId?: string | null;
	} | null;
	// Изменения статусов заказов (оба типа)
	bookingStatusChanges: {
		bookingId: string;
		type: "equipment" | "studio";
		newStatus: BookingStatus;
		changedAt: string;
	}[];
	studioBookingStatusChanges: {
		bookingId: string;
		type: "studio";
		newStatus: BookingStatus;
		changedAt: string;
	}[];
	// NEW: авто-промокод доступный клиенту (при статусе APPROVED + триггер)
	autoPromo: {
		code: string;
		type: string;
		value: number;
		minOrderAmount: number | null;
	} | null;
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

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

// ─── CLIENT ───────────────────────────────────────────────────────────────────

export async function pollClientNotificationsAction(
	lastPolledAt: string | null
): Promise<ClientNotificationResult> {
	const empty: ClientNotificationResult = {
		unreadChats: 0,
		newChatMessages: [],
		applicationStatusChanged: null,
		bookingStatusChanges: [],
		studioBookingStatusChanges: [],
		autoPromo: null,
	};

	try {
		const session = await auth();
		if (!session?.user?.id) return empty;
		const userId = session.user.id;
		const since = lastPolledAt ? new Date(lastPolledAt) : null;

		const [threads, application, bookings, studioBookings, autoPromoData] =
			await Promise.all([
				// Все треды клиента с сообщениями
				prisma.supportThread.findMany({
					where: { userId, deletedByClientAt: null },
					select: {
						id: true,
						subject: true,
						clientReadAt: true,
						messages: {
							orderBy: { createdAt: "desc" },
							take: 1,
							select: { isAdmin: true, content: true, createdAt: true },
						},
					},
				}),
				// Статус анкеты + когда обновлялась
				prisma.clientApplication.findUnique({
					where: { userId },
					select: { status: true, updatedAt: true },
				}),
				// Заказы оборудования (updatedAt > since)
				since
					? prisma.booking.findMany({
							where: { userId, updatedAt: { gt: since } },
							select: { id: true, status: true, updatedAt: true },
							orderBy: { updatedAt: "desc" },
						})
					: Promise.resolve([]),
				// Заказы студии (updatedAt > since)
				since
					? prisma.studioBooking.findMany({
							where: { userId, updatedAt: { gt: since } },
							select: { id: true, status: true, updatedAt: true },
							orderBy: { updatedAt: "desc" },
						})
					: Promise.resolve([]),
				// авто-промокод — ищем активный промокод с триггером FIRST_BOOKING_AFTER_APPROVAL
				// только если статус анкеты APPROVED (подтянем через отдельный запрос ниже)
				prisma.promoCode.findFirst({
					where: {
						autoApplyTrigger: "FIRST_BOOKING_AFTER_APPROVAL",
						isActive: true,
						OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
						AND: [
							{ OR: [{ validFrom: null }, { validFrom: { lte: new Date() } }] },
						],
					},
					select: {
						id: true,
						code: true,
						type: true,
						value: true,
						minOrderAmount: true,
						perUserLimit: true,
						usageLimit: true,
						usedCount: true,
					},
				}),
			]);

		// Непрочитанные чаты (последнее сообщение от админа)
		const unreadChats = threads.filter((t) => {
			const lastMsg = t.messages[0];
			if (!lastMsg?.isAdmin) return false;
			if (!t.clientReadAt) return true;
			return new Date(lastMsg.createdAt) > new Date(t.clientReadAt);
		}).length;

		// Новые сообщения от админа с момента lastPolledAt
		const newChatMessages = since
			? threads
					.map((t) => {
						const message = t.messages[0];
						if (!message?.isAdmin) return null;
						if (new Date(message.createdAt) <= since) return null;
						if (
							t.clientReadAt &&
							new Date(message.createdAt) <= new Date(t.clientReadAt)
						)
							return null;

						return {
							threadId: t.id,
							threadSubject: t.subject,
							messageContent: message.content,
							createdAt: message.createdAt.toISOString(),
						};
					})
					.filter(
						(
							message
						): message is {
							threadId: string;
							threadSubject: string;
							messageContent: string;
							createdAt: string;
						} => message !== null
					)
			: [];

		// Изменение статуса анкеты
		const applicationStatusChanged =
			since &&
			application &&
			application.updatedAt > since &&
			// Сообщаем только о финальных статусах — не о PENDING/REVIEWING
			["APPROVED", "REJECTED", "CLARIFICATION", "STANDARD"].includes(
				application.status
			)
				? {
						newStatus: application.status,
						changedAt: application.updatedAt.toISOString(),
					}
				: null;

		let clarificationThreadId: string | null = null;
		if (applicationStatusChanged?.newStatus === "CLARIFICATION") {
			const clarThread = await prisma.supportThread.findFirst({
				where: {
					userId,
					deletedByClientAt: null,
					messages: { some: { isAdmin: true } },
				},
				orderBy: { lastMessageAt: "desc" },
				select: { id: true },
			});
			clarificationThreadId = clarThread?.id ?? null;
		}

		// Изменения статусов заказов оборудования
		const bookingStatusChanges = bookings.map((b) => ({
			bookingId: b.id,
			type: "equipment" as const,
			newStatus: b.status,
			changedAt: b.updatedAt.toISOString(),
		}));

		// Изменения статусов заказов студии
		const studioBookingStatusChanges = studioBookings.map((b) => ({
			bookingId: b.id,
			type: "studio" as const,
			newStatus: b.status,
			changedAt: b.updatedAt.toISOString(),
		}));

		// авто-промокод — проверяем доступность для текущего клиента
		let autoPromo: ClientNotificationResult["autoPromo"] = null;
		if (autoPromoData && application?.status === "APPROVED") {
			// Глобальный лимит
			const globalLimitOk =
				autoPromoData.usageLimit === null ||
				autoPromoData.usedCount < autoPromoData.usageLimit;

			if (globalLimitOk) {
				// Лимит на клиента (по умолчанию 1 для авто-промокодов)
				const perUserLimit = autoPromoData.perUserLimit ?? 1;
				const userUsageCount = await prisma.booking.count({
					where: { userId, promoCode: autoPromoData.code },
				});
				// Также считаем студийные заказы
				const userStudioUsageCount = await prisma.studioBooking.count({
					where: { userId, promoCode: autoPromoData.code },
				});

				if (userUsageCount + userStudioUsageCount < perUserLimit) {
					autoPromo = {
						code: autoPromoData.code,
						type: autoPromoData.type,
						value: autoPromoData.value,
						minOrderAmount: autoPromoData.minOrderAmount,
					};
				}
			}
		}

		return {
			unreadChats,
			newChatMessages,
			applicationStatusChanged: applicationStatusChanged
				? { ...applicationStatusChanged, clarificationThreadId }
				: null,
			bookingStatusChanges,
			studioBookingStatusChanges,
			autoPromo,
		};
	} catch {
		return empty;
	}
}
