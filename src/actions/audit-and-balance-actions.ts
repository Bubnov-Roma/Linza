"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { computePaymentStatus } from "@/actions/admin-booking-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fmtRub } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Не авторизован");
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true, name: true },
	});
	if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
		throw new Error("Недостаточно прав");
	}
	return { userId: session.user.id, name: user.name ?? "Администратор" };
}

export interface AuditLogEntry {
	id: string;
	action: string;
	fieldName: string | null;
	valueBefore: string | null;
	valueAfter: string | null;
	authorName: string | null;
	authorId: string | null;
	createdAt: string;
	meta?: Record<string, unknown> | null;
}

/**
 * Записать одну запись в лог изменений заказа.
 * Вызывается из других server actions — не напрямую из UI.
 */
export async function writeAuditLog(
	bookingId: string,
	authorId: string,
	authorName: string,
	entry: {
		action: string;
		fieldName?: string;
		valueBefore?: string;
		valueAfter?: string;
		meta?: Record<string, unknown>;
	}
): Promise<void> {
	await prisma.bookingAuditLog.create({
		data: {
			bookingId,
			authorId,
			authorName,
			action: entry.action,
			fieldName: entry.fieldName ?? null,
			valueBefore: entry.valueBefore ?? null,
			valueAfter: entry.valueAfter ?? null,
			meta: entry.meta ? (entry.meta as unknown as Prisma.JsonObject) : {},
		},
	});
}

/**
 * Получить всю историю изменений заказа (для отображения в Sheet).
 */
export async function getBookingAuditLogAction(
	bookingId: string
): Promise<{ success: boolean; data?: AuditLogEntry[]; error?: string }> {
	try {
		await requireAdmin();

		const logs = await prisma.bookingAuditLog.findMany({
			where: { bookingId },
			orderBy: { createdAt: "desc" },
			take: 100,
		});

		return {
			success: true,
			data: logs.map((l) => ({
				id: l.id,
				action: l.action,
				fieldName: l.fieldName,
				valueBefore: l.valueBefore,
				valueAfter: l.valueAfter,
				authorName: l.authorName,
				authorId: l.authorId,
				createdAt: l.createdAt.toISOString(),
				meta: l.meta as Record<string, unknown> | null,
			})),
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ═══════════════════════════════════════════════════════════════════
// BookingLabel (метки к заказу)
// ═══════════════════════════════════════════════════════════════════

export interface BookingLabelDB {
	id: string;
	text: string;
	color: string;
	dueDate: string | null;
	shift: string | null;
	authorName: string | null;
	createdAt: string;
}

export async function getBookingLabelsAction(
	bookingId: string
): Promise<{ success: boolean; data?: BookingLabelDB[]; error?: string }> {
	try {
		await requireAdmin();
		const labels = await prisma.bookingLabel.findMany({
			where: { bookingId },
			orderBy: { createdAt: "asc" },
			include: { author: { select: { name: true } } },
		});
		return {
			success: true,
			data: labels.map((l) => ({
				id: l.id,
				text: l.text,
				color: l.color,
				dueDate: l.dueDate?.toISOString() ?? null,
				shift: l.shift,
				authorName: l.author?.name ?? null,
				createdAt: l.createdAt.toISOString(),
			})),
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function addBookingLabelAction(
	bookingId: string,
	label: { text: string; color: string; dueDate?: string; shift?: string }
): Promise<{ success: boolean; data?: BookingLabelDB; error?: string }> {
	try {
		const { userId, name } = await requireAdmin();
		const created = await prisma.bookingLabel.create({
			data: {
				bookingId,
				authorId: userId,
				text: label.text,
				color: label.color,
				dueDate: label.dueDate ? new Date(label.dueDate) : null,
				shift: label.shift ?? null,
			},
			include: { author: { select: { name: true } } },
		});
		await writeAuditLog(bookingId, userId, name, {
			action: "Метка добавлена",
			fieldName: "labels",
			valueAfter: label.text,
		});
		return {
			success: true,
			data: {
				id: created.id,
				text: created.text,
				color: created.color,
				dueDate: created.dueDate?.toISOString() ?? null,
				shift: created.shift,
				authorName: created.author?.name ?? null,
				createdAt: created.createdAt.toISOString(),
			},
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function removeBookingLabelAction(
	bookingId: string,
	labelId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { userId, name } = await requireAdmin();
		const label = await prisma.bookingLabel.findUnique({
			where: { id: labelId },
			select: { text: true },
		});
		await prisma.bookingLabel.delete({ where: { id: labelId } });
		await writeAuditLog(bookingId, userId, name, {
			action: "Метка удалена",
			fieldName: "labels",
			valueBefore: label?.text || "неизвестная метка",
		});
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ═══════════════════════════════════════════════════════════════════
// БЛОК 3: Баланс клиента
// ═══════════════════════════════════════════════════════════════════

export interface BalanceTx {
	id: string;
	type: "REFUND" | "CREDIT" | "DEBIT" | "MANUAL";
	amount: number;
	description: string | null;
	bookingId: string | null;
	authorName: string | null;
	createdAt: string;
}

/** Получить текущий баланс клиента + историю транзакций */
export async function getUserBalanceAction(userId: string): Promise<{
	success: boolean;
	balance?: number;
	transactions?: BalanceTx[];
	error?: string;
}> {
	try {
		await requireAdmin();
		const [user, txs] = await Promise.all([
			prisma.user.findUnique({
				where: { id: userId },
				select: { balance: true },
			}),
			prisma.balanceTransaction.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: 50,
				include: { author: { select: { name: true } } },
			}),
		]);

		if (!user) return { success: false, error: "Пользователь не найден" };

		return {
			success: true,
			balance: user.balance,
			transactions: txs.map((t) => ({
				id: t.id,
				type: t.type,
				amount: t.amount,
				description: t.description,
				bookingId: t.bookingId,
				authorName: t.author?.name ?? null,
				createdAt: t.createdAt.toISOString(),
			})),
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/**
 * Начислить или списать средства с баланса клиента (ручная операция от admin/manager).
 * type: CREDIT = пополнение, DEBIT = списание, MANUAL = произвольная корректировка
 */
export async function adjustUserBalanceAction(
	userId: string,
	type: "CREDIT" | "DEBIT" | "MANUAL",
	amount: number,
	description?: string,
	bookingId?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
	try {
		const { userId: authorId, name: _authorName } = await requireAdmin();

		const delta = type === "DEBIT" ? -Math.abs(amount) : Math.abs(amount);

		const [updatedUser] = await prisma.$transaction([
			prisma.user.update({
				where: { id: userId },
				data: { balance: { increment: delta } },
				select: { balance: true },
			}),
			prisma.balanceTransaction.create({
				data: {
					userId,
					bookingId: bookingId ?? null,
					type,
					amount: delta,
					description: description ?? null,
					authorId,
				},
			}),
		]);

		revalidatePath("/admin/users");
		return { success: true, newBalance: updatedUser.balance };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/**
 * Перечислить переплату на баланс клиента.
 * Вызывается из adminUpdateBookingPricingAction когда новая сумма < оплаченной.
 */
export async function refundToBalanceAction(
	userId: string,
	amount: number,
	bookingId: string,
	description?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
	try {
		const { userId: authorId, name: authorName } = await requireAdmin();

		const [updatedUser] = await prisma.$transaction([
			// 1. Пополняем баланс пользователя
			prisma.user.update({
				where: { id: userId },
				data: { balance: { increment: amount } },
				select: { balance: true },
			}),
			// 2. Создаем транзакцию баланса
			prisma.balanceTransaction.create({
				data: {
					userId,
					bookingId,
					type: "REFUND",
					amount,
					description:
						description ??
						`Возврат переплаты по заказу ${bookingId.slice(0, 8)}`,
					authorId,
				},
			}),
			// 3. ДОБАВЛЕНО: Создаем отрицательный платеж в самом заказе для выравнивания суммы
			prisma.bookingPayment.create({
				data: {
					bookingId,
					authorId,
					amount: -Math.abs(amount), // Минусуем сумму из заказа
					method: "TRANSFER", // Или любой другой подходящий метод из вашего PaymentMethod (CASH, CARD и т.д.)
					note: "Возврат переплаты на баланс клиента",
					paidAt: new Date(),
				},
			}),
		]);

		// Логируем изменение в аудит заказа для истории
		await writeAuditLog(bookingId, authorId, authorName, {
			action: "Возврат переплаты",
			fieldName: "payments",
			valueAfter: `Переведено на баланс: ${fmtRub(amount)}`,
		});

		revalidatePath("/admin/users");
		revalidatePath("/admin/bookings"); // Обязательно обновляем кэш заказов
		return { success: true, newBalance: updatedUser.balance };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/**
 * Применить баланс клиента в счёт оплаты заказа.
 * amount — сколько списать с баланса (не больше текущего баланса и не больше суммы заказа).
 */
export async function applyBalanceToBookingAction(
	userId: string,
	bookingId: string,
	amount: number
): Promise<{
	success: boolean;
	newBalance?: number;
	error?: string;
}> {
	try {
		const { userId: authorId, name: authorName } = await requireAdmin();

		const [user, booking] = await Promise.all([
			prisma.user.findUnique({
				where: { id: userId },
				select: { balance: true },
			}),
			prisma.booking.findUnique({
				where: { id: bookingId },
				// Запрашиваем платежи, чтобы посчитать текущую оплаченную сумму
				select: { totalAmount: true, payments: { select: { amount: true } } },
			}),
		]);

		if (!user) return { success: false, error: "Пользователь не найден" };
		if (!booking) return { success: false, error: "Заказ не найден" };
		if (user.balance < amount)
			return {
				success: false,
				error: `Недостаточно средств на балансе (есть ${fmtRub(user.balance)})`,
			};

		const prevPaid = booking.payments.reduce((s, p) => s + p.amount, 0);
		const remaining = booking.totalAmount - prevPaid;

		if (amount > remaining)
			return {
				success: false,
				error: "Нельзя списать больше суммы остатка к оплате",
			};

		const [updatedUser] = await prisma.$transaction([
			// 1. Списываем средства с баланса пользователя
			prisma.user.update({
				where: { id: userId },
				data: { balance: { decrement: amount } },
				select: { balance: true },
			}),
			// 2. ИСПРАВЛЕНИЕ: Создаем платеж в заказе! Стоимость заказа (totalAmount) не трогаем.
			prisma.bookingPayment.create({
				data: {
					bookingId,
					authorId,
					amount: amount,
					method: "BALANCE", // Указываем, что оплачено с баланса
					type: "PAYMENT", // Или другой тип по умолчанию
					note: "Оплата заказа с баланса клиента",
					paidAt: new Date(),
				},
			}),
			// 3. Записываем историю транзакций баланса
			prisma.balanceTransaction.create({
				data: {
					userId,
					bookingId,
					type: "DEBIT",
					amount: -amount,
					description: `Оплата заказа ${bookingId.slice(0, 8).toUpperCase()} с баланса`,
					authorId,
				},
			}),
		]);

		const newTotalPaid = prevPaid + amount;

		const paymentStatus = await computePaymentStatus(
			newTotalPaid,
			booking.totalAmount
		);

		// Лог в историю заказа
		await writeAuditLog(bookingId, authorId, authorName, {
			action: "Оплата с баланса",
			fieldName: "payments",
			valueBefore: `Оплачено: ${fmtRub(prevPaid)}`,
			valueAfter: `Оплачено: ${fmtRub(newTotalPaid)} (+${fmtRub(amount)} с баланса)`,
			meta: { paymentStatus },
		});

		revalidatePath("/admin/bookings");
		revalidatePath("/admin/users");

		return {
			success: true,
			newBalance: updatedUser.balance,
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}
