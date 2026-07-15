"use server";

import { randomUUID } from "node:crypto";
import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import type { EquipmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { DbRawCSVRow } from "@/core/domain/entities/Equipment";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// ── S3 ──
function getS3Client() {
	return new S3Client({
		endpoint: process.env.S3_ENDPOINT as string,
		region: process.env.S3_REGION ?? "ru-1",
		credentials: {
			accessKeyId: process.env.S3_ACCESS_KEY as string,
			secretAccessKey: process.env.S3_SECRET_KEY as string,
		},
		forcePathStyle: true,
	});
}

// Загрузить файл в S3 → вернуть публичный URL
export async function uploadToS3(
	buffer: Buffer,
	originalName: string,
	mimeType: string,
	folder = "equipment"
): Promise<string> {
	const ext = originalName.split(".").pop() ?? "bin";
	const key = `${folder}/${randomUUID()}.${ext}`;
	const client = getS3Client();
	await client.send(
		new PutObjectCommand({
			Bucket: process.env.S3_BUCKET,
			Key: key,
			Body: buffer,
			ContentType: mimeType,
		})
	);
	return `${process.env.S3_PUBLIC_URL}/${key}`;
}

// Удалить объект из S3 по публичному URL
async function deleteFromS3(url: string): Promise<void> {
	const publicBase = process.env.S3_PUBLIC_URL as string;
	if (!url.startsWith(publicBase)) return;
	const key = url.replace(`${publicBase}/`, "");
	const client = getS3Client();
	await client.send(
		new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
	);
}

// ── Удаление изображения из БД + S3 ───────
export async function deleteImageAction(
	imageId: string,
	imageUrl: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireAdmin();

		const isUUID =
			/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
				imageId
			);
		if (isUUID) await prisma.image.delete({ where: { id: imageId } });

		if (imageUrl.startsWith(process.env.S3_PUBLIC_URL ?? "__never__")) {
			await deleteFromS3(imageUrl).catch(() => {});
		} else if (imageUrl.startsWith("/uploads/")) {
			// legacy: файл на диске
			const { unlink } = await import("node:fs/promises");
			const { join } = await import("node:path");
			await unlink(join(process.cwd(), "public", imageUrl)).catch(() => {});
		}

		revalidatePath("/admin/equipment");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка удаления" };
	}
}

// ── Упаравление порядком изображений позиции ---
export async function reorderImagesAction(
	equipmentId: string,
	orderedImageIds: string[] // массив imageId в нужном порядке
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireAdmin();
		await prisma.$transaction(
			orderedImageIds.map((imageId, index) =>
				prisma.equipmentImageLink.updateMany({
					where: { equipmentId, imageId },
					data: { orderIndex: index },
				})
			)
		);
		revalidatePath("/admin/equipment");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка сортировки" };
	}
}

// ── Связать загруженный URL с оборудованием в БД ─────────────────────────────────────
export async function linkImageToEquipmentAction(
	equipmentId: string,
	imageUrl: string
): Promise<{ id: string; url: string; error?: string }> {
	try {
		await requireAdmin();

		const image = await prisma.image.create({
			data: { url: imageUrl, hash: imageUrl },
		});
		await prisma.equipmentImageLink.create({
			data: { equipmentId, imageId: image.id },
		});

		revalidatePath("/admin/equipment");
		return { id: image.id, url: image.url };
	} catch (error: unknown) {
		console.error(error);
		throw new Error("Failed to link image");
	}
}

// ── CSV ────────────────────────────────────────────────────────────────

export async function importEquipmentFromCSV(data: DbRawCSVRow[]): Promise<{
	success: boolean;
	count?: number;
	skipped?: number;
	error?: string;
}> {
	try {
		await requireAdmin();

		// 1. Загружаем справочники
		const [categories, subcategories, existingEq] = await Promise.all([
			prisma.category.findMany({
				select: { id: true, name: true, slug: true },
			}),
			prisma.subcategory.findMany({
				select: { id: true, name: true, slug: true },
			}),
			prisma.equipment.findMany({ select: { id: true, slug: true } }),
		]);

		// Карты для быстрого поиска
		const catById = new Set(categories.map((c) => c.id));
		const catByName = new Map(
			categories.map((c) => [c.name.toLowerCase(), c.id])
		);
		const catBySlug = new Map(
			categories.map((c) => [c.slug.toLowerCase(), c.id])
		);

		const subById = new Set(subcategories.map((s) => s.id));
		const subByName = new Map(
			subcategories.map((s) => [s.name.toLowerCase(), s.id])
		);
		const subBySlug = new Map(
			subcategories.map((s) => [s.slug.toLowerCase(), s.id])
		);

		const usedSlugs = new Set(
			existingEq.map((e) => e.slug).filter(Boolean) as string[]
		);
		const existingIds = new Set(existingEq.map((e) => e.id));
		const seenTitlesInImport = new Set<string>();

		// 2. Подготавливаем записи
		const prepared = [];
		let skippedCount = 0;

		for (const item of data) {
			const raw = item;
			const title = String(raw.title || "").trim();
			if (!title) continue;

			const parsePrice = (val: number) => {
				if (!val) return 0;
				const clean = String(val).replace(/[^0-9.]/g, "");
				return Number.parseFloat(clean) || 0;
			};

			const titleKey = title.toLowerCase();

			// --- ЛОГИКА КАТЕГОРИЙ (ID -> SLUG -> NAME) ---
			const catVal = String(raw.category || "").trim();
			const categoryId = catById.has(catVal)
				? catVal
				: (catBySlug.get(catVal.toLowerCase()) ??
					catByName.get(catVal.toLowerCase()) ??
					categories[0]?.id);

			if (!categoryId) {
				console.warn(`Пропущено (нет категории): "${title}"`);
				skippedCount++;
				continue;
			}

			// --- ЛОГИКА ПОДКАТЕГОРИЙ (ID -> SLUG -> NAME) ---
			const subVal = String(raw.subcategory || "").trim();
			const subcategoryId = subById.has(subVal)
				? subVal
				: (subBySlug.get(subVal.toLowerCase()) ??
					subByName.get(subVal.toLowerCase()) ??
					null);

			// Slug
			let baseSlug = (raw.slug || "").trim();
			if (!baseSlug) {
				baseSlug = title
					.toLowerCase()
					.replace(/[^a-zа-яё0-9\s-]/gi, "")
					.replace(/\s+/g, "-")
					.slice(0, 80);
			}
			let uniqueSlug = baseSlug;
			let counter = 1;
			while (usedSlugs.has(uniqueSlug)) {
				uniqueSlug = `${baseSlug}-${counter++}`;
			}
			usedSlugs.add(uniqueSlug);

			// Принудительные значения по твоему запросу
			const isAvailable = true;
			const status: EquipmentStatus = "AVAILABLE";

			// Логика isPrimary
			let isPrimary = false;
			if (!seenTitlesInImport.has(titleKey)) {
				isPrimary = true;
				seenTitlesInImport.add(titleKey);
			}

			prepared.push({
				id: raw.id || crypto.randomUUID(),
				title,
				slug: uniqueSlug,
				categoryId,
				subcategoryId,
				description: raw.description ?? null,
				inventoryNumber: raw.inventoryNumber ?? null,
				pricePerDay: parsePrice(raw.pricePerDay),
				price4h: parsePrice(raw.price4h),
				price8h: parsePrice(raw.price8h),
				deposit: parsePrice(raw.deposit),
				replacementValue: parsePrice(raw.replacementValue),
				isAvailable,
				isPrimary,
				status,
			});
		}

		// 3. Батчинг (транзакции)
		const BATCH_SIZE = 30;
		let totalCreated = 0;

		for (let i = 0; i < prepared.length; i += BATCH_SIZE) {
			const batch = prepared.slice(i, i + BATCH_SIZE);
			await prisma.$transaction(
				async (tx) => {
					for (const item of batch) {
						const isExisting = existingIds.has(item.id);
						await tx.equipment.upsert({
							where: isExisting ? { id: item.id } : { slug: item.slug },
							update: { ...item },
							create: { ...item },
						});
					}
				},
				{ timeout: 15000 }
			);
			totalCreated += batch.length;
		}

		revalidatePath("/admin/equipment");
		return { success: true, count: totalCreated, skipped: skippedCount };
	} catch (error: unknown) {
		console.error("CSV Import error:", error);
		return { success: false, error: "Ошибка импорта" };
	}
}

// ── Img for Categories ─────────────────

export async function uploadCategoryImageAction(
	formData: FormData,
	categoryId: string,
	oldImageUrl?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
	try {
		await requireAdmin();

		const file = formData.get("file") as File;
		if (!file) return { success: false, error: "Файл не найден" };

		const buffer = Buffer.from(await file.arrayBuffer());

		// 1. Если есть старая картинка в S3 — удаляем её
		if (oldImageUrl?.includes("category_images")) {
			await deleteFromS3(oldImageUrl).catch(() => {});
		}

		// 2. Загружаем новую в папку category_images
		// Используем originalName для расширения, но randomUUID для уникальности пути
		const url = await uploadToS3(
			buffer,
			file.name,
			file.type,
			"category_images"
		);

		// 3. Обновляем URL в базе данных
		await prisma.category.update({
			where: { id: categoryId },
			data: { imageUrl: url },
		});

		revalidatePath("/admin/categories");
		revalidatePath("/"); // Чтобы на главной тоже обновилось

		return { success: true, url };
	} catch (error) {
		console.error(error);
		return { success: false, error: "Ошибка при загрузке иконки" };
	}
}
