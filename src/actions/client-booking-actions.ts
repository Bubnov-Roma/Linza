"use server";

import { BookingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createAdminNotification } from "@/actions/notification-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── Submit booking ────────────────────────────────────────────────────────────

export async function submitBookingAction(formData: {
	items: {
		id: string;
		allUnitIds: string[];
		quantity: number;
		priceToPay: number;
		deposit?: number;
		replacementValue?: number;
	}[];
	startDate: string;
	endDate: string;
	totalPrice: number;
	hasInsurance: boolean;
	totalReplacementValue: number;
	promoCode?: string | undefined;
	discountAmount?: number;
}): Promise<{ success: boolean; bookingId?: string; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };
		const bookingItemRows: Array<{
			equipmentId: string;
			priceAtBooking: number;
			depositAtBooking: number;
			replacementValueAtBooking: number;
		}> = [];

		for (const item of formData.items) {
			if (item.quantity <= 0) continue;

			const availableUnits = await prisma.equipment.findMany({
				where: {
					id: { in: item.allUnitIds },
					isAvailable: true,
				},
				select: { id: true },
				take: item.quantity,
			});

			const unitIds = availableUnits.map((u) => u.id);

			while (unitIds.length < item.quantity) {
				unitIds.push(item.id);
			}

			for (const equipmentId of unitIds) {
				bookingItemRows.push({
					equipmentId,
					priceAtBooking: item.priceToPay,
					depositAtBooking: item.deposit ?? 0,
					replacementValueAtBooking: item.replacementValue ?? 0,
				});
			}
		}

		if (bookingItemRows.length === 0) {
			return {
				success: false,
				error: "Нет доступной техники для бронирования",
			};
		}

		let promoCodeId: string | null = null;
		if (formData.promoCode) {
			const promo = await prisma.promoCode.findUnique({
				where: { code: formData.promoCode.trim().toUpperCase() },
				select: {
					id: true,
					isActive: true,
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

			if (isValid) promoCodeId = promo.id;
		}

		const booking = await prisma.booking.create({
			data: {
				userId: session.user.id,
				startDate: new Date(formData.startDate),
				endDate: new Date(formData.endDate),
				totalAmount: formData.totalPrice,
				insuranceIncluded: formData.hasInsurance,
				totalReplacementValue: formData.totalReplacementValue,
				status: BookingStatus.PENDING_REVIEW,
				promoCode: formData.promoCode ?? null,
				discountAmount: formData.discountAmount ?? 0,
				bookingItems: {
					create: bookingItemRows,
				},
			},
		});

		if (promoCodeId) {
			await prisma.promoCode
				.update({
					where: { id: promoCodeId },
					data: { usedCount: { increment: 1 } },
				})
				.catch(() => {});
		}

		await createAdminNotification({
			type: "bookingCreated",
			userId: session.user.id,
			entityId: booking.id,
			entityType: "booking",
			payload: { totalAmount: formData.totalPrice },
		});

		revalidatePath("/dashboard/bookings");
		return { success: true, bookingId: booking.id };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка создания брони" };
	}
}

// ── Cancel booking ────────────────────────────────────────────────────────────

export async function cancelBookingAction(
	bookingId: string,
	reason: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			select: { userId: true, status: true, promoCode: true },
		});

		if (!booking || booking.userId !== session.user.id) {
			return { success: false, error: "Заказ не найден" };
		}
		if (
			booking.status === BookingStatus.ACTIVE ||
			booking.status === BookingStatus.COMPLETED ||
			booking.status === BookingStatus.CANCELLED ||
			booking.status === BookingStatus.EXPIRED
		) {
			return {
				success: false,
				error: "Нельзя отменить активный или завершённый заказ",
			};
		}

		await prisma.booking.update({
			where: { id: bookingId },
			data: {
				status: BookingStatus.CANCELLED,
				cancellationReason: reason,
				cancelledAt: new Date(),
			},
		});

		await createAdminNotification({
			type: "bookingCancelled",
			userId: session.user.id,
			entityId: bookingId,
			entityType: "booking",
			payload: { reason },
		});

		if (booking.promoCode) {
			await prisma.promoCode
				.updateMany({
					where: { code: booking.promoCode, usedCount: { gt: 0 } },
					data: { usedCount: { decrement: 1 } },
				})
				.catch(() => {});
		}

		revalidatePath(`/dashboard/bookings/${bookingId}`);
		revalidatePath("/dashboard/bookings");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка отмены" };
	}
}

// ── Update booking dates ──────────────────────────────────────────────────────

export async function updateBookingDatesAction(
	bookingId: string,
	startDate: string,
	endDate: string
): Promise<{ success: boolean; promoExpired?: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			select: {
				userId: true,
				status: true,
				promoCode: true,
				discountAmount: true,
				totalAmount: true,
			},
		});

		if (!booking || booking.userId !== session.user.id) {
			return { success: false, error: "Заказ не найден" };
		}
		if (
			booking.status !== BookingStatus.PENDING_REVIEW &&
			booking.status !== BookingStatus.READY_TO_RENT
		) {
			return { success: false, error: "Нельзя изменить даты на данном этапе" };
		}

		const newEnd = new Date(endDate);
		let promoExpired = false;

		if (booking.promoCode) {
			const promo = await prisma.promoCode.findUnique({
				where: { code: booking.promoCode },
				select: { validUntil: true, usedCount: true },
			});

			const isExpiredByDate =
				promo?.validUntil != null && newEnd > promo.validUntil;

			if (isExpiredByDate) {
				promoExpired = true;
			}
		}

		const updateData: Parameters<typeof prisma.booking.update>[0]["data"] = {
			startDate: new Date(startDate),
			endDate: newEnd,
			status: BookingStatus.PENDING_REVIEW,
		};

		if (promoExpired) {
			updateData.promoCode = null;
			updateData.discountAmount = 0;
			updateData.totalAmount =
				(booking.totalAmount ?? 0) + (booking.discountAmount ?? 0);
		}

		await prisma.booking.update({
			where: { id: bookingId },
			data: updateData,
		});

		// #7 — изменение дат заказа
		await createAdminNotification({
			type: "bookingUpdated",
			userId: session.user.id,
			entityId: bookingId,
			entityType: "booking",
			payload: {
				changedField: "dates",
				startDate,
				endDate,
				promoExpired,
			},
		});

		if (promoExpired && booking.promoCode) {
			await prisma.promoCode
				.updateMany({
					where: { code: booking.promoCode, usedCount: { gt: 0 } },
					data: { usedCount: { decrement: 1 } },
				})
				.catch(() => {});
		}

		revalidatePath(`/dashboard/bookings/${bookingId}`);
		revalidatePath("/dashboard/bookings");
		return { success: true, promoExpired };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка обновления дат" };
	}
}

// ── Check availability ────────────────────────────────────────────────────────

export async function checkAvailabilityAction(
	equipmentIds: string[],
	startDate: Date,
	endDate: Date,
	excludeBookingId?: string
): Promise<{ busyIds: string[]; error?: string }> {
	try {
		const overlappingItems = await prisma.bookingItem.findMany({
			where: {
				equipmentId: { in: equipmentIds },
				booking: {
					status: {
						in: [
							BookingStatus.WAIT_PAYMENT,
							BookingStatus.READY_TO_RENT,
							BookingStatus.ACTIVE,
						],
					},
					startDate: { lte: new Date(endDate) },
					endDate: { gte: new Date(startDate) },
					...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
				},
			},
			select: { equipmentId: true },
		});

		const busyIds = [
			...new Set(overlappingItems.map((item) => item.equipmentId)),
		];
		return { busyIds };
	} catch (error: unknown) {
		if (error instanceof Error) return { busyIds: [], error: error.message };
		return { busyIds: [], error: "Ошибка проверки доступности" };
	}
}

// ── Update booking items ──────────────────────────────────────────────────────

export async function updateBookingItemsAction(
	bookingId: string,
	payload: {
		items: { equipmentId: string; quantity: number; pricePerUnit: number }[];
		totalAmount: number;
		totalReplacementValue: number;
		promoCode?: string;
		discountAmount?: number;
	}
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const nonEditableStatuses: BookingStatus[] = [
			BookingStatus.ACTIVE,
			BookingStatus.COMPLETED,
			BookingStatus.CANCELLED,
			BookingStatus.EXPIRED,
		];

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			select: { userId: true, status: true },
		});

		if (!booking || booking.userId !== session.user.id) {
			return { success: false, error: "Заказ не найден" };
		}
		if (nonEditableStatuses.includes(booking.status)) {
			return {
				success: false,
				error: "Нельзя изменить комплектацию на данном этапе",
			};
		}
		if (payload.items.length === 0) {
			return { success: false, error: "Нельзя сохранить пустой заказ" };
		}

		const newRows = payload.items.flatMap((item) =>
			Array.from({ length: item.quantity }, () => ({
				equipmentId: item.equipmentId,
				priceAtBooking: item.pricePerUnit,
			}))
		);

		await prisma.$transaction([
			prisma.bookingItem.deleteMany({ where: { bookingId } }),
			prisma.booking.update({
				where: { id: bookingId },
				data: {
					totalAmount: payload.totalAmount,
					totalReplacementValue: payload.totalReplacementValue,
					status: BookingStatus.PENDING_REVIEW,
					bookingItems: {
						create: newRows,
					},
					...(payload.promoCode !== undefined
						? { promoCode: payload.promoCode }
						: {}),
					...(payload.discountAmount !== undefined
						? { discountAmount: payload.discountAmount }
						: {}),
				},
			}),
		]);

		// #7 — изменение комплектации заказа
		await createAdminNotification({
			type: "bookingUpdated",
			userId: session.user.id,
			entityId: bookingId,
			entityType: "booking",
			payload: {
				changedField: "items",
				itemCount: newRows.length,
			},
		});

		revalidatePath(`/dashboard/bookings/${bookingId}`);
		revalidatePath("/dashboard/bookings");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка обновления комплектации" };
	}
}

// ── Admin: update booking status ──────────────────────────────────────────────
// Примечание: это admin-действие, уведомление тут не нужно —
// оно создаётся для клиента, а не для админа.

export async function updateBookingStatusAction(
	bookingId: string,
	newStatus: BookingStatus
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		await prisma.booking.update({
			where: { id: bookingId },
			data: {
				status: newStatus,
				...(newStatus === BookingStatus.CANCELLED
					? { cancelledAt: new Date() }
					: {}),
			},
		});

		revalidatePath("/admin/bookings");
		revalidatePath(`/dashboard/bookings/${bookingId}`);
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка обновления статуса" };
	}
}

export async function getPendingCount() {
	return prisma.booking.count({ where: { status: "PENDING_REVIEW" } });
}

export async function getPendingApplicationsCountAction(): Promise<{
	count: number;
}> {
	try {
		const count = await prisma.clientApplication.count({
			where: { status: "PENDING" },
		});
		return { count };
	} catch {
		return { count: 0 };
	}
}
