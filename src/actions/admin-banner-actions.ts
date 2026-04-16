"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type BannerType = "info" | "event" | "promo";
export interface BannerImage {
	id: string;
	bannerId: string;
	url: string;
	orderIndex: number;
}
export interface Banner {
	id: string;
	title: string;
	subtitle: string | null;
	body: string | null;
	imageUrl: string | null;
	images: BannerImage[];
	linkUrl: string | null;
	linkLabel: string | null;
	type: BannerType;
	isActive: boolean;
	sortOrder: number;
	eventDate: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

const BANNER_INCLUDE = {
	images: { orderBy: { orderIndex: "asc" } },
} satisfies Prisma.BannerInclude;

// ── Read ─────────────────────────────────────────────────────────────────────

export const getBannersFromDb = cache(async (): Promise<Banner[]> => {
	try {
		const data = await prisma.banner.findMany({
			where: { isActive: true },
			orderBy: { sortOrder: "asc" },
			include: BANNER_INCLUDE,
		});
		return data as unknown as Banner[];
	} catch {
		console.warn("[Prisma] Баннеры недоступны");
		return [];
	}
});

export async function getAllBannersAdmin(): Promise<Banner[]> {
	try {
		const data = await prisma.banner.findMany({
			orderBy: { sortOrder: "asc" },
			include: BANNER_INCLUDE,
		});
		return data as unknown as Banner[];
	} catch {
		return [];
	}
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createBannerAction(input: {
	title: string;
	subtitle?: string;
	body?: string;
	imageUrl?: string;
	linkUrl?: string;
	linkLabel?: string;
	type?: BannerType;
	isActive?: boolean;
	eventDate?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Unauthorized" };
		}

		const last = await prisma.banner.findFirst({
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		const created = await prisma.banner.create({
			data: {
				title: input.title.trim(),
				subtitle: input.subtitle?.trim() ?? null,
				body: input.body?.trim() ?? null,
				imageUrl: input.imageUrl ?? null,
				linkUrl: input.linkUrl?.trim() ?? null,
				linkLabel: input.linkLabel?.trim() ?? null,
				type: input.type ?? "info",
				isActive: input.isActive ?? true,
				eventDate: input.eventDate ? new Date(input.eventDate) : null,
				sortOrder: (last?.sortOrder ?? 0) + 1,
				createdBy: session.user.id,
			},
		});

		revalidatePath("/");
		return { success: true, id: created.id };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

// ── Update ───────────────────────────────────────────────────────────────────
export async function updateBannerAction(
	id: string,
	input: Partial<{
		title: string;
		subtitle: string;
		body: string;
		imageUrl: string;
		linkUrl: string;
		linkLabel: string;
		type: BannerType;
		isActive: boolean;
		sortOrder: number;
		eventDate: string | null;
	}>
): Promise<{ success: boolean; error?: string; id?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Unauthorized" };
		}

		// Создаем объект строго по типу Prisma, чтобы избежать undefined в ключах
		const data: Prisma.BannerUpdateInput = {};

		if (input.title !== undefined) data.title = input.title;
		if (input.subtitle !== undefined) data.subtitle = input.subtitle;
		if (input.body !== undefined) data.body = input.body;
		if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
		if (input.linkUrl !== undefined) data.linkUrl = input.linkUrl;
		if (input.linkLabel !== undefined) data.linkLabel = input.linkLabel;
		if (input.type !== undefined) data.type = input.type;
		if (input.isActive !== undefined) data.isActive = input.isActive;
		if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
		if (input.eventDate !== undefined) {
			data.eventDate = input.eventDate ? new Date(input.eventDate) : null;
		}

		await prisma.banner.update({
			where: { id },
			data,
		});
		revalidatePath("/");
		return { success: true, id: id };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deleteBannerAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Unauthorized" };
		}
		await prisma.banner.delete({ where: { id } });
		revalidatePath("/");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

// ── Reorder ───────────────────────────────────────────────────────────────────

export async function reorderBannersAction(
	orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Unauthorized" };
		}

		await prisma.$transaction(
			orderedIds.map((id, index) =>
				prisma.banner.update({
					where: { id },
					data: { sortOrder: index + 1 },
				})
			)
		);

		revalidatePath("/");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

// ── Banner Images ─────────────────────────────────────────────────────────────

export async function addBannerImageAction(
	bannerId: string,
	imageUrl: string
): Promise<{ success: boolean; image?: BannerImage; error?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Unauthorized" };
		}

		const count = await prisma.bannerImage.count({ where: { bannerId } });
		if (count >= 10) {
			return { success: false, error: "Максимум 10 изображений на баннер" };
		}

		const image = await prisma.bannerImage.create({
			data: { bannerId, url: imageUrl, orderIndex: count },
		});

		// Если это первое изображение — обновляем imageUrl баннера (обложка)
		if (count === 0) {
			await prisma.banner.update({
				where: { id: bannerId },
				data: { imageUrl },
			});
		}

		revalidatePath("/");
		return { success: true, image: image as unknown as BannerImage };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка добавления изображения" };
	}
}

// Удалить изображение баннера
export async function deleteBannerImageAction(
	imageId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Unauthorized" };
		}

		const img = await prisma.bannerImage.findUnique({
			where: { id: imageId },
			select: { bannerId: true, orderIndex: true },
		});
		if (!img) return { success: false, error: "Изображение не найдено" };

		await prisma.bannerImage.delete({ where: { id: imageId } });

		// Обновляем обложку баннера — первое оставшееся изображение
		const first = await prisma.bannerImage.findFirst({
			where: { bannerId: img.bannerId },
			orderBy: { orderIndex: "asc" },
		});
		await prisma.banner.update({
			where: { id: img.bannerId },
			data: { imageUrl: first?.url ?? null },
		});

		revalidatePath("/");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка удаления" };
	}
}

// Изменить порядок изображений баннера
export async function reorderBannerImagesAction(
	bannerId: string,
	orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Unauthorized" };
		}

		await prisma.$transaction(
			orderedIds.map((id, index) =>
				prisma.bannerImage.update({
					where: { id },
					data: { orderIndex: index },
				})
			)
		);

		// Первое изображение становится обложкой
		const first = await prisma.bannerImage.findFirst({
			where: { bannerId },
			orderBy: { orderIndex: "asc" },
		});
		if (first) {
			await prisma.banner.update({
				where: { id: bannerId },
				data: { imageUrl: first.url },
			});
		}

		revalidatePath("/");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка сортировки" };
	}
}
