"use server";

import { BookingStatus, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ── Submit booking ────────────────────────────────────────────────────────────

export async function submitBookingAction(formData: {
	items: {
		id: string; // id isPrimary-записи (используется как fallback)
		allUnitIds: string[]; // все id сиблингов для раскрытия quantity → N items
		quantity: number; // сколько единиц этой позиции
		priceToPay: number; // цена за одну единицу
		deposit?: number;
		replacementValue?: number;
	}[];
	startDate: string;
	endDate: string;
	totalPrice: number;
	hasInsurance: boolean;
	totalReplacementValue: number;
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

			// Получаем свежие доступные единицы с тем же title из БД
			// Используем allUnitIds как список кандидатов, фильтруем только доступные
			const availableUnits = await prisma.equipment.findMany({
				where: {
					id: { in: item.allUnitIds },
					isAvailable: true,
					status: "AVAILABLE",
				},
				select: { id: true },
				take: item.quantity,
			});

			// Если доступных меньше чем запрошено — добавляем isPrimary как fallback
			const unitIds = availableUnits.map((u) => u.id);

			// Дополнить до нужного количества если не хватает (fallback на isPrimary)
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
			// Защита от пустого заказа
			return {
				success: false,
				error: "Нет доступной техники для бронирования",
			};
		}

		// Prisma позволяет создать запись и все связанные элементы (items) за одну транзакцию!
		const booking = await prisma.booking.create({
			data: {
				userId: session.user.id,
				startDate: new Date(formData.startDate),
				endDate: new Date(formData.endDate),
				totalAmount: formData.totalPrice,
				insuranceIncluded: formData.hasInsurance,
				totalReplacementValue: formData.totalReplacementValue,
				status: BookingStatus.PENDING_REVIEW,
				bookingItems: {
					create: bookingItemRows,
				},
			},
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
			select: { userId: true, status: true },
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

		// Транзакция: обновляем статус и создаем уведомление
		await prisma.$transaction([
			prisma.booking.update({
				where: { id: bookingId },
				data: {
					status: BookingStatus.CANCELLED,
					cancellationReason: reason,
					cancelledAt: new Date(),
				},
			}),
			prisma.adminNotification.create({
				data: {
					type: "booking_cancelled",
					userId: session.user.id,
					payload: { booking_id: bookingId, reason } as Prisma.InputJsonValue,
				},
			}),
		]);

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
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			select: { userId: true, status: true },
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

		await prisma.$transaction([
			prisma.booking.update({
				where: { id: bookingId },
				data: {
					startDate: new Date(startDate),
					endDate: new Date(endDate),
					status: BookingStatus.PENDING_REVIEW,
				},
			}),
			prisma.adminNotification.create({
				data: {
					type: "booking_dates_changed",
					userId: session.user.id,
					payload: {
						booking_id: bookingId,
						start_date: startDate,
						end_date: endDate,
					} as Prisma.InputJsonValue,
				},
			}),
		]);

		revalidatePath(`/dashboard/bookings/${bookingId}`);
		return { success: true };
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
						notIn: [
							BookingStatus.CANCELLED,
							BookingStatus.PENDING_REVIEW,
							BookingStatus.COMPLETED,
							BookingStatus.EXPIRED,
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

		// Транзакция: удаляем старые items, создаем новые, обновляем сам заказ
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
				},
			}),
			prisma.adminNotification.create({
				data: {
					type: "booking_items_changed",
					userId: session.user.id,
					payload: {
						booking_id: bookingId,
						item_count: newRows.length,
					} as Prisma.InputJsonValue,
				},
			}),
		]);

		revalidatePath(`/dashboard/bookings/${bookingId}`);
		revalidatePath("/dashboard/bookings");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка обновления комплектации" };
	}
}

// ── Admin: update booking status ──────────────────────────────────────────────

export async function updateBookingStatusAction(
	bookingId: string,
	newStatus: BookingStatus
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const booking = await prisma.booking.update({
			where: { id: bookingId },
			data: {
				status: newStatus,
				...(newStatus === BookingStatus.CANCELLED
					? { cancelledAt: new Date() }
					: {}),
			},
			select: { userId: true },
		});

		const notifyStatuses = [
			BookingStatus.PENDING_REVIEW,
			BookingStatus.WAIT_PAYMENT,
			BookingStatus.READY_TO_RENT,
			BookingStatus.ACTIVE,
			BookingStatus.COMPLETED,
			BookingStatus.CANCELLED,
			BookingStatus.EXPIRED,
		];

		if (notifyStatuses.includes(newStatus)) {
			await prisma.adminNotification.create({
				data: {
					type: "booking_status_changed",
					userId: booking.userId,
					payload: {
						booking_id: bookingId,
						new_status: newStatus,
					} as Prisma.InputJsonValue,
				},
			});
		}

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
