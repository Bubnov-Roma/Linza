"use server";

import type { DiscountType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── Типы ─────────────────────────────────────────────────────────────────────

export interface PromoCodeItem {
	id: string;
	code: string;
	type: DiscountType;
	value: number;
	description: string | null;
	isActive: boolean;
	usageLimit: number | null;
	usedCount: number;
	perUserLimit: number | null;
	minOrderAmount: number | null;
	autoApplyTrigger: string | null;
	equipmentIds: string[];
	validFrom: string | null;
	validUntil: string | null;
	createdBy: string | null;
	creatorName: string | null;
	createdAt: string;
}

// ─── Helper: авторизация ───────────────────────────────────────────────────────

async function requireAdminOrPromoRight() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Не авторизован");

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true, isAdminCreated: true, permissions: true },
	});

	if (!user || user.role !== "ADMIN") throw new Error("Недостаточно прав");

	// Изначальные ADMIN — полный доступ без проверки
	if (!user.isAdminCreated) return session.user.id;

	// Назначенные ADMIN — проверяем право promo_edit
	const perms = user.permissions as Record<string, boolean> | null;
	if (!perms?.promo_edit)
		throw new Error("Нет права на управление промокодами");

	return session.user.id;
}

// ─── Helper: маппинг строки БД → PromoCodeItem ────────────────────────────────

function mapPromoRow(r: {
	id: string;
	code: string;
	type: DiscountType;
	value: number;
	description: string | null;
	isActive: boolean;
	usageLimit: number | null;
	usedCount: number;
	perUserLimit: number | null;
	minOrderAmount: number | null;
	autoApplyTrigger: string | null;
	validFrom: Date | null;
	validUntil: Date | null;
	createdBy: string | null;
	createdAt: Date;
	creator: { name: string | null } | null;
	equipmentRestrictions: { equipmentId: string }[];
}): PromoCodeItem {
	return {
		id: r.id,
		code: r.code,
		type: r.type,
		value: r.value,
		description: r.description,
		isActive: r.isActive,
		usageLimit: r.usageLimit,
		usedCount: r.usedCount,
		perUserLimit: r.perUserLimit,
		minOrderAmount: r.minOrderAmount,
		autoApplyTrigger: r.autoApplyTrigger,
		equipmentIds: r.equipmentRestrictions.map((e) => e.equipmentId),
		validFrom: r.validFrom?.toISOString() ?? null,
		validUntil: r.validUntil?.toISOString() ?? null,
		createdBy: r.createdBy,
		creatorName: r.creator?.name ?? null,
		createdAt: r.createdAt.toISOString(),
	};
}

const PROMO_INCLUDE = {
	creator: { select: { name: true } },
	equipmentRestrictions: { select: { equipmentId: true } },
} as const;

// ─── Actions ──────────────────────────────────────────────────────────────────

/** Получить все промокоды */
export async function getPromoCodesAction(): Promise<{
	success: boolean;
	data?: PromoCodeItem[];
	error?: string;
}> {
	try {
		await requireAdminOrPromoRight();

		const rows = await prisma.promoCode.findMany({
			orderBy: { createdAt: "desc" },
			include: PROMO_INCLUDE,
		});

		return { success: true, data: rows.map(mapPromoRow) };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/** Создать промокод */
export async function createPromoCodeAction(input: {
	code: string;
	type: DiscountType;
	value: number;
	description?: string;
	isActive?: boolean;
	usageLimit?: number | null;
	perUserLimit?: number | null;
	minOrderAmount?: number | null;
	autoApplyTrigger?: string | null;
	equipmentIds?: string[];
	validFrom?: string | null;
	validUntil?: string | null;
}): Promise<{ success: boolean; data?: PromoCodeItem; error?: string }> {
	try {
		const authorId = await requireAdminOrPromoRight();

		const code = input.code.trim().toUpperCase();
		if (!code) return { success: false, error: "Кодовое слово обязательно" };
		if (input.value <= 0)
			return { success: false, error: "Значение должно быть больше 0" };
		if (input.type === "PERCENT" && input.value > 100)
			return { success: false, error: "Скидка не может превышать 100%" };

		const created = await prisma.promoCode.create({
			data: {
				code,
				type: input.type,
				value: input.value,
				description: input.description?.trim() ?? null,
				isActive: input.isActive ?? true,
				usageLimit: input.usageLimit ?? null,
				perUserLimit: input.perUserLimit ?? null,
				minOrderAmount: input.minOrderAmount ?? null,
				autoApplyTrigger: input.autoApplyTrigger ?? null,
				validFrom: input.validFrom ? new Date(input.validFrom) : null,
				validUntil: input.validUntil ? new Date(input.validUntil) : null,
				createdBy: authorId,
				// Создаём связи с оборудованием в одной операции
				equipmentRestrictions: input.equipmentIds?.length
					? {
							create: input.equipmentIds.map((equipmentId) => ({
								equipmentId,
							})),
						}
					: {},
			},
			include: PROMO_INCLUDE,
		});

		revalidatePath("/admin/settings");
		return { success: true, data: mapPromoRow(created) };
	} catch (e: unknown) {
		if (
			e instanceof Error &&
			"code" in e &&
			(e as { code: string }).code === "P2002"
		) {
			return { success: false, error: "Промокод с таким кодом уже существует" };
		}
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/** Обновить промокод */
export async function updatePromoCodeAction(
	id: string,
	input: Partial<{
		code: string;
		type: DiscountType;
		value: number;
		description: string | null;
		isActive: boolean;
		usageLimit: number | null;
		perUserLimit: number | null;
		minOrderAmount: number | null;
		autoApplyTrigger: string | null;
		equipmentIds: string[];
		validFrom: string | null;
		validUntil: string | null;
	}>
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireAdminOrPromoRight();

		const data: Parameters<typeof prisma.promoCode.update>[0]["data"] = {};

		if (input.code !== undefined) data.code = input.code.trim().toUpperCase();
		if (input.type !== undefined) data.type = input.type;
		if (input.value !== undefined) {
			if (input.value <= 0)
				return { success: false, error: "Значение должно быть больше 0" };
			data.value = input.value;
		}
		if (input.description !== undefined) data.description = input.description;
		if (input.isActive !== undefined) data.isActive = input.isActive;
		if (input.usageLimit !== undefined) data.usageLimit = input.usageLimit;
		if (input.perUserLimit !== undefined)
			data.perUserLimit = input.perUserLimit;
		if (input.minOrderAmount !== undefined)
			data.minOrderAmount = input.minOrderAmount;
		if (input.autoApplyTrigger !== undefined)
			data.autoApplyTrigger = input.autoApplyTrigger;
		if (input.validFrom !== undefined) {
			data.validFrom = input.validFrom ? new Date(input.validFrom) : null;
		}
		if (input.validUntil !== undefined) {
			data.validUntil = input.validUntil ? new Date(input.validUntil) : null;
		}

		if (input.equipmentIds !== undefined) {
			// Полная замена: удаляем старые → создаём новые в транзакции
			await prisma.$transaction([
				prisma.promoCodeEquipment.deleteMany({ where: { promoCodeId: id } }),
				prisma.promoCode.update({
					where: { id },
					data: {
						...data,
						equipmentRestrictions: input.equipmentIds.length
							? {
									create: input.equipmentIds.map((equipmentId) => ({
										equipmentId,
									})),
								}
							: {},
					},
				}),
			]);
		} else {
			await prisma.promoCode.update({ where: { id }, data });
		}

		revalidatePath("/admin/settings");
		return { success: true };
	} catch (e: unknown) {
		if (
			e instanceof Error &&
			"code" in e &&
			(e as { code: string }).code === "P2002"
		) {
			return { success: false, error: "Промокод с таким кодом уже существует" };
		}
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/** Удалить промокод */
export async function deletePromoCodeAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireAdminOrPromoRight();
		// equipmentRestrictions удалятся каскадно (onDelete: Cascade в схеме)
		await prisma.promoCode.delete({ where: { id } });
		revalidatePath("/admin/settings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/** Сбросить счётчик использований */
export async function resetPromoCodeUsageAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireAdminOrPromoRight();
		await prisma.promoCode.update({ where: { id }, data: { usedCount: 0 } });
		revalidatePath("/admin/settings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/**
 * Публичный action — проверить промокод при оформлении заказа клиентом.
 *
 * Новые проверки:
 *   - perUserLimit: считаем сколько раз клиент уже использовал этот промокод
 *   - minOrderAmount: проверяем переданную сумму заказа
 *   - equipmentIds: проверяем что все позиции заказа входят в разрешённый список
 */
export async function validatePromoCodeAction(
	code: string,
	context?: {
		orderAmount?: number; // итоговая сумма заказа для проверки minOrderAmount
		equipmentIds?: string[]; // id позиций в заказе для проверки ограничений по технике
	}
): Promise<{
	success: boolean;
	type?: DiscountType;
	value?: number;
	minOrderAmount?: number | null;
	error?: string;
}> {
	try {
		const session = await auth();
		const userId = session?.user?.id ?? null;

		const normalized = code.trim().toUpperCase();
		if (!normalized) return { success: false, error: "Введите промокод" };

		const promo = await prisma.promoCode.findUnique({
			where: { code: normalized },
			select: {
				id: true,
				isActive: true,
				type: true,
				value: true,
				usageLimit: true,
				usedCount: true,
				perUserLimit: true,
				minOrderAmount: true,
				autoApplyTrigger: true,
				validFrom: true,
				validUntil: true,
				equipmentRestrictions: { select: { equipmentId: true } },
			},
		});

		if (!promo) return { success: false, error: "Промокод не найден" };
		if (!promo.isActive) return { success: false, error: "Промокод неактивен" };

		// ── Даты ──────────────────────────────────────────────────────────────────
		const now = new Date();
		if (promo.validFrom && now < promo.validFrom)
			return { success: false, error: "Промокод ещё не действует" };
		if (promo.validUntil && now > promo.validUntil)
			return { success: false, error: "Срок действия промокода истёк" };

		// ── Глобальный лимит использований ───────────────────────────────────────
		if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit)
			return {
				success: false,
				error: "Лимит использований промокода исчерпан",
			};

		// ── Лимит на клиента (perUserLimit) ───────────────────────────────────────
		if (promo.perUserLimit !== null && userId) {
			const userUsageCount = await prisma.booking.count({
				where: { userId, promoCode: normalized },
			});
			if (userUsageCount >= promo.perUserLimit) {
				return {
					success: false,
					error:
						promo.perUserLimit === 1
							? "Вы уже использовали этот промокод"
							: `Вы использовали этот промокод максимальное количество раз (${promo.perUserLimit})`,
				};
			}
		}

		// ── Минимальная сумма заказа ──────────────────────────────────────────────
		if (promo.minOrderAmount !== null) {
			if (
				context?.orderAmount !== undefined &&
				context.orderAmount < promo.minOrderAmount
			) {
				return {
					success: false,
					error: `Промокод действует при заказе от ${promo.minOrderAmount.toLocaleString("ru-RU")} ₽`,
				};
			}
			// Если сумма не передана — возвращаем ограничение в ответе,
			// чтобы клиентская форма могла показать его пользователю
		}

		// ── Ограничение по технике ────────────────────────────────────────────────
		const allowedEquipmentIds = promo.equipmentRestrictions.map(
			(e) => e.equipmentId
		);
		if (allowedEquipmentIds.length > 0 && context?.equipmentIds?.length) {
			const hasDisallowed = context.equipmentIds.some(
				(id) => !allowedEquipmentIds.includes(id)
			);
			if (hasDisallowed) {
				return {
					success: false,
					error: "Промокод не распространяется на некоторые позиции в заказе",
				};
			}
		}

		return {
			success: true,
			type: promo.type,
			value: promo.value,
			minOrderAmount: promo.minOrderAmount,
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/**
 * Найти авто-применяемый промокод для пользователя.
 *
 * Логика для триггера "FIRST_BOOKING_AFTER_APPROVAL":
 *   1. У пользователя статус анкеты APPROVED
 *   2. У него ещё не было ни одного заказа с этим промокодом
 *   3. Промокод активен и не истёк
 *
 * Возвращает код и параметры промокода, либо null если условия не выполнены.
 */
export async function getAutoApplyPromoForUserAction(): Promise<{
	success: boolean;
	promo?: {
		code: string;
		type: DiscountType;
		value: number;
		minOrderAmount: number | null;
	} | null;
	error?: string;
}> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: true, promo: null };
		const userId = session.user.id;

		// Ищем все промокоды с авто-триггером
		const autoPromos = await prisma.promoCode.findMany({
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
		});

		if (!autoPromos.length) return { success: true, promo: null };

		// Проверяем статус анкеты
		const application = await prisma.clientApplication.findUnique({
			where: { userId },
			select: { status: true },
		});

		if (application?.status !== "APPROVED")
			return { success: true, promo: null };

		// Ищем первый подходящий промокод (приоритет — порядок создания)
		for (const promo of autoPromos) {
			// Глобальный лимит
			if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit)
				continue;

			// Лимит на клиента
			const perUserLimit = promo.perUserLimit ?? 1; // по умолчанию 1 для авто-промокодов
			const userUsageCount = await prisma.booking.count({
				where: { userId, promoCode: promo.code },
			});
			if (userUsageCount >= perUserLimit) continue;

			// Нашли подходящий
			return {
				success: true,
				promo: {
					code: promo.code,
					type: promo.type,
					value: promo.value,
					minOrderAmount: promo.minOrderAmount,
				},
			};
		}

		return { success: true, promo: null };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}
