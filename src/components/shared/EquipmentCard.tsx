"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AddToCartButton } from "@/components/core/AddToCartButton";
import { PriceSelector } from "@/components/core/PriceSelector";
import { EquipmentActionButtons } from "@/components/shared/EquipmentActionButtons";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";
import { slugify } from "@/utils";

interface EquipmentCardProps {
	item: GroupedEquipment;
	variant?: "catalog" | "favorites" | "slider";
	onFavoriteToggle?: (e: React.MouseEvent) => void;
}

export function EquipmentCard({
	item,
	variant = "catalog",
}: EquipmentCardProps) {
	const initialSrc = item.imageUrl || "/placeholder.png";
	const [imgSrc, setImgSrc] = useState<string>(initialSrc);
	const [isImageLoaded, setIsImageLoaded] = useState(false);
	const imageRef = useRef<HTMLDivElement>(null);
	const slug = item.slug || slugify(item.title);

	useEffect(() => {
		setImgSrc(item.imageUrl || "/placeholder.png");
		setIsImageLoaded(false);
	}, [item.imageUrl]);

	return (
		<AnimatePresence mode="wait">
			<motion.div
				layout
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95 }}
				transition={{ duration: 0.3 }}
				className="h-full"
			>
				<article
					className={cn(
						"relative flex flex-col h-full overflow-hidden rounded-3xl border border-foreground/4 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:border-foreground/10 hover:-translate-y-1",
						variant === "slider" &&
							"border-0 shadow-none hover:shadow-none hover:translate-y-0"
					)}
				>
					{/* Image Container */}
					<Link
						href={`/equipment/item/${slug}`}
						className="group/card h-full flex-col flex"
					>
						<div
							ref={imageRef}
							className={cn(
								"relative shrink-0 overflow-hidden bg-foreground/5",
								variant === "slider" ? "aspect-square glass-card" : "aspect-4/3"
							)}
						>
							{/* Скелетон-заглушка, пока картинка грузится */}
							{!isImageLoaded && (
								<div className="absolute inset-0 animate-pulse bg-foreground/5" />
							)}
							<Image
								src={imgSrc}
								alt={item.title}
								loading="eager"
								fill
								sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw"
								className={cn(
									"object-cover transition-all duration-700 ease-in-out group-hover/card:scale-[1.05]",
									isImageLoaded ? "opacity-100" : "opacity-0 scale-110"
								)}
								onLoad={() => setIsImageLoaded(true)}
								onError={() => {
									if (imgSrc !== "/placeholder.png") {
										setImgSrc("/placeholder.png");
									}
									setIsImageLoaded(true);
								}}
							/>
							{variant === "slider" && (
								<div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent opacity-90 pb-3" />
							)}
						</div>

						{/* Content */}
						<div
							className={cn(
								"px-2 md:px-4 pt-4 flex flex-col gap-2",
								variant === "slider"
									? "absolute bottom-0 left-0 right-0 pt-10 pb-4"
									: "flex-1"
							)}
						>
							<h3
								className={cn(
									"font-bold leading-tight line-clamp-2 text-sm text-foreground/70 px-1 transition-colors group-hover/card:text-foreground"
								)}
								style={{
									display: "-webkit-box",
									WebkitLineClamp: 2,
									WebkitBoxOrient: "vertical",
									overflow: "hidden",
									height: "2.6em",
								}}
								aria-label={item.title}
							>
								{item.title}
							</h3>
						</div>
					</Link>

					{/* Selectors */}
					{variant !== "slider" && (
						<div className="mt-auto pt-4 pb-2 md:pb-4 relative z-10">
							<PriceSelector
								prices={{
									day: item.pricePerDay,
									h4: item.price4h,
									h8: item.price8h,
								}}
								variant="catalog"
								className="px-2 md:px-3"
								action={
									<AddToCartButton
										item={item}
										sourceRef={imageRef as React.RefObject<HTMLElement | null>}
										size="sm"
										variant="catalog"
										className="w-full"
									/>
								}
							/>
						</div>
					)}
					{variant !== "slider" && (
						<EquipmentActionButtons
							id={item.id}
							slug={slug}
							title={item.title}
							className="absolute top-3 right-3 z-10 left-3"
						/>
					)}
				</article>
			</motion.div>
		</AnimatePresence>
	);
}
