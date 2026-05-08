"use server";

import type { BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fmtRub } from "@/lib/utils";

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
	promoCode?: string;
	discountAmount?: number;
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

// ─── Client: booking detail ───────────────────────────────────────────────────

export interface ClientStudioBookingDetail {
	id: string;
	tariffId: string;
	tariffName: string;
	tariffPriceAtBooking: number;
	startDate: Date;
	endDate: Date;
	durationHours: number;
	totalAmount: number;
	status: BookingStatus;
	cancellationReason: string | null;
	cancelledAt: Date | null;
	createdAt: Date;
	items: {
		id: string;
		equipmentId: string;
		equipmentTitle: string;
		equipmentImageUrl: string | null;
		priceAtBooking: number;
	}[];
	payments: {
		id: string;
		amount: number;
		method: string;
		type: string;
		note: string | null;
		paidAt: Date;
	}[];
	promoCode: string | null;
	discountAmount: number;
	totalPaid: number;
	promoValidUntil?: string | null;
	paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";
}

export async function getMyStudioBookingDetailAction(
	bookingId: string
): Promise<ClientStudioBookingDetail | null> {
	const session = await auth();
	if (!session?.user?.id) return null;

	const b = await prisma.studioBooking.findUnique({
		where: { id: bookingId, userId: session.user.id },
		include: {
			tariff: { select: { name: true } },
			items: {
				include: {
					equipment: {
						select: {
							title: true,
							equipmentImageLinks: {
								take: 1,
								orderBy: { orderIndex: "asc" },
								include: { image: { select: { url: true } } },
							},
						},
					},
				},
			},
			payments: {
				orderBy: { paidAt: "desc" },
			},
		},
	});

	if (!b) return null;

	let promoValidUntil: string | null = null;
	if (b.promoCode) {
		const promo = await prisma.promoCode.findUnique({
			where: { code: b.promoCode },
			select: { validUntil: true },
		});
		promoValidUntil = promo?.validUntil?.toISOString() ?? null;
	}

	const totalPaid = b.payments
		.filter((p) => p.type === "PAYMENT")
		.reduce((s, p) => s + p.amount, 0);
	const totalRefunded = b.payments
		.filter((p) => p.type === "OTHER")
		.reduce((s, p) => s + p.amount, 0);
	const net = totalPaid - totalRefunded;

	const paymentStatus: ClientStudioBookingDetail["paymentStatus"] =
		net <= 0
			? "UNPAID"
			: net >= b.totalAmount
				? net > b.totalAmount
					? "OVERPAID"
					: "PAID"
				: "PARTIAL";

	return {
		id: b.id,
		tariffId: b.tariffId,
		tariffName: b.tariff.name,
		tariffPriceAtBooking: b.tariffPriceAtBooking,
		startDate: b.startDate,
		endDate: b.endDate,
		durationHours: b.durationHours,
		totalAmount: b.totalAmount,
		status: b.status,
		cancellationReason: b.cancellationReason,
		cancelledAt: b.cancelledAt,
		createdAt: b.createdAt,
		promoCode: b.promoCode ?? null,
		discountAmount: b.discountAmount ?? 0,
		promoValidUntil,
		items: b.items.map((item) => ({
			id: item.id,
			equipmentId: item.equipmentId,
			equipmentTitle: item.equipment.title,
			equipmentImageUrl:
				item.equipment.equipmentImageLinks[0]?.image.url ?? null,
			priceAtBooking: item.priceAtBooking,
		})),
		payments: b.payments.map((p) => ({
			id: p.id,
			amount: p.amount,
			method: p.method,
			type: p.type,
			note: p.note,
			paidAt: p.paidAt,
		})),
		totalPaid: net,
		paymentStatus,
	};
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
		const rawTotal = tariffTotal + equipmentTotal;

		// Валидируем промокод повторно на сервере
		let promoCodeId: string | null = null;
		let finalTotal = rawTotal;

		if (input.promoCode) {
			const promo = await prisma.promoCode.findUnique({
				where: { code: input.promoCode.trim().toUpperCase() },
				select: {
					id: true,
					isActive: true,
					type: true,
					value: true,
					usageLimit: true,
					usedCount: true,
					validFrom: true,
					validUntil: true,
				},
			});
			const now = new Date();
			const isValid =
				promo?.isActive &&
				(!promo.validFrom || now >= promo.validFrom) &&
				(!promo.validUntil || now <= promo.validUntil) &&
				(promo.usageLimit === null || promo.usedCount < promo.usageLimit);

			if (isValid && promo) {
				promoCodeId = promo.id;
				const discount =
					promo.type === "PERCENT"
						? (rawTotal * promo.value) / 100
						: Math.min(promo.value, rawTotal);
				finalTotal = Math.max(0, rawTotal - discount);
			}
		}

		const totalAmount = finalTotal;

		const booking = await prisma.studioBooking.create({
			data: {
				userId: session.user.id,
				tariffId: input.tariffId,
				startDate: input.startDate,
				endDate: input.endDate,
				durationHours,
				tariffPriceAtBooking: tariff.pricePerHour,
				totalAmount, // итоговая цена со скидкой
				promoCode: input.promoCode ?? null, // <- NEW
				discountAmount: rawTotal - finalTotal, // <- NEW фактическая скидка
				items: {
					create: equipmentItems,
				},
			},
		});

		if (promoCodeId) {
			// Инкрементируем счётчик промокода
			await prisma.promoCode
				.update({
					where: { id: promoCodeId },
					data: { usedCount: { increment: 1 } },
				})
				.catch(() => {});
		}

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

export async function cancelStudioBookingAction(
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

		const bookingToCancel = await prisma.studioBooking.findUnique({
			where: { id: bookingId },
			select: { promoCode: true },
		});

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

		if (bookingToCancel?.promoCode) {
			await prisma.promoCode
				.updateMany({
					where: { code: bookingToCancel.promoCode, usedCount: { gt: 0 } },
					data: { usedCount: { decrement: 1 } },
				})
				.catch(() => {});
		}

		revalidatePath("/studio");
		revalidatePath("/dashboard");
		return { success: true };
	} catch (e) {
		console.error("cancelStudioBookingAction:", e);
		return { success: false, error: "Ошибка отмены" };
	}
}

// ─── Client: update booking dates ────────────────────────────────────────────

export async function updateStudioBookingDatesAction(
	bookingId: string,
	startDate: string,
	endDate: string
): Promise<{ success: boolean; promoExpired?: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const booking = await prisma.studioBooking.findUnique({
			where: { id: bookingId },
			select: {
				userId: true,
				status: true,
				discountAmount: true,
				promoCode: true,
				totalAmount: true,
			},
		});

		if (!booking || booking.userId !== session.user.id)
			return { success: false, error: "Заказ не найден" };

		const editableStatuses: BookingStatus[] = [
			"PENDING_REVIEW",
			"WAIT_PAYMENT",
			"READY_TO_RENT",
		];
		if (!editableStatuses.includes(booking.status))
			return { success: false, error: "Нельзя изменить даты на данном этапе" };

		const newStart = new Date(startDate);
		const newEnd = new Date(endDate);
		const durationMs = newEnd.getTime() - newStart.getTime();

		if (durationMs < 3_600_000)
			return { success: false, error: "Минимальная аренда — 1 час" };

		// Проверяем конфликт
		const conflict = await prisma.studioBooking.findFirst({
			where: {
				id: { not: bookingId },
				status: { in: ["WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"] },
				startDate: { lt: newEnd },
				endDate: { gt: newStart },
			},
			select: { startDate: true, endDate: true },
		});

		if (conflict)
			return { success: false, error: "Студия занята в выбранный период" };

		const durationHours = durationMs / 3_600_000;

		// Загружаем полный заказ для пересчёта суммы
		const existing = await prisma.studioBooking.findUnique({
			where: { id: bookingId },
			include: { items: { select: { priceAtBooking: true } } },
		});
		if (!existing) return { success: false, error: "Заказ не найден" };

		// Проверяем не вышел ли перенос за дедлайн промокода
		let promoExpired = false;
		if (existing.promoCode) {
			const promo = await prisma.promoCode.findUnique({
				where: { code: existing.promoCode },
				select: { validUntil: true },
			});

			if (promo?.validUntil != null && newEnd > promo.validUntil) {
				promoExpired = true;
			}
		}

		// Пересчёт суммы
		const equipTotal = existing.items.reduce((s, i) => s + i.priceAtBooking, 0);
		const rawTotal = existing.tariffPriceAtBooking * durationHours + equipTotal;

		// Если промо сгорело — скидку не применяем, иначе сохраняем
		const savedDiscount = promoExpired ? 0 : (existing.discountAmount ?? 0);
		const newTotal = Math.max(0, rawTotal - savedDiscount);

		// Строим data для update
		const updateData: Parameters<
			typeof prisma.studioBooking.update
		>[0]["data"] = {
			startDate: newStart,
			endDate: newEnd,
			durationHours,
			totalAmount: newTotal,
			status: "PENDING_REVIEW",
		};

		if (promoExpired) {
			updateData.promoCode = null;
			updateData.discountAmount = 0;
		}

		await prisma.studioBooking.update({
			where: { id: bookingId },
			data: updateData,
		});

		await prisma.studioBookingAuditLog.create({
			data: {
				studioBookingId: bookingId,
				authorId: session.user.id,
				authorName: session.user.name ?? null,
				action: "BOOKING_UPDATED",
				fieldName: "period",
				valueBefore: `${existing.startDate.toLocaleString("ru-RU")} – ${existing.endDate.toLocaleString("ru-RU")}`,
				valueAfter: `${newStart.toLocaleString("ru-RU")} – ${newEnd.toLocaleString("ru-RU")}`,
				meta: {
					source: "client",
					newTotal,
					promoExpired,
				},
			},
		});

		// Декрементируем usedCount если промо сгорело
		if (promoExpired && existing.promoCode) {
			await prisma.promoCode
				.updateMany({
					where: { code: existing.promoCode, usedCount: { gt: 0 } },
					data: { usedCount: { decrement: 1 } },
				})
				.catch(() => {});
		}

		revalidatePath("/studio");
		revalidatePath("/dashboard/studio-bookings");
		return { success: true, promoExpired };
	} catch (e) {
		console.error("updateStudioBookingDatesAction:", e);
		return { success: false, error: "Ошибка обновления дат" };
	}
}

// ─── Client: update booking tariff + equipment ────────────────────────────────

export async function updateStudioBookingTariffAction(input: {
	bookingId: string;
	tariffId: string;
	equipmentIds: string[];
}): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const booking = await prisma.studioBooking.findUnique({
			where: { id: input.bookingId },
			select: {
				userId: true,
				status: true,
				startDate: true,
				endDate: true,
				durationHours: true,
				tariffId: true,
				tariffPriceAtBooking: true,
				promoCode: true,
				discountAmount: true,
			},
		});

		if (!booking || booking.userId !== session.user.id)
			return { success: false, error: "Заказ не найден" };

		const editableStatuses: BookingStatus[] = [
			"PENDING_REVIEW",
			"WAIT_PAYMENT",
			"READY_TO_RENT",
		];
		if (!editableStatuses.includes(booking.status))
			return {
				success: false,
				error: "Нельзя изменить заказ на данном этапе",
			};

		// Загружаем тариф
		const tariff = await prisma.studioTariff.findUnique({
			where: { id: input.tariffId, isActive: true },
		});
		if (!tariff) return { success: false, error: "Тариф не найден" };

		// Загружаем технику (только studioAvailable)
		const equipments =
			input.equipmentIds.length > 0
				? await prisma.equipment.findMany({
						where: { id: { in: input.equipmentIds }, studioAvailable: true },
						select: { id: true, priceStudio: true },
					})
				: [];

		const equipTotal = equipments.reduce((s, e) => s + e.priceStudio, 0);
		const rawTotal = tariff.pricePerHour * booking.durationHours + equipTotal;
		const savedDiscount = booking.discountAmount ?? 0;
		const newTotal = Math.max(0, rawTotal - savedDiscount);

		await prisma.$transaction([
			prisma.studioBookingItem.deleteMany({
				where: { studioBookingId: input.bookingId },
			}),
			prisma.studioBooking.update({
				where: { id: input.bookingId },
				data: {
					tariffId: input.tariffId,
					tariffPriceAtBooking: tariff.pricePerHour,
					totalAmount: newTotal,
					status: "PENDING_REVIEW",
					items: {
						create: equipments.map((e) => ({
							equipmentId: e.id,
							priceAtBooking: e.priceStudio,
						})),
					},
				},
			}),
			prisma.studioBookingAuditLog.create({
				data: {
					studioBookingId: input.bookingId,
					authorId: session.user.id,
					authorName: session.user.name ?? null,
					action: "BOOKING_UPDATED",
					fieldName: "tariff",
					valueBefore: null,
					valueAfter: `Тариф: ${tariff.name}, техника: ${equipments.length} поз., сумма: ${fmtRub(newTotal)}`,
					meta: { source: "client", equipmentCount: equipments.length },
				},
			}),
		]);

		revalidatePath("/studio");
		revalidatePath("/dashboard/studio-bookings");
		return { success: true };
	} catch (e) {
		console.error("updateStudioBookingTariffAction:", e);
		return { success: false, error: "Ошибка обновления заказа" };
	}
}
