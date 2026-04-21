import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const equipment = await prisma.equipment.findMany();
	const equipmentUrls = equipment.map((item) => ({
		url: `https://linzarental.ru/catalog/item/${item.slug}`,
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
			url: "https://linzarental.ru/catalog",
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.8,
		},
		...equipmentUrls,
	];
}
