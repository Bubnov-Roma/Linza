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

	const data = await prisma.equipment.findMany({
		where: {
			id: { in: ids },
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

	// Группируем так же, как и для каталога
	const grouped = groupEquipmentRows(data as unknown as RawEquipmentRow[]);

	// Восстанавливаем порядок ID, который пришел с клиента
	const byId = Object.fromEntries(grouped.map((g) => [g.id, g]));
	return ids
		.map((id) => byId[id])
		.filter((item): item is GroupedEquipment => item !== undefined);
}
