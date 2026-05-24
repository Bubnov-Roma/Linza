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
	/**
	 * "catalog"   — default horizontal catalog grid (4:3 image, transparent bg)
	 * "favorites" — square image, card border/bg, always-visible action buttons
	 */
	variant?: "catalog" | "favorites" | "slider";
	/**
	 * Optional override for the heart-button click.
	 * When provided, this is called INSTEAD of the internal useFavorite toggle.
	 * Use in favorites page to wire undo-toast logic without duplicating state.
	 */
	onFavoriteToggle?: (e: React.MouseEvent) => void;
}

export function EquipmentCard({
	item,
	variant = "catalog",
}: EquipmentCardProps) {
	const initialSrc = item.imageUrl || "/placeholder.png";
	const [imgSrc, setImgSrc] = useState<string>(initialSrc);
	const imageRef = useRef<HTMLDivElement>(null);
	const slug = item.slug || slugify(item.title);

	useEffect(() => {
		setImgSrc(item.imageUrl || "/placeholder.png");
	}, [item.imageUrl]);

	return (
		<AnimatePresence mode="wait">
			<motion.div
				layout
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				transition={{ duration: 0.15 }}
			>
				<article
					className={cn(
						"relative flex flex-col h-full overflow-hidden rounded-2xl border border-foreground/5 bg-card transition-all duration-300 hover:shadow-xl",
						variant === "slider" && "border-0 shadow-none hover:shadow-none"
					)}
				>
					{/* Image Container */}
					<Link
						href={`/equipment/item/${slug}`}
						className="block group/card h-full"
					>
						<div
							className={cn(
								"relative shrink-0 overflow-hidden",
								variant === "slider" ? "aspect-square glass-card" : "aspect-4/3"
							)}
						>
							<Image
								src={imgSrc}
								alt={item.title}
								fill
								sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw h-full"
								className="object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
								onError={() => {
									if (imgSrc !== "/placeholder.png") {
										setImgSrc("/placeholder.png");
									}
								}}
							/>
							{variant === "slider" && (
								<div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent opacity-90 pb-3" />
							)}
						</div>
						{/* Content */}
						<div
							className={cn(
								"px-3 pt-3 flex flex-col gap-2",
								variant === "slider"
									? "absolute bottom-0 left-0 right-0 pt-10 pb-4"
									: "flex-1"
							)}
						>
							<h3
								className={cn(
									"font-bold leading-tight line-clamp-2 px-1",
									variant === "slider"
										? "text-sm text-foreground"
										: "text-sm text-foreground/80"
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
						<div className="mt-auto p-3">
							<PriceSelector
								prices={{
									day: item.pricePerDay,
									h4: item.price4h,
									h8: item.price8h,
								}}
								variant="catalog"
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
							className="absolute top-2 px-2 w-full"
						/>
					)}
				</article>
			</motion.div>
		</AnimatePresence>
	);
}
