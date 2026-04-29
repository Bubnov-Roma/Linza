"use server";

import { BookingStatus, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/actions/audit-and-balance-actions";
import { auth } from "@/auth";
import { PAYMENT_METHOD_LABELS } from "@/constants";
import type {
	BookingPaymentRow,
	PaymentMethod,
	PaymentStatus,
} from "@/core/domain/entities/Booking";
import { extractEnrichedUserData } from "@/lib/extract-enriched-user-data";
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

// Создание нового заказа администратором/менеджером
export interface AdminCreateBookingPayload {
	userId: string;
	startDate: string; // ISO-строка
	endDate: string; // ISO-строка
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
	insuranceIncluded?: boolean;
	initialStatus?: BookingStatus;
	internalNote?: string; // Будет записан в аудит-лог
}

export async function adminCreateBookingAction(
	payload: AdminCreateBookingPayload
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
	try {
		const { userId: authorId, name: authorName } = await requireAdmin();

		// Проверяем существование клиента
		const client = await prisma.user.findUnique({
			where: { id: payload.userId },
			select: { id: true, name: true, email: true },
		});
		if (!client) return { success: false, error: "Клиент не найден" };

		if (payload.items.length === 0) {
			return { success: false, error: "Нельзя создать пустой заказ" };
		}

		// Разворачиваем позиции — каждая quantity=N создаёт N BookingItem
		const bookingItemRows = payload.items.flatMap((item) =>
			Array.from({ length: item.quantity }, () => ({
				equipmentId: item.equipmentId,
				priceAtBooking: item.pricePerUnit,
				depositAtBooking: item.depositPerUnit,
				replacementValueAtBooking: item.replacementValuePerUnit,
			}))
		);

		const initialStatus = payload.initialStatus ?? BookingStatus.PENDING_REVIEW;

		const booking = await prisma.booking.create({
			data: {
				userId: payload.userId,
				startDate: new Date(payload.startDate),
				endDate: new Date(payload.endDate),
				totalAmount: payload.totalAmount,
				totalReplacementValue: payload.totalReplacementValue,
				insuranceIncluded: payload.insuranceIncluded ?? true,
				status: initialStatus,
				bookingItems: {
					create: bookingItemRows,
				},
			},
			select: { id: true },
		});

		// Аудит-лог: создание
		const itemsSummary = payload.items
			.map((i) => (i.quantity > 1 ? `${i.title} ×${i.quantity}` : i.title))
			.join(", ");

		await writeAuditLog(booking.id, authorId, authorName, {
			action: "Заказ создан администратором",
			fieldName: "status",
			valueBefore: "",
			valueAfter: initialStatus,
			meta: {
				createdBy: authorName,
				client: `${client.name ?? "?"} (${client.email ?? "?"})`,
				items: itemsSummary,
				total: `${payload.totalAmount} ₽`,
				note: payload.internalNote,
			},
		});

		if (payload.internalNote) {
			await writeAuditLog(booking.id, authorId, authorName, {
				action: "Комментарий при создании",
				valueAfter: payload.internalNote,
			});
		}

		revalidatePath("/admin/bookings");
		return { success: true, bookingId: booking.id };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка создания заказа",
		};
	}
}

// Смена статуса (без ограничений — любой → любой)
export async function adminForceSetBookingStatusAction(
	bookingId: string,
	newStatus: BookingStatus,
	reason?: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId, name } = await requireAdmin();

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			select: { status: true },
		});
		if (!booking) return { success: false, error: "Заказ не найден" };
		if (booking.status === newStatus)
			return { success: false, error: "Статус уже установлен" };

		const updateData: Prisma.BookingUpdateInput = { status: newStatus };
		if (newStatus === "CANCELLED") {
			updateData.cancelledAt = new Date();
			if (reason) updateData.cancellationReason = reason;
		}
		if (newStatus === "EXPIRED") updateData.expiredAt = new Date();

		await prisma.booking.update({
			where: { id: bookingId },
			data: updateData,
		});

		await writeAuditLog(bookingId, userId, name, {
			action: "Статус изменён вручную",
			fieldName: "status",
			valueBefore: booking.status,
			valueAfter: newStatus,
			meta: reason ? { reason } : {},
		});

		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// Платежи по заказу
export async function computePaymentStatus(
	totalPaid: number,
	totalAmount: number
): Promise<PaymentStatus> {
	if (totalPaid <= 0) return "UNPAID";
	const ratio = totalPaid / totalAmount;
	if (ratio >= 1.005) return "OVERPAID"; // допуск 0.5%
	if (ratio >= 0.995) return "PAID";
	return "PARTIAL";
}

/** Получить все платежи по заказу */
export async function getBookingPaymentsAction(bookingId: string): Promise<{
	success: boolean;
	payments?: BookingPaymentRow[];
	totalPaid?: number;
	paymentStatus?: PaymentStatus;
	totalAmount?: number;
	error?: string;
}> {
	try {
		await requireAdmin();

		const [booking, payments] = await Promise.all([
			prisma.booking.findUnique({
				where: { id: bookingId },
				select: { totalAmount: true },
			}),
			prisma.bookingPayment.findMany({
				where: { bookingId },
				orderBy: { paidAt: "desc" },
				include: { author: { select: { name: true } } },
			}),
		]);

		if (!booking) return { success: false, error: "Заказ не найден" };

		const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
		const paymentStatus = await computePaymentStatus(
			totalPaid,
			booking.totalAmount
		);

		return {
			success: true,
			payments: payments.map((p) => ({
				id: p.id,
				amount: p.amount,
				method: p.method as PaymentMethod,
				note: p.note,
				paidAt: p.paidAt.toISOString(),
				createdAt: p.createdAt.toISOString(),
				authorName: p.author?.name ?? null,
			})),
			totalPaid,
			paymentStatus,
			totalAmount: booking.totalAmount,
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export interface RecordPaymentPayload {
	bookingId: string;
	/** Положительное — приход, отрицательное — возврат/расход */
	amount: number;
	method: PaymentMethod;
	type: "PAYMENT" | "DEPOSIT" | "OTHER";
	note?: string;
}

export type RecordPaymentResult =
	| {
			success: true;
			payment: BookingPaymentRow;
			newTotalPaid: number;
			paymentStatus: PaymentStatus;
			totalAmount: number;
	  }
	| {
			success: false;
			error: string;
	  };
/** Зафиксировать платёж */
export async function recordBookingPaymentAction(
	payload: RecordPaymentPayload
): Promise<RecordPaymentResult> {
	try {
		const { userId, name } = await requireAdmin();

		const booking = await prisma.booking.findUnique({
			where: { id: payload.bookingId },
			select: {
				totalAmount: true,
				status: true,
				payments: { select: { amount: true } }, // "payments" — relation field в schema.prisma
			},
		});
		if (!booking) return { success: false, error: "Заказ не найден" };

		const payment = await prisma.bookingPayment.create({
			data: {
				bookingId: payload.bookingId,
				authorId: userId,
				amount: payload.amount,
				method: payload.method,
				type: payload.type,
				note: payload.note ?? null,
				paidAt: new Date(), // дата фиксируется по акту транзакции
			},
			include: { author: { select: { name: true } } },
		});

		const prevPaid = booking.payments.reduce((s, p) => s + p.amount, 0);
		const newTotalPaid = prevPaid + payload.amount;
		const paymentStatus = await computePaymentStatus(
			newTotalPaid,
			booking.totalAmount
		);

		const actionLabel = payload.amount > 0 ? "Приход" : "Возврат";
		const typeLabel =
			payload.type === "DEPOSIT"
				? "залога"
				: payload.type === "OTHER"
					? "(прочее)"
					: "оплаты";

		await writeAuditLog(payload.bookingId, userId, name, {
			action: `${actionLabel} ${typeLabel}`,
			fieldName: "payments",
			valueBefore: `Оплачено: ${prevPaid.toLocaleString("ru-RU")} ₽`,
			valueAfter: `Оплачено: ${newTotalPaid.toLocaleString("ru-RU")} ₽ (${
				payload.amount > 0 ? "+" : ""
			}${payload.amount.toLocaleString("ru-RU")} ₽ · ${PAYMENT_METHOD_LABELS[payload.method]})`,
			meta: { method: payload.method, note: payload.note, paymentStatus },
		});

		revalidatePath("/admin/bookings");

		return {
			success: true,
			payment: {
				id: payment.id,
				amount: payment.amount,
				method: payment.method as PaymentMethod,
				note: payment.note,
				paidAt: payment.paidAt.toISOString(),
				createdAt: payment.createdAt.toISOString(),
				authorName: payment.author?.name ?? null,
			},
			newTotalPaid,
			paymentStatus,
			totalAmount: booking.totalAmount,
		};
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка записи платежа",
		};
	}
}

/** Удалить платёж (только для ADMIN) */
export async function deleteBookingPaymentAction(
	bookingId: string,
	paymentId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId, name, role } = await requireAdmin();
		if (role !== "ADMIN") {
			return {
				success: false,
				error: "Удаление платежей доступно только администратору",
			};
		}

		const payment = await prisma.bookingPayment.findUnique({
			where: { id: paymentId },
			select: { amount: true, method: true },
		});
		if (!payment) return { success: false, error: "Платёж не найден" };

		await prisma.bookingPayment.delete({ where: { id: paymentId } });

		await writeAuditLog(bookingId, userId, name, {
			action: "Платёж удалён",
			fieldName: "payments",
			valueBefore: `${payment.amount.toLocaleString("ru-RU")} ₽ · ${PAYMENT_METHOD_LABELS[payment.method as PaymentMethod]}`,
		});

		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ═══════════════════════════════════════════════════════════════════
// Существующие actions (без изменений)
// ═══════════════════════════════════════════════════════════════════

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
					bookingItems: { create: newRows },
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
		priceStudio: number;
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
				priceStudio: true,
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
		await requireAdmin();
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

		await prisma.booking.update({
			where: { id: bookingId },
			data: {
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				totalAmount: newTotalAmount,
			},
		});

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

export async function adminAddBookingCommentAction(
	bookingId: string,
	note: string
) {
	try {
		const { userId, name } = await requireAdmin();
		const created = await prisma.bookingAdminNote.create({
			data: { bookingId, authorId: userId, note: note.trim() },
		});
		await writeBookingAuditLog(bookingId, userId, name, {
			action: "Добавлен комментарий",
			valueAfter: note.trim(),
		});
		revalidatePath("/admin/bookings");
		return { success: true, data: created };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function adminDeleteBookingCommentAction(
	bookingId: string,
	commentId: string
) {
	try {
		const { userId, name } = await requireAdmin();
		const note = await prisma.bookingAdminNote.findUnique({
			where: { id: commentId },
		});
		if (!note) return { success: false, error: "Комментарий не найден" };

		await prisma.bookingAdminNote.delete({ where: { id: commentId } });

		await writeBookingAuditLog(bookingId, userId, name, {
			action: "Удален комментарий",
			valueBefore: note.note,
		});
		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function getAdminBookingCommentsAction(bookingId: string) {
	try {
		await requireAdmin();
		const notes = await prisma.bookingAdminNote.findMany({
			where: { bookingId },
			include: { author: { select: { name: true } } },
			orderBy: { createdAt: "desc" },
		});
		return { success: true, data: notes };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function writeBookingAuditLog(
	targetUserId: string,
	authorId: string | null,
	authorName: string | null,
	entry: {
		action: string;
		fieldName?: string;
		valueBefore?: string;
		valueAfter?: string;
		meta?: Record<string, unknown>;
	}
) {
	try {
		await requireAdmin();
		const model = prisma.userAuditLog;
		if (!model) return;

		await model.create({
			data: {
				targetUserId,
				authorId,
				authorName,
				action: entry.action,
				fieldName: entry.fieldName ?? null,
				valueBefore: entry.valueBefore ?? null,
				valueAfter: entry.valueAfter ?? null,
				meta: entry.meta ? (entry.meta as Prisma.JsonObject) : {},
			},
		});
	} catch {
		console.warn("[UserAuditLog] Не удалось записать лог:", entry.action);
	}
}

// ─── PAGINATION & INLINE PAYMENTS ─────────────────────────────────────────────

export type FetchAdminBookingsParams = {
	search: string;
	statusFilter: string;
	paymentFilter: string;
	dateFrom: string;
	dateTo: string;
	sortField: "createdAt" | "startDate" | "totalAmount" | "status";
	sortDir: "asc" | "desc";
	limit: number;
	offset: number;
};

export async function getPaginatedAdminBookingsAction(
	params: FetchAdminBookingsParams
) {
	try {
		await requireAdmin();

		const where: Prisma.BookingWhereInput = {};

		if (params.statusFilter !== "all") {
			where.status = params.statusFilter as BookingStatus;
		}

		if (params.dateFrom) {
			where.startDate = { gte: new Date(params.dateFrom) };
		}
		if (params.dateTo) {
			where.endDate = { lte: new Date(params.dateTo) };
		}

		if (params.search) {
			const q = params.search;
			where.OR = [
				{ id: { contains: q } },
				{ user: { name: { contains: q } } },
				{ user: { email: { contains: q } } },
				{ user: { phone: { contains: q } } },
				{ bookingItems: { some: { equipment: { title: { contains: q } } } } },
				{ labels: { some: { text: { contains: q } } } },
			];
		}

		// Получаем данные из БД
		const rawBookings = await prisma.booking.findMany({
			where,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
						clientApplication: { select: { adminOverrides: true } },
					},
				},
				bookingItems: {
					include: {
						equipment: {
							select: {
								title: true,
								inventoryNumber: true,
								isPrimary: true,
								equipmentImageLinks: {
									select: { image: { select: { url: true } } },
									orderBy: { orderIndex: "asc" },
									take: 1,
								},
							},
						},
					},
				},
				payments: { select: { amount: true, type: true } },
				labels: { select: { text: true } },
			},
			orderBy: {
				[params.sortField]: params.sortDir,
			},
		});

		// Вычисляем статусы оплаты и маппим данные
		let mapped = await Promise.all(
			rawBookings.map(async (b) => {
				const totalPaid = b.payments.reduce((s, p) => s + p.amount, 0);
				const paymentStatus = await computePaymentStatus(
					totalPaid,
					b.totalAmount
				);

				const overrides = b.user?.clientApplication?.adminOverrides as Record<
					string,
					unknown
				> | null;

				const { fullName } = extractEnrichedUserData(overrides, {
					name: b.user?.name ?? null,
					phone: b.user?.phone ?? null,
				});

				return {
					id: b.id,
					status: b.status,
					totalAmount: b.totalAmount,
					createdAt: b.createdAt.toISOString(),
					startDate: b.startDate.toISOString(),
					endDate: b.endDate.toISOString(),
					insuranceIncluded: b.insuranceIncluded,
					totalReplacementValue: b.totalReplacementValue,
					cancellationReason: b.cancellationReason,
					cancelledAt: b.cancelledAt?.toISOString() ?? null,
					clientId: b.userId,
					clientName: fullName,
					clientEmail: b.user?.email ?? null,
					equipmentTitles: [
						...new Set(b.bookingItems.map((i) => i.equipment.title)),
					],
					itemCount: b.bookingItems.length,
					bookingItems: b.bookingItems.map((i) => ({
						equipmentId: i.equipmentId,
						title: i.equipment.title,
						inventoryNumber: i.equipment.inventoryNumber ?? null,
						imageUrl: i.equipment.equipmentImageLinks?.[0]?.image?.url ?? null,
						priceAtBooking: i.priceAtBooking,
						depositAtBooking: i.depositAtBooking ?? 0,
						replacementValueAtBooking: i.replacementValueAtBooking ?? 0,
						price4h: null,
						price8h: null,
						pricePerDay: i.priceAtBooking,
					})),
					paymentStatus,
					totalPaid,
					labelTexts: b.labels.map((l) => l.text),
				};
			})
		);

		// Фильтруем по статусу оплаты в памяти (т.к. это вычисляемое поле)
		if (params.paymentFilter !== "all") {
			mapped = mapped.filter((b) => b.paymentStatus === params.paymentFilter);
		}

		const totalCount = mapped.length;
		const paginatedData = mapped.slice(
			params.offset,
			params.offset + params.limit
		);

		return { success: true, data: paginatedData, count: totalCount };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function adminQuickPayBookingAction(bookingId: string) {
	try {
		const { userId, name } = await requireAdmin();

		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			include: { payments: { select: { amount: true } } },
		});
		if (!booking) return { success: false, error: "Заказ не найден" };

		const totalPaid = booking.payments.reduce((s, p) => s + p.amount, 0);
		const remainder = booking.totalAmount - totalPaid;

		if (remainder <= 0) {
			return { success: false, error: "Заказ уже полностью оплачен" };
		}

		await prisma.bookingPayment.create({
			data: {
				bookingId,
				authorId: userId,
				amount: remainder,
				method: "CASH", // Быстрая оплата помечается как наличные по дефолту
				type: "PAYMENT",
				note: "Быстрая отметка об оплате",
				paidAt: new Date(),
			},
		});

		await writeAuditLog(bookingId, userId, name, {
			action: "Быстрая оплата",
			fieldName: "payments",
			valueAfter: `Добавлен платёж на ${remainder} ₽`,
		});

		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function adminClearBookingPaymentsAction(bookingId: string) {
	try {
		const { userId, name, role } = await requireAdmin();
		if (role !== "ADMIN") {
			return { success: false, error: "Удаление доступно только админу" };
		}

		await prisma.bookingPayment.deleteMany({ where: { bookingId } });

		await writeAuditLog(bookingId, userId, name, {
			action: "Сброс оплат",
			fieldName: "payments",
			valueAfter: "Все платежи удалены администратором",
		});

		revalidatePath("/admin/bookings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function getPendingReviewCountAction(): Promise<{
	count: number;
}> {
	try {
		await requireAdmin();
		const count = await prisma.booking.count({
			where: { status: BookingStatus.PENDING_REVIEW },
		});
		return { count };
	} catch {
		return { count: 0 };
	}
}
