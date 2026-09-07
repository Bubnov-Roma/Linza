export const dynamic = "force-dynamic";

import { getCategoriesFromDb } from "@/actions/admin/admin-category-actions";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const baseUrl = "https://linzarental.ru";

	try {
		const [equipment, categories, history] = await Promise.all([
			prisma.equipment.findMany({
				where: { isPrimary: true, isAvailable: true },
				select: {
					slug: true,
					updatedAt: true,
					categoryId: true,
					subcategoryId: true,
				},
			}),
			getCategoriesFromDb(),
			// Получаем последние изменения категорий из истории
			prisma.categoryHistory.findMany({
				where: { action: { in: ["CREATED", "UPDATED"] } },
				select: { entityId: true, changedAt: true },
				orderBy: { changedAt: "desc" },
			}),
		]);

		// Вспомогательный маппер для быстрого поиска даты изменения категории/подкатегории из истории
		const historyMap = new Map<string, Date>();
		for (const record of history) {
			if (!historyMap.has(record.entityId)) {
				historyMap.set(record.entityId, record.changedAt);
			}
		}

		const urls: Array<{
			loc: string;
			lastmod: string;
			changefreq: string;
			priority: string;
		}> = [];

		const currentDate = new Date().toISOString().split("T")[0];

		// ─── 1. Статические разделы ──────────────────────────────────────────
		const staticPages = [
			{ path: "", changefreq: "daily", priority: "1.0" },
			{ path: "/equipment", changefreq: "daily", priority: "0.8" },
			{ path: "/studio", changefreq: "weekly", priority: "0.7" },
			{ path: "/about", changefreq: "weekly", priority: "0.6" },
			{ path: "/faq", changefreq: "weekly", priority: "0.6" },
			{ path: "/contacts", changefreq: "weekly", priority: "0.6" },
		];

		for (const page of staticPages) {
			urls.push({
				loc: `${baseUrl}${page.path}`,
				lastmod: currentDate ?? "",
				changefreq: page.changefreq,
				priority: page.priority,
			});
		}

		// ─── 2. Категории и подкатегории ─────────────────────────────────────
		for (const cat of categories) {
			// Ищем дату изменения в истории, если нет — берем updatedAt самой свежей техники в этой категории
			const catHistoryDate = historyMap.get(cat.id);
			const relatedEquip = equipment.filter((e) => e.categoryId === cat.id);
			const newestEquipDate =
				relatedEquip.length > 0
					? new Date(
							Math.max(...relatedEquip.map((e) => e.updatedAt.getTime()))
						)
					: null;

			const catLastMod = catHistoryDate || newestEquipDate || new Date();

			urls.push({
				loc: `${baseUrl}/equipment?category=${cat.slug}`,
				lastmod: catLastMod.toISOString().split("T")[0] ?? "",
				changefreq: "weekly",
				priority: "0.8",
			});

			// Подкатегории
			if (cat.subcategories) {
				for (const sub of cat.subcategories) {
					const subHistoryDate = historyMap.get(sub.id);
					const subEquip = relatedEquip.filter(
						(e) => e.subcategoryId === sub.id
					);
					const newestSubEquipDate =
						subEquip.length > 0
							? new Date(
									Math.max(...subEquip.map((e) => e.updatedAt.getTime()))
								)
							: null;

					const subLastMod = subHistoryDate || newestSubEquipDate || catLastMod;

					urls.push({
						// Важно: в XML символ "&" должен быть экранирован как "&amp;"
						loc: `${baseUrl}/equipment?category=${cat.slug}&amp;subcategory=${sub.slug}`,
						lastmod: subLastMod.toISOString().split("T")[0] ?? "",
						changefreq: "weekly",
						priority: "0.7",
					});
				}
			}
		}

		// ─── 3. Карточки техники ─────────────────────────────────────────────
		for (const item of equipment) {
			urls.push({
				loc: `${baseUrl}/equipment/item/${item.slug}`,
				lastmod: new Date(item.updatedAt).toISOString().split("T")[0] ?? "",
				changefreq: "weekly",
				priority: "0.6",
			});
		}

		// Собираем XML. Ссылаемся на наш новый роут /sitemap.xsl
		const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
		.map(
			(url) => `
    <url>
      <loc>${url.loc}</loc>
      <lastmod>${url.lastmod}</lastmod>
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>`
		)
		.join("")}
</urlset>`;

		return new Response(sitemapXml, {
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
				"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
			},
		});
	} catch (error) {
		console.error("Ошибка генерации sitemap:", error);
		const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;
		return new Response(fallbackXml, {
			headers: { "Content-Type": "application/xml" },
		});
	}
}
