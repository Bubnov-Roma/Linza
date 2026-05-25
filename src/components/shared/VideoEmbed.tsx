"use client";

import { PlayCircleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
	getMediaType,
	parseRutubeUrl,
	parseVimeoUrl,
	parseVkPostUrl,
	parseVkVideoOrClip,
	parseYoutubeUrl,
} from "@/utils";

interface VideoEmbedProps {
	url: string;
	className?: string;
	thumbnail?: string | null;
}

export function VideoEmbed({ url, className, thumbnail }: VideoEmbedProps) {
	const type = getMediaType(url);
	const [isStarted, setIsStarted] = useState(!thumbnail);

	const iframeWrapperClass = cn(
		"relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-white/5",
		className
	);

	const iframeBaseProps = {
		width: "100%",
		height: "100%",
		className: "absolute inset-0 w-full h-full border-0",
		allow:
			"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen;",
	};

	// 0. Заглушка (Превью)
	if (!isStarted && thumbnail) {
		return (
			<CardContent
				className={cn("cursor-pointer group", iframeWrapperClass)}
				onClick={() => setIsStarted(true)}
			>
				<Image
					src={thumbnail}
					alt="Video preview"
					fill
					className="object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				<div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
					<PlayCircleIcon
						size={72}
						weight="fill"
						className="text-white/90 drop-shadow-xl group-hover:scale-110 transition-transform"
					/>
				</div>
			</CardContent>
		);
	}

	// 1. ВК Видео или Клип
	if (type === "vk-video") {
		const parsed = parseVkVideoOrClip(url);
		if (!parsed) return <ErrorBadge message="Не удалось извлечь ID ВК" />;

		// ИСПРАВЛЕНО: убран .html + добавлен &autoplay=1 для старта после клика
		const embedUrl = parsed.isClip
			? `https://vk.com/clip_ext.php?oid=${parsed.oid}&id=${parsed.id}&hd=2&autoplay=1`
			: `https://vk.com/video_ext.php?oid=${parsed.oid}&id=${parsed.id}&hd=2&autoplay=1`;

		return (
			<div
				className={cn(
					iframeWrapperClass,
					parsed.isClip && "aspect-9/16 max-w-100 mx-auto"
				)}
			>
				<iframe
					src={embedUrl}
					title="VK Video"
					allowFullScreen
					{...iframeBaseProps}
				/>
			</div>
		);
	}

	// 1. ВК Публикация / Пост на стене / Виджет
	if (type === "vk-post") {
		const embedSrc = parseVkPostUrl(url);
		if (!embedSrc) {
			return <ErrorBadge message="Неверный формат виджета или ссылки ВК" />;
		}

		return (
			<div className={iframeWrapperClass}>
				<iframe src={embedSrc} title="VK Post Embed" {...iframeBaseProps} />
			</div>
		);
	}

	// 2. YouTube
	if (type === "youtube") {
		const videoId = parseYoutubeUrl(url);
		if (!videoId) return <ErrorBadge message="Не удалось извлечь ID YouTube" />;

		return (
			<div className={iframeWrapperClass}>
				{/* mute=0 гарантирует звук, так как мы запускаем по клику */}
				<iframe
					src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0`}
					title="YouTube"
					{...iframeBaseProps}
				/>
			</div>
		);
	}

	// 3. Прямой медиафайл (например, из Beget S3)
	if (type === "video") {
		return (
			<div className={iframeWrapperClass}>
				<video
					src={url.trim()}
					controls
					muted
					autoPlay={isStarted}
					poster={thumbnail || undefined}
					className="w-full h-full object-contain"
				/>
			</div>
		);
	}

	// 4. RuTube
	if (type === "rutube") {
		const videoId = parseRutubeUrl(url);
		if (!videoId) {
			return <ErrorBadge message="Не удалось извлечь ID видео RuTube" />;
		}

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
		if (!videoId) {
			return <ErrorBadge message="Не удалось извлечь ID видео Vimeo" />;
		}

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

	// Заглушка, если формат не распознан
	return (
		<div className="text-xs text-muted-foreground p-4 border border-dashed rounded-xl text-center bg-muted/20">
			Превью недоступно или ссылка не поддерживается
		</div>
	);
}

function ErrorBadge({ message }: { message: string }) {
	return (
		<div className="text-xs text-red-500 font-medium p-3 border border-red-500/20 bg-red-500/5 border-dashed rounded-xl text-center">
			{message}
		</div>
	);
}
