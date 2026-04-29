import {
	ArrowSquareOutIcon,
	CalendarIcon,
	XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import type { Banner } from "@/actions/admin-banner-actions";
import { SimpleMarkdown } from "@/components/shared";
import { Button } from "@/components/ui";
import { EVENT_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";

export function BannerModal({
	banner,
	onClose,
}: {
	banner: Banner;
	onClose: () => void;
}) {
	const config =
		EVENT_CONFIG[banner.type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.info;
	const Icon = config.icon;

	useEffect(() => {
		const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 z-80 flex items-center justify-center p-4"
			onClick={onClose}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 16 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 8 }}
				transition={{ type: "spring", stiffness: 400, damping: 30 }}
				onClick={(e) => e.stopPropagation()}
				className="relative z-10 w-full max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto rounded-3xl bg-background border border-foreground/8 shadow-2xl no-scrollbar"
			>
				{/* Изображение-шапка */}
				{banner.imageUrl && (
					<div className="relative w-full aspect-video rounded-t-3xl overflow-hidden">
						<Image
							src={banner.imageUrl}
							alt={banner.title}
							fill
							loading="eager"
							sizes="670px"
							className="object-cover"
						/>
						<div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent" />
					</div>
				)}

				<div className="p-6 md:p-8 space-y-4">
					{/* Бейдж типа */}
					<div
						className={cn(
							"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border",
							config.badge
						)}
					>
						<Icon size={11} weight="fill" />
						{config.label}
					</div>

					{/* Дата события */}
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

					{/* Заголовок */}
					<h2 className="text-2xl font-black tracking-tight leading-tight">
						{banner.title}
					</h2>

					{/* Подзаголовок */}
					{banner.subtitle && (
						<p className="text-muted-foreground font-medium">
							{banner.subtitle}
						</p>
					)}

					{/* Тело (Markdown) */}
					{banner.body && (
						<div className="prose-sm text-foreground/80 border-t border-foreground/5 pt-4">
							<SimpleMarkdown text={banner.body} />
						</div>
					)}

					{/* CTA */}
					{banner.linkUrl && (
						<div className="pt-2">
							<Button asChild className="gap-2">
								<a
									href={banner.linkUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									{banner.linkLabel ?? "Подробнее"}
									<ArrowSquareOutIcon size={14} />
								</a>
							</Button>
						</div>
					)}
				</div>

				{/* Кнопка закрытия */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 h-8 w-8 rounded-full bg-background/80 border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-colors backdrop-blur-sm"
				>
					<XIcon size={14} />
				</button>
			</motion.div>
		</motion.div>
	);
}
