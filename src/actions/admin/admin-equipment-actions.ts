"use server";

import type { EquipmentStatus, OwnershipType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeEquipmentAuditLog } from "@/actions/admin/admin-equipment-audit-log-actions";
import type {
	DbEquipment,
	DbEquipmentWithImages,
} from "@/core/domain/entities/Equipment";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { fmtRub } from "@/lib/utils";
import { getSearchVariations, slugify } from "@/utils";

// ─── AUDIT HELPERS ──────────────────────────────────────────────────────────

const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
	AVAILABLE: "Исправно",
	RENTED: "В аренде",
	RESERVED: "Забронировано",
	MAINTENANCE: "В ремонте",
	BROKEN: "Неисправно",
	RETIRED: "Списано",
};

const OWNERSHIP_LABELS: Record<string, string> = {
	INTERNAL: "Своё",
	SUBLEASE: "Субаренда",
};

function formatPlain(v: unknown): string {
	if (v === null || v === undefined || v === "") return "—";
	return String(v);
}

function formatPrice(v: unknown): string {
	return fmtRub(Number(v ?? 0));
}

function formatBool(v: unknown): string {
	return v ? "Да" : "Нет";
}

function formatStatus(v: unknown): string {
	return EQUIPMENT_STATUS_LABELS[String(v)] ?? formatPlain(v);
}

function formatOwnership(v: unknown): string {
	return OWNERSHIP_LABELS[String(v)] ?? formatPlain(v);
}

function formatCategoryName(v: unknown, map: Map<string, string>): string {
	if (!v || typeof v !== "string") return "—";
	return map.get(v) ?? v;
}

function isEqualValue(a: unknown, b: unknown): boolean {
	// Числа с плавающей точкой сравниваем с небольшим допуском
	if (typeof a === "number" && typeof b === "number") {
		return Math.abs(a - b) < 0.001;
	}
	return (a ?? null) === (b ?? null);
}

// Поля, изменения которых фиксируются в истории позиции.
// Порядок и подписи — как в карточке товара.
const TRACKED_EQUIPMENT_FIELDS: {
	key: string;
	label: string;
	format?: (v: unknown) => string;
}[] = [
	{ key: "title", label: "Наименование" },
	{ key: "inventoryNumber", label: "Инвентарный номер" },
	{ key: "categoryId", label: "Категория" },
	{ key: "subcategoryId", label: "Подкатегория" },
	{ key: "pricePerDay", label: "Цена/сутки", format: formatPrice },
	{ key: "price4h", label: "Цена/4ч", format: formatPrice },
	{ key: "price8h", label: "Цена/8ч", format: formatPrice },
	{ key: "priceStudio", label: "Цена в студии", format: formatPrice },
	{ key: "deposit", label: "Залог", format: formatPrice },
	{
		key: "replacementValue",
		label: "Стоимость (для страховки)",
		format: formatPrice,
	},
	{ key: "status", label: "Техническое состояние", format: formatStatus },
	{ key: "isAvailable", label: "Доступность", format: formatBool },
	{ key: "isFeatured", label: "Рекомендуемое", format: formatBool },
	{ key: "studioAvailable", label: "Доступно в студии", format: formatBool },
	{ key: "ownershipType", label: "Тип владения", format: formatOwnership },
	{ key: "partnerName", label: "Владелец (субаренда)" },
	{ key: "description", label: "Описание" },
	{ key: "defects", label: "Дефекты" },
	{ key: "kit", label: "Комплектация" },
	{ key: "kitDescription", label: "Описание комплекта" },
];

/**
 * Сравнивает состояние позиции до/после изменения и пишет
 * по одной записи в историю на каждое изменённое поле.
 */
async function logEquipmentChanges(
	equipmentId: string,
	authorId: string,
	authorName: string,
	before: Record<string, unknown>,
	after: Record<string, unknown>
): Promise<void> {
	const categoryIds = [before.categoryId, after.categoryId].filter(
		(v): v is string => typeof v === "string"
	);
	const subcategoryIds = [before.subcategoryId, after.subcategoryId].filter(
		(v): v is string => typeof v === "string"
	);

	const [categories, subcategories] = await Promise.all([
		categoryIds.length
			? prisma.category.findMany({
					where: { id: { in: [...new Set(categoryIds)] } },
					select: { id: true, name: true },
				})
			: Promise.resolve([]),
		subcategoryIds.length
			? prisma.subcategory.findMany({
					where: { id: { in: [...new Set(subcategoryIds)] } },
					select: { id: true, name: true },
				})
			: Promise.resolve([]),
	]);
	const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
	const subcategoryNameById = new Map(subcategories.map((s) => [s.id, s.name]));

	for (const { key, label, format } of TRACKED_EQUIPMENT_FIELDS) {
		const beforeVal = before[key];
		const afterVal = after[key];

		if (isEqualValue(beforeVal, afterVal)) continue;

		let valueBefore: string;
		let valueAfter: string;

		if (key === "categoryId") {
			valueBefore = formatCategoryName(beforeVal, categoryNameById);
			valueAfter = formatCategoryName(afterVal, categoryNameById);
		} else if (key === "subcategoryId") {
			valueBefore = formatCategoryName(beforeVal, subcategoryNameById);
			valueAfter = formatCategoryName(afterVal, subcategoryNameById);
		} else if (format) {
			valueBefore = format(beforeVal);
			valueAfter = format(afterVal);
		} else {
			valueBefore = formatPlain(beforeVal);
			valueAfter = formatPlain(afterVal);
		}

		await writeEquipmentAuditLog(equipmentId, authorId, authorName, {
			action: `Изменено поле «${label}»`,
			fieldName: key,
			valueBefore,
			valueAfter,
		});
	}
}

// ─── TYPES & HELPERS ────────────────────────────────────────────────────────

export type CreateEquipmentData = {
	title: string;
	category: string;
	subcategory?: string | null;
	inventoryNumber?: string | undefined;
	priceStudio?: number | undefined;
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
		const searchWords = search.trim().split(/\s+/).filter(Boolean);

		if (searchWords.length > 0) {
			where.AND = searchWords.map((word) => {
				const variations = getSearchVariations(word);

				return {
					OR: variations.flatMap((term) => [
						{ title: { contains: term, mode: "insensitive" } },
						{ description: { contains: term, mode: "insensitive" } },
						{ inventoryNumber: { contains: term, mode: "insensitive" } },
					]),
				};
			});
		}
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
	await requireAdmin();
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
		const { userId: authorId, name: authorName } = await requireAdmin();
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
		await writeEquipmentAuditLog(created.id, authorId, authorName, {
			action: "Позиция создана",
			fieldName: "title",
			valueAfter: created.title,
			meta: { inventoryNumber: created.inventoryNumber },
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
	await requireAdmin();
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

	const titlesMap = new Map<string, string>(); // title → imageUrl
	// Сначала собираем из текущей страницы
	for (const item of data) {
		const url = (
			item as unknown as {
				equipmentImageLinks?: Array<{ image?: { url?: string } }>;
			}
		).equipmentImageLinks?.[0]?.image?.url;
		if (url && !titlesMap.has(item.title)) {
			titlesMap.set(item.title, url);
		}
	}

	// Titles у которых нет картинки в текущей странице — дозапрашиваем из БД
	const titlesWithoutImage = uniqueTitles.filter((t) => !titlesMap.has(t));
	if (titlesWithoutImage.length > 0) {
		const imageRows = await prisma.equipmentImageLink.findMany({
			where: {
				equipment: { title: { in: titlesWithoutImage } },
				orderIndex: 0,
			},
			select: {
				image: { select: { url: true } },
				equipment: { select: { title: true } },
			},
			orderBy: { orderIndex: "asc" },
		});
		for (const row of imageRows) {
			if (!titlesMap.has(row.equipment.title) && row.image?.url) {
				titlesMap.set(row.equipment.title, row.image.url);
			}
		}
	}

	const enrichedData = data.map((item) => {
		const hasImage = (
			item as unknown as {
				equipmentImageLinks?: Array<{ image?: { url?: string } }>;
			}
		).equipmentImageLinks?.[0]?.image?.url;
		return {
			...item,
			siblingCount: countsMap.get(item.title) ?? 1,
			imageUrlFallback: hasImage ? undefined : titlesMap.get(item.title),
			activeBookingStatus:
				(
					item as unknown as {
						bookingItems: Array<{ booking: { status: string } }>;
					}
				).bookingItems?.[0]?.booking?.status ?? null,
		};
	});

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
		await requireAdmin();
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
		await requireAdmin();
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

export async function toggleEquipmentFeaturedAction(
	id: string,
	isFeatured: boolean
) {
	try {
		await requireAdmin();
		await prisma.equipment.update({
			where: { id },
			data: { isFeatured },
		});
		revalidatePath("/admin/equipment");
		revalidatePath("/");
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
	const { userId: authorId, name: authorName } = await requireAdmin();

	// Снимок состояния ДО изменений — нужен для истории изменений
	const before = await prisma.equipment.findUnique({ where: { id } });
	if (!before) throw new Error("Позиция не найдена");

	// Формируем slug
	const withSlug =
		updates.title && !updates.slug
			? { ...updates, slug: slugify(updates.title) }
			: updates;

	// Очищаем от undefined
	const cleanUpdates = Object.fromEntries(
		Object.entries(withSlug).filter(([, v]) => v !== undefined)
	);

	// Реляционные поля (categoryId, subcategoryId) и поле relatedIds (которого физически нет в схеме Prisma, но оно приходит с фронта)
	const {
		categoryId,
		subcategoryId,
		relatedIds,
		...restData // Здесь остались только скалярные поля (title, price и т.д.)
	} = cleanUpdates;

	// Формируем правильный объект для Prisma
	const prismaData: Prisma.EquipmentUpdateInput = { ...restData };

	// Подключаем Категорию
	if (categoryId) {
		prismaData.category = { connect: { id: String(categoryId) } };
	}

	// Подключаем Подкатегорию
	if (subcategoryId !== undefined) {
		if (subcategoryId === null) {
			prismaData.subcategory = { disconnect: true };
		} else {
			prismaData.subcategory = { connect: { id: String(subcategoryId) } };
		}
	}

	// RELATED_IDS
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

	const VALID_STATUSES = new Set([
		"AVAILABLE",
		"RENTED",
		"RESERVED",
		"MAINTENANCE",
		"BROKEN",
		"RETIRED",
	]);

	if (prismaData.status && !VALID_STATUSES.has(String(prismaData.status))) {
		throw new Error(`Недопустимый статус техники: ${prismaData.status}`);
	}

	const updated = await prisma.equipment.update({
		where: { id },
		data: prismaData,
	});

	await logEquipmentChanges(
		id,
		authorId,
		authorName,
		before as unknown as Record<string, unknown>,
		updated as unknown as Record<string, unknown>
	);

	if (before.slug !== updated.slug) {
		await prisma.equipmentSlugRedirect.upsert({
			where: { oldSlug: before.slug },
			create: { oldSlug: before.slug, newSlug: updated.slug },
			update: { newSlug: updated.slug },
		});
	}

	revalidatePath("/admin/equipment");
	return updated as unknown as DbEquipment;
}

export async function deleteEquipment(ids: string[]) {
	await requireAdmin();
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
			const toDelete = await prisma.equipment.findMany({
				where: { id: { in: freeIds } },
				select: { slug: true, title: true },
			});

			await prisma.equipment.deleteMany({ where: { id: { in: freeIds } } });

			for (const row of toDelete) {
				const replacement = await prisma.equipment.findFirst({
					where: { title: row.title, isPrimary: true },
					select: { slug: true },
				});
				await prisma.equipmentSlugRedirect.upsert({
					where: { oldSlug: row.slug },
					create: { oldSlug: row.slug, newSlug: replacement?.slug ?? null },
					update: { newSlug: replacement?.slug ?? null },
				});
			}
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

	const toDelete = await prisma.equipment.findMany({
		where: { id: { in: ids } },
		select: { slug: true, title: true },
	});

	await prisma.equipment.deleteMany({ where: { id: { in: ids } } });

	for (const row of toDelete) {
		const replacement = await prisma.equipment.findFirst({
			where: { title: row.title, isPrimary: true },
			select: { slug: true },
		});
		await prisma.equipmentSlugRedirect.upsert({
			where: { oldSlug: row.slug },
			create: { oldSlug: row.slug, newSlug: replacement?.slug ?? null },
			update: { newSlug: replacement?.slug ?? null },
		});
	}

	revalidatePath("/admin/equipment");
	return { success: true };
}

export async function duplicateEquipment(id: string): Promise<DbEquipment> {
	await requireAdmin();
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
	await requireAdmin();
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

export async function syncEquipmentImagesAction(
	sourceId: string
): Promise<{ updated: number }> {
	// Берём картинки источника
	await requireAdmin();
	const source = await prisma.equipment.findUnique({
		where: { id: sourceId },
		include: {
			equipmentImageLinks: { orderBy: { orderIndex: "asc" } },
		},
	});
	if (!source) throw new Error("Source not found");

	const siblings = await prisma.equipment.findMany({
		where: { title: source.title, id: { not: sourceId } },
		select: { id: true },
	});

	if (siblings.length === 0) return { updated: 0 };

	// Для каждого сиблинга без собственных картинок — копируем ссылки
	let updated = 0;
	for (const sibling of siblings) {
		const existingLinks = await prisma.equipmentImageLink.count({
			where: { equipmentId: sibling.id },
		});
		if (existingLinks === 0 && source.equipmentImageLinks.length > 0) {
			await prisma.equipmentImageLink.createMany({
				data: source.equipmentImageLinks.map((link) => ({
					equipmentId: sibling.id,
					imageId: link.imageId,
					orderIndex: link.orderIndex,
				})),
				skipDuplicates: true,
			});
			updated++;
		}
	}

	revalidatePath("/admin/equipment");
	return { updated };
}

export async function exportEquipment(ids?: string[]): Promise<DbEquipment[]> {
	await requireAdmin();
	const data = await prisma.equipment.findMany({
		where: ids && ids.length > 0 ? { id: { in: ids } } : {},
	});
	return data as unknown as DbEquipment[];
}

export async function checkInventoryNumberUniqueAction(
	inventoryNumber: string,
	excludeId?: string
): Promise<{ isUnique: boolean }> {
	await requireAdmin();
	const found = await prisma.equipment.findFirst({
		where: {
			inventoryNumber,
			...(excludeId ? { id: { not: excludeId } } : {}),
		},
		select: { id: true },
	});
	return { isUnique: !found };
}
