"use server";

import { prisma } from "@/lib/prisma";
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
