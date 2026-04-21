import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/admin/",
				"/api/",
				"/private/",
				"/dashboard/",
				"/checkout/",
				"/booking/",
			],
		},
		sitemap: "https://linzarental.ru/sitemap.xml",
	};
}
