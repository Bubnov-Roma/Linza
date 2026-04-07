"use server";

import { BookingStatus, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/actions/audit-and-balance-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Не авторизован");
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true, permissions: true, name: true },
	});
	if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
		throw new Error("Недостаточно прав");
	}
	return {
		userId: session.user.id,
		name: user.name ?? "Администратор",
		role: user.role,
		permissions: user.permissions as Record<string, boolean>,
	};
}

// ── 2.2 Change booking client ─────────────────────────────────────────────────

export async function adminChangeBookingClientAction(
	bookingId: string,
	newUserId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId, name } = await requireAdmin();

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			select: {
				userId: true,
				status: true,
				totalAmount: true,
				user: { select: { name: true, email: true } },
			},
		});
		if (!booking) return { success: false, error: "Заказ не найден" };

		const newUser = await prisma.user.findUnique({
			where: { id: newUserId },
			select: { id: true, name: true, email: true },
		});
		if (!newUser) return { success: false, error: "Пользователь не найден" };

		await prisma.$transaction([
			prisma.booking.update({
				where: { id: bookingId },
				data: { userId: newUserId },
			}),
			prisma.adminNotification.create({
				data: {
					type: "booking_client_changed",
					userId,
					payload: {
						bookingId,
						oldUserId: booking.userId,
						newUserId,
						newUserName: newUser.name,
					} as Prisma.InputJsonValue,
				},
			}),
		]);

		await writeAuditLog(bookingId, userId, name, {
			action: "Клиент заказа изменён",
			fieldName: "userId",
			valueBefore: `${booking.user?.name ?? "?"} (${booking.user?.email ?? "?"})`,
			valueAfter: `${newUser.name ?? "?"} (${newUser.email ?? "?"})`,
		});

		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ── 2.3 Update booking items ──────────────────────────────────────────────────

export interface AdminUpdateItemsPayload {
	items: {
		equipmentId: string;
		title: string;
		quantity: number;
		pricePerUnit: number;
		depositPerUnit: number;
		replacementValuePerUnit: number;
	}[];
	totalAmount: number;
	totalReplacementValue: number;
}

export async function adminUpdateBookingItemsAction(
	bookingId: string,
	payload: AdminUpdateItemsPayload
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId, name } = await requireAdmin();

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			select: {
				status: true,
				totalAmount: true,
				bookingItems: {
					select: {
						equipment: { select: { title: true } },
						priceAtBooking: true,
					},
				},
			},
		});
		if (!booking) return { success: false, error: "Заказ не найден" };

		const locked: BookingStatus[] = [
			"ACTIVE",
			"COMPLETED",
			"CANCELLED",
			"EXPIRED",
		];
		if (locked.includes(booking.status)) {
			return {
				success: false,
				error: "Нельзя изменить состав на данном этапе",
			};
		}
		if (payload.items.length === 0) {
			return { success: false, error: "Нельзя сохранить пустой заказ" };
		}

		const newRows = payload.items.flatMap((item) =>
			Array.from({ length: item.quantity }, () => ({
				equipmentId: item.equipmentId,
				priceAtBooking: item.pricePerUnit,
				depositAtBooking: item.depositPerUnit,
				replacementValueAtBooking: item.replacementValuePerUnit,
			}))
		);

		const oldTitles = booking.bookingItems
			.map((i) => i.equipment?.title ?? "?")
			.join(", ");
		const newTitles = payload.items
			.map((i) => (i.quantity > 1 ? `${i.title} ×${i.quantity}` : i.title))
			.join(", ");

		await prisma.$transaction([
			prisma.bookingItem.deleteMany({ where: { bookingId } }),
			prisma.booking.update({
				where: { id: bookingId },
				data: {
					totalAmount: payload.totalAmount,
					totalReplacementValue: payload.totalReplacementValue,
					status: BookingStatus.PENDING_REVIEW,
					bookingItems: { create: newRows },
				},
			}),
			prisma.adminNotification.create({
				data: {
					type: "booking_items_changed",
					userId,
					payload: {
						bookingId,
						itemCount: newRows.length,
						totalAmount: payload.totalAmount,
					} as Prisma.InputJsonValue,
				},
			}),
		]);

		await writeAuditLog(bookingId, userId, name, {
			action: "Состав заказа изменён",
			fieldName: "bookingItems",
			valueBefore: `${booking.bookingItems.length} позиций: ${oldTitles} · ${booking.totalAmount} ₽`,
			valueAfter: `${newRows.length} позиций: ${newTitles} · ${payload.totalAmount} ₽`,
		});

		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ── 2.4 Update booking pricing ────────────────────────────────────────────────

export type PriceAdjustmentType = "percent" | "fixed" | "promo" | "penalty";

export interface PriceAdjustment {
	type: PriceAdjustmentType;
	value: number;
	description?: string;
	promoCode?: string;
	itemIds?: string[];
}

export async function adminUpdateBookingPricingAction(
	bookingId: string,
	adjustments: PriceAdjustment[],
	finalTotal: number
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId, name } = await requireAdmin();

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			select: { status: true, totalAmount: true },
		});
		if (!booking) return { success: false, error: "Заказ не найден" };

		const locked: BookingStatus[] = ["COMPLETED", "CANCELLED", "EXPIRED"];
		if (locked.includes(booking.status)) {
			return { success: false, error: "Нельзя изменить цену на данном этапе" };
		}

		const adjSummary = adjustments
			.map((a) => {
				if (a.type === "percent") return `−${a.value}%`;
				if (a.type === "fixed") return `−${a.value} ₽`;
				if (a.type === "promo")
					return `промокод ${a.promoCode ?? ""} −${a.value} ₽`;
				if (a.type === "penalty") return `штраф +${a.value} ₽`;
				return String(a.value);
			})
			.join(", ");

		await prisma.$transaction([
			prisma.booking.update({
				where: { id: bookingId },
				data: { totalAmount: finalTotal },
			}),
			prisma.adminNotification.create({
				data: {
					type: "booking_pricing_changed",
					userId,
					payload: {
						bookingId,
						oldTotal: booking.totalAmount,
						newTotal: finalTotal,
						adjustments,
					} as unknown as Prisma.InputJsonValue,
				},
			}),
		]);

		await writeAuditLog(bookingId, userId, name, {
			action: "Стоимость скорректирована",
			fieldName: "totalAmount",
			valueBefore: `${booking.totalAmount} ₽`,
			valueAfter: `${finalTotal} ₽`,
			meta: { adjustments: adjSummary },
		});

		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ── Search users ──────────────────────────────────────────────────────────────

export async function searchUsersAction(query: string): Promise<
	{
		id: string;
		name: string | null;
		email: string | null;
		phone: string | null;
	}[]
> {
	try {
		await requireAdmin();
		if (!query.trim()) return [];
		return await prisma.user.findMany({
			where: {
				OR: [
					{ name: { contains: query } },
					{ email: { contains: query } },
					{ phone: { contains: query } },
				],
				role: { in: ["USER", "PARTNER"] },
			},
			select: { id: true, name: true, email: true, phone: true },
			take: 10,
		});
	} catch {
		return [];
	}
}

// ── Search equipment ──────────────────────────────────────────────────────────

export async function searchEquipmentAction(query: string): Promise<
	{
		id: string;
		title: string;
		pricePerDay: number;
		price4h: number;
		price8h: number;
		deposit: number;
		replacementValue: number;
	}[]
> {
	try {
		await requireAdmin();
		if (!query.trim()) return [];
		return await prisma.equipment.findMany({
			where: {
				title: { contains: query },
				isAvailable: true,
			},
			select: {
				id: true,
				title: true,
				pricePerDay: true,
				price4h: true,
				price8h: true,
				deposit: true,
				replacementValue: true,
			},
			take: 15,
		});
	} catch {
		return [];
	}
}

export async function adminSaveCompleteBookingAction(
	bookingId: string,
	data: {
		startDate: Date;
		endDate: Date;
		totalAmount: number;
		totalReplacementValue: number;
		items: { equipmentId: string; priceAtBooking: number }[];
	}
) {
	try {
		await prisma.$transaction(async (tx) => {
			await tx.booking.update({
				where: { id: bookingId },
				data: {
					startDate: data.startDate,
					endDate: data.endDate,
					totalAmount: data.totalAmount,
					totalReplacementValue: data.totalReplacementValue,
				},
			});
			await tx.bookingItem.deleteMany({ where: { bookingId } });
			await tx.bookingItem.createMany({
				data: data.items.map((item) => ({
					bookingId,
					equipmentId: item.equipmentId,
					priceAtBooking: item.priceAtBooking,
				})),
			});
		});
		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (error) {
		console.error("Ошибка комплексного сохранения брони:", error);
		return { success: false, error: "Не удалось сохранить изменения" };
	}
}

export async function adminUpdateBookingDatesAction(
	bookingId: string,
	startDate: string,
	endDate: string,
	newTotalAmount: number
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId, name } = await requireAdmin();

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			select: { status: true, totalAmount: true },
		});

		if (!booking) return { success: false, error: "Заказ не найден" };

		const locked: BookingStatus[] = [
			"ACTIVE",
			"COMPLETED",
			"CANCELLED",
			"EXPIRED",
		];
		if (locked.includes(booking.status)) {
			return { success: false, error: "Нельзя изменить даты на данном этапе" };
		}

		await prisma.booking.update({
			where: { id: bookingId },
			data: {
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				totalAmount: newTotalAmount,
				status: "PENDING_REVIEW",
			},
		});

		// Пишем изменение в историю заказа
		await writeAuditLog(bookingId, userId, name, {
			action: "Период аренды изменён",
			fieldName: "startDate/endDate",
			valueBefore: `Сумма: ${booking.totalAmount} ₽`,
			valueAfter: `Сумма: ${newTotalAmount} ₽`,
		});

		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка обновления дат",
		};
	}
}
