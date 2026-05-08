"use server";

import type { DiscountType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── Типы ─────────────────────────────────────────────────────────────────────

export interface PromoCodeItem {
	id: string;
	code: string;
	type: DiscountType; // PERCENT | FIXED
	value: number; // % или рублей
	description: string | null;
	isActive: boolean;
	usageLimit: number | null; // null = безлимит
	usedCount: number;
	validFrom: string | null;
	validUntil: string | null;
	createdBy: string | null;
	creatorName: string | null;
	createdAt: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

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
			include: { creator: { select: { name: true } } },
		});

		return {
			success: true,
			data: rows.map((r) => ({
				id: r.id,
				code: r.code,
				type: r.type,
				value: r.value,
				description: r.description,
				isActive: r.isActive,
				usageLimit: r.usageLimit,
				usedCount: r.usedCount,
				validFrom: r.validFrom?.toISOString() ?? null,
				validUntil: r.validUntil?.toISOString() ?? null,
				createdBy: r.createdBy,
				creatorName: r.creator?.name ?? null,
				createdAt: r.createdAt.toISOString(),
			})),
		};
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
	validFrom?: string | null;
	validUntil?: string | null;
}): Promise<{ success: boolean; data?: PromoCodeItem; error?: string }> {
	try {
		const authorId = await requireAdminOrPromoRight();

		const code = input.code.trim().toUpperCase();
		if (!code) return { success: false, error: "Кодовое слово обязательно" };
		if (input.value <= 0)
			return { success: false, error: "Значение должно быть больше 0" };
		if (input.type === "PERCENT" && input.value > 100) {
			return { success: false, error: "Скидка не может превышать 100%" };
		}

		const created = await prisma.promoCode.create({
			data: {
				code,
				type: input.type,
				value: input.value,
				description: input.description?.trim() ?? null,
				isActive: input.isActive ?? true,
				usageLimit: input.usageLimit ?? null,
				validFrom: input.validFrom ? new Date(input.validFrom) : null,
				validUntil: input.validUntil ? new Date(input.validUntil) : null,
				createdBy: authorId,
			},
			include: { creator: { select: { name: true } } },
		});

		revalidatePath("/admin/settings");
		return {
			success: true,
			data: {
				id: created.id,
				code: created.code,
				type: created.type,
				value: created.value,
				description: created.description,
				isActive: created.isActive,
				usageLimit: created.usageLimit,
				usedCount: created.usedCount,
				validFrom: created.validFrom?.toISOString() ?? null,
				validUntil: created.validUntil?.toISOString() ?? null,
				createdBy: created.createdBy,
				creatorName: created.creator?.name ?? null,
				createdAt: created.createdAt.toISOString(),
			},
		};
	} catch (e: unknown) {
		// P2002 — unique constraint (code уже существует)
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
		if (input.validFrom !== undefined) {
			data.validFrom = input.validFrom ? new Date(input.validFrom) : null;
		}
		if (input.validUntil !== undefined) {
			data.validUntil = input.validUntil ? new Date(input.validUntil) : null;
		}

		await prisma.promoCode.update({ where: { id }, data });

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
 * Возвращает тип и значение скидки, не раскрывая id и внутренние поля.
 */
export async function validatePromoCodeAction(code: string): Promise<{
	success: boolean;
	type?: DiscountType;
	value?: number;
	error?: string;
}> {
	try {
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
				validFrom: true,
				validUntil: true,
			},
		});

		if (!promo) return { success: false, error: "Промокод не найден" };
		if (!promo.isActive) return { success: false, error: "Промокод неактивен" };

		const now = new Date();
		if (promo.validFrom && now < promo.validFrom) {
			return { success: false, error: "Промокод ещё не действует" };
		}
		if (promo.validUntil && now > promo.validUntil) {
			return { success: false, error: "Срок действия промокода истёк" };
		}
		if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
			return {
				success: false,
				error: "Лимит использований промокода исчерпан",
			};
		}

		return { success: true, type: promo.type, value: promo.value };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}
