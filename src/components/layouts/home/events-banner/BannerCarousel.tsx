"use client";

import {
	CaretLeftIcon,
	CaretRightIcon,
	PauseIcon,
	PlayIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";
import { useCallback, useEffect, useState } from "react";
import type { Banner } from "@/actions/admin-banner-actions";
import { BannerCard } from "@/components/layouts/home/events-banner/BannerCard";
import { BannerModal } from "@/components/layouts/home/events-banner/BannerModal";
import { Button, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

interface BannerCarouselProps {
	banners: Banner[];
	variant?: "hero" | "studio";
	autoplayMs?: number;
	initialIsPlaying?: boolean;
}

export function BannerCarousel({
	banners,
	variant = "hero",
	autoplayMs = 7000,
	initialIsPlaying,
}: BannerCarouselProps) {
	const [current, setCurrent] = useState(0);
	const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
	const [isPlaying, setIsPlaying] = useState(
		initialIsPlaying !== undefined ? initialIsPlaying : autoplayMs > 0
	);

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

	useEffect(() => {
		if (!isPlaying || banners.length <= 1 || !autoplayMs) return;
		const id = setInterval(next, autoplayMs);
		return () => clearInterval(id);
	}, [isPlaying, banners.length, autoplayMs, next]);

	if (banners.length === 0) return null;
	const currentBanner = banners[current];
	if (!currentBanner) return null;

	const hasNav = banners.length > 1;

	return (
		<div className="relative w-full h-full aspect-7/5 sm:aspect-auto min-h-70 overflow-hidden rounded-2xl group/carousel">
			{/* Контейнер для анимации слайдов */}
			<div className="w-full h-full relative">
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.div
						key={current}
						initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
						animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
						exit={{ opacity: 0, scale: 1.06, filter: "blur(6px)" }}
						transition={{
							duration: 0.6,
							ease: [0.215, 0.61, 0.355, 1.0],
						}}
						className="w-full h-full"
					>
						<BannerCard
							banner={currentBanner}
							onClick={() => setActiveBanner(currentBanner)}
							isActive={true}
							variant={variant}
							hasNav={hasNav}
						/>
					</motion.div>
				</AnimatePresence>
			</div>

			{/* ── Overlay навигация ── */}
			{hasNav && (
				<CardContent
					className={cn(
						"absolute bottom-0 inset-x-0 px-5 py-3 flex items-center justify-between gap-2 z-20 pointer-events-auto",
						"bg-linear-to-t from-black/45 via-black/20 to-transparent"
					)}
				>
					{/* Точки */}
					<div className="flex items-center gap-1.5 flex-wrap">
						{banners.map((_, i) => (
							<button
								key={i}
								type="button"
								onClick={() => setCurrent(i)}
								aria-label={`Слайд ${i + 1}`}
								className={cn(
									"rounded-full transition-all duration-300 cursor-pointer",
									i === current
										? "w-6 h-3 bg-white/90"
										: "w-3 h-3 bg-white/40 hover:bg-white/70"
								)}
							/>
						))}
					</div>

					{/* Плей/пауза + стрелки */}
					<div className="flex items-center gap-0.5 shrink-0">
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
							className="h-8 w-8 rounded-full flex items-center justify-center transition-colors text-white/50 hover:text-white hover:bg-white/20"
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
							className="h-8 w-8 rounded-full flex items-center justify-center transition-colors text-white/50 hover:text-white hover:bg-white/10 text-lg font-light leading-none"
						>
							<CaretLeftIcon size={12} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							type="button"
							onClick={next}
							aria-label="Следующий"
							className="h-8 w-8 rounded-full flex items-center justify-center transition-colors text-white/50 hover:text-white hover:bg-white/10 text-lg font-light leading-none"
						>
							<CaretRightIcon size={12} />
						</Button>
					</div>
				</CardContent>
			)}

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
