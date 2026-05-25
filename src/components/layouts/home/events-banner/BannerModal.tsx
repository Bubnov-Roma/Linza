"use client";

import {
	CalendarIcon,
	CaretLeftIcon,
	CaretRightIcon,
	ClockIcon,
	CornersOutIcon,
	XIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Banner } from "@/actions/admin-banner-actions";
import { MediaBlock } from "@/components/layouts/home/events-banner/MediaBlock";
import {
	ClientTime,
	SimpleMarkdown,
	SliderPagination,
} from "@/components/shared";
import {
	Badge,
	Button,
	Card,
	Dialog,
	DialogContent,
	DialogTitle,
	Drawer,
	DrawerContent,
} from "@/components/ui";
import { EVENT_CONFIG } from "@/constants";
import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/utils";

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
	const [isFullView, setIsFullView] = useState(false);

	const config =
		EVENT_CONFIG[banner.type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.info;
	const Icon = config.icon;

	useEffect(() => setMounted(true), []);

	// Проверка на истечение срока
	const isExpired = useMemo(() => {
		if (!banner.eventDate) return false;
		return new Date(banner.eventDate) < new Date();
	}, [banner.eventDate]);

	const mediaItems = useMemo(() => {
		const items: Array<{ url: string; isVideo: boolean }> = [];
		for (const img of banner.images) {
			items.push({ url: img.videoUrl || img.url, isVideo: !!img.videoUrl });
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

	// Клавиатурная навигация
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (isFullView) setIsFullView(false);
				else onClose();
			}
			if (hasGallery && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
				setActiveIndex((i) =>
					e.key === "ArrowLeft"
						? (i - 1 + mediaItems.length) % mediaItems.length
						: (i + 1) % mediaItems.length
				);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose, isFullView, hasGallery, mediaItems.length]);

	if (!mounted) return null;

	const nextSlide = (e: React.MouseEvent) => {
		e.stopPropagation();
		setActiveIndex((i) => (i + 1) % mediaItems.length);
	};

	const prevSlide = (e: React.MouseEvent) => {
		e.stopPropagation();
		setActiveIndex((i) => (i - 1 + mediaItems.length) % mediaItems.length);
	};

	// ── Общий контент модального окна ─────────────────────────────────────
	const renderContent = () => (
		<>
			{activeMedia && (
				<div className="relative group/media">
					<Card
						className="cursor-zoom-in border-none bg-transparent shadow-none"
						onClick={() =>
							!activeMedia.url.includes("youtube") && setIsFullView(true)
						}
					>
						<MediaBlock url={activeMedia.url} alt={banner.title} />
					</Card>

					{/* Индикатор возможности расширения */}
					{!activeMedia.url.includes("youtube") && (
						<div className="absolute top-4 right-4 opacity-0 group-hover/media:opacity-100 transition-opacity pointer-events-none">
							<div className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white">
								<CornersOutIcon size={20} />
							</div>
						</div>
					)}

					{hasGallery && (
						<>
							<Button
								variant="ghost"
								onClick={prevSlide}
								className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 text-white hover:bg-black/40 flex items-center justify-center backdrop-blur-sm shadow-lg cursor-pointer z-10"
							>
								<CaretLeftIcon size={20} weight="bold" />
							</Button>
							<Button
								variant="ghost"
								onClick={nextSlide}
								className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 text-white hover:bg-black/40 flex items-center justify-center backdrop-blur-sm shadow-lg cursor-pointer z-10"
							>
								<CaretRightIcon size={20} weight="bold" />
							</Button>
							<SliderPagination
								totalPages={mediaItems.length}
								currentPage={activeIndex}
								onPageClick={setActiveIndex}
							/>
						</>
					)}
				</div>
			)}

			<div className="p-6 md:p-8 space-y-6">
				<div className="flex flex-col md:flex-row justify-between gap-6 items-start">
					<div className="space-y-3 flex-1">
						<div className="flex items-center gap-2 flex-wrap">
							<Badge className={cn("px-3 py-1 text-[10px]", config.badge)}>
								<Icon size={12} weight="fill" />
								{config.label}
							</Badge>
							{banner.eventDate && (
								<div
									className={cn(
										"text-xs flex items-center gap-1.5 font-bold",
										isExpired ? "text-red-400" : "text-muted-foreground"
									)}
								>
									<CalendarIcon size={14} />
									<ClientTime iso={banner.eventDate} fmt="full-datetime" />
								</div>
							)}
						</div>

						<h2 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-none">
							{banner.title}
						</h2>
						{banner.subtitle && (
							<p className="text-muted-foreground font-medium">
								{banner.subtitle}
							</p>
						)}
					</div>

					{banner.linkUrl && (
						<div className="w-full md:w-auto shrink-0">
							<Button
								asChild
								variant="outline"
								className={cn(
									"flex  shadow-primary/30 w-full items-center gap-2 px-6 py-3 rounded-full text-red-400 text-sm font-bold shadow-2xl",
									config.shadow,
									config.badge
								)}
								size="xl"
							>
								{isExpired ? (
									<div>
										<ClockIcon size={16} weight="bold" />
										{banner.type === "event"
											? "Событие уже прошло"
											: banner.type === "promo"
												? "Акция закончилась"
												: "Новость устарела"}
									</div>
								) : (
									<Link
										href={banner.linkUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										{banner.linkLabel ?? "Подробнее"}
									</Link>
								)}
							</Button>
						</div>
					)}
				</div>

				{banner.body && (
					<div className="prose-sm text-foreground/90 border-t border-foreground/5 pt-6 leading-relaxed">
						<SimpleMarkdown text={banner.body} />
					</div>
				)}
			</div>

			<Button
				type="button"
				variant="ghost"
				onClick={onClose}
				className="ml-auto sticky bottom-3 right-3 rounded-full flex items-center text-foreground/30 hover:text-foreground/60 border border-muted-foreground/10 bg-muted-foreground/10 justify-center transition-colors backdrop-blur-xs z-10"
			>
				<XIcon size={18} weight="bold" />
			</Button>
		</>
	);

	const fullscreenDialog = (
		<Dialog open={isFullView} onOpenChange={setIsFullView}>
			<DialogContent
				className="max-w-none w-100vw h-screen p-0 m-0 bg-black/95 border-none rounded-none flex items-center justify-center z-150 shadow-none [&>button]:hidden outline-none pointer-events-auto"
				overlayClassName="z-[100] backdrop-blur-md bg-black/40"
				onClick={() => setIsFullView(false)}
			>
				<DialogTitle className="hidden">Просмотр медиа</DialogTitle>
				{activeMedia && (
					<div className="relative w-full h-full flex items-center justify-center p-4 md:p-10 cursor-zoom-out">
						<MediaBlock
							url={activeMedia.url}
							alt={banner.title}
							isFull={true}
						/>

						{hasGallery && (
							<div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
								<Button
									onClick={prevSlide}
									className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white pointer-events-auto backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl"
								>
									<CaretLeftIcon size={24} weight="bold" />
								</Button>
								<Button
									onClick={nextSlide}
									className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white pointer-events-auto backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl"
								>
									<CaretRightIcon size={24} weight="bold" />
								</Button>
							</div>
						)}

						<Button
							className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-white/5 hover:bg-white/20 text-white backdrop-blur-md z-50 flex items-center justify-center border border-white/5 shadow-xl"
							onClick={() => setIsFullView(false)}
						>
							<XIcon size={24} />
						</Button>

						<div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs font-mono bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
							{activeIndex + 1} / {mediaItems.length}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);

	if (isMobile) {
		return (
			<>
				<Drawer open onOpenChange={(open) => !open && onClose()}>
					<DrawerContent className="max-h-[96vh] rounded-t-[32px] overflow-hidden flex flex-col">
						<DialogTitle className="hidden" />
						<div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain">
							{renderContent()}
						</div>
					</DrawerContent>
				</Drawer>
				{fullscreenDialog}
			</>
		);
	}

	return createPortal(
		<>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			>
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, scale: 0.98 }}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
					onClick={(e) => e.stopPropagation()}
					className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-background shadow-2xl no-scrollbar border border-foreground/5"
				>
					{renderContent()}
				</motion.div>
			</motion.div>
			{fullscreenDialog}
		</>,
		document.body
	);
}
