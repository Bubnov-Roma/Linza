"use client";

import { cn } from "@/lib/utils";

// ─── ТИПЫ И ХЕЛПЕРЫ ДЛЯ ПАРСИНГА МЕДИА ────────────────────────────────────────

export type ExtendedMediaType =
	| "youtube"
	| "vk-video"
	| "vk-post"
	| "rutube"
	| "vimeo"
	| "video"
	| "image"
	| "unknown";

/**
 * Определяет тип медиа-ресурса на основе URL-адреса или строки кода виджета
 */
export function getMediaType(url: string): ExtendedMediaType {
	if (!url) return "unknown";
	const text = url.trim();

	// 1. Проверяем виджеты и посты ВК (стены)
	if (
		text.includes("VK.Widgets.Post") ||
		text.includes("vk_post_") ||
		text.includes("vk.com/wall") ||
		text.includes("vk.com/widget_post.php")
	) {
		return "vk-post";
	}

	// 2. Остальные стриминговые платформы
	if (text.includes("youtube.com") || text.includes("youtu.be"))
		return "youtube";
	if (
		text.includes("vk.com/video") ||
		text.includes("vkvideo.ru") ||
		text.includes("vk.com/video_ext.php")
	)
		return "vk-video";
	if (text.includes("rutube.ru")) return "rutube";
	if (text.includes("player.vimeo.com") || text.includes("vimeo.com"))
		return "vimeo";

	// 3. Прямые ссылки на видеофайлы и изображения
	if (/\.(mp4|webm|ogg|mov)(?:\?|$)/i.test(text)) return "video";
	if (
		/\.(jpeg|jpg|gif|png|webp|avif)(?:\?|$)/i.test(text) ||
		text.includes("i.ibb.co")
	)
		return "image";

	return "unknown";
}

/**
 * Извлекает чистый iframe URL из постов ВК или кода виджетов ВК
 */
export function parseVkPostUrl(input: string): string | null {
	const text = input.trim();

	// Код виджета ВК из конструктора
	if (text.includes("VK.Widgets.Post")) {
		const match = text.match(
			/VK\.Widgets\.Post\s*\(\s*['"][^'"]+['"]\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*['"]([^'"]+)['"]/i
		);
		if (match) {
			const [, ownerId, postId, hash] = match;
			return `https://vk.com/widget_post.php?owner_id=${ownerId}&post_id=${postId}&hash=${hash}`;
		}
	}

	// Прямая ссылка на пост со стены
	const wallMatch = text.match(/vk\.com\/wall(-?\d+)_(\d+)/i);
	if (wallMatch) {
		const [, ownerId, postId] = wallMatch;
		return `https://vk.com/widget_post.php?owner_id=${ownerId}&post_id=${postId}`;
	}

	if (text.includes("vk.com/widget_post.php")) return text;
	return null;
}

/**
 * Парсер ссылок на видео-плеер ВК (VK Видео / vkvideo.ru)
 */
export function parseVkVideoUrl(input: string): string | null {
	const text = input.trim();
	const videoMatch = text.match(/(?:vk\.com|vkvideo\.ru)\/video(-?\d+)_(\d+)/i);
	if (videoMatch) {
		return `https://vk.com/video_ext.php?oid=${videoMatch[1]}&id=${videoMatch[2]}`;
	}
	if (text.includes("vk.com/video_ext.php")) return text;
	return null;
}

/**
 * Парсер ID видео для YouTube
 */
export function parseYoutubeUrl(url: string): string | null {
	const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
	const match = url.match(regExp);
	return match && match[2]?.length === 11 ? match[2] : null;
}

/**
 * Парсер ID видео для RuTube
 */
export function parseRutubeUrl(url: string): string | null {
	const match = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/);
	if (match === null || match[1] === undefined) return null;
	return match ? match[1] : null;
}

/**
 * Парсер ID видео для Vimeo
 */
export function parseVimeoUrl(url: string): string | null {
	const match = url.match(
		/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/
	);
	if (match === null || match[1] === undefined) return null;
	return match ? match[1] : null;
}

// ─── КОМПОНЕНТ ПЛЕЕРА VIDEOEMBED ─────────────────────────────────────────────

interface VideoEmbedProps {
	url: string;
	className?: string;
}

export function VideoEmbed({ url, className }: VideoEmbedProps) {
	const type = getMediaType(url);

	// Контейнер-обертка для всех iframe, сохраняющий пропорции 16:9
	const iframeWrapperClass = cn(
		"relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-white/5",
		className
	);

	const iframeBaseProps = {
		width: "100%",
		height: "100%",
		className: "absolute inset-0 w-full h-full border-0",
		allowTransparency: true,
		allow:
			"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen;",
	};

	// 1. ВК Публикация / Пост на стене / Виджет
	if (type === "vk-post") {
		const embedSrc = parseVkPostUrl(url);
		if (!embedSrc)
			return <ErrorBadge message="Неверный формат виджета или ссылки ВК" />;

		return (
			<div className={iframeWrapperClass}>
				<iframe
					src={embedSrc}
					title="VK Post Embed"
					scrolling="no"
					{...iframeBaseProps}
				/>
			</div>
		);
	}

	// 2. ВК Видео (Плеер)
	if (type === "vk-video") {
		const embedSrc = parseVkVideoUrl(url);
		if (!embedSrc)
			return <ErrorBadge message="Неверный формат ссылки VK Видео" />;

		return (
			<div className={iframeWrapperClass}>
				<iframe src={embedSrc} title="VK Video Player" {...iframeBaseProps} />
			</div>
		);
	}

	// 3. YouTube
	if (type === "youtube") {
		const videoId = parseYoutubeUrl(url);
		if (!videoId)
			return <ErrorBadge message="Не удалось извлечь ID видео YouTube" />;

		return (
			<div className={iframeWrapperClass}>
				<iframe
					src={`https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0`}
					title="YouTube Video Player"
					{...iframeBaseProps}
				/>
			</div>
		);
	}

	// 4. RuTube
	if (type === "rutube") {
		const videoId = parseRutubeUrl(url);
		if (!videoId)
			return <ErrorBadge message="Не удалось извлечь ID видео RuTube" />;

		return (
			<div className={iframeWrapperClass}>
				<iframe
					src={`https://rutube.ru/play/embed/${videoId}`}
					title="RuTube Video Player"
					{...iframeBaseProps}
				/>
			</div>
		);
	}

	// 5. Vimeo
	if (type === "vimeo") {
		const videoId = parseVimeoUrl(url);
		if (!videoId)
			return <ErrorBadge message="Не удалось извлечь ID видео Vimeo" />;

		return (
			<div className={iframeWrapperClass}>
				<iframe
					src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0`}
					title="Vimeo Video Player"
					{...iframeBaseProps}
				/>
			</div>
		);
	}

	// 6. Прямой медиафайл (например, из облака Beget S3)
	if (type === "video") {
		return (
			<div
				className={cn(
					"relative w-full rounded-xl overflow-hidden bg-black",
					className
				)}
			>
				<video
					src={url.trim()}
					controls
					muted
					preload="metadata"
					className="w-full aspect-video object-contain"
				/>
			</div>
		);
	}

	// Заглушка, если формат не распознан
	return (
		<div className="text-xs text-muted-foreground p-4 border border-dashed rounded-xl text-center bg-muted/20">
			Превью недоступно или ссылка не поддерживается
		</div>
	);
}

// Вспомогательный минорный компонент для вывода ошибок парсинга
function ErrorBadge({ message }: { message: string }) {
	return (
		<div className="text-xs text-red-500 font-medium p-3 border border-red-500/20 bg-red-500/5 border-dashed rounded-xl text-center">
			{message}
		</div>
	);
}
