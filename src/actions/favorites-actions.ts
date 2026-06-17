"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { FavoriteItem } from "@/components/layouts/favorites/types";
import type {
	DbEquipmentWithImages,
	GroupedEquipment,
} from "@/core/domain/entities/Equipment";
import { prisma } from "@/lib/prisma";
import { groupEquipmentRows } from "@/utils/group-equipment";

export async function toggleFavoriteAction(
	equipmentId: string
): Promise<{ isFavorite: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { isFavorite: false, error: "Unauthorized" };

		// Проверяем прямое совпадение
		const existing = await prisma.favorite.findFirst({
			where: { userId: session.user.id, equipmentId },
		});

		if (existing) {
			await prisma.favorite.delete({ where: { id: existing.id } });
			revalidatePath("/favorites");
			return { isFavorite: false };
		}

		// Защита от дублей: ищем сиблингов с тем же title в избранном пользователя
		const equipment = await prisma.equipment.findUnique({
			where: { id: equipmentId },
			select: { title: true },
		});

		if (equipment) {
			// Все id техники с таким же title
			const siblings = await prisma.equipment.findMany({
				where: { title: equipment.title },
				select: { id: true },
			});
			const siblingIds = siblings.map((s) => s.id);

			// Если уже есть избранное с любым из сиблингов — удаляем, добавляем новое
			const existingSibling = await prisma.favorite.findFirst({
				where: { userId: session.user.id, equipmentId: { in: siblingIds } },
			});

			if (existingSibling) {
				// Переключаем на новый isPrimary (заменяем, не дублируем)
				await prisma.favorite.update({
					where: { id: existingSibling.id },
					data: { equipmentId },
				});
				revalidatePath("/favorites");
				return { isFavorite: true };
			}
		}

		await prisma.favorite.create({
			data: { userId: session.user.id, equipmentId },
		});

		revalidatePath("/favorites");
		return { isFavorite: true };
	} catch (error: unknown) {
		if (error instanceof Error)
			return { isFavorite: false, error: error.message };
		return { isFavorite: false, error: "Ошибка" };
	}
}

export async function checkFavoriteAction(
	equipmentId: string
): Promise<boolean> {
	try {
		const session = await auth();
		if (!session?.user?.id) return false;

		const existing = await prisma.favorite.findFirst({
			where: { userId: session.user.id, equipmentId },
		});

		return !!existing;
	} catch {
		return false;
	}
}

// ─── Equipment Sets ───────────────────────────────────────────────────────────

interface SetItem {
	equipmentId: string;
	quantity: number;
}

interface SaveSetInput {
	id?: string;
	name: string;
	description: string;
	items: SetItem[];
	totalPricePerDay: number;
}

export async function saveSetAction(
	data: SaveSetInput
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Unauthorized" };

		if (data.id) {
			await prisma.equipmentSet.updateMany({
				where: { id: data.id, userId: session.user.id },
				data: {
					name: data.name,
					description: data.description,
					items: data.items as unknown as Prisma.InputJsonArray,
					totalPricePerDay: data.totalPricePerDay,
				},
			});
		} else {
			await prisma.equipmentSet.create({
				data: {
					userId: session.user.id,
					name: data.name,
					description: data.description,
					items: data.items as unknown as Prisma.InputJsonArray,
					totalPricePerDay: data.totalPricePerDay,
				},
			});
		}

		revalidatePath("/favorites");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка сохранения сета" };
	}
}

// ── Для хука use-favorite.ts ──  возвращаем id + все id сиблингов каждого избранного:
export async function getUserFavoriteIdsAction(): Promise<string[]> {
	try {
		const session = await auth();
		if (!session?.user?.id) return [];

		const favs = await prisma.favorite.findMany({
			where: { userId: session.user.id },
			select: {
				equipmentId: true,
				equipment: { select: { title: true } },
			},
		});

		if (favs.length === 0) return [];

		// Собираем уникальные titles
		const titles = [...new Set(favs.map((f) => f.equipment.title))];

		// Получаем все id техники с этими titles (все сиблинги)
		const allSiblings = await prisma.equipment.findMany({
			where: { title: { in: titles } },
			select: { id: true },
		});

		// Возвращаем объединение: оригинальные ids + все сиблинги
		// Это позволяет сердечку гореть у любой карточки из группы
		return [
			...new Set([
				...favs.map((f) => f.equipmentId),
				...allSiblings.map((e) => e.id),
			]),
		];
	} catch {
		return [];
	}
}

export async function removeFavoriteAction(favId: string): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	await prisma.favorite.delete({
		where: { id: favId },
	});
}

export async function fetchFavoritesAction() {
	const session = await auth();
	if (!session?.user?.id) return [];

	const data = await prisma.favorite.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: "desc" },
		include: {
			equipment: {
				include: { equipmentImageLinks: { include: { image: true } } },
			},
		},
	});
	return data as unknown as FavoriteItem[];
}

export async function fetchSetsAction() {
	const session = await auth();
	if (!session?.user?.id) return [];

	const sets = await prisma.equipmentSet.findMany({
		where: { userId: session.user.id },
		orderBy: { createdAt: "desc" },
	});

	return sets.map((set) => ({
		id: set.id,
		name: set.name,
		description: set.description,
		items: set.items as unknown as Array<{
			equipmentId: string;
			quantity: number;
		}>,
		totalPricePerDay: set.totalPricePerDay,
		createdAt: set.createdAt,
		updatedAt: set.updatedAt,
	}));
}

export async function deleteSetAction(setId: string): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Unauthorized");

	await prisma.equipmentSet.delete({
		where: { id: setId },
	});
}

export async function fetchGroupedEquipmentMapAction(): Promise<
	[string, GroupedEquipment][]
> {
	const data = await prisma.equipment.findMany({
		include: { equipmentImageLinks: { include: { image: true } } },
	});

	const grouped = groupEquipmentRows(
		data as unknown as DbEquipmentWithImages[]
	);
	const entries: [string, GroupedEquipment][] = [];

	for (const group of grouped) {
		for (const unitId of group.allUnitIds) {
			entries.push([unitId, group]);
		}
	}
	return entries;
}
export async function fetchEquipmentByIdsAction(
	ids: string[]
): Promise<GroupedEquipment[]> {
	if (!ids || ids.length === 0) return [];

	const data = await prisma.equipment.findMany({
		where: { id: { in: ids } },
		include: { equipmentImageLinks: { include: { image: true } } },
	});

	return groupEquipmentRows(data as unknown as DbEquipmentWithImages[]);
}
