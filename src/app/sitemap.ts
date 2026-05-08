export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	try {
		const equipment = await prisma.equipment.findMany();
		const equipmentUrls = equipment.map((item) => ({
			url: `https://linzarental.ru/equipment/item/${item.slug}`,
			lastModified: item.updatedAt,
		}));

		return [
			{
				url: "https://linzarental.ru",
				lastModified: new Date(),
				changeFrequency: "weekly",
				priority: 1,
			},
			{
				url: "https://linzarental.ru/equipment",
				lastModified: new Date(),
				changeFrequency: "daily",
				priority: 0.8,
			},
			...equipmentUrls,
		];
	} catch {
		console.log("Сборка ситмапа пропущена (БД недоступна)");
		return [];
	}
}
