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
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Banner } from "@/actions/admin-banner-actions";
import {
	ClientTime,
	SimpleMarkdown,
	SliderPagination,
} from "@/components/shared";
import {
	Badge,
	Button,
	DialogTitle,
	Drawer,
	DrawerContent,
} from "@/components/ui";
import { EVENT_CONFIG } from "@/constants";
import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/utils";
import { getMediaType, toYouTubeEmbed } from "@/utils/admin-banner-helpers";

// ── Медиа-блок ───────────────────────────────────────
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
					className="absolute inset-0 w-full h-full rounded-t-3xl md:rounded-t-3xl rounded-none"
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
					className="absolute inset-0 w-full h-full object-contain rounded-t-3xl md:rounded-t-3xl rounded-none"
				/>
			</div>
		);
	}

	return (
		<div className={cn("relative w-full aspect-video", className)}>
			<Image
				src={url}
				alt={alt}
				fill
				loading="eager"
				sizes="(max-width: 768px) 100vw, 670px"
				className="object-cover sm:rounded-t-3xl rounded-none"
			/>
		</div>
	);
}

// ── Основной компонент BannerModal ───────────────────────────────────────────
export function BannerModal({
	banner,
	onClose,
}: {
	banner: Banner;
	onClose: () => void;
}) {
	const isMobile = useIsMobile();
	const [activeIndex, setActiveIndex] = useState(0);
	const [mounted, setMounted] = useState(false);

	const config =
		EVENT_CONFIG[banner.type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.info;
	const Icon = config.icon;

	useEffect(() => {
		setMounted(true);
	}, []);

	const mediaItems = useMemo(() => {
		const items: Array<{ url: string; isVideo: boolean }> = [];
		for (const img of banner.images) {
			if (img.videoUrl) {
				items.push({ url: img.videoUrl, isVideo: true });
			} else {
				items.push({ url: img.url, isVideo: false });
			}
		}
		if (items.length === 0) {
			if (banner.videoUrl) items.push({ url: banner.videoUrl, isVideo: true });
			else if (banner.imageUrl)
				items.push({ url: banner.imageUrl, isVideo: false });
		}
		return items;
	}, [banner]);

	const hasGallery = mediaItems.length > 1;
	const activeMedia = mediaItems[activeIndex];

	// Клавиатурная навигация (нужна только для десктопа)
	useEffect(() => {
		if (isMobile) return;

		const handler = (e: KeyboardEvent) => {
			// Escape — закрываем
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
			}

			// Enter — открываем целевую ссылку баннера
			if (e.key === "Enter" && banner.linkUrl) {
				e.preventDefault();
				window.open(banner.linkUrl, "_blank", "noopener,noreferrer");
			}

			// Смена слайда
			if (hasGallery) {
				if (e.key === "ArrowLeft") {
					e.preventDefault();
					setActiveIndex(
						(i) => (i - 1 + mediaItems.length) % mediaItems.length
					);
				}
				if (e.key === "ArrowRight") {
					e.preventDefault();
					setActiveIndex((i) => (i + 1) % mediaItems.length);
				}
			}
		};

		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose, hasGallery, mediaItems.length, isMobile, banner.linkUrl]);

	if (!mounted) return null;

	// ── Общий контент для Модалки и Шторки ─────────────────────────────────────
	const renderContent = () => (
		<>
			{/* Медиа-шапка */}
			{activeMedia && (
				<div className="relative">
					<MediaBlock url={activeMedia.url} alt={banner.title} />

					{hasGallery && mediaItems[activeIndex] && (
						<>
							<Button
								variant="ghost"
								onClick={() =>
									setActiveIndex(
										(i) => (i - 1 + mediaItems.length) % mediaItems.length
									)
								}
								className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/20 text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-background/60 transition-colors backdrop-blur-sm shadow-xs cursor-pointer z-10"
							>
								<CaretLeftIcon size={14} />
							</Button>
							<Button
								variant="ghost"
								onClick={() =>
									setActiveIndex((i) => (i + 1) % mediaItems.length)
								}
								className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/20 text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-background/60 transition-colors backdrop-blur-sm shadow-xs cursor-pointer z-10"
							>
								<CaretRightIcon size={14} />
							</Button>
							<SliderPagination
								totalPages={mediaItems.length}
								currentPage={activeIndex}
								onPageClick={(index) => setActiveIndex(index)}
							/>
						</>
					)}

					{hasGallery && (
						<div className="flex gap-1.5 px-4 pt-4 pb-0 overflow-x-auto no-scrollbar">
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
											<span className="text-white text-[8px] font-bold">▶</span>
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

			{/* Текстовый контент */}
			<div className="p-5 md:p-8 space-y-4">
				<div className="flex flex-col sm:flex-row w-full justify-between gap-4 items-start">
					<div className="flex flex-col space-y-2 flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<Badge className={cn(config.badge)}>
								<Icon size={11} weight="fill" />
								{config.label}
							</Badge>
							{banner.eventDate && (
								<p className="text-xs text-muted-foreground flex items-center gap-1.5">
									<CalendarIcon size={12} />
									<ClientTime iso={banner.eventDate} fmt="full-datetime" />
								</p>
							)}
						</div>

						<h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-foreground italic">
							{banner.title}
						</h2>

						{banner.subtitle && (
							<p className="text-sm text-muted-foreground font-medium">
								{banner.subtitle}
							</p>
						)}
					</div>

					{banner.linkUrl && (
						<Button
							asChild
							className="rounded-full shadow-xl shadow-primary/30 w-full sm:w-auto shrink-0"
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

				{banner.body && (
					<div className="prose-sm text-foreground/80 border-t border-foreground/5 pt-4">
						<SimpleMarkdown text={banner.body} />
					</div>
				)}
			</div>
			<Button
				type="button"
				variant="ghost"
				onClick={onClose}
				className="ml-auto cursor-pointer sticky bottom-3 inset-x-3.5 right-3 h-8 w-8 rounded-full flex items-center text-foreground/30 hover:text-foreground/60 border border-muted-foreground/10 bg-muted-foreground/10 justify-center transition-colors backdrop-blur-xs z-10"
			>
				<XIcon size={14} weight="bold" />
			</Button>
		</>
	);

	// ── DRAWER для мобильных ──────────────────────────────────────────
	if (isMobile) {
		return (
			<Drawer open={true} onOpenChange={(open) => !open && onClose()}>
				<DrawerContent className="max-h-[94vh] rounded-t-2xl flex flex-col">
					<DialogTitle />
					<div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain">
						{renderContent()}
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	// ── MODAL для десктопа ─────────────────────────────────────────────
	return createPortal(
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-80 flex items-center justify-center p-4 overscroll-none overflow-hidden"
			onClick={onClose}
		>
			<div className="absolute inset-0 bg-black/50 " />

			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 16 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 8 }}
				transition={{ type: "spring", stiffness: 400, damping: 30 }}
				onClick={(e) => e.stopPropagation()}
				className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl card-surface bg-background shadow-2xl shadow-muted-foreground/40 no-scrollbar overscroll-none"
			>
				{renderContent()}
			</motion.div>
		</motion.div>,
		document.body
	);
}
