"use client";

import {
	CalendarIcon,
	CaretLeftIcon,
	CaretRightIcon,
	ClockIcon,
	XIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Banner } from "@/actions/admin/admin-banner-actions";
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
	DialogTitle,
	Drawer,
	DrawerContent,
} from "@/components/ui";
// Импортируем компоненты карусели и тип её API из Shadcn UI
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { EVENT_CONFIG } from "@/constants";
import { useIsMobile } from "@/hooks";
import { cn } from "@/lib/utils";

export function BannerModal({
	banner,
	onClose,
}: {
	banner: Banner;
	onClose: () => void;
}) {
	const isMobile = useIsMobile();
	const [mounted, setMounted] = useState(false);
	const [isFullView, setIsFullView] = useState(false);

	// Состояния для работы с Shadcn Carousel
	const [api, setApi] = useState<CarouselApi>();
	const [activeIndex, setActiveIndex] = useState(0);

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

	// Синхронизация внутреннего состояния Embla с реактивным стейтом активного индекса
	useEffect(() => {
		if (!api) return;

		setActiveIndex(api.selectedScrollSnap());

		api.on("select", () => {
			setActiveIndex(api.selectedScrollSnap());
		});
	}, [api]);

	// Клавиатурная навигация глобально для модалки
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (isFullView) setIsFullView(false);
				else onClose();
			}
			if (hasGallery && api) {
				if (e.key === "ArrowLeft") api.scrollPrev();
				if (e.key === "ArrowRight") api.scrollNext();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose, isFullView, hasGallery, api]);

	if (!mounted) return null;

	// ── Общий контент модального окна ─────────────────────────────────────
	const renderContent = () => (
		<div className="bg-card/60">
			{mediaItems.length > 0 && (
				<div className="relative group/media">
					{/* Контейнер карусели Shadcn с поддержкой бесконечного цикла (loop: true) */}
					<Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
						<CarouselContent>
							{mediaItems.map((item, index) => (
								<CarouselItem key={index} className="basis-full">
									<Card
										className="border-none bg-transparent shadow-none!"
										onClick={() =>
											!item.url.includes("youtube") && setIsFullView(true)
										}
									>
										<MediaBlock url={item.url} alt={banner.title} />
									</Card>
								</CarouselItem>
							))}
						</CarouselContent>
					</Carousel>

					{/* Стрелки навигации и пагинация поверх карусели */}
					{hasGallery && (
						<>
							<Button
								variant="ghost"
								onClick={(e) => {
									e.stopPropagation();
									api?.scrollPrev();
								}}
								className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/10 text-white/60 hover:bg-black/40 hover:text-white flex items-center justify-center backdrop-blur-xs shadow-lg cursor-pointer z-10"
							>
								<CaretLeftIcon size={20} weight="bold" />
							</Button>
							<Button
								variant="ghost"
								onClick={(e) => {
									e.stopPropagation();
									api?.scrollNext();
								}}
								className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/10 text-white/60 hover:bg-black/40 hover:text-white flex items-center justify-center backdrop-blur-xs shadow-lg cursor-pointer z-10"
							>
								<CaretRightIcon size={20} weight="bold" />
							</Button>

							<SliderPagination
								totalPages={mediaItems.length}
								currentPage={activeIndex}
								onPageClick={(index) => api?.scrollTo(index)}
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
									"flex shadow-primary/30 w-full items-center gap-2 px-6 py-3 rounded-full text-red-400 text-sm font-bold shadow-2xl",
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
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open onOpenChange={(open) => !open && onClose()}>
				<DrawerContent className="max-h-[96vh] rounded-t-[32px] overflow-hidden flex flex-col">
					<DialogTitle className="hidden" />
					<div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain">
						{renderContent()}
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return createPortal(
		/* Внешний оверлей — делаем его motion.div и плавно гасим opacity */
		<motion.div
			initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
			animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
			exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
			transition={{ duration: 0.2, ease: "easeInOut" }}
			className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-background/40"
			onClick={onClose}
		>
			{/* Внутреннее окно модалки */}
			<motion.div
				initial={{ opacity: 0, y: 25, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 15, scale: 0.98 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
				onClick={(e) => e.stopPropagation()}
				className="relative w-full bg-card/80 max-w-3xl max-h-[85vh] overflow-y-auto rounded-[32px] shadow-2xl no-scrollbar border border-foreground/5 mx-auto"
			>
				{renderContent()}
			</motion.div>
		</motion.div>,
		document.body
	);
}
