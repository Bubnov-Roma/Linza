"use server";

import type { BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudioAvailabilityResult {
	available: boolean;
	conflictStart?: Date;
	conflictEnd?: Date;
}

export interface SubmitStudioBookingInput {
	tariffId: string;
	startDate: Date;
	endDate: Date;
	equipmentIds?: string[];
}

export interface ClientStudioBookingRow {
	id: string;
	tariffName: string;
	tariffPriceAtBooking: number;
	startDate: Date;
	endDate: Date;
	durationHours: number;
	totalAmount: number;
	status: BookingStatus;
	itemsCount: number;
	createdAt: Date;
}

// ─── Availability ─────────────────────────────────────────────────────────────

/**
 * Проверяет, свободна ли студия в заданный период.
 * Учитываются только брони со статусами WAIT_PAYMENT, READY_TO_RENT, ACTIVE.
 * PENDING_REVIEW намеренно НЕ блокирует слот — это «ожидание проверки»,
 * которое не гарантирует занятость.
 */
export async function checkStudioAvailabilityAction(
	startDate: Date,
	endDate: Date,
	excludeBookingId?: string
): Promise<StudioAvailabilityResult> {
	const conflict = await prisma.studioBooking.findFirst({
		where: {
			// Исправлен баг: пустая строка в where.id была некорректна
			...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
			status: {
				in: ["WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"],
			},
			// Перекрытие: существующая бронь начинается до конца нашей И заканчивается после начала нашей
			startDate: { lt: endDate },
			endDate: { gt: startDate },
		},
		select: { startDate: true, endDate: true },
	});

	if (conflict) {
		return {
			available: false,
			conflictStart: conflict.startDate,
			conflictEnd: conflict.endDate,
		};
	}

	return { available: true };
}

/**
 * Возвращает список занятых периодов студии на ближайшие N дней.
 * Используется для отображения календаря доступности.
 */
export async function getStudioBusyPeriodsAction(
	daysAhead = 60
): Promise<{ startDate: Date; endDate: Date }[]> {
	const from = new Date();
	const to = new Date();
	to.setDate(to.getDate() + daysAhead);

	const bookings = await prisma.studioBooking.findMany({
		where: {
			status: {
				in: ["WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"],
			},
			startDate: { lt: to },
			endDate: { gt: from },
		},
		select: { startDate: true, endDate: true },
		orderBy: { startDate: "asc" },
	});

	return bookings;
}

// ─── Equipment for studio ─────────────────────────────────────────────────────

/**
 * Возвращает технику доступную для добавления к аренде студии.
 * Фильтр: studioAvailable=true, priceStudio > 0
 * isAvailable намеренно НЕ проверяется — студийная техника может сдаваться
 * вне зависимости от статуса аренды основного оборудования.
 * Проверяется только пересечение с другими студийными заказами в тот же период.
 */
export async function getStudioAvailableEquipmentAction(
	startDate: Date,
	endDate: Date,
	excludeBookingId?: string
): Promise<
	{
		id: string;
		title: string;
		priceStudio: number;
		imageUrl: string | null;
		categoryName: string;
	}[]
> {
	// ID техники занятой в других заказах студии в этот период
	const busyItems = await prisma.studioBookingItem.findMany({
		where: {
			studioBooking: {
				// Исключаем текущий заказ при редактировании
				...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
				status: {
					in: ["WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"],
				},
				startDate: { lt: endDate },
				endDate: { gt: startDate },
			},
		},
		select: { equipmentId: true },
	});

	const busyIds = busyItems.map((i) => i.equipmentId);

	const equipments = await prisma.equipment.findMany({
		where: {
			studioAvailable: true,
			priceStudio: { gt: 0 },
			...(busyIds.length > 0 ? { id: { notIn: busyIds } } : {}),
		},
		select: {
			id: true,
			title: true,
			priceStudio: true,
			category: { select: { name: true } },
			equipmentImageLinks: {
				take: 1,
				orderBy: { orderIndex: "asc" },
				include: { image: { select: { url: true } } },
			},
		},
		orderBy: { title: "asc" },
	});

	return equipments.map((eq) => ({
		id: eq.id,
		title: eq.title,
		priceStudio: eq.priceStudio,
		imageUrl: eq.equipmentImageLinks[0]?.image.url ?? null,
		categoryName: eq.category.name,
	}));
}

/**
 * Поиск студийной техники по названию (для добавления в существующий заказ).
 * Возвращает только studioAvailable=true позиции.
 */
export async function searchStudioEquipmentAction(
	query: string,
	excludeBookingId?: string,
	startDate?: Date,
	endDate?: Date
): Promise<
	{
		id: string;
		title: string;
		priceStudio: number;
		imageUrl: string | null;
		categoryName: string;
	}[]
> {
	// Если переданы даты — проверяем занятость
	let busyIds: string[] = [];
	if (startDate && endDate) {
		const busyItems = await prisma.studioBookingItem.findMany({
			where: {
				studioBooking: {
					...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
					status: { in: ["WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"] },
					startDate: { lt: endDate },
					endDate: { gt: startDate },
				},
			},
			select: { equipmentId: true },
		});
		busyIds = busyItems.map((i) => i.equipmentId);
	}

	const equipments = await prisma.equipment.findMany({
		where: {
			studioAvailable: true,
			priceStudio: { gt: 0 },
			title: { contains: query, mode: "insensitive" },
			...(busyIds.length > 0 ? { id: { notIn: busyIds } } : {}),
		},
		select: {
			id: true,
			title: true,
			priceStudio: true,
			category: { select: { name: true } },
			equipmentImageLinks: {
				take: 1,
				orderBy: { orderIndex: "asc" },
				include: { image: { select: { url: true } } },
			},
		},
		orderBy: { title: "asc" },
		take: 20,
	});

	return equipments.map((eq) => ({
		id: eq.id,
		title: eq.title,
		priceStudio: eq.priceStudio,
		imageUrl: eq.equipmentImageLinks[0]?.image.url ?? null,
		categoryName: eq.category.name,
	}));
}

// ─── Submit booking ───────────────────────────────────────────────────────────

export async function submitStudioBookingAction(
	input: SubmitStudioBookingInput
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { success: false, error: "Необходима авторизация" };
		}

		// Минимальная длительность — 1 час
		const durationMs = input.endDate.getTime() - input.startDate.getTime();
		const durationHours = durationMs / (1000 * 60 * 60);
		if (durationHours < 1) {
			return { success: false, error: "Минимальная аренда — 1 час" };
		}

		// Проверяем доступность (только WAIT_PAYMENT, READY_TO_RENT, ACTIVE блокируют)
		const availability = await checkStudioAvailabilityAction(
			input.startDate,
			input.endDate
		);
		if (!availability.available) {
			return {
				success: false,
				error: "Студия занята в указанный период. Выберите другое время.",
			};
		}

		// Тариф
		const tariff = await prisma.studioTariff.findUnique({
			where: { id: input.tariffId, isActive: true },
		});
		if (!tariff) {
			return { success: false, error: "Тариф не найден или недоступен" };
		}

		// Техника (только studioAvailable=true, isAvailable не проверяем)
		let equipmentTotal = 0;
		const equipmentItems: { equipmentId: string; priceAtBooking: number }[] =
			[];

		if (input.equipmentIds?.length) {
			const equipments = await prisma.equipment.findMany({
				where: {
					id: { in: input.equipmentIds },
					studioAvailable: true,
				},
				select: { id: true, priceStudio: true },
			});

			for (const eq of equipments) {
				equipmentItems.push({
					equipmentId: eq.id,
					priceAtBooking: eq.priceStudio,
				});
				equipmentTotal += eq.priceStudio;
			}
		}

		const tariffTotal = tariff.pricePerHour * durationHours;
		const totalAmount = tariffTotal + equipmentTotal;

		const booking = await prisma.studioBooking.create({
			data: {
				userId: session.user.id,
				tariffId: input.tariffId,
				startDate: input.startDate,
				endDate: input.endDate,
				durationHours,
				tariffPriceAtBooking: tariff.pricePerHour,
				totalAmount,
				items: {
					create: equipmentItems,
				},
			},
		});

		await prisma.studioBookingAuditLog.create({
			data: {
				studioBookingId: booking.id,
				authorId: session.user.id,
				authorName: session.user.name ?? null,
				action: "CREATED",
				meta: { source: "client" },
			},
		});

		revalidatePath("/studio");
		revalidatePath("/dashboard");
		return { success: true, bookingId: booking.id };
	} catch (e) {
		console.error("submitStudioBookingAction:", e);
		return { success: false, error: "Ошибка при создании заказа" };
	}
}

// ─── Auto-expire overdue bookings ────────────────────────────────────────────

/**
 * Автоматически переводит просроченные заказы студии в статус EXPIRED.
 * Затрагивает заказы в статусах PENDING_REVIEW, WAIT_PAYMENT, READY_TO_RENT
 * у которых startDate уже прошёл.
 * Вызывается из cron/route или вручную.
 */
export async function autoExpireStudioBookingsAction(): Promise<{
	success: boolean;
	expiredCount?: number;
	error?: string;
}> {
	try {
		const now = new Date();

		const overdueBookings = await prisma.studioBooking.findMany({
			where: {
				status: { in: ["PENDING_REVIEW", "WAIT_PAYMENT", "READY_TO_RENT"] },
				startDate: { lt: now },
			},
			select: { id: true, status: true },
		});

		if (overdueBookings.length === 0) {
			return { success: true, expiredCount: 0 };
		}

		const overdueIds = overdueBookings.map((b) => b.id);

		await prisma.$transaction([
			prisma.studioBooking.updateMany({
				where: { id: { in: overdueIds } },
				data: { status: "EXPIRED", expiredAt: now },
			}),
			// Создаём аудит-записи для каждого просроченного заказа
			...overdueBookings.map((b) =>
				prisma.studioBookingAuditLog.create({
					data: {
						studioBookingId: b.id,
						authorId: null,
						authorName: "Система",
						action: "STATUS_CHANGED",
						fieldName: "status",
						valueBefore: b.status,
						valueAfter: "EXPIRED",
						meta: { auto: true, reason: "startDate прошёл" },
					},
				})
			),
		]);

		revalidatePath("/admin/studio");
		return { success: true, expiredCount: overdueIds.length };
	} catch (e) {
		console.error("autoExpireStudioBookingsAction:", e);
		return {
			success: false,
			error: "Ошибка автоматического истечения заказов",
		};
	}
}

// ─── Client: own bookings ─────────────────────────────────────────────────────

export async function getMyStudioBookingsAction(): Promise<
	ClientStudioBookingRow[]
> {
	const session = await auth();
	if (!session?.user?.id) return [];

	const bookings = await prisma.studioBooking.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: "desc" },
		include: {
			tariff: { select: { name: true } },
			_count: { select: { items: true } },
		},
	});

	return bookings.map((b) => ({
		id: b.id,
		tariffName: b.tariff.name,
		tariffPriceAtBooking: b.tariffPriceAtBooking,
		startDate: b.startDate,
		endDate: b.endDate,
		durationHours: b.durationHours,
		totalAmount: b.totalAmount,
		status: b.status,
		itemsCount: b._count.items,
		createdAt: b.createdAt,
	}));
}

// ─── Client: cancel own booking ───────────────────────────────────────────────

export async function cancelMyStudioBookingAction(
	bookingId: string,
	reason?: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const booking = await prisma.studioBooking.findUnique({
			where: { id: bookingId },
			select: { userId: true, status: true },
		});

		if (!booking) return { success: false, error: "Заказ не найден" };
		if (booking.userId !== session.user.id)
			return { success: false, error: "Нет доступа" };

		const cancellableStatuses: BookingStatus[] = [
			"PENDING_REVIEW",
			"WAIT_PAYMENT",
		];
		if (!cancellableStatuses.includes(booking.status)) {
			return {
				success: false,
				error:
					"Отменить можно только заказы в статусе «На рассмотрении» или «Ожидает оплаты»",
			};
		}

		await prisma.studioBooking.update({
			where: { id: bookingId },
			data: {
				status: "CANCELLED",
				cancellationReason: reason?.trim() || "Отменён клиентом",
				cancelledAt: new Date(),
			},
		});

		await prisma.studioBookingAuditLog.create({
			data: {
				studioBookingId: bookingId,
				authorId: session.user.id,
				authorName: session.user.name ?? null,
				action: "CANCELLED",
				meta: { reason: reason ?? "Отменён клиентом", cancelledByClient: true },
			},
		});

		revalidatePath("/studio");
		revalidatePath("/dashboard");
		return { success: true };
	} catch (e) {
		console.error("cancelMyStudioBookingAction:", e);
		return { success: false, error: "Ошибка отмены" };
	}
}
