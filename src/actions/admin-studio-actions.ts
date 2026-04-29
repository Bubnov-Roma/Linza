"use server";

import type { BookingStatus, PaymentMethod, PaymentType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudioTariffData {
	id: string;
	name: string;
	description: string | null;
	details: string | null;
	pricePerHour: number;
	isActive: boolean;
	sortOrder: number;
	imageUrls: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateTariffInput {
	name: string;
	description?: string;
	details?: string;
	pricePerHour: number;
	isActive?: boolean;
	sortOrder?: number;
	imageUrls?: string[];
}

export interface UpdateTariffInput extends Partial<CreateTariffInput> {
	id: string;
}

// ─── Guards ───────────────────────────────────────────────────────────────────

async function requireAdminOrManager() {
	const session = await auth();
	const role = session?.user?.role;
	if (role !== "ADMIN" && role !== "MANAGER") {
		throw new Error("Недостаточно прав");
	}
	return session;
}

// ─── Serialise ────────────────────────────────────────────────────────────────

function serialiseTariff(t: {
	id: string;
	name: string;
	description: string | null;
	details: string | null;
	pricePerHour: number;
	isActive: boolean;
	sortOrder: number;
	imageUrls: unknown;
	createdAt: Date;
	updatedAt: Date;
}): StudioTariffData {
	return {
		...t,
		imageUrls: Array.isArray(t.imageUrls) ? (t.imageUrls as string[]) : [],
	};
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getStudioTariffsAction(): Promise<StudioTariffData[]> {
	const tariffs = await prisma.studioTariff.findMany({
		orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
	});
	return tariffs.map(serialiseTariff);
}

export async function getActiveStudioTariffsAction(): Promise<
	StudioTariffData[]
> {
	const tariffs = await prisma.studioTariff.findMany({
		where: { isActive: true },
		orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
	});
	return tariffs.map(serialiseTariff);
}

export async function getStudioTariffByIdAction(
	id: string
): Promise<StudioTariffData | null> {
	const tariff = await prisma.studioTariff.findUnique({ where: { id } });
	return tariff ? serialiseTariff(tariff) : null;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createStudioTariffAction(
	input: CreateTariffInput
): Promise<{ success: boolean; id?: string; error?: string }> {
	try {
		await requireAdminOrManager();

		if (!input.name?.trim())
			return { success: false, error: "Название обязательно" };
		if (!input.pricePerHour || input.pricePerHour <= 0)
			return { success: false, error: "Цена за час должна быть > 0" };

		const tariff = await prisma.studioTariff.create({
			data: {
				name: input.name.trim(),
				description: input.description?.trim() || null,
				details: input.details?.trim() || null,
				pricePerHour: input.pricePerHour,
				isActive: input.isActive ?? true,
				sortOrder: input.sortOrder ?? 0,
				imageUrls: input.imageUrls ?? [],
			},
		});

		revalidatePath("/admin/studio");
		revalidatePath("/studio");
		return { success: true, id: tariff.id };
	} catch (e) {
		console.error("createStudioTariffAction:", e);
		return { success: false, error: "Ошибка создания тарифа" };
	}
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateStudioTariffAction(
	input: UpdateTariffInput
): Promise<{ success: boolean; error?: string; id?: string }> {
	try {
		await requireAdminOrManager();

		const { id, ...data } = input;

		await prisma.studioTariff.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name.trim() }),
				...(data.description !== undefined && {
					description: data.description?.trim() || null,
				}),
				...(data.details !== undefined && {
					details: data.details?.trim() || null,
				}),
				...(data.pricePerHour !== undefined && {
					pricePerHour: data.pricePerHour,
				}),
				...(data.isActive !== undefined && { isActive: data.isActive }),
				...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
				...(data.imageUrls !== undefined && { imageUrls: data.imageUrls }),
			},
		});

		revalidatePath("/admin/studio");
		revalidatePath("/studio");
		return { success: true, id: id };
	} catch (e) {
		console.error("updateStudioTariffAction:", e);
		return { success: false, error: "Ошибка обновления тарифа" };
	}
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteStudioTariffAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireAdminOrManager();

		// Запрет удаления если есть активные брони
		const activeBookings = await prisma.studioBooking.count({
			where: {
				tariffId: id,
				status: {
					in: ["PENDING_REVIEW", "WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"],
				},
			},
		});

		if (activeBookings > 0) {
			return {
				success: false,
				error: `Нельзя удалить тариф: ${activeBookings} активных заказов`,
			};
		}

		await prisma.studioTariff.delete({ where: { id } });

		revalidatePath("/admin/studio");
		revalidatePath("/studio");
		return { success: true };
	} catch (e) {
		console.error("deleteStudioTariffAction:", e);
		return { success: false, error: "Ошибка удаления тарифа" };
	}
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export async function reorderStudioTariffsAction(
	orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireAdminOrManager();

		await prisma.$transaction(
			orderedIds.map((id, index) =>
				prisma.studioTariff.update({
					where: { id },
					data: { sortOrder: index },
				})
			)
		);

		revalidatePath("/admin/studio");
		revalidatePath("/studio");
		return { success: true };
	} catch (e) {
		console.error("reorderStudioTariffsAction:", e);
		return { success: false, error: "Ошибка сортировки" };
	}
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudioBookingRow {
	id: string;
	userId: string;
	userName: string | null;
	userEmail: string | null;
	userPhone: string | null;
	tariffId: string;
	tariffName: string;
	startDate: Date;
	endDate: Date;
	durationHours: number;
	tariffPriceAtBooking: number;
	totalAmount: number;
	status: BookingStatus;
	cancellationReason: string | null;
	cancelledAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	itemsCount: number;
	// Платёжный статус
	totalPaid: number;
	paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";
}

export interface StudioBookingDetail extends StudioBookingRow {
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
		method: PaymentMethod;
		type: PaymentType;
		note: string | null;
		paidAt: Date;
		authorName: string | null;
	}[];
	auditLogs: {
		id: string;
		action: string;
		fieldName: string | null;
		valueBefore: string | null;
		valueAfter: string | null;
		authorName: string | null;
		createdAt: Date;
		meta: unknown;
	}[];
}

export interface StudioBookingFilters {
	status?: BookingStatus | "ALL";
	paymentStatus?: "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID" | "ALL";
	search?: string;
	dateFrom?: Date;
	dateTo?: Date;
	tariffId?: string;
}

function calcPaymentStatus(
	totalAmount: number,
	totalPaid: number
): StudioBookingRow["paymentStatus"] {
	if (totalPaid <= 0) return "UNPAID";
	if (totalPaid >= totalAmount + 0.01) return "OVERPAID";
	if (totalPaid >= totalAmount - 0.01) return "PAID";
	return "PARTIAL";
}

function buildRow(b: {
	id: string;
	userId: string;
	tariffId: string;
	startDate: Date;
	endDate: Date;
	durationHours: number;
	tariffPriceAtBooking: number;
	totalAmount: number;
	status: BookingStatus;
	cancellationReason: string | null;
	cancelledAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	user: { name: string | null; email: string | null; phone: string | null };
	tariff: { name: string };
	_count: { items: number };
	payments: { amount: number }[];
}): StudioBookingRow {
	const totalPaid = b.payments.reduce((s, p) => s + p.amount, 0);
	return {
		id: b.id,
		userId: b.userId,
		userName: b.user.name,
		userEmail: b.user.email,
		userPhone: b.user.phone,
		tariffId: b.tariffId,
		tariffName: b.tariff.name,
		startDate: b.startDate,
		endDate: b.endDate,
		durationHours: b.durationHours,
		tariffPriceAtBooking: b.tariffPriceAtBooking,
		totalAmount: b.totalAmount,
		status: b.status,
		cancellationReason: b.cancellationReason,
		cancelledAt: b.cancelledAt,
		createdAt: b.createdAt,
		updatedAt: b.updatedAt,
		itemsCount: b._count.items,
		totalPaid,
		paymentStatus: calcPaymentStatus(b.totalAmount, totalPaid),
	};
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getStudioBookingsAction(
	filters: StudioBookingFilters = {}
): Promise<StudioBookingRow[]> {
	await requireAdminOrManager();

	const where: Record<string, unknown> = {};

	if (filters.status && filters.status !== "ALL") {
		where.status = filters.status;
	}
	if (filters.tariffId) {
		where.tariffId = filters.tariffId;
	}
	if (filters.dateFrom || filters.dateTo) {
		where.startDate = {
			...(filters.dateFrom && { gte: filters.dateFrom }),
			...(filters.dateTo && { lte: filters.dateTo }),
		};
	}
	if (filters.search?.trim()) {
		const s = filters.search.trim();
		where.user = {
			OR: [
				{ name: { contains: s, mode: "insensitive" } },
				{ email: { contains: s, mode: "insensitive" } },
				{ phone: { contains: s, mode: "insensitive" } },
			],
		};
	}

	const bookings = await prisma.studioBooking.findMany({
		where,
		orderBy: { createdAt: "desc" },
		include: {
			user: { select: { name: true, email: true, phone: true } },
			tariff: { select: { name: true } },
			_count: { select: { items: true } },
			payments: { select: { amount: true } },
		},
	});

	const rows = bookings.map(buildRow);

	// Фильтр по paymentStatus выполняем в памяти (вычисляемое поле)
	if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
		return rows.filter((r) => r.paymentStatus === filters.paymentStatus);
	}

	return rows;
}

export async function getStudioBookingDetailAction(
	id: string
): Promise<StudioBookingDetail | null> {
	await requireAdminOrManager();

	const b = await prisma.studioBooking.findUnique({
		where: { id },
		include: {
			user: { select: { name: true, email: true, phone: true } },
			tariff: { select: { name: true } },
			_count: { select: { items: true } },
			payments: {
				orderBy: { paidAt: "desc" },
				include: { author: { select: { name: true } } },
			},
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
			auditLogs: {
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!b) return null;

	const row = buildRow({
		...b,
		payments: b.payments,
	});

	return {
		...row,
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
			authorName: p.author?.name ?? null,
		})),
		auditLogs: b.auditLogs.map((l) => ({
			id: l.id,
			action: l.action,
			fieldName: l.fieldName,
			valueBefore: l.valueBefore,
			valueAfter: l.valueAfter,
			authorName: l.authorName,
			createdAt: l.createdAt,
			meta: l.meta,
		})),
	};
}

export async function getPendingStudioBookingsCountAction(): Promise<number> {
	try {
		return await prisma.studioBooking.count({
			where: { status: "PENDING_REVIEW" },
		});
	} catch {
		return 0;
	}
}

// ─── Status update ────────────────────────────────────────────────────────────

export async function updateStudioBookingStatusAction(
	bookingId: string,
	newStatus: BookingStatus,
	reason?: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await requireAdminOrManager();

		const booking = await prisma.studioBooking.findUnique({
			where: { id: bookingId },
			select: { status: true },
		});
		if (!booking) return { success: false, error: "Заказ не найден" };

		const oldStatus = booking.status;

		await prisma.studioBooking.update({
			where: { id: bookingId },
			data: {
				status: newStatus,
				...(newStatus === "CANCELLED" && {
					cancellationReason: reason ?? null,
					cancelledAt: new Date(),
				}),
				...(newStatus === "EXPIRED" && { expiredAt: new Date() }),
			},
		});

		await prisma.studioBookingAuditLog.create({
			data: {
				studioBookingId: bookingId,
				authorId: session?.user?.id ?? null,
				authorName: session?.user?.name ?? null,
				action: "STATUS_CHANGED",
				fieldName: "status",
				valueBefore: oldStatus,
				valueAfter: newStatus,
				...(reason && { meta: { reason } }),
			},
		});

		revalidatePath("/admin/studio");
		return { success: true };
	} catch (e) {
		console.error("updateStudioBookingStatusAction:", e);
		return { success: false, error: "Ошибка обновления статуса" };
	}
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function addStudioBookingPaymentAction(input: {
	studioBookingId: string;
	amount: number;
	method: PaymentMethod;
	type?: PaymentType;
	note?: string;
	paidAt?: Date;
}): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await requireAdminOrManager();

		if (input.amount <= 0)
			return { success: false, error: "Сумма должна быть > 0" };

		await prisma.studioBookingPayment.create({
			data: {
				studioBookingId: input.studioBookingId,
				authorId: session?.user?.id ?? null,
				amount: input.amount,
				method: input.method,
				type: input.type ?? "PAYMENT",
				note: input.note?.trim() || null,
				paidAt: input.paidAt ?? new Date(),
			},
		});

		await prisma.studioBookingAuditLog.create({
			data: {
				studioBookingId: input.studioBookingId,
				authorId: session?.user?.id ?? null,
				authorName: session?.user?.name ?? null,
				action: "PAYMENT_ADDED",
				fieldName: "payment",
				valueAfter: String(input.amount),
				meta: { method: input.method, type: input.type ?? "PAYMENT" },
			},
		});

		revalidatePath("/admin/studio");
		return { success: true };
	} catch (e) {
		console.error("addStudioBookingPaymentAction:", e);
		return { success: false, error: "Ошибка добавления платежа" };
	}
}

export async function deleteStudioBookingPaymentAction(
	paymentId: string,
	studioBookingId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await requireAdminOrManager();

		const payment = await prisma.studioBookingPayment.findUnique({
			where: { id: paymentId },
			select: { amount: true, method: true },
		});
		if (!payment) return { success: false, error: "Платёж не найден" };

		await prisma.studioBookingPayment.delete({ where: { id: paymentId } });

		await prisma.studioBookingAuditLog.create({
			data: {
				studioBookingId,
				authorId: session?.user?.id ?? null,
				authorName: session?.user?.name ?? null,
				action: "PAYMENT_DELETED",
				fieldName: "payment",
				valueBefore: String(payment.amount),
				meta: { method: payment.method },
			},
		});

		revalidatePath("/admin/studio");
		return { success: true };
	} catch (e) {
		console.error("deleteStudioBookingPaymentAction:", e);
		return { success: false, error: "Ошибка удаления платежа" };
	}
}

// ─── Admin manual create ──────────────────────────────────────────────────────

export async function createStudioBookingByAdminAction(input: {
	userId: string;
	tariffId: string;
	startDate: Date;
	endDate: Date;
	equipmentIds?: string[];
	note?: string;
}): Promise<{ success: boolean; bookingId?: string; error?: string }> {
	try {
		const session = await requireAdminOrManager();

		// Считаем длительность
		const durationMs = input.endDate.getTime() - input.startDate.getTime();
		const durationHours = Math.max(1, durationMs / (1000 * 60 * 60));

		// Проверяем конфликт по времени
		const conflict = await prisma.studioBooking.findFirst({
			where: {
				status: {
					in: ["PENDING_REVIEW", "WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"],
				},
				OR: [
					{
						startDate: { lt: input.endDate },
						endDate: { gt: input.startDate },
					},
				],
			},
		});
		if (conflict) {
			return {
				success: false,
				error: "Студия занята в указанный период",
			};
		}

		const tariff = await prisma.studioTariff.findUnique({
			where: { id: input.tariffId },
		});
		if (!tariff) return { success: false, error: "Тариф не найден" };

		// Стоимость техники
		let equipmentTotal = 0;
		const equipmentItems: { equipmentId: string; priceAtBooking: number }[] =
			[];

		if (input.equipmentIds?.length) {
			const equipments = await prisma.equipment.findMany({
				where: { id: { in: input.equipmentIds }, studioAvailable: true },
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
				userId: input.userId,
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
				authorId: session?.user?.id ?? null,
				authorName: session?.user?.name ?? null,
				action: "CREATED",
				meta: {
					createdByAdmin: true,
					...(input.note && { note: input.note }),
				},
			},
		});

		revalidatePath("/admin/studio");
		return { success: true, bookingId: booking.id };
	} catch (e) {
		console.error("createStudioBookingByAdminAction:", e);
		return { success: false, error: "Ошибка создания заказа" };
	}
}

// ─── Delete (admin only) ──────────────────────────────────────────────────────

export async function deleteStudioBookingAction(
	bookingId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN")
			return {
				success: false,
				error: "Только администратор может удалять заказы",
			};

		await prisma.studioBooking.delete({ where: { id: bookingId } });

		revalidatePath("/admin/studio");
		return { success: true };
	} catch (e) {
		console.error("deleteStudioBookingAction:", e);
		return { success: false, error: "Ошибка удаления" };
	}
}
