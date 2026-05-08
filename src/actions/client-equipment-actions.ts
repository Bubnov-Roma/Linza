"use server";

import type {
	GroupedEquipment,
	RawEquipmentRow,
} from "@/core/domain/entities/Equipment";
import { prisma } from "@/lib/prisma";
import { groupEquipmentRows } from "@/utils/group-equipment";

export async function getEquipmentForCartAction(
	ids: string[]
): Promise<GroupedEquipment[]> {
	if (!ids || ids.length === 0) return [];

	// Шаг 1: находим запрошенные позиции чтобы получить их titles
	const requestedItems = await prisma.equipment.findMany({
		where: { id: { in: ids } },
		select: { id: true, title: true },
	});

	if (requestedItems.length === 0) return [];

	// Шаг 2: загружаем ВСЕХ сиблингов по title (все экземпляры каждой позиции)
	// Это критично для корректного allUnitIds и availableCount
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

	// Шаг 3: группируем — теперь allUnitIds содержит все доступные id группы
	const grouped = groupEquipmentRows(data as unknown as RawEquipmentRow[]);

	// Шаг 4: возвращаем только запрошенные позиции (по id isPrimary)
	const byId = Object.fromEntries(grouped.map((g) => [g.id, g]));
	return ids
		.map((id) => byId[id])
		.filter((item): item is GroupedEquipment => item !== undefined);
}

/**
 * Для заданных заголовков техники возвращает map:
 * title → первый доступный imageUrl (от любого экземпляра с этим title)
 */
export async function getEquipmentImagesByTitles(
	titles: string[]
): Promise<Map<string, string>> {
	if (!titles.length) return new Map();

	const rows = await prisma.equipmentImageLink.findMany({
		where: {
			equipment: { title: { in: titles } },
			orderIndex: 0, // только первая картинка
		},
		select: {
			image: { select: { url: true } },
			equipment: { select: { title: true } },
		},
		orderBy: { orderIndex: "asc" },
	});

	// Берём первый найденный URL для каждого title
	const map = new Map<string, string>();
	for (const row of rows) {
		if (!map.has(row.equipment.title) && row.image?.url) {
			map.set(row.equipment.title, row.image.url);
		}
	}

	return map;
}

export async function clientSearchEquipmentAction(
	query: string
): Promise<GroupedEquipment[]> {
	if (!query || query.length < 2) return [];

	const data = await prisma.equipment.findMany({
		where: {
			isAvailable: true,
			title: {
				contains: query,
				mode: "insensitive",
			},
		},
		take: 10,
		include: {
			equipmentImageLinks: {
				include: { image: true },
				orderBy: { orderIndex: "asc" },
			},
		},
	});

	return groupEquipmentRows(data as unknown as RawEquipmentRow[]);
}
