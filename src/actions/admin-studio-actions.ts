"use server";

import type { BookingStatus, PaymentMethod, PaymentType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
	computePaymentStatus,
	type RecordPaymentPayload,
	type RecordPaymentResult,
} from "@/actions/admin-booking-actions";
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

export interface StudioEquipmentSearchResult {
	id: string;
	title: string;
	priceStudio: number;
	categoryName: string;
	imageUrl: string | null;
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
	userBalance: number;
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
	search?: string | "ALL";
	dateFrom?: Date | undefined;
	dateTo?: Date | undefined;
	tariffId?: string | undefined;
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
			user: { select: { name: true, email: true, phone: true, balance: true } },
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
		userBalance: b.user.balance ?? 0,
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

// ─── Full booking update (admin) ──────────────────────────────────────────────

export interface UpdateStudioBookingInput {
	bookingId: string;
	userId?: string;
	tariffId?: string;
	startDate?: Date;
	endDate?: Date;
	totalAmount?: number;
	/** Полный список ID техники (replaces existing) */
	equipmentIds?: string[];
	note?: string;
}

/**
 * Полное редактирование заказа студии администратором.
 * Позволяет изменить клиента, тариф, период, технику и сумму.
 */
export async function updateStudioBookingFullAction(
	input: UpdateStudioBookingInput
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await requireAdminOrManager();
		const authorId = session?.user?.id ?? null;
		const authorName = session?.user?.name ?? null;

		const existing = await prisma.studioBooking.findUnique({
			where: { id: input.bookingId },
			include: {
				items: { select: { equipmentId: true, priceAtBooking: true } },
				tariff: true,
			},
		});
		if (!existing) return { success: false, error: "Заказ не найден" };

		const newStartDate = input.startDate ?? existing.startDate;
		const newEndDate = input.endDate ?? existing.endDate;
		const newTariffId = input.tariffId ?? existing.tariffId;
		const newUserId = input.userId ?? existing.userId;

		// Проверка пересечений если изменилось время
		const timeChanged =
			input.startDate !== undefined || input.endDate !== undefined;
		if (timeChanged) {
			const conflict = await prisma.studioBooking.findFirst({
				where: {
					id: { not: input.bookingId },
					status: { in: ["WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"] },
					startDate: { lt: newEndDate },
					endDate: { gt: newStartDate },
				},
				select: { id: true, startDate: true, endDate: true },
			});

			if (conflict) {
				const fmt = (d: Date) =>
					d.toLocaleString("ru-RU", {
						day: "numeric",
						month: "short",
						hour: "2-digit",
						minute: "2-digit",
					});
				return {
					success: false,
					error: `Студия занята: ${fmt(conflict.startDate)} — ${fmt(conflict.endDate)}`,
				};
			}
		}

		// Пересчёт длительности
		const durationMs = newEndDate.getTime() - newStartDate.getTime();
		const durationHours = Math.max(1, durationMs / (1000 * 60 * 60));

		// Новый тариф
		let tariffPriceAtBooking = existing.tariffPriceAtBooking;
		if (input.tariffId && input.tariffId !== existing.tariffId) {
			const tariff = await prisma.studioTariff.findUnique({
				where: { id: input.tariffId },
			});
			if (!tariff) return { success: false, error: "Тариф не найден" };
			tariffPriceAtBooking = tariff.pricePerHour;
		}

		// Пересчёт техники
		let equipmentItems: { equipmentId: string; priceAtBooking: number }[] = [];
		let equipmentTotal = 0;

		if (input.equipmentIds !== undefined) {
			// Полная замена списка техники
			if (input.equipmentIds.length > 0) {
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
		} else {
			// Оставляем старую технику
			equipmentItems = existing.items.map((i) => ({
				equipmentId: i.equipmentId,
				priceAtBooking: i.priceAtBooking,
			}));
			equipmentTotal = existing.items.reduce((s, i) => s + i.priceAtBooking, 0);
		}

		// Итоговая сумма
		const autoTotal = tariffPriceAtBooking * durationHours + equipmentTotal;
		const newTotalAmount = input.totalAmount ?? autoTotal;

		// Аудит-лог изменений
		const changes: string[] = [];
		if (input.userId && input.userId !== existing.userId) {
			const newUser = await prisma.user.findUnique({
				where: { id: input.userId },
				select: { name: true },
			});
			changes.push(`Клиент → ${newUser?.name ?? input.userId}`);
		}
		if (input.tariffId && input.tariffId !== existing.tariffId) {
			const newTariff = await prisma.studioTariff.findUnique({
				where: { id: input.tariffId },
				select: { name: true },
			});
			changes.push(`Тариф → ${newTariff?.name ?? input.tariffId}`);
		}
		if (timeChanged) {
			changes.push(
				`Период → ${newStartDate.toLocaleString("ru-RU")} – ${newEndDate.toLocaleString("ru-RU")}`
			);
		}
		if (input.equipmentIds !== undefined) {
			changes.push(`Техника обновлена (${equipmentItems.length} позиц.)`);
		}
		if (
			input.totalAmount !== undefined &&
			Math.abs(input.totalAmount - existing.totalAmount) > 0.01
		) {
			changes.push(`Сумма: ${existing.totalAmount} ₽ → ${input.totalAmount} ₽`);
		}

		await prisma.$transaction([
			// Удаляем старую технику если меняем список
			...(input.equipmentIds !== undefined
				? [
						prisma.studioBookingItem.deleteMany({
							where: { studioBookingId: input.bookingId },
						}),
					]
				: []),
			// Обновляем заказ
			prisma.studioBooking.update({
				where: { id: input.bookingId },
				data: {
					...(newUserId !== existing.userId && { userId: newUserId }),
					...(newTariffId !== existing.tariffId && { tariffId: newTariffId }),
					startDate: newStartDate,
					endDate: newEndDate,
					durationHours,
					tariffPriceAtBooking,
					totalAmount: newTotalAmount,
					// Создаём новую технику если меняем список
					...(input.equipmentIds !== undefined && {
						items: { create: equipmentItems },
					}),
				},
			}),
			// Аудит
			prisma.studioBookingAuditLog.create({
				data: {
					studioBookingId: input.bookingId,
					authorId,
					authorName,
					action: "BOOKING_UPDATED",
					fieldName: null,
					valueBefore: null,
					valueAfter: changes.join("; ") || "Изменения сохранены",
					meta: {
						...(input.note && { note: input.note }),
						changes,
					},
				},
			}),
		]);

		revalidatePath("/admin/studio");
		return { success: true };
	} catch (e) {
		console.error("updateStudioBookingFullAction:", e);
		return { success: false, error: "Ошибка обновления заказа" };
	}
}

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * Вернуть переплату по аренде студии на баланс клиента.
 */
export async function refundStudioToBalanceAction(
	studioBookingId: string,
	amount: number
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await requireAdminOrManager();
		const authorId = session?.user?.id ?? null;
		const authorName = session?.user?.name ?? null;

		const booking = await prisma.studioBooking.findUnique({
			where: { id: studioBookingId },
			select: { userId: true },
		});
		if (!booking) return { success: false, error: "Заказ не найден" };

		await prisma.$transaction([
			// Пополняем баланс клиента
			prisma.user.update({
				where: { id: booking.userId },
				data: { balance: { increment: amount } },
			}),
			// Транзакция баланса (REFUND)
			prisma.balanceTransaction.create({
				data: {
					userId: booking.userId,
					bookingId: null,
					type: "REFUND",
					amount,
					description: `Возврат переплаты за студию (заказ …${studioBookingId.slice(-6).toUpperCase()})`,
					authorId,
				},
			}),
			// Отрицательный платёж в заказе для выравнивания
			prisma.studioBookingPayment.create({
				data: {
					studioBookingId,
					authorId,
					amount: -amount,
					method: "TRANSFER",
					type: "PAYMENT",
					note: "Возврат переплаты на баланс клиента",
					paidAt: new Date(),
				},
			}),
			// Аудит
			prisma.studioBookingAuditLog.create({
				data: {
					studioBookingId,
					authorId,
					authorName,
					action: "REFUND_TO_BALANCE",
					fieldName: "payment",
					valueAfter: `+${amount} на баланс`,
				},
			}),
		]);

		revalidatePath("/admin/studio");
		revalidatePath("/admin/users");
		return { success: true };
	} catch (e) {
		console.error("refundStudioToBalanceAction:", e);
		return { success: false, error: "Ошибка возврата на баланс" };
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

		// Проверяем конфликт по времени (только WAIT_PAYMENT, READY_TO_RENT, ACTIVE)
		const conflict = await prisma.studioBooking.findFirst({
			where: {
				status: { in: ["WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"] },
				startDate: { lt: input.endDate },
				endDate: { gt: input.startDate },
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

		// Стоимость техники (только studioAvailable=true)
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

// ─── Studio Payments API (for PaymentsPanel) ──────────────────────────────────

// ─── ДОБАВИТЬ В src/actions/admin-studio-actions.ts ──────────────────────────

// ─── Admin: search studio equipment ──────────────────────────────────────────

/**
 * Поиск студийной техники для редактирования заказа администратором.
 * В отличие от клиентского searchStudioEquipmentAction не фильтрует по занятости —
 * админ видит всё studioAvailable оборудование.
 */
export async function searchStudioEquipmentAdminAction(
	query: string,
	excludeBookingId?: string,
	startDate?: Date,
	endDate?: Date
): Promise<StudioEquipmentSearchResult[]> {
	try {
		await requireAdminOrManager();
		if (!query.trim()) return [];

		// Если переданы даты — вычисляем занятую технику (исключая текущий заказ)
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
			categoryName: eq.category.name,
			imageUrl: eq.equipmentImageLinks[0]?.image.url ?? null,
		}));
	} catch {
		return [];
	}
}

/**
 * Получить все платежи по заказу студии
 */
export async function getStudioPaymentsAction(bookingId: string) {
	try {
		await requireAdminOrManager();

		const booking = await prisma.studioBooking.findUnique({
			where: { id: bookingId },
			select: { totalAmount: true },
		});
		if (!booking) return { success: false, error: "Заказ не найден" };

		const payments = await prisma.studioBookingPayment.findMany({
			where: { studioBookingId: bookingId },
			orderBy: { paidAt: "desc" },
			include: { author: { select: { name: true } } },
		});

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
				method: p.method,
				note: p.note,
				paidAt: p.paidAt.toISOString(),
				createdAt: p.paidAt.toISOString(), // Приводим к ожидаемому формату дат
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

/**
 * Зафиксировать платёж по заказу студии (в т.ч. с баланса)
 */
export async function recordStudioPaymentAction(
	payload: RecordPaymentPayload
): Promise<RecordPaymentResult> {
	try {
		const session = await requireAdminOrManager();
		const userId = session?.user?.id;
		const name = session?.user?.name;

		if (!userId) throw new Error("Не авторизован");

		const booking = await prisma.studioBooking.findUnique({
			where: { id: payload.bookingId },
			select: {
				userId: true,
				totalAmount: true,
				status: true,
				payments: { select: { amount: true } },
			},
		});
		if (!booking) return { success: false, error: "Заказ не найден" };

		let payment: {
			id: string;
			amount: number;
			method: PaymentMethod;
			type: string;
			note: string | null;
			paidAt: Date;
			createdAt: Date;
			author: { name: string | null } | null;
		};

		if (payload.method === "BALANCE") {
			const balanceDelta = -payload.amount;
			const txType = balanceDelta > 0 ? "REFUND" : "DEBIT";
			const txDesc =
				balanceDelta > 0
					? `Возврат средств на баланс по студии ${payload.bookingId.slice(0, 8)}`
					: `Списание с баланса в счет студии ${payload.bookingId.slice(0, 8)}`;

			const [createdPayment] = await prisma.$transaction([
				prisma.studioBookingPayment.create({
					data: {
						studioBookingId: payload.bookingId,
						authorId: userId,
						amount: payload.amount,
						method: payload.method,
						type: payload.type,
						note: payload.note ?? null,
						paidAt: new Date(),
					},
					include: { author: { select: { name: true } } },
				}),
				prisma.user.update({
					where: { id: booking.userId },
					data: { balance: { increment: balanceDelta } },
				}),
				prisma.balanceTransaction.create({
					data: {
						userId: booking.userId,
						type: txType,
						amount: balanceDelta,
						description: txDesc,
						authorId: userId,
					},
				}),
			]);
			payment = createdPayment;
		} else {
			payment = await prisma.studioBookingPayment.create({
				data: {
					studioBookingId: payload.bookingId,
					authorId: userId,
					amount: payload.amount,
					method: payload.method,
					type: payload.type,
					note: payload.note ?? null,
					paidAt: new Date(),
				},
				include: { author: { select: { name: true } } },
			});
		}

		const prevPaid = booking.payments.reduce((s, p) => s + p.amount, 0);
		const newTotalPaid = prevPaid + payload.amount;
		const paymentStatus = await computePaymentStatus(
			newTotalPaid,
			booking.totalAmount
		);

		// Аудит лог
		await prisma.studioBookingAuditLog.create({
			data: {
				studioBookingId: payload.bookingId,
				authorId: userId,
				authorName: name ?? "Admin",
				action: payload.amount > 0 ? "PAYMENT_ADDED" : "REFUND_TO_BALANCE",
				fieldName: "payment",
				valueAfter: `Оплачено: ${newTotalPaid.toLocaleString("ru-RU")} ₽`,
				meta: { method: payload.method, note: payload.note, paymentStatus },
			},
		});

		revalidatePath("/admin/studio");
		revalidatePath("/admin/users");

		return {
			success: true,
			payment: {
				id: payment.id,
				amount: payment.amount,
				method: payment.method,
				note: payment.note,
				paidAt: payment.paidAt.toISOString(),
				createdAt: payment.paidAt.toISOString(),
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

/**
 * Удалить платёж (только для ADMIN)
 */
export async function deleteStudioPaymentAction(
	bookingId: string,
	paymentId: string
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
				studioBookingId: bookingId,
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
	} catch {
		return { success: false, error: "Ошибка удаления платежа" };
	}
}
