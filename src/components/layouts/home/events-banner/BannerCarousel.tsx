"use client";

import {
	CaretLeftIcon,
	CaretRightIcon,
	PauseIcon,
	PlayIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner } from "@/actions/admin-banner-actions";
import { BannerCard } from "@/components/layouts/home/events-banner/BannerCard";
import { BannerModal } from "@/components/layouts/home/events-banner/BannerModal";
import { Button, CardContent } from "@/components/ui";
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

	// Реф для предотвращения ложных кликов по карточке во время свайпа
	const isDraggingRef = useRef(false);

	// Синхронизируем состояние автоплея из кук при первом рендере (защита от SSR гидратации)
	useEffect(() => {
		const savedPlayState = Cookies.get(`banner_playing_${variant}`);
		if (savedPlayState === "false") {
			setIsPlaying(false);
		} else if (savedPlayState === "true") {
			setIsPlaying(true);
		} else {
			setIsPlaying(banners.length > 1 && autoplayMs > 0);
		}
	}, [variant, banners.length, autoplayMs]);

	const togglePlay = useCallback(() => {
		setIsPlaying((prev) => {
			const nextState = !prev;
			Cookies.set(`banner_playing_${variant}`, String(nextState), {
				expires: 7,
			});
			return nextState;
		});
	}, [variant]);

	const prev = useCallback(
		() => setCurrent((c) => (c - 1 + banners.length) % banners.length),
		[banners.length]
	);

	const next = useCallback(
		() => setCurrent((c) => (c + 1) % banners.length),
		[banners.length]
	);

	// Логика автопрокрутки интервалом
	useEffect(() => {
		if (!isPlaying || banners.length <= 1 || !autoplayMs) return;
		const id = setInterval(next, autoplayMs);
		return () => clearInterval(id);
	}, [isPlaying, banners.length, autoplayMs, next]);

	if (banners.length === 0) return null;
	const currentBanner = banners[current];
	if (!currentBanner) return null;

	const hasNav = banners.length > 1;

	// Строгая типизация обработчика завершения свайпа без any
	const handleDragEnd = (
		_: MouseEvent | TouchEvent | PointerEvent,
		info: PanInfo
	): void => {
		const swipeThreshold = 50; // Расстояние в px, после которого свайп засчитывается
		const swipeVelocity = 200; // Скорость движения

		if (info.offset.x < -swipeThreshold || info.velocity.x < -swipeVelocity) {
			next();
		} else if (
			info.offset.x > swipeThreshold ||
			info.velocity.x > swipeVelocity
		) {
			prev();
		}

		// Небольшой таймаут, чтобы событие клика по кнопке внутри карточки не сработало сразу после свайпа
		setTimeout(() => {
			isDraggingRef.current = false;
		}, 50);
	};

	const handleCardClick = (): void => {
		if (isDraggingRef.current) return;
		setActiveBanner(currentBanner);
	};

	return (
		<div className="relative w-full h-full aspect-7/5 sm:aspect-auto min-h-50 sm:min-h-70 overflow-hidden rounded-lg group/carousel select-none">
			{/* Контейнер для анимации слайдов */}
			<div className="w-full h-full relative touch-pan-y">
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.div
						key={current}
						drag={hasNav ? "x" : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.5}
						onDragStart={() => {
							isDraggingRef.current = true;
						}}
						onDragEnd={handleDragEnd}
						initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
						animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
						exit={{ opacity: 0, scale: 1.06, filter: "blur(6px)" }}
						transition={{
							duration: 0.5,
							ease: [0.215, 0.61, 0.355, 1.0],
						}}
						className={cn(
							"w-full h-full",
							hasNav ? "cursor-grab active:cursor-grabbing" : ""
						)}
					>
						<BannerCard
							banner={currentBanner}
							onClick={handleCardClick}
							isActive={true}
							variant={variant}
							hasNav={hasNav}
						/>
					</motion.div>
				</AnimatePresence>

				{/* ── Overlay навигация ── */}
				{hasNav && (
					<CardContent
						className={cn(
							"absolute bottom-0 right-0 pl-4 pr-2 py-1 flex items-center justify-between gap-8 z-5 pointer-events-auto bg-black/10 rounded-lg m-0.5"
						)}
					>
						{/* Точки */}
						<div className="flex items-center gap-1.5 flex-wrap">
							{banners.map((_, i) => (
								<Button
									key={i}
									type="button"
									onClick={() => setCurrent(i)}
									aria-label={`Слайд ${i + 1}`}
									className={cn(
										"rounded-full transition-all duration-300 cursor-pointer p-0",
										i === current
											? "w-6 h-3 bg-white/20 hover:bg-white/80"
											: "w-3 h-3 bg-white/20 hover:bg-white/80"
									)}
								/>
							))}
						</div>

						{/* Плей/пауза + стрелки */}
						<div className="flex items-center gap-0.5 shrink-0 rounded-full">
							<Button
								variant="ghost"
								size="icon"
								type="button"
								onClick={togglePlay}
								aria-label={isPlaying ? "Пауза" : "Автопрокрутка"}
								title={
									isPlaying
										? "Остановить автопрокрутку"
										: "Включить автопрокрутку"
								}
								className="h-8 w-8 rounded-full flex items-center justify-center transition-colors text-white/20 hover:text-white/80 hover:bg-white/10"
							>
								{isPlaying ? (
									<PauseIcon size={12} weight="fill" />
								) : (
									<PlayIcon size={12} weight="fill" />
								)}
							</Button>

							<Button
								variant="ghost"
								size="icon"
								type="button"
								onClick={prev}
								aria-label="Предыдущий"
								className="h-8 w-8 rounded-full flex items-center justify-center transition-colors text-white/20 hover:text-white/80 hover:bg-white/10 text-lg font-light leading-none"
							>
								<CaretLeftIcon size={12} weight="fill" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								type="button"
								onClick={next}
								aria-label="Следующий"
								className="h-8 w-8 rounded-full flex items-center justify-center transition-colors text-white/20 hover:text-white/80 hover:bg-white/10 text-lg font-light leading-none"
							>
								<CaretRightIcon size={12} weight="fill" />
							</Button>
						</div>
					</CardContent>
				)}
			</div>

			{/* Модальное окно */}
			<AnimatePresence>
				{activeBanner && (
					<BannerModal
						banner={activeBanner}
						onClose={() => setActiveBanner(null)}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
