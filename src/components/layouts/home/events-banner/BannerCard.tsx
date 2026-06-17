"use client";

import { PlayCircleIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef } from "react";
import type { Banner } from "@/actions/admin-banner-actions";
import { ClientTime } from "@/components/shared";
import { EVENT_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";
import { getMediaType } from "@/utils";

export function BannerCard({
	banner,
	onClick,
	isActive,
	variant = "hero",
	hasNav = false,
}: {
	banner: Banner;
	onClick?: () => void;
	isActive: boolean;
	variant?: "hero" | "studio";
	hasNav?: boolean;
}) {
	const config =
		EVENT_CONFIG[banner.type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.info;
	const videoRef = useRef<HTMLVideoElement>(null);

	const isStudio = variant === "studio";
	const mediaType = banner.videoUrl ? getMediaType(banner.videoUrl) : "image";
	const hasVideo = mediaType === "video" || mediaType === "youtube";
	const bgVideo = mediaType === "video" ? banner.videoUrl : null;

	// Включаем безопасный отступ снизу на мобильных, чтобы текст не заезжал под кнопки навигации
	const navHeight = hasNav ? "pb-14 md:pb-6" : "pb-5";

	return (
		<div
			className={cn(
				"relative w-full h-full overflow-hidden border group rounded-xl flex flex-col justify-stretch",
				isStudio
					? "border-0"
					: isActive
						? "border-foreground/15"
						: "border-foreground/8"
			)}
		>
			{/* ── Фоновое видео (S3) ── */}
			{bgVideo && (
				<>
					<video
						ref={videoRef}
						src={bgVideo}
						autoPlay
						muted
						loop
						playsInline
						className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none"
					/>
					<div
						className={cn("absolute inset-0 bg-linear-to-b", config.gradient)}
					/>
				</>
			)}

			{/* ── Фоновое изображение ── */}
			{!bgVideo && banner.imageUrl && (
				<>
					<div className={cn("absolute inset-0")}>
						<Image
							src={banner.imageUrl}
							alt={banner.title}
							fill
							sizes="480px"
							loading="eager"
							className={cn(
								"object-cover opacity-60 transition-opacity duration-500"
							)}
						/>
					</div>
					<div className="absolute inset-0 transition-color duration-200 bg-linear-to-r from-black/60 to-transparent bg-black/10 backdrop-blur-xs rounded-xl" />
				</>
			)}

			{/* ── Цветная полоска слева ── */}
			{/* {!isStudio && (
				<div
					className={cn(
						"absolute left-0 top-0 bottom-0 w-0.5 z-10",
						config.accent
					)}
				/>
			)} */}

			{/* ── Кликабельный контент ── */}
			<button
				type="button"
				onClick={onClick}
				className={cn(
					"relative w-full text-left flex flex-col items-stretch cursor-pointer h-full flex-1"
				)}
			>
				<div
					className={cn(
						"px-5 pt-4 md:px-7 flex flex-col gap-3 min-h-60 md:min-h-70 h-full",
						navHeight
					)}
				>
					{/* Верхняя строка: бейдж типа + видео-метка */}
					<div className="flex items-start justify-between gap-2 shrink-0">
						<span
							className={cn(
								"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border",
								config.badge
							)}
						>
							{config.label}
						</span>

						{hasVideo && (
							<span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/60 bg-black/25 backdrop-blur-sm px-2 py-0.5 rounded-full">
								<PlayCircleIcon size={11} weight="fill" />
								Видео
							</span>
						)}
					</div>

					<div className="flex-1 flex flex-col justify-center pb-1 pl-3 gap-1.5 min-w-0">
						<h3
							className={cn(
								"text-2xl md:text-3xl font-black tracking-tight leading-snug italic text-white wrap-break-word"
							)}
						>
							{banner.title}
						</h3>

						{banner.subtitle && (
							<p
								className={cn(
									"text-xs md:text-sm uppercase tracking-wide line-clamp-2 font-medium text-white/90"
								)}
							>
								{banner.subtitle}
							</p>
						)}

						{banner.eventDate && (
							<span
								className={cn("text-xs font-bold opacity-60 text-white mt-0.5")}
							>
								<ClientTime iso={banner.eventDate} fmt="full" />
							</span>
						)}
					</div>
				</div>
			</button>
		</div>
	);
}
