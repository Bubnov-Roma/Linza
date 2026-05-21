"use client";

import {
	CalendarIcon,
	CaretLeftIcon,
	CaretRightIcon,
	XIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Banner } from "@/actions/admin-banner-actions";
import { ClientTime, SimpleMarkdown } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import { EVENT_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";
import { getMediaType, toYouTubeEmbed } from "@/utils/admin-banner-helpers";

// ── Медиа-блок ────────────────────────────────────────────────────────────────

function MediaBlock({
	url,
	alt,
	className,
}: {
	url: string;
	alt: string;
	className?: string;
}) {
	const type = getMediaType(url);

	if (type === "youtube") {
		return (
			<div className={cn("relative w-full aspect-video", className)}>
				<iframe
					src={toYouTubeEmbed(url)}
					title={alt}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="absolute inset-0 w-full h-full rounded-t-3xl"
				/>
			</div>
		);
	}

	if (type === "video") {
		return (
			<div className={cn("relative w-full aspect-video bg-black", className)}>
				<video
					src={url}
					controls
					autoPlay
					muted
					playsInline
					className="absolute inset-0 w-full h-full object-contain rounded-t-3xl"
				/>
			</div>
		);
	}

	// image
	return (
		<div className={cn("relative w-full aspect-video", className)}>
			<Image
				src={url}
				alt={alt}
				fill
				loading="eager"
				sizes="(max-width: 768px) 100vw, 670px"
				className="object-cover rounded-t-3xl"
			/>
			{/* <div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent rounded-t-3xl" /> */}
		</div>
	);
}

// ── BannerModal ───────────────────────────────────────────────────────────────

export function BannerModal({
	banner,
	onClose,
}: {
	banner: Banner;
	onClose: () => void;
}) {
	const config =
		EVENT_CONFIG[banner.type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.info;
	const Icon = config.icon;

	// Галерея: собираем все медиа-элементы (images + основной videoUrl баннера)
	const mediaItems: Array<{ url: string; isVideo: boolean }> = [];

	// Изображения/видео из gallery
	for (const img of banner.images) {
		if (img.videoUrl) {
			mediaItems.push({ url: img.videoUrl, isVideo: true });
		} else {
			mediaItems.push({ url: img.url, isVideo: false });
		}
	}

	if (mediaItems.length === 0) {
		// Если галерея пуста — показываем главный imageUrl или videoUrl
		if (banner.videoUrl) {
			mediaItems.push({ url: banner.videoUrl, isVideo: true });
		} else if (banner.imageUrl) {
			mediaItems.push({ url: banner.imageUrl, isVideo: false });
		}
	}

	const [activeIndex, setActiveIndex] = useState(0);

	const [mounted, setMounted] = useState(false);

	const hasGallery = mediaItems.length > 1;
	const activeMedia = mediaItems[activeIndex];

	useEffect(() => {
		setMounted(true);
	}, []);

	// Клавиатурная навигация
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft" && hasGallery)
				setActiveIndex((i) => (i - 1 + mediaItems.length) % mediaItems.length);
			if (e.key === "ArrowRight" && hasGallery)
				setActiveIndex((i) => (i + 1) % mediaItems.length);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose, hasGallery, mediaItems.length]);

	if (!mounted) return null;

	return createPortal(
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-80 flex items-center justify-center p-0 sm:p-4 overscroll-none overflow-hidden"
			onClick={onClose}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 16 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 8 }}
				transition={{ type: "spring", stiffness: 400, damping: 30 }}
				onClick={(e) => e.stopPropagation()}
				className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl card-surface bg-background/90 shadow-2xl shadow-muted-foreground/40 no-scrollbar overscroll-none overflow-hidden"
			>
				{/* Медиа-шапка */}
				{activeMedia && (
					<div className="relative">
						<MediaBlock url={activeMedia.url} alt={banner.title} />

						{/* Навигация по галерее */}
						{hasGallery && (
							<>
								<button
									type="button"
									onClick={() =>
										setActiveIndex(
											(i) => (i - 1 + mediaItems.length) % mediaItems.length
										)
									}
									className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/20 text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-background/60 transition-colors backdrop-blur-sm shadow-xs cursor-pointer"
								>
									<CaretLeftIcon size={14} />
								</button>
								<button
									type="button"
									onClick={() =>
										setActiveIndex((i) => (i + 1) % mediaItems.length)
									}
									className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/20 text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-background/60 transition-colors backdrop-blur-sm shadow-xs cursor-pointer"
								>
									<CaretRightIcon size={14} />
								</button>

								{/* Точки */}
								<div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
									{mediaItems.map((_, i) => (
										<button
											key={i}
											type="button"
											onClick={() => setActiveIndex(i)}
											className={cn(
												"cursor-pointer rounded-full transition-all duration-300 p-1 scale-100 hover:scale-135",
												i === activeIndex
													? "w-5 h-1.5 bg-foreground"
													: "w-1.5 h-1.5 bg-foreground/40 hover:bg-foreground/60"
											)}
										/>
									))}
								</div>
							</>
						)}

						{/* Превью галереи (мини-стрип) */}
						{hasGallery && (
							<div className="flex gap-1.5 px-4 pt-2 pb-0 overflow-x-auto no-scrollbar">
								{mediaItems.map((item, i) => (
									<button
										key={i}
										type="button"
										onClick={() => setActiveIndex(i)}
										className={cn(
											"relative shrink-0 w-12 h-9 rounded-lg overflow-hidden border-2 transition-all",
											i === activeIndex
												? "border-primary"
												: "border-transparent opacity-60 hover:opacity-90"
										)}
									>
										{item.isVideo ? (
											<div className="w-full h-full bg-black/60 flex items-center justify-center">
												<span className="text-white text-[8px] font-bold">
													▶
												</span>
											</div>
										) : (
											<Image
												src={item.url}
												alt={`фото ${i + 1}`}
												fill
												sizes="48px"
												className="object-cover"
											/>
										)}
									</button>
								))}
							</div>
						)}
					</div>
				)}

				{/* Контент */}
				<div className="p-5 md:p-8 space-y-3">
					<div className="flex w-full justify-between">
						<div className="flex flex-col space-y-3 flex-1">
							{banner.eventDate && (
								<>
									{/* Бейдж типа */}
									<Badge className={cn(config.badge)}>
										<Icon size={11} weight="fill" />
										{config.label}
									</Badge>

									{/* Дата события */}
									<p className="text-xs text-muted-foreground flex items-center gap-1.5">
										<CalendarIcon size={12} />
										<ClientTime iso={banner.eventDate} fmt="full-datetime" />
									</p>
								</>
							)}

							{/* Заголовок */}
							<h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-foreground italic">
								{banner.title}
							</h2>

							{/* Подзаголовок */}
							{banner.subtitle && (
								<p className="text-sm text-muted-foreground font-medium">
									{banner.subtitle}
								</p>
							)}
						</div>
						{/* CTA */}
						{banner.linkUrl && (
							<Button
								asChild
								className="rounded-full shadow-xl shadow-primary/30"
								size="xl"
							>
								<Link
									href={banner.linkUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									{banner.linkLabel ?? "Подробнее"}
								</Link>
							</Button>
						)}
					</div>
					{/* Тело (Markdown) */}
					{banner.body && (
						<div className="prose-sm text-foreground/80 border-t border-foreground/5 pt-4">
							<SimpleMarkdown text={banner.body} />
						</div>
					)}
				</div>

				{/* Кнопка закрытия */}
				<Button
					type="button"
					variant="ghost"
					onClick={onClose}
					className="ml-auto cursor-pointer sticky bottom-3 inset-x-3.5 right-2 h-8 w-8 rounded-full flex items-center text-foreground/30 hover:text-foreground/60 border border-muted-foreground/10 bg-muted-foreground/10 justify-center transition-colors backdrop-blur-xs z-10"
				>
					<XIcon size={14} weight="bold" />
				</Button>
			</motion.div>
		</motion.div>,
		document.body
	);
}
