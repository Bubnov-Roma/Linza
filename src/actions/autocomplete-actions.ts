"use server";

import type {
	GroupedEquipment,
	RawEquipmentRow,
} from "@/core/domain/entities/Equipment";
import { prisma } from "@/lib/prisma";
import { groupEquipmentRows } from "@/utils/group-equipment";
import { getSearchVariations } from "@/utils/keyboard-layout";

export type AutocompleteType =
	| "equipment"
	| "users"
	| "bookings"
	| "studio"
	| "categories";

export async function getAutocompleteAction(
	type: AutocompleteType,
	query: string
) {
	if (!query || query.length < 2) return [];

	const variations = getSearchVariations(query);

	// Базовая логика поиска для каждой таблицы
	switch (type) {
		case "equipment":
			return await prisma.equipment
				.findMany({
					where: {
						OR: variations.flatMap((v) => [
							{ title: { contains: v, mode: "insensitive" } },
							{ inventoryNumber: { contains: v, mode: "insensitive" } },
						]),
					},
					select: { title: true },
					take: 1,
				})
				.then((res) => res.map((r) => r.title));

		case "users":
			return await prisma.user
				.findMany({
					where: {
						OR: variations.flatMap((v) => [
							{ name: { contains: v, mode: "insensitive" } },
							{ email: { contains: v, mode: "insensitive" } },
						]),
					},
					select: { name: true },
					take: 1,
				})
				.then((res) => res.map((r) => r.name || ""));

		case "categories":
			return await prisma.category
				.findMany({
					where: { name: { contains: query, mode: "insensitive" } },
					select: { name: true },
					take: 1,
				})
				.then((res) => res.map((r) => r.name));

		default:
			return [];
	}
}

/** ----------------- CLIENT ------------------- */

export async function getEquipmentForCartAction(
	ids: string[]
): Promise<GroupedEquipment[]> {
	if (!ids || ids.length === 0) return [];

	const requestedItems = await prisma.equipment.findMany({
		where: { id: { in: ids } },
		select: { id: true, title: true },
	});

	if (requestedItems.length === 0) return [];

	const titles = [...new Set(requestedItems.map((r) => r.title))];

	const data = await prisma.equipment.findMany({
		where: {
			title: { in: titles },
			isAvailable: true,
		},
		include: {
			equipmentImageLinks: {
				include: { image: true },
				orderBy: { orderIndex: "asc" },
			},
		},
	});

	const grouped = groupEquipmentRows(data as unknown as RawEquipmentRow[]);

	const byId = Object.fromEntries(grouped.map((g) => [g.id, g]));
	return ids
		.map((id) => byId[id])
		.filter((item): item is GroupedEquipment => item !== undefined);
}

/**
 * Для заданных заголовков техники возвращает map:
 * title → первый доступный imageUrl
 */
export async function getEquipmentImagesByTitles(
	titles: string[]
): Promise<Map<string, string>> {
	if (!titles.length) return new Map();

	const rows = await prisma.equipmentImageLink.findMany({
		where: {
			equipment: { title: { in: titles } },
			orderIndex: 0,
		},
		select: {
			image: { select: { url: true } },
			equipment: { select: { title: true } },
		},
		orderBy: { orderIndex: "asc" },
	});

	const map = new Map<string, string>();
	for (const row of rows) {
		if (!map.has(row.equipment.title) && row.image?.url) {
			map.set(row.equipment.title, row.image.url);
		}
	}

	return map;
}

/**
 * Автодополнение для клиентского поиска: возвращает первый подходящий title.
 * Используется в InlineSearchInput модалки создания сетов и SearchPanel.
 */
export async function clientAutocompleteEquipmentAction(
	query: string
): Promise<string | null> {
	if (!query || query.length < 2) return null;

	const variations = getSearchVariations(query);

	const result = await prisma.equipment.findFirst({
		where: {
			isAvailable: true,
			OR: variations.map((v) => ({
				title: { contains: v, mode: "insensitive" },
			})),
		},
		select: { title: true },
		orderBy: { title: "asc" },
	});

	return result?.title ?? null;
}
