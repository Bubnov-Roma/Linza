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
			status: "AVAILABLE",
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
