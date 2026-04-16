"use server";

import {
	type CategoryEntityType,
	type HistoryAction,
	Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import type {
	DbCategory,
	DbSubcategory,
} from "@/core/domain/entities/Equipment";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/utils";

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getCategoriesFromDb = cache(async (): Promise<DbCategory[]> => {
	try {
		const data = await prisma.category.findMany({
			orderBy: { sortOrder: "asc" },
			include: {
				subcategories: {
					orderBy: { sortOrder: "asc" },
				},
			},
		});

		if (!data) return [];

		return data.map((cat) => ({
			id: cat.id,
			name: cat.name,
			slug: cat.slug,
			iconName: cat.iconName,
			imageUrl: cat.imageUrl ?? undefined,
			isModular: cat.isModular,
			adminNotes: cat.adminNotes ?? undefined,
			subcategories: cat.subcategories.map((sub) => ({
				id: sub.id,
				name: sub.name,
				slug: sub.slug,
				adminNotes: sub.adminNotes ?? undefined,
				imageUrl: sub.imageUrl ?? undefined,
				sortOrder: sub.sortOrder,
			})),
		}));
	} catch {
		console.warn("[Prisma] БД недоступна, возвращаем пустые категории.");
		return [];
	}
});
// ─── History helper ───────────────────────────────────────────────────────────

async function logHistory(
	entityType: CategoryEntityType,
	entityId: string,
	action: HistoryAction,
	changes?: Record<string, [unknown, unknown]>
): Promise<void> {
	try {
		// В будущем здесь можно доставать ID пользователя через NextAuth
		// const session = await auth();
		// const userId = session?.user?.id;

		await prisma.categoryHistory.create({
			data: {
				entityType,
				entityId,
				action,
				// changedBy: userId,
				// Приводим Record к типу, который ожидает Prisma для JSON-поля
				changes: changes ? (changes as Prisma.InputJsonValue) : Prisma.JsonNull,
			},
		});
	} catch (error: unknown) {
		console.error("History logging failed", error);
	}
}

// ─── Category CRUD ────────────────────────────────────────────────────────────

export async function createCategoryAction(data: {
	name: string;
	iconName?: string;
	imageUrl?: string;
	isModular?: boolean;
	adminNotes?: string;
}): Promise<{
	success: boolean;
	category?: Omit<DbCategory, "subcategories">;
	error?: string;
}> {
	try {
		const last = await prisma.category.findFirst({
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		const nextOrder = (last?.sortOrder ?? 0) + 1;
		const slug = slugify(data.name);

		const created = await prisma.category.create({
			data: {
				name: data.name.trim(),
				slug,
				iconName: data.iconName ?? "Package",
				imageUrl: data.imageUrl ?? null,
				isModular: data.isModular ?? false,
				adminNotes: data.adminNotes ?? null,
				sortOrder: nextOrder,
			},
		});

		await logHistory("CATEGORY", created.id, "CREATED");
		revalidatePath("/", "layout");

		return {
			success: true,
			category: {
				id: created.id,
				name: created.name,
				slug: created.slug,
				iconName: created.iconName,
				imageUrl: created.imageUrl ?? undefined,
				isModular: created.isModular,
				adminNotes: created.adminNotes ?? undefined,
			},
		};
	} catch (error: unknown) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				return {
					success: false,
					error: "Категория с таким названием уже существует",
				};
			}
		}
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function updateCategoryAction(
	id: string,
	data: {
		name?: string;
		iconName?: string | undefined;
		imageUrl?: string | undefined;
		isModular?: boolean;
		adminNotes?: string | undefined;
		sortOrder?: number;
	}
): Promise<{ success: boolean; error?: string }> {
	try {
		const current = await prisma.category.findUnique({ where: { id } });
		if (!current) return { success: false, error: "Категория не найдена" };

		const updates: Prisma.CategoryUpdateInput = {};

		if (data.name !== undefined) {
			updates.name = data.name.trim();
			updates.slug = slugify(data.name);
		}
		if (data.iconName !== undefined) updates.iconName = data.iconName;
		if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
		if (data.isModular !== undefined) updates.isModular = data.isModular;
		if (data.adminNotes !== undefined) updates.adminNotes = data.adminNotes;
		if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

		await prisma.category.update({
			where: { id },
			data: updates,
		});

		// Строгое вычисление изменений без any
		const changes: Record<string, [unknown, unknown]> = {};
		const currentRecord = current as Record<string, unknown>;

		for (const [key, newVal] of Object.entries(updates)) {
			const oldVal = currentRecord[key];
			if (oldVal !== newVal) {
				changes[key] = [oldVal, newVal];
			}
		}

		await logHistory("CATEGORY", id, "UPDATED", changes);
		revalidatePath("/", "layout");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function deleteCategoryAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const count = await prisma.equipment.count({ where: { categoryId: id } });

		if (count > 0) {
			return {
				success: false,
				error: `Нельзя удалить: в категории ${count} позиций техники`,
			};
		}

		const cat = await prisma.category.findUnique({
			where: { id },
			select: { name: true },
		});

		await prisma.category.delete({ where: { id } });

		await logHistory("CATEGORY", id, "DELETED", { name: [cat?.name, null] });
		revalidatePath("/", "layout");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function reorderCategoriesAction(
	orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
	try {
		await prisma.$transaction(
			orderedIds.map((id, index) =>
				prisma.category.update({
					where: { id },
					data: { sortOrder: index + 1 },
				})
			)
		);
		revalidatePath("/", "layout");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function reorderSubcategoriesAction(
	orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
	try {
		await prisma.$transaction(
			orderedIds.map((id, index) =>
				prisma.subcategory.update({
					where: { id },
					data: { sortOrder: index + 1 },
				})
			)
		);
		revalidatePath("/", "layout");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function getCategoryHistoryAction(entityId: string) {
	const data = await prisma.categoryHistory.findMany({
		where: { entityId },
		orderBy: { changedAt: "desc" },
		take: 50,
	});
	return data;
}

// ─── Subcategory CRUD ─────────────────────────────────────────────────────────

export async function createSubcategoryAction(data: {
	categoryId: string;
	name: string;
	imageUrl?: string;
	adminNotes?: string;
}): Promise<{
	success: boolean;
	subcategory?: DbSubcategory;
	error?: string;
}> {
	try {
		const last = await prisma.subcategory.findFirst({
			where: { categoryId: data.categoryId },
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		const nextOrder = (last?.sortOrder ?? 0) + 1;

		const created = await prisma.subcategory.create({
			data: {
				categoryId: data.categoryId,
				name: data.name.trim(),
				slug: slugify(data.name),
				sortOrder: nextOrder,
				imageUrl: data.imageUrl ?? null,
				adminNotes: data.adminNotes ?? null,
			},
		});

		await logHistory("SUBCATEGORY", created.id, "CREATED");
		revalidatePath("/", "layout");

		return {
			success: true,
			subcategory: {
				id: created.id,
				name: created.name,
				slug: created.slug,
				imageUrl: created.imageUrl ?? undefined,
				adminNotes: created.adminNotes ?? undefined,
			},
		};
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function updateSubcategoryAction(
	id: string,
	data: {
		name?: string;
		imageUrl?: string | undefined;
		adminNotes?: string | undefined;
		sortOrder?: number;
	}
): Promise<{ success: boolean; error?: string }> {
	try {
		const current = await prisma.subcategory.findUnique({ where: { id } });
		if (!current) return { success: false, error: "Подкатегория не найдена" };

		const updates: Prisma.SubcategoryUpdateInput = {};

		if (data.name !== undefined) {
			updates.name = data.name.trim();
			updates.slug = slugify(data.name);
		}
		if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
		if (data.adminNotes !== undefined) updates.adminNotes = data.adminNotes;
		if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

		await prisma.subcategory.update({
			where: { id },
			data: updates,
		});

		const changes: Record<string, [unknown, unknown]> = {};
		const currentRecord = current as Record<string, unknown>;

		for (const [key, newVal] of Object.entries(updates)) {
			const oldVal = currentRecord[key];
			if (oldVal !== newVal) {
				changes[key] = [oldVal, newVal];
			}
		}

		await logHistory("SUBCATEGORY", id, "UPDATED", changes);
		revalidatePath("/", "layout");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function deleteSubcategoryAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	try {
		// В Prisma мы поставили SetNull для связи Equipment -> Subcategory
		await prisma.subcategory.delete({ where: { id } });

		await logHistory("SUBCATEGORY", id, "DELETED");
		revalidatePath("/", "layout");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}
