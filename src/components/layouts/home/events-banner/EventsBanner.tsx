/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
"use client";

import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CalendarIcon,
	CaretLeftIcon,
	CaretRightIcon,
	XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner, BannerImage } from "@/actions/admin-banner-actions";
import { SimpleMarkdown } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { EVENT_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";

// ─── Lightbox (полноэкранный просмотр) ───────────────────────────────────────

function ImageLightbox({
	images,
	startIndex,
	title,
	onClose,
}: {
	images: BannerImage[];
	startIndex: number;
	title: string;
	onClose: () => void;
}) {
	const [idx, setIdx] = useState(startIndex);

	const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
	const next = () => setIdx((i) => (i + 1) % images.length);

	useEffect(() => {
		const h = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft") prev();
			if (e.key === "ArrowRight") next();
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, [onClose]);

	const img = images[idx];
	if (!img) return null;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-100 flex items-center justify-center bg-black/95"
			onClick={onClose}
		>
			<button
				type="button"
				className="relative w-full h-full flex items-center justify-center"
				onClick={(e) => e.stopPropagation()}
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={idx}
						initial={{ opacity: 0, scale: 0.97 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="relative max-w-5xl max-h-[85vh] w-full h-full mx-4"
					>
						<Image
							src={img.url}
							alt={`${title} ${idx + 1}`}
							fill
							className="object-contain"
							sizes="100vw"
						/>
					</motion.div>
				</AnimatePresence>

				{/* Стрелки */}
				{images.length > 1 && (
					<>
						<button
							type="button"
							onClick={prev}
							className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
						>
							<ArrowLeftIcon size={20} className="text-white" />
						</button>
						<button
							type="button"
							onClick={next}
							className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
						>
							<ArrowRightIcon size={20} className="text-white" />
						</button>
					</>
				)}

				{/* Счётчик */}
				{images.length > 1 && (
					<div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
						{idx + 1} / {images.length}
					</div>
				)}

				{/* Закрыть */}
				<Button
					asChild
					variant="ghost"
					onClick={onClose}
					className="absolute bottom-4 h-10 w-10 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm flex items-center justify-center p-3"
				>
					<XIcon size={26} className="text-white" />
				</Button>
			</button>
		</motion.div>
	);
}

// ─── Модальное окно события ───────────────────────────────────────────────────

function EventModal({
	banner,
	onClose,
}: {
	banner: Banner;
	onClose: () => void;
}) {
	const [imgIdx, setImgIdx] = useState(0);
	const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

	const config =
		EVENT_CONFIG[banner.type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.info;
	const Icon = config.icon;

	// Все изображения — из BannerImage[] или fallback imageUrl
	const allImages: BannerImage[] = banner.images?.length
		? banner.images
		: banner.imageUrl
			? [
					{
						id: "cover",
						bannerId: banner.id,
						url: banner.imageUrl,
						orderIndex: 0,
						videoUrl: banner.videoUrl,
					},
				]
			: [];

	const prevImg = () =>
		setImgIdx((i) => (i - 1 + allImages.length) % allImages.length);
	const nextImg = () => setImgIdx((i) => (i + 1) % allImages.length);

	useEffect(() => {
		const h = (e: KeyboardEvent) => {
			if (e.key === "Escape" && lightboxIdx === null) onClose();
			if (e.key === "ArrowLeft" && lightboxIdx === null) prevImg();
			if (e.key === "ArrowRight" && lightboxIdx === null) nextImg();
		};
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, [onClose, lightboxIdx]);

	const coverImg = allImages[imgIdx];

	return (
		<>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-50 flex items-center justify-center p-4"
				onClick={onClose}
			>
				<div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 16 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 8 }}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
					onClick={(e) => e.stopPropagation()}
					className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-background border border-foreground/8 shadow-2xl no-scrollbar"
				>
					{/* Слайдер изображений в шапке */}
					{coverImg && (
						<div className="relative w-full aspect-video rounded-t-3xl overflow-hidden bg-foreground/5">
							<AnimatePresence mode="wait">
								<motion.div
									key={imgIdx}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.25 }}
									className="absolute inset-0 cursor-zoom-in"
									onClick={() => setLightboxIdx(imgIdx)}
								>
									<Image
										src={coverImg.url}
										alt={banner.title}
										fill
										className="object-cover"
										sizes="672px"
										priority
									/>
									<div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent" />
								</motion.div>
							</AnimatePresence>

							{/* Стрелки слайдера */}
							{allImages.length > 1 && (
								<>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											prevImg();
										}}
										className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors"
									>
										<ArrowLeftIcon size={16} className="text-white" />
									</button>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											nextImg();
										}}
										className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors"
									>
										<ArrowRightIcon size={16} className="text-white" />
									</button>

									{/* Счётчик */}
									<div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
										{imgIdx + 1}/{allImages.length}
									</div>
								</>
							)}

							{/* Thumbnails */}
							{allImages.length > 1 && (
								<div className="absolute bottom-3 left-3 flex gap-1.5">
									{allImages.map((img, i) => (
										<button
											key={img.id}
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setImgIdx(i);
											}}
											className={cn(
												"w-1.5 h-1.5 rounded-full transition-all",
												i === imgIdx
													? "bg-white w-4"
													: "bg-white/50 hover:bg-white/80"
											)}
										/>
									))}
								</div>
							)}
						</div>
					)}

					<div className="p-6 md:p-8 space-y-4">
						{/* Бейдж */}
						<div
							className={cn(
								"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border",
								config.badge
							)}
						>
							<Icon size={11} weight="fill" />
							{config.label}
						</div>

						{/* Дата */}
						{banner.eventDate && (
							<p className="text-xs text-muted-foreground flex items-center gap-1.5">
								<CalendarIcon size={12} />
								{new Date(banner.eventDate).toLocaleDateString("ru-RU", {
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							</p>
						)}

						<h2 className="text-2xl font-black tracking-tight leading-tight text-foreground">
							{banner.title}
						</h2>
						{banner.subtitle && (
							<p className="text-muted-foreground font-medium">
								{banner.subtitle}
							</p>
						)}

						{banner.body && (
							<div className="prose-sm text-foreground/80 border-t border-foreground/5 pt-4">
								<SimpleMarkdown text={banner.body} />
							</div>
						)}

						{banner.linkUrl && (
							<div className="pt-2">
								<Button asChild className="gap-2">
									<a
										href={banner.linkUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										{banner.linkLabel ?? "Подробнее"}
									</a>
								</Button>
							</div>
						)}
					</div>

					<Button
						variant="ghost"
						onClick={onClose}
						className="absolute top-4 right-4 h-8 w-8 rounded-full border border-muted-foreground/20 text-muted-foreground flex items-center justify-center bg-background/20 hover:bg-background/60 transition-colors backdrop-blur-sm"
					>
						<XIcon size={14} />
					</Button>
				</motion.div>
			</motion.div>

			{/* Lightbox */}
			<AnimatePresence>
				{lightboxIdx !== null && (
					<ImageLightbox
						images={allImages}
						startIndex={lightboxIdx}
						title={banner.title}
						onClose={() => setLightboxIdx(null)}
					/>
				)}
			</AnimatePresence>
		</>
	);
}

// ─── EventsBanner — полноширинный слайдер событий ───────────────────────────

export function EventsBanner({ banners }: { banners: Banner[] }) {
	const [current, setCurrent] = useState(0);
	const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
	const touchStartX = useRef<number | null>(null);

	const prev = useCallback(
		() => setCurrent((c) => (c - 1 + banners.length) % banners.length),
		[banners.length]
	);
	const next = useCallback(
		() => setCurrent((c) => (c + 1) % banners.length),
		[banners.length]
	);

	// Свайп
	const onTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.touches[0]?.clientX ?? null;
	};
	const onTouchEnd = (e: React.TouchEvent) => {
		if (touchStartX.current === null) return;
		const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
		if (Math.abs(diff) > 50) diff > 0 ? prev() : next();
		touchStartX.current = null;
	};

	if (banners.length === 0) return null;
	const banner = banners[current];
	if (!banner) return null;

	const config =
		EVENT_CONFIG[banner.type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.info;
	const coverUrl = banner.images?.[0]?.url ?? banner.imageUrl;

	return (
		<>
			<section className="w-full overflow-hidden container m-auto p-4">
				<div
					className="relative overflow-hidden rounded-2xl bg-foreground text-background"
					onTouchStart={onTouchStart}
					onTouchEnd={onTouchEnd}
				>
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={current}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.4 }}
							className="relative w-full aspect-video cursor-pointer group"
							onClick={() => setActiveBanner(banner)}
						>
							{/* Фон */}
							{coverUrl ? (
								<Image
									src={coverUrl}
									alt={banner.title}
									fill
									sizes="380px"
									loading="eager"
									className="object-cover"
									priority
								/>
							) : (
								<div className="absolute inset-0 bg-foreground/5" />
							)}

							{/* Overlay */}
							<div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/50 to-transparent" />
							<div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent" />

							{/* Контент */}
							<div className="absolute inset-0 flex items-end py-8 px-12">
								<div className="max-w-xl space-y-6">
									<h2 className="text-2xl md:text-4xl font-black italic tracking-tight leading-tight drop-shadow-sm text-muted-foreground group-hover:text-foreground duration-300">
										{banner.title}
									</h2>

									{banner.subtitle && (
										<p className="text-sm md:text-base text-foreground/70 line-clamp-2">
											{banner.subtitle}
										</p>
									)}

									<div className="flex items-center gap-6 pt-1">
										<div
											className={cn(
												"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border",
												config.badge
											)}
										>
											<config.icon size={10} weight="fill" />
											{config.label}
											{banner.eventDate && (
												<span className="opacity-70">
													·{" "}
													{new Date(banner.eventDate).toLocaleDateString(
														"ru-RU",
														{ day: "numeric", month: "short" }
													)}
												</span>
											)}
										</div>
										<span className="text-xs text-muted-foreground/60 group-hover:text-foreground/60 transition-colors">
											Подробнее →
										</span>
									</div>
								</div>
							</div>
						</motion.div>
					</AnimatePresence>

					{banners.length > 1 && (
						<>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									prev();
								}}
								className="absolute left-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/30 hover:bg-background/60 backdrop-blur-sm flex items-center justify-center transition-all opacity-70 hover:opacity-100"
							>
								<CaretLeftIcon size={16} className="text-foreground" />
							</button>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									next();
								}}
								className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/30 hover:bg-background/60 backdrop-blur-sm flex items-center justify-center transition-all opacity-70 hover:opacity-100"
							>
								<CaretRightIcon size={16} className="text-foreground" />
							</button>
						</>
					)}
				</div>
			</section>

			{/* Модальное окно */}
			<AnimatePresence>
				{activeBanner && (
					<EventModal
						banner={activeBanner}
						onClose={() => setActiveBanner(null)}
					/>
				)}
			</AnimatePresence>
		</>
	);
}
