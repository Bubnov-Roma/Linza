import type { Prisma } from "@prisma/client";

export const BANNER_INCLUDE = {
	images: { orderBy: { orderIndex: "asc" } },
} satisfies Prisma.BannerInclude;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Определить тип медиа по URL */
export function getMediaType(url: string): "video" | "youtube" | "image" {
	if (!url) return "image";
	const lower = url.toLowerCase();
	if (
		lower.includes("youtube.com/watch") ||
		lower.includes("youtu.be/") ||
		lower.includes("youtube.com/embed")
	)
		return "youtube";
	if (
		lower.endsWith(".mp4") ||
		lower.endsWith(".webm") ||
		lower.endsWith(".mov") ||
		lower.includes("/video/")
	)
		return "video";
	return "image";
}

/** Преобразовать YouTube watch URL → embed URL */
export function toYouTubeEmbed(url: string): string {
	try {
		const u = new URL(url);
		if (u.hostname.includes("youtu.be")) {
			return `https://www.youtube.com/embed${u.pathname}?autoplay=1&mute=1&loop=1&playlist=${u.pathname.slice(1)}`;
		}
		const v = u.searchParams.get("v");
		if (v)
			return `https://www.youtube.com/embed/${v}?autoplay=1&mute=1&loop=1&playlist=${v}`;
	} catch {
		// ignore
	}
	return url;
}
