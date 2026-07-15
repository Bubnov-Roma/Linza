"use client";

import {
	CaretLeftIcon,
	CaretRightIcon,
	PauseIcon,
	PlayIcon,
} from "@phosphor-icons/react";
import {
	AnimatePresence,
	animate,
	motion,
	type PanInfo,
	useMotionValue,
	useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner } from "@/actions/admin/admin-banner-actions";
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

	// Глобальное разрешение на автоплей (из localStorage)
	const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
	// Флаг наведения мыши для временной паузы
	const [isHovered, setIsHovered] = useState(false);

	const isDraggingRef = useRef(false);
	const hasNav = banners.length > 1;

	// Инициализация состояния из localStorage после монтирования на клиенте
	useEffect(() => {
		const saved = localStorage.getItem("banner-carousel-autoplay");
		if (saved !== null) {
			setIsAutoplayEnabled(saved === "true");
		}
	}, []);

	// Вычисляемое состояние активного воспроизведения
	const isPlaying = isAutoplayEnabled && !isHovered;

	const next = useCallback(
		() => setCurrent((c) => (c + 1) % banners.length),
		[banners.length]
	);

	const prev = useCallback(
		() => setCurrent((c) => (c - 1 + banners.length) % banners.length),
		[banners.length]
	);

	// ── Новая точная логика прогресс-бара и автоплея ──
	const progress = useMotionValue(0);
	const widthTransform = useTransform(progress, (v) => `${v}%`);
	const lastCurrentRef = useRef(current);

	useEffect(() => {
		// Если слайд переключился (вручную кнопкой или автоматически) — сбрасываем прогресс в ноль
		if (lastCurrentRef.current !== current) {
			progress.set(0);
			lastCurrentRef.current = current;
		}

		if (!isPlaying || !hasNav || !autoplayMs) return;

		// Вычисляем сколько процентов осталось заполнить и пропорционально уменьшаем оставшееся время
		const remainingPercent = 100 - progress.get();
		const remainingTime = (autoplayMs * remainingPercent) / 100 / 1000;

		// Запускаем контролируемую анимацию числового значения от текущего до 100
		const controls = animate(progress, 100, {
			duration: remainingTime,
			ease: "linear",
			onComplete: next, // По окончании полосы переключаем на следующий слайд
		});

		// При размонтировании эффекта (пауза, ховер или смена слайда)controls.stop()
		// останавливает анимацию прямо на текущем кадре, сохраняя значение в progress
		return () => controls.stop();
	}, [isPlaying, current, autoplayMs, next, hasNav, progress]);

	if (banners.length === 0) return null;
	const currentBanner = banners[current];

	if (!currentBanner) return null;

	const toggleAutoplay = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsAutoplayEnabled((prev) => {
			const nextValue = !prev;
			localStorage.setItem("banner-carousel-autoplay", String(nextValue));
			return nextValue;
		});
	};

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
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Стрелки навигации */}
			{hasNav && (
				<>
					<Button
						size="icon"
						onClick={prev}
						className="absolute left-1 top-1/2 -translate-y-1/2 z-25 rounded-full bg-black/5 hover:bg-black/20 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 transform group-hover/carousel:translate-x-0 -translate-x-2"
					>
						<CaretLeftIcon size={18} weight="bold" />
					</Button>
					<Button
						size="icon"
						onClick={next}
						className="absolute right-1 top-1/2 -translate-y-1/2 z-25 rounded-full bg-black/5 hover:bg-black/20 text-white backdrop-blur-xs flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 transform group-hover/carousel:translate-x-0 translate-x-2"
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
							hasNav={false}
						/>
					</motion.div>
				</AnimatePresence>
			</div>

			{/* ── Линейный Прогресс-бар (Стиль Stories вверху) ── */}
			{hasNav && (
				<div className="absolute top-1 inset-x-4 z-10 flex gap-1.5 px-1">
					{banners.map((_, i) => (
						<Label
							key={i}
							onClick={() => setCurrent(i)}
							className="h-0.5 flex-1 min-w-4 rounded-full bg-white/10 backdrop-blur-xs overflow-hidden cursor-pointer relative"
						>
							{/* Полоска прогресса текущего слайда */}
							{i === current ? (
								<motion.div
									style={{ width: widthTransform }}
									className="absolute inset-y-0 left-0 bg-white/50 rounded-full"
								/>
							) : i < current ? (
								/* Если слайд уже пройден */
								<div className="absolute inset-0 bg-white/40 rounded-full" />
							) : null}
						</Label>
					))}
				</div>
			)}

			{/* ── Кнопка Стоп / Плей в правом нижнем углу ── */}
			{hasNav && (
				<Button
					size="icon"
					onClick={toggleAutoplay}
					className="absolute right-3 bottom-3 z-25 h-7 w-7 rounded-full bg-black/10 text-white/60 hover:bg-black/40 hover:text-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 shadow-xs border border-white/5 cursor-pointer opacity-40 group-hover/carousel:opacity-100"
					title={
						isAutoplayEnabled
							? "Поставить автовоспроизведение на паузу"
							: "Включить автовоспроизведение"
					}
				>
					{isAutoplayEnabled ? (
						<PauseIcon size={12} weight="fill" />
					) : (
						<PlayIcon size={12} weight="fill" />
					)}
				</Button>
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
