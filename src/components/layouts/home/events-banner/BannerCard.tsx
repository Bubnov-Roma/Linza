import { motion } from "framer-motion";
import Image from "next/image";
import type { Banner } from "@/actions/admin-banner-actions";
import { EVENT_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";

export function BannerCard({
	banner,
	onClick,
	isActive,
}: {
	banner: Banner;
	onClick: () => void;
	isActive: boolean;
}) {
	const config =
		EVENT_CONFIG[banner.type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.info;
	const Icon = config.icon;

	return (
		<motion.button
			type="button"
			onClick={onClick}
			initial={false}
			animate={{ opacity: isActive ? 1 : 0.4, scale: isActive ? 1 : 0.97 }}
			transition={{ duration: 0.3 }}
			className={cn(
				"relative w-full text-left overflow-hidden rounded-2xl border cursor-pointer",
				"transition-colors duration-300 group",
				// "bg-linear from-background/80 via:background/20 to-transparent",
				isActive
					? "border-foreground/15 bg-foreground/3"
					: "border-foreground/8 bg-foreground/2"
			)}
		>
			{/* Фоновое изображение */}
			{banner.imageUrl && (
				<>
					<div className="absolute inset-0">
						<Image
							src={banner.imageUrl}
							alt={banner.title}
							fill
							sizes="380px"
							loading="eager"
							className="object-cover opacity-20 group-hover:opacity-55 transition-opacity duration-500"
						/>
					</div>
					<div
						className={cn("absolute inset-0 bg-linear-to-r", config.gradient)}
					/>
				</>
			)}

			{/* Цветная полоска слева */}
			<div
				className={cn(
					"absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl",
					config.accent
				)}
			/>

			<div className="relative p-4 md:p-6 flex flex-col gap-3 min-h-45 md:min-h-55">
				{/* Контент */}
				<div className="flex-1">
					<h3 className="inline text-xl md:text-2xl font-black tracking-tight leading-snug mb-1.5 italic backdrop-shadow-xl">
						{banner.title}
					</h3>
					{banner.subtitle && (
						<p className="text-sm text-muted-foreground line-clamp-2 uppercase tracking-wide">
							{banner.subtitle}
						</p>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between">
					{/* Бейдж */}
					<div
						className={cn(
							"self-start inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold",
							config.badge
						)}
					>
						<Icon size={10} weight="fill" />
						{config.label}
						{banner.eventDate && (
							<span className="opacity-70">
								·{" "}
								{new Date(banner.eventDate).toLocaleDateString("ru-RU", {
									day: "numeric",
									month: "short",
								})}
							</span>
						)}
					</div>

					{banner.linkLabel && (
						<span className="text-xs font-bold text-muted-foreground shadow-neumorph-inset/5 py-0.5 px-2 rounded-2xl bg-muted-foreground/20">
							{banner.linkLabel}
						</span>
					)}
				</div>
			</div>
		</motion.button>
	);
}
