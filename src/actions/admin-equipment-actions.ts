"use server";

import type { EquipmentStatus, OwnershipType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import type {
	Comment,
	DbEquipment,
	DbEquipmentWithImages,
	GroupedEquipment,
	RawEquipmentRow,
} from "@/core/domain/entities/Equipment";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/utils";
import { groupEquipmentRows } from "@/utils/group-equipment";

// ─── TYPES & HELPERS ────────────────────────────────────────────────────────

export type CreateEquipmentData = {
	title: string;
	category: string;
	subcategory?: string | null;
	inventoryNumber?: string | undefined;
	pricePerDay: number;
	price4h?: number | undefined;
	price8h?: number | undefined;
	deposit?: number | undefined;
	replacementValue?: number | undefined;
	description?: string | undefined;
	kitDescription?: string | undefined;
	defects?: string | undefined;
	status?: EquipmentStatus | undefined;
	isAvailable?: boolean | undefined;
	ownershipType?: OwnershipType | undefined;
	partnerName?: string | undefined;
	specifications?: Record<string, unknown>;
	relatedIds?: string[] | undefined;
	videoUrls?: string[] | undefined;
};

export type FilterOperator =
	| "eq"
	| "neq"
	| "gt"
	| "gte"
	| "lt"
	| "lte"
	| "like"
	| "ilike"
	| "in"
	| "is"
	| "contains";

type EquipmentColumn = keyof Prisma.EquipmentWhereInput;

export type EquipmentFilter = {
	column: EquipmentColumn;
	operator: FilterOperator;
	value: unknown;
};

export type EquipmentSort = {
	column: keyof Prisma.EquipmentOrderByWithRelationInput;
	ascending: boolean;
};

function buildPrismaWhere(
	filters?: EquipmentFilter[],
	search?: string
): Prisma.EquipmentWhereInput {
	const where: Prisma.EquipmentWhereInput = {};

	if (search) {
		where.OR = [
			{ title: { contains: search } },
			{ description: { contains: search } },
			{ inventoryNumber: { contains: search } },
		];
	}

	if (filters && filters.length > 0) {
		const dynamicConditions = filters.reduce(
			(acc, { column, operator, value }) => {
				switch (operator) {
					case "eq":
					case "is":
						acc[column as string] = value;
						break;
					case "neq":
						acc[column as string] = { not: value };
						break;
					case "gt":
						acc[column as string] = { gt: value };
						break;
					case "gte":
						acc[column as string] = { gte: value };
						break;
					case "lt":
						acc[column as string] = { lt: value };
						break;
					case "lte":
						acc[column as string] = { lte: value };
						break;
					case "like":
					case "ilike":
					case "contains":
						acc[column as string] = {
							contains: String(value),
							mode: "insensitive",
						};
						break;
					case "in":
						acc[column as string] = {
							in: Array.isArray(value) ? value : [value],
						};
						break;
				}
				return acc;
			},
			{} as Record<string, unknown>
		);
		return { ...where, ...dynamicConditions } as Prisma.EquipmentWhereInput;
	}

	return where;
}

// ─── ACTIONS ────────────────────────────────────────────────────────────────

async function generateInventoryNumber(): Promise<string> {
	const last = await prisma.equipment.findFirst({
		where: { inventoryNumber: { startsWith: "INV-" } },
		orderBy: { inventoryNumber: "desc" },
		select: { inventoryNumber: true },
	});

	let next = 1;
	if (last?.inventoryNumber) {
		const match = last.inventoryNumber.match(/INV-(\d+)$/);
		if (match?.[1]) next = parseInt(match[1], 10) + 1;
	}

	return `INV-${String(next).padStart(4, "0")}`;
}

export async function createEquipmentAction(
	data: CreateEquipmentData
): Promise<{ success: boolean; id?: string; error?: string }> {
	try {
		// Проверяем, есть ли уже техника с таким названием
		const existing = await prisma.equipment.findFirst({
			where: { title: data.title },
		});

		// Если техники с таким именем нет, новая позиция автоматически становится основной
		const isPrimary = !existing;
		const created = await prisma.equipment.create({
			data: {
				title: data.title,
				slug: slugify(data.title),
				categoryId: data.category,
				subcategoryId: data.subcategory ?? null,
				inventoryNumber:
					data.inventoryNumber?.trim() || (await generateInventoryNumber()),
				pricePerDay: data.pricePerDay,
				price4h: data.price4h ?? 0,
				price8h: data.price8h ?? 0,
				deposit: data.deposit ?? 0,
				replacementValue: data.replacementValue ?? 0,
				description: data.description ?? null,
				kitDescription: data.kitDescription ?? null,
				defects: data.defects ?? null,
				status: data.status ?? "AVAILABLE",
				isAvailable: data.isAvailable ?? true,
				ownershipType: data.ownershipType ?? "INTERNAL",
				partnerName: data.partnerName ?? null,
				isPrimary,
				specifications: data.specifications
					? (data.specifications as Prisma.InputJsonValue)
					: Prisma.JsonNull,
				videoUrls: data.videoUrls
					? (data.videoUrls as Prisma.InputJsonValue)
					: [],
				...(data.relatedIds && data.relatedIds.length > 0
					? {
							relatedEquipment: {
								create: data.relatedIds.map((id) => ({
									relatedId: id,
								})),
							},
						}
					: {}),
			},
		});

		revalidatePath("/admin/equipment");
		return { success: true, id: created.id };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function getEquipmentWithFilters(params: {
	search?: string;
	filters?: EquipmentFilter[];
	sort?: EquipmentSort[];
	limit?: number;
	offset?: number;
}): Promise<{
	data: (DbEquipmentWithImages & { siblingCount?: number })[];
	count: number;
}> {
	const where = buildPrismaWhere(params.filters, params.search);

	const orderBy = params.sort?.length
		? params.sort.map((s) => ({ [s.column]: s.ascending ? "asc" : "desc" }))
		: [{ createdAt: "desc" }];

	const queryArgs: Prisma.EquipmentFindManyArgs = {
		where,
		orderBy: orderBy as Prisma.EquipmentOrderByWithRelationInput[],
		include: {
			equipmentImageLinks: {
				include: { image: { select: { id: true, url: true } } },
				orderBy: { orderIndex: "asc" },
			},
			relatedEquipment: {
				select: { relatedId: true },
			},
			bookingItems: {
				where: {
					booking: {
						status: {
							in: ["PENDING_REVIEW", "WAIT_PAYMENT", "READY_TO_RENT", "ACTIVE"],
						},
					},
				},
				select: {
					booking: { select: { status: true, startDate: true, endDate: true } },
				},
				take: 1, // только ближайший активный заказ
				orderBy: { booking: { startDate: "asc" } },
			},
		},
	};

	if (params.limit !== undefined) queryArgs.take = params.limit;
	if (params.offset !== undefined) queryArgs.skip = params.offset;

	const [data, count] = await Promise.all([
		prisma.equipment.findMany(queryArgs),
		prisma.equipment.count({ where }),
	]);

	const uniqueTitles = [...new Set(data.map((d) => d.title))];

	let countsMap = new Map<string, number>();
	if (uniqueTitles.length > 0) {
		const titleCounts = await prisma.equipment.groupBy({
			by: ["title"],
			where: { title: { in: uniqueTitles } },
			_count: { id: true },
		});
		countsMap = new Map(titleCounts.map((tc) => [tc.title, tc._count.id]));
	}

	const enrichedData = data.map((item) => ({
		...item,
		siblingCount: countsMap.get(item.title) ?? 1,
		activeBookingStatus:
			(
				item as unknown as {
					bookingItems: Array<{ booking: { status: string } }>;
				}
			).bookingItems?.[0]?.booking?.status ?? null,
	}));

	return {
		data: enrichedData as unknown as (DbEquipmentWithImages & {
			siblingCount?: number;
		})[],
		count,
	};
}

export async function toggleEquipmentAvailabilityAction(
	id: string,
	isAvailable: boolean
) {
	try {
		await prisma.equipment.update({
			where: { id },
			data: { isAvailable },
		});
		revalidatePath("/admin/equipment");
		return { success: true };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка обновления",
		};
	}
}

export async function toggleEquipmentPrimaryAction(
	id: string,
	isPrimary: boolean
) {
	try {
		if (isPrimary) {
			const item = await prisma.equipment.findUnique({
				where: { id },
				select: { title: true },
			});
			if (!item) return { success: false, error: "Не найдено" };

			// 1. Атомарно переключаем isPrimary в группе
			await prisma.$transaction([
				prisma.equipment.updateMany({
					where: { title: item.title, id: { not: id } },
					data: { isPrimary: false },
				}),
				prisma.equipment.update({
					where: { id },
					data: { isPrimary: true },
				}),
			]);

			// 2. Синхронизируем избранное пользователей
			const siblings = await prisma.equipment.findMany({
				where: { title: item.title, id: { not: id } },
				select: { id: true },
			});
			const siblingIds = siblings.map((s) => s.id);

			if (siblingIds.length > 0) {
				const siblingFavs = await prisma.favorite.findMany({
					where: { equipmentId: { in: siblingIds } },
				});

				for (const fav of siblingFavs) {
					const alreadyHasNew = await prisma.favorite.findFirst({
						where: { userId: fav.userId, equipmentId: id },
					});
					if (!alreadyHasNew) {
						await prisma.favorite.update({
							where: { id: fav.id },
							data: { equipmentId: id },
						});
					} else {
						await prisma.favorite.delete({ where: { id: fav.id } });
					}
				}
			}
		} else {
			await prisma.equipment.update({
				where: { id },
				data: { isPrimary: false },
			});
		}

		revalidatePath("/admin/equipment");
		return { success: true };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка обновления",
		};
	}
}

export async function updateEquipment(
	id: string,
	updates: Partial<DbEquipment>
): Promise<DbEquipment> {
	// 1. Формируем slug
	const withSlug =
		updates.title && !updates.slug
			? { ...updates, slug: slugify(updates.title) }
			: updates;

	// Очищаем от undefined
	const cleanUpdates = Object.fromEntries(
		Object.entries(withSlug).filter(([, v]) => v !== undefined)
	);

	// 2. Реляционные поля (categoryId, subcategoryId) и поле relatedIds (которого физически нет в схеме Prisma, но оно приходит с фронта)
	const {
		categoryId,
		subcategoryId,
		relatedIds,
		...restData // Здесь остались только скалярные поля (title, price и т.д.)
	} = cleanUpdates;

	// 3. Формируем правильный объект для Prisma
	const prismaData: Prisma.EquipmentUpdateInput = { ...restData };

	// --- Подключаем Категорию ---
	if (categoryId) {
		prismaData.category = { connect: { id: String(categoryId) } };
	}

	// --- Подключаем Подкатегорию ---
	if (subcategoryId !== undefined) {
		if (subcategoryId === null) {
			prismaData.subcategory = { disconnect: true };
		} else {
			prismaData.subcategory = { connect: { id: String(subcategoryId) } };
		}
	}

	// --- RELATED_IDS ---
	// Если с фронта пришел массив relatedIds (даже пустой), обновляем связи
	if (Array.isArray(relatedIds)) {
		prismaData.relatedEquipment = {
			// Удаляем старые связи
			deleteMany: {},
			// Создаем новые. Убеждаемся, что мы работаем со строками (ID)
			create: relatedIds.map((relatedId: unknown) => ({
				related: { connect: { id: String(relatedId) } },
			})),
		};
	}

	const updated = await prisma.equipment.update({
		where: { id },
		data: prismaData,
	});

	revalidatePath("/admin/equipment");
	return updated as unknown as DbEquipment;
}

export async function deleteEquipment(ids: string[]) {
	const referencedItems = await prisma.bookingItem.findMany({
		where: {
			equipmentId: { in: ids },
			booking: { status: { not: "CANCELLED" } },
		},
		select: { equipmentId: true },
	});

	if (referencedItems.length > 0) {
		const refIds = [...new Set(referencedItems.map((r) => r.equipmentId))];
		const freeIds = ids.filter((id) => !refIds.includes(id));

		if (freeIds.length > 0) {
			await prisma.equipment.deleteMany({ where: { id: { in: freeIds } } });
		}

		await prisma.equipment.updateMany({
			where: { id: { in: refIds } },
			data: { isAvailable: false, status: "BROKEN" },
		});

		revalidatePath("/admin/equipment");
		return {
			success: true,
			partial: true,
			deleted: freeIds.length,
			archived: refIds.length,
			archivedIds: refIds,
			message: `Удалено: ${freeIds.length}. Архивировано (есть в бронях): ${refIds.length}.`,
		};
	}

	await prisma.equipment.deleteMany({ where: { id: { in: ids } } });

	revalidatePath("/admin/equipment");
	return { success: true };
}

// TODO: есть дубль в admin-booking-actions
// TODO! используется на клиенте в core search !!!
export async function searchEquipmentAction(
	query: string
): Promise<GroupedEquipment[]> {
	if (!query || query.length < 2) return [];

	const data = await prisma.equipment.findMany({
		where: {
			isAvailable: true,
			title: { contains: query },
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

export async function duplicateEquipment(id: string): Promise<DbEquipment> {
	const original = await prisma.equipment.findUnique({
		where: { id },
		include: { equipmentImageLinks: true },
	});
	if (!original) throw new Error("Equipment not found");

	// Генерируем уникальный инвентарный номер автоматически
	const newInventoryNumber = await generateInventoryNumber();

	const {
		id: _,
		createdAt: __,
		updatedAt: ___,
		equipmentImageLinks,
		specifications,
		comments,
		videoUrls,
		inventoryNumber: _inv,
		isPrimary: _p,
		...data
	} = original;

	const newEntry = await prisma.equipment.create({
		data: {
			...data,
			inventoryNumber: newInventoryNumber,
			isPrimary: false,
			slug: slugify(`${data.title}-${newInventoryNumber}`),
			specifications: specifications
				? (specifications as Prisma.InputJsonValue)
				: Prisma.JsonNull,
			comments: comments
				? (comments as Prisma.InputJsonValue)
				: Prisma.JsonNull,
			videoUrls: videoUrls ? (videoUrls as Prisma.InputJsonValue) : [],
			equipmentImageLinks: {
				create: equipmentImageLinks.map((link) => ({
					imageId: link.imageId,
					orderIndex: link.orderIndex,
				})),
			},
		},
	});

	revalidatePath("/admin/equipment");
	return newEntry as unknown as DbEquipment;
}

export async function syncEquipmentByTitle(
	targetId: string,
	fields: string[]
): Promise<{ updated: number }> {
	const source = await prisma.equipment.findUnique({ where: { id: targetId } });
	if (!source) throw new Error("Source not found");

	const siblings = await prisma.equipment.findMany({
		where: { title: source.title, id: { not: targetId } },
		select: { id: true },
	});

	if (siblings.length === 0) return { updated: 0 };

	const updateData: Record<string, unknown> = {};
	for (const field of fields) {
		if (
			field !== "id" &&
			field !== "createdAt" &&
			field !== "updatedAt" &&
			field !== "inventoryNumber"
		) {
			updateData[field] = (source as unknown as Record<string, unknown>)[field];
		}
	}

	await prisma.equipment.updateMany({
		where: { id: { in: siblings.map((s) => s.id) } },
		data: updateData,
	});

	revalidatePath("/admin/equipment");
	return { updated: siblings.length };
}

export async function exportEquipment(ids?: string[]): Promise<DbEquipment[]> {
	const data = await prisma.equipment.findMany({
		where: ids && ids.length > 0 ? { id: { in: ids } } : {},
	});
	return data as unknown as DbEquipment[];
}

export async function checkInventoryNumberUniqueAction(
	inventoryNumber: string,
	excludeId?: string
): Promise<{ isUnique: boolean }> {
	const found = await prisma.equipment.findFirst({
		where: {
			inventoryNumber,
			...(excludeId ? { id: { not: excludeId } } : {}),
		},
		select: { id: true },
	});
	return { isUnique: !found };
}

// TODO: используется на клиенте
// ─── CATALOG FETCH (Cached) ─────────────────────────────────────────────────

const fetchEquipmentCached = cache(
	async (
		categorySlug: string,
		subcategorySlug: string,
		search: string
	): Promise<GroupedEquipment[]> => {
		const where: Prisma.EquipmentWhereInput = { isAvailable: true };

		if (search) {
			where.title = { contains: search };
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

// TODO: используется на клиенте
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

// TODO: используется на клиенте
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
