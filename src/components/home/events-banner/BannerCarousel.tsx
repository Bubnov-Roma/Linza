"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { Banner } from "@/actions/admin-banner-actions";
import { BannerCard } from "@/components/home/events-banner/BannerCard";
import { BannerModal } from "@/components/home/events-banner/BannerModal";
import { cn } from "@/lib/utils";

export function BannerCarousel({ banners }: { banners: Banner[] }) {
	const [current, setCurrent] = useState(0);
	const [activeBanner, setActiveBanner] = useState<Banner | null>(null);

	const prev = useCallback(
		() => setCurrent((c) => (c - 1 + banners.length) % banners.length),
		[banners.length]
	);
	const next = useCallback(
		() => setCurrent((c) => (c + 1) % banners.length),
		[banners.length]
	);

	// Автопрокрутка
	useEffect(() => {
		if (banners.length <= 1) return;
		const id = setInterval(next, 8000);
		return () => clearInterval(id);
	}, [next, banners.length]);

	if (banners.length === 0) return null;
	const currentBanner = banners[current];
	if (!currentBanner) return null;

	return (
		<>
			<div className="relative w-full">
				{/* Слайды */}
				<div className="overflow-hidden">
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={current}
							initial={{ opacity: 0, x: 30 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -30 }}
							transition={{ duration: 0.35, ease: "easeOut" }}
						>
							<BannerCard
								banner={currentBanner}
								onClick={() => setActiveBanner(currentBanner)}
								isActive={true}
							/>
						</motion.div>
					</AnimatePresence>
				</div>

				{/* Навигация */}
				{banners.length > 1 && (
					<div className="flex items-center justify-between mt-4">
						{/* Точки */}
						<div className="flex items-center gap-1.5">
							{banners.map((b, i) => (
								<button
									key={b.id}
									type="button"
									onClick={() => setCurrent(i)}
									className={cn(
										"rounded-full transition-all duration-300",
										i === current
											? "w-6 h-2 bg-primary"
											: "w-2 h-2 bg-foreground/20 hover:bg-foreground/40"
									)}
								/>
							))}
						</div>

						{/* Стрелки */}
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={prev}
								className="h-8 w-8 rounded-full border border-foreground/10 flex items-center justify-center hover:bg-foreground/8 transition-colors"
							>
								<ArrowLeftIcon size={14} />
							</button>
							<button
								type="button"
								onClick={next}
								className="h-8 w-8 rounded-full border border-foreground/10 flex items-center justify-center hover:bg-foreground/8 transition-colors"
							>
								<ArrowRightIcon size={14} />
							</button>
						</div>
					</div>
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
		</>
	);
}
