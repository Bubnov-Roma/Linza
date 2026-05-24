/**
 * Преобразует обычную ссылку на видео (YouTube, VK, RuTube, Vimeo, Reddit) в embed-ссылку для iframe.
 */

export type ExtendedMediaType =
	| "youtube"
	| "vk-video"
	| "vk-post"
	| "rutube"
	| "vimeo"
	| "video"
	| "image"
	| "unknown";

export function getMediaType(url: string): ExtendedMediaType {
	if (!url) return "unknown";
	const text = url.trim();

	// Определяем, если подсунули скрипт виджета ВК или ссылку на стену
	if (
		text.includes("VK.Widgets.Post") ||
		text.includes("vk_post_") ||
		text.includes("vk.com/wall") ||
		text.includes("vk.com/widget_post.php")
	) {
		return "vk-post";
	}

	if (text.includes("youtube.com") || text.includes("youtu.be"))
		return "youtube";
	if (text.includes("vk.com/video") || text.includes("vkvideo.ru"))
		return "vk-video";
	if (text.includes("rutube.ru")) return "rutube";
	if (text.includes("player.vimeo.com") || text.includes("vimeo.com"))
		return "vimeo";

	if (/\.(mp4|webm|ogg|mov)(?:\?|$)/i.test(text)) return "video";
	if (
		/\.(jpeg|jpg|gif|png|webp|avif)(?:\?|$)/i.test(text) ||
		text.includes("i.ibb.co")
	)
		return "image";

	return "unknown";
}

export function parseVkUrl(input: string): string | null {
	const text = input.trim();

	// 1. Парсим код виджета (если скопировали весь скрипт)
	// Ищет параметры: VK.Widgets.Post("id", owner_id, post_id, 'hash')
	if (text.includes("VK.Widgets.Post")) {
		const match = text.match(
			/VK\.Widgets\.Post\s*\(\s*['"][^'"]+['"]\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*['"]([^'"]+)['"]/i
		);
		if (match) {
			const [, ownerId, postId, hash] = match;
			return `https://vk.com/widget_post.php?owner_id=${ownerId}&post_id=${postId}&hash=${hash}`;
		}
	}

	// 2. Парсим обычную прямую ссылку на пост со стены
	// Пример: https://vk.com/wall-195519707_235
	const wallMatch = text.match(/vk\.com\/wall(-?\d+)_(\d+)/i);
	if (wallMatch) {
		const [, ownerId, postId] = wallMatch;
		// Для открытых публичных сообществ пост откроется в iframe даже без hash параметров
		return `https://vk.com/widget_post.php?owner_id=${ownerId}&post_id=${postId}`;
	}

	// 3. Если это прямая ссылка на видео ВК (не пост, а плеер)
	const videoMatch = text.match(/(?:vk\.com|vkvideo\.ru)\/video(-?\d+)_(\d+)/i);
	if (videoMatch) {
		return `https://vk.com/video_ext.php?oid=${videoMatch[1]}&id=${videoMatch[2]}`;
	}

	// 4. Если пользователь уже передал готовый iframe урл
	if (
		text.includes("vk.com/widget_post.php") ||
		text.includes("vk.com/video_ext.php")
	) {
		return text;
	}

	return null;
}

/**
 * Проверяет, является ли ссылка прямым файлом видео (например, из S3).
 */
export function isVideoFileUrl(url: string): boolean {
	if (!url) return false;
	return /\.(mp4|webm|ogv|mov|avi)(?:\?.*)?$/i.test(url);
}
