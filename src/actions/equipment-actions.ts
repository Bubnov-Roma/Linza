import type { Prisma } from "@prisma/client";
import { cache } from "react";
import type {
	Comment,
	GroupedEquipment,
	RawEquipmentRow,
} from "@/core/domain/entities/Equipment";
import { prisma } from "@/lib/prisma";
import { getSearchVariations, groupEquipmentRows } from "@/utils";

// ─── CATALOG FETCH (Cached) ─────────────────────────────────────────────────

const fetchEquipmentCached = cache(
	async (
		categorySlug: string,
		subcategorySlug: string,
		search: string
	): Promise<GroupedEquipment[]> => {
		const where: Prisma.EquipmentWhereInput = { isAvailable: true };

		if (search) {
			const searchWords = search.trim().split(/\s+/).filter(Boolean);
			if (searchWords.length > 0) {
				where.AND = searchWords.map((word) => {
					const variations = getSearchVariations(word);
					return {
						OR: variations.map((term) => ({
							title: { contains: term, mode: "insensitive" },
						})),
					};
				});
			}
		}

		if (categorySlug && categorySlug !== "all") {
			const cat = await prisma.category.findUnique({
				where: { slug: categorySlug },
				select: { id: true },
			});
			if (cat) where.categoryId = cat.id;
		}

		if (subcategorySlug) {
			const sub = await prisma.subcategory.findUnique({
				where: { slug: subcategorySlug },
				select: { id: true },
			});
			if (sub) where.subcategoryId = sub.id;
		}

		const data = await prisma.equipment.findMany({
			where,
			include: {
				equipmentImageLinks: {
					include: { image: true },
					orderBy: { orderIndex: "asc" },
				},
			},
		});

		return groupEquipmentRows(data as unknown as RawEquipmentRow[]);
	}
);

export async function getFeaturedEquipment(): Promise<GroupedEquipment[]> {
	const data = await prisma.equipment.findMany({
		where: { isFeatured: true, isAvailable: true },
		include: {
			equipmentImageLinks: {
				include: { image: true },
				orderBy: { orderIndex: "asc" },
			},
		},
		orderBy: { updatedAt: "desc" },
	});
	return groupEquipmentRows(data as unknown as RawEquipmentRow[]);
}

export async function getEquipment(filters: {
	categorySlug?: string;
	subcategorySlug?: string | undefined;
	search?: string | undefined;
}): Promise<GroupedEquipment[]> {
	return fetchEquipmentCached(
		filters.categorySlug || "all",
		filters.subcategorySlug || "",
		filters.search || ""
	);
}

export async function getEquipmentBySlug(
	slug: string
): Promise<GroupedEquipment | null> {
	// 1. Ищем isPrimary запись с этим slug
	let primaryItem = await prisma.equipment.findFirst({
		where: { slug, isPrimary: true },
		include: {
			equipmentImageLinks: {
				include: { image: { select: { id: true, url: true } } },
				orderBy: { orderIndex: "asc" },
			},
			relatedEquipment: { select: { relatedId: true } },
		},
	});

	// Fallback 1: slug найден, но isPrimary не установлен →
	// ищем isPrimary среди записей с тем же title
	if (!primaryItem) {
		const anyBySlug = await prisma.equipment.findFirst({
			where: { slug },
			select: { title: true },
		});

		if (anyBySlug) {
			// Ищем isPrimary в той же группе по title
			primaryItem = await prisma.equipment.findFirst({
				where: { title: anyBySlug.title, isPrimary: true },
				include: {
					equipmentImageLinks: {
						include: { image: { select: { id: true, url: true } } },
						orderBy: { orderIndex: "asc" },
					},
					relatedEquipment: { select: { relatedId: true } },
				},
			});
		}
	}

	// Fallback 2: совсем нет isPrimary — берём любую запись с этим slug
	if (!primaryItem) {
		primaryItem = await prisma.equipment.findFirst({
			where: { slug },
			include: {
				equipmentImageLinks: {
					include: { image: { select: { id: true, url: true } } },
					orderBy: { orderIndex: "asc" },
				},
				relatedEquipment: { select: { relatedId: true } },
			},
		});
	}

	if (!primaryItem) return null;

	// 2. Загружаем всех "братьев" по title для подсчёта totalCount/availableCount
	const siblings = await prisma.equipment.findMany({
		where: { title: primaryItem.title },
		include: {
			equipmentImageLinks: {
				include: { image: { select: { id: true, url: true } } },
				orderBy: { orderIndex: "asc" },
			},
		},
	});

	// 3. Группируем братьев — получаем корректные счётчики
	const grouped = groupEquipmentRows(siblings as unknown as RawEquipmentRow[]);
	const groupedItem = grouped[0];
	if (!groupedItem) return null;

	const relatedIds =
		primaryItem.relatedEquipment?.map((r) => r.relatedId) ?? [];

	// 4. Скалярные поля — ВСЕГДА от isPrimary; агрегированные — от grouped
	return {
		...groupedItem,
		id: primaryItem.id,
		title: primaryItem.title,
		slug: primaryItem.slug,
		description: primaryItem.description,
		categoryId: primaryItem.categoryId,
		subcategoryId: primaryItem.subcategoryId,
		inventoryNumber: primaryItem.inventoryNumber,
		pricePerDay: primaryItem.pricePerDay,
		price4h: primaryItem.price4h,
		price8h: primaryItem.price8h,
		deposit: primaryItem.deposit,
		replacementValue: primaryItem.replacementValue,
		specifications: (primaryItem.specifications ?? {}) as Record<
			string,
			unknown
		>,
		videoUrls: (primaryItem.videoUrls ?? []) as string[],
		comments: (primaryItem.comments as unknown as Comment[]) ?? [],
		status:
			primaryItem.status as import("@/core/domain/entities/Equipment").EquipmentStatus,
		isAvailable: primaryItem.isAvailable,
		isPrimary: primaryItem.isPrimary,
		ownershipType:
			primaryItem.ownershipType as import("@/core/domain/entities/Equipment").OwnershipType,
		partnerName: primaryItem.partnerName,
		defects: primaryItem.defects,
		kit: primaryItem.kitDescription ?? null,
		kitDescription: primaryItem.kitDescription,
		imageUrl:
			primaryItem.equipmentImageLinks?.[0]?.image?.url ?? groupedItem.imageUrl,
		images: primaryItem.equipmentImageLinks.length
			? primaryItem.equipmentImageLinks.map((l) => l.image.url)
			: groupedItem.images,
		imagesData: primaryItem.equipmentImageLinks.length
			? primaryItem.equipmentImageLinks.map((l) => ({
					id: l.image.id,
					url: l.image.url,
				}))
			: groupedItem.imagesData,
		equipmentImageLinks: primaryItem.equipmentImageLinks,
		relatedIds,
		createdAt: primaryItem.createdAt,
		updatedAt: primaryItem.updatedAt,
	};
}

export async function getRelatedEquipmentAction(ids: string[] | undefined) {
	if (!ids || ids.length === 0) return [];

	const data = await prisma.equipment.findMany({
		where: { id: { in: ids }, isAvailable: true },
		include: {
			equipmentImageLinks: { include: { image: true } },
		},
	});

	const grouped = groupEquipmentRows(data as unknown as RawEquipmentRow[]);
	const byId = Object.fromEntries(grouped.map((g) => [g.id, g]));
	return ids.map((id) => byId[id]).filter(Boolean);
}
