import type { Prisma } from "@prisma/client";

// Сохраняем конфигурацию Prisma
export const BANNER_INCLUDE = {
	images: { orderBy: { orderIndex: "asc" } },
} satisfies Prisma.BannerInclude;

// ── Types ────────────────────────────────────────────────────────────────────

export type ExtendedMediaType =
	| "youtube"
	| "vk-video"
	| "vk-post"
	| "rutube"
	| "vimeo"
	| "video"
	| "image"
	| "unknown";

// ── Core Helpers ──────────────────────────────────────────────────────────────

/**
 * Определяет тип медиа-ресурса на основе URL-адреса или строки кода виджета
 */
export function getMediaType(url: string): ExtendedMediaType {
	if (!url) return "unknown";
	const text = url.trim();
	const lower = text.toLowerCase();

	// 1. Проверяем виджеты и посты ВК (стены)
	if (
		text.includes("VK.Widgets.Post") ||
		text.includes("vk_post_") ||
		lower.includes("vk.com/wall") ||
		lower.includes("vk.com/widget_post.php")
	) {
		return "vk-post";
	}

	// 2. Стриминговая платформа ВК + Клипы
	if (
		lower.includes("vk.com/video") ||
		lower.includes("vkvideo.ru") ||
		lower.includes("vk.com/video_ext.php") ||
		lower.includes("vk.com/clip") ||
		lower.includes("vk.com/clip_ext.php")
	) {
		return "vk-video";
	}

	// 3. YouTube
	if (
		lower.includes("youtube.com") ||
		lower.includes("youtu.be") ||
		lower.includes("youtube-nocookie.com")
	) {
		return "youtube";
	}

	// 4. RuTube & Vimeo
	if (lower.includes("rutube.ru")) return "rutube";
	if (lower.includes("player.vimeo.com") || lower.includes("vimeo.com")) {
		return "vimeo";
	}

	// 5. Прямые ссылки на файлы
	if (/\.(mp4|webm|ogg|mov|ogv|avi)(?:\?|$)/i.test(text)) return "video";
	if (
		/\.(jpeg|jpg|gif|png|webp|avif|svg)(?:\?|$)/i.test(text) ||
		lower.includes("i.ibb.co")
	) {
		return "image";
	}

	return "unknown";
}

/**
 * Проверяет, является ли ссылка прямым файлом видео (например, из S3).
 */
export function isVideoFileUrl(url: string): boolean {
	return getMediaType(url) === "video";
}

// ── Platform Parsers & Embedders ─────────────────────────────────────────────

/**
 * Парсер ID видео для YouTube
 */
export function parseYoutubeUrl(url: string): string | null {
	const regExp =
		/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
	const match = url.match(regExp);
	return match && match[2]?.length === 11 ? match[2] : null;
}

/**
 * Преобразует ссылку на YouTube в полный embed URL для iframe
 */
export function toYouTubeEmbed(url: string, mute: boolean = false): string {
	const id = parseYoutubeUrl(url);
	const muteParam = mute ? "1" : "0";
	return id
		? `https://www.youtube.com/embed/${id}?autoplay=1&mute=${muteParam}&loop=1&playlist=${id}`
		: url;
}

/**
 * Парсит ID видео для RuTube (возвращает хэш-строку ID)
 */
export function parseRutubeUrl(url: string): string | null {
	const text = url.trim();
	const match = text.match(
		/(?:rutube\.ru\/(?:video|embed|play\/embed)\/)([\w-]+)/i
	);
	return match ? (match[1] ?? "") : null;
}

/**
 * Парсер ID видео для Vimeo
 */
export function parseVimeoUrl(url: string): string | null {
	const match = url.match(
		/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/
	);
	return match?.[1] ?? null;
}

/**
 * Извлекает чистый iframe URL из постов ВК или кода виджетов ВК
 */
export function parseVkPostUrl(input: string): string | null {
	const text = input.trim();

	if (text.includes("VK.Widgets.Post")) {
		const match = text.match(
			/VK\.Widgets\.Post\s*\(\s*['"][^'"]+['"]\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*['"]([^'"]+)['"]/i
		);
		if (match) {
			const [, ownerId, postId, hash] = match;
			return `https://vk.com/widget_post.php?owner_id=${ownerId}&post_id=${postId}&hash=${hash}`;
		}
	}

	const wallMatch = text.match(/vk\.com\/wall(-?\d+)_(\d+)/i);
	if (wallMatch) {
		return `https://vk.com/widget_post.php?owner_id=${wallMatch[1]}&post_id=${wallMatch[2]}`;
	}

	if (text.includes("vk.com/widget_post.php")) return text;
	return null;
}

/**
 * Парсит ссылки и iframe коды ВК Видео и ВК Клипов
 */
export function parseVkVideoOrClip(
	url: string
): { oid: string; id: string; isClip: boolean } | null {
	const text = url.trim();
	const lower = text.toLowerCase();
	const isClip = lower.includes("/clip");

	// 1. Извлечение из кода готового iframe
	if (text.includes("<iframe") || text.includes("_ext.php")) {
		const oidMatch = text.match(/[?&]oid=([^&"'\s>]+)/);
		const idMatch = text.match(/[?&]id=([^&"'\s>]+)/);
		const iframeClip = lower.includes("clip_ext.php");
		if (oidMatch && idMatch) {
			return {
				oid: oidMatch[1] ?? "",
				id: idMatch[1] ?? "",
				isClip: iframeClip || isClip,
			};
		}
	}

	// 2. Прямая ссылка на Клип
	const clipMatch = text.match(
		/(?:vk\.com\/clip|vkvideo\.ru\/clip)(-?\d+)_(\d+)/i
	);
	if (clipMatch) {
		return { oid: clipMatch[1] ?? "", id: clipMatch[2] ?? "", isClip: true };
	}

	// 3. Прямая ссылка на обычное Видео
	const videoMatch = text.match(
		/(?:vk\.com\/video|vkvideo\.ru\/video)(-?\d+)_(\d+)/i
	);
	if (videoMatch) {
		return { oid: videoMatch[1] ?? "", id: videoMatch[2] ?? "", isClip: false };
	}

	return null;
}

// ── Ultimate Helper ──────────────────────────────────────────────────────────

/**
 * Универсальный хелпер для получения прямой ссылки iframe src
 */
export function getEmbedUrl(url: string): string {
	if (!url) return "";
	const type = getMediaType(url);

	switch (type) {
		case "youtube":
			return toYouTubeEmbed(url, true);
		case "vk-post":
			return parseVkPostUrl(url) || url;
		case "vk-video": {
			const parsed = parseVkVideoOrClip(url);
			if (!parsed) return url;
			return parsed.isClip
				? `https://vk.com/clip_ext.php?oid=${parsed.oid}&id=${parsed.id}&hd=2`
				: `https://vk.com/video_ext.php?oid=${parsed.oid}&id=${parsed.id}&hd=2`;
		}
		case "rutube": {
			const id = parseRutubeUrl(url);
			return id ? `https://rutube.ru/play/embed/${id}` : url;
		}
		default:
			return url.trim();
	}
}
