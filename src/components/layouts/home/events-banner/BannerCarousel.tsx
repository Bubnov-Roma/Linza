"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner } from "@/actions/admin-banner-actions";
import { BannerCard } from "@/components/layouts/home/events-banner/BannerCard";
import { BannerModal } from "@/components/layouts/home/events-banner/BannerModal";
import { Button, Card, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

interface BannerCarouselProps {
	banners: Banner[];
	variant?: "hero" | "studio";
	autoplayMs?: number;
}

export function BannerCarousel({
	banners,
	variant = "hero",
	autoplayMs = 7000,
}: BannerCarouselProps) {
	const [current, setCurrent] = useState(0);
	const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
	const [isPlaying, setIsPlaying] = useState(true);

	const isDraggingRef = useRef(false);
	const hasNav = banners.length > 1;

	const next = useCallback(
		() => setCurrent((c) => (c + 1) % banners.length),
		[banners.length]
	);

	const prev = useCallback(
		() => setCurrent((c) => (c - 1 + banners.length) % banners.length),
		[banners.length]
	);

	// Логика автоплея
	useEffect(() => {
		if (!isPlaying || !hasNav || !autoplayMs) return;
		const id = setInterval(next, autoplayMs);
		return () => clearInterval(id);
	}, [isPlaying, hasNav, autoplayMs, next]);

	if (banners.length === 0) return null;
	const currentBanner = banners[current];

	if (!currentBanner) return null;

	const handleDragEnd = (
		_: MouseEvent | TouchEvent | PointerEvent,
		info: PanInfo
	): void => {
		const swipeThreshold = 50;
		if (info.offset.x < -swipeThreshold) next();
		else if (info.offset.x > swipeThreshold) prev();

		setTimeout(() => {
			isDraggingRef.current = false;
		}, 50);
	};

	return (
		<Card
			className={cn(
				"relative w-full h-full aspect-16/10 lg:aspect-7/5 overflow-hidden rounded-2xl select-none shadow-xs group/carousel"
			)}
			onMouseEnter={() => setIsPlaying(false)} // Пауза при наведении (очень удобно для пользователя)
			onMouseLeave={() => setIsPlaying(true)}
		>
			{/* Стрелки навигации — появляются только при ховере в стиле Telegram desktop */}
			{hasNav && (
				<>
					<Button
						type="button"
						onClick={prev}
						className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 transform group-hover/carousel:translate-x-0 -translate-x-2"
					>
						<CaretLeftIcon size={18} weight="bold" />
					</Button>
					<Button
						type="button"
						onClick={next}
						className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 transform group-hover/carousel:translate-x-0 translate-x-2"
					>
						<CaretRightIcon size={18} weight="bold" />
					</Button>
				</>
			)}

			{/* Контейнер слайдов */}
			<div className="w-full h-full relative touch-pan-y">
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.div
						key={current}
						drag={hasNav ? "x" : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.2}
						onDragStart={() => {
							isDraggingRef.current = true;
						}}
						onDragEnd={handleDragEnd}
						initial={{ opacity: 0, x: 40 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -40 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className={cn(
							"w-full h-full",
							hasNav && "cursor-grab active:cursor-grabbing"
						)}
					>
						<BannerCard
							banner={currentBanner}
							onClick={() =>
								!isDraggingRef.current && setActiveBanner(currentBanner)
							}
							isActive={true}
							variant={variant}
							hasNav={false} // Навигацию вынесли наружу карты
						/>
					</motion.div>
				</AnimatePresence>
			</div>

			{/* ── Линейный Прогресс-бар (Стиль Stories) ── */}
			{hasNav && (
				<div className="absolute bottom-4 inset-x-6 z-20 flex gap-1.5 px-1">
					{banners.map((_, i) => (
						<Label
							key={i}
							onClick={() => setCurrent(i)}
							className="h-1 flex-1 min-w-4 rounded-full bg-white/10 backdrop-blur-xs overflow-hidden cursor-pointer relative"
						>
							{/* Полоска прогресса */}
							{i === current && (
								<motion.div
									initial={{ width: "0%" }}
									animate={isPlaying ? { width: "100%" } : { width: "100%" }}
									// Если стоит на паузе из-за ховера, сохраняем текущее или делаем плавную анимацию
									transition={{
										duration: autoplayMs / 1000,
										ease: "linear",
									}}
									className="absolute inset-y-0 left-0 bg-white/50 rounded-full"
								/>
							)}
							{/* Если слайд уже пройден */}
							{i < current && (
								<div className="absolute inset-0 bg-white/30  rounded-full" />
							)}
						</Label>
					))}
				</div>
			)}

			{/* Модалка */}
			<AnimatePresence>
				{activeBanner && (
					<BannerModal
						banner={activeBanner}
						onClose={() => setActiveBanner(null)}
					/>
				)}
			</AnimatePresence>
		</Card>
	);
}
