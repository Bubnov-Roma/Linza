"use client";
import { HeartIcon, ShareFatIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AddToCartButton } from "@/components/core/AddToCartButton";
import { PriceSelector } from "@/components/core/PriceSelector";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { useFavorite } from "@/hooks";
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
	onFavoriteToggle,
}: EquipmentCardProps) {
	const [isCopied, setIsCopied] = useState(false);
	const imageRef = useRef<HTMLDivElement>(null);
	const slug = item.slug || slugify(item.title);
	const isFav = variant === "favorites";

	const { isFavorite, toggle: toggleFavorite } = useFavorite(item.id);

	// If parent supplies onFavoriteToggle, use it; otherwise use internal toggle.
	const handleHeartClick = onFavoriteToggle ?? toggleFavorite;

	const handleShare = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		navigator.clipboard
			.writeText(`${window.location.origin}/equipment/item/${slug}`)
			.then(() => {
				toast.success("Ссылка скопирована");
				setIsCopied(true);
				setTimeout(() => setIsCopied(false), 2000);
			})
			.catch(() => {});
	};

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
						"group flex flex-col h-full bg-transparent",
						"rounded-2xl border border-foreground/5 bg-card/50 overflow-hidden hover:border-foreground/10 hover:shadow-lg transition-all duration-300"
					)}
				>
					{/* ── Image ── */}
					<div
						ref={imageRef}
						className={cn(
							"relative overflow-hidden bg-foreground/5 shrink-0",
							isFav ? "aspect-square w-full" : "aspect-4/3 rounded-xl mb-2.5"
						)}
					>
						<Link href={`/equipment/item/${slug}`} className="absolute inset-0">
							<Image
								src={item.imageUrl || "/placeholder.png"}
								alt={item.title}
								fill
								sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw"
								className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
							/>
						</Link>
						{/* Share / Favorite overlay buttons */}
						{variant !== "slider" && (
							<div
								className={cn(
									"absolute top-2 left-2 right-2 flex justify-between transition-opacity duration-200",
									isFav
										? "opacity-60 group-hover:opacity-100"
										: isFavorite
											? "opacity-100"
											: "opacity-40 group-hover:opacity-100"
								)}
							>
								<button
									type="button"
									onClick={handleShare}
									aria-label="Поделиться"
									className="w-7 h-7 rounded-full bg-background/75 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors duration-200 shadow-sm"
								>
									<ShareFatIcon
										weight={isCopied ? "fill" : "regular"}
										className="transition-all duration-200"
									/>
								</button>
								<button
									type="button"
									onClick={handleHeartClick}
									aria-label={
										isFavorite ? "Убрать из избранного" : "В избранное"
									}
									className={cn(
										"w-7 h-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer bg-background",
										isFavorite && "text-primary"
									)}
								>
									<HeartIcon
										weight={`${isFavorite ? "fill" : "regular"}`}
										className="transition-all duration-200"
									/>
								</button>
							</div>
						)}
					</div>

					{/* ── Content ── */}
					<div className={cn("flex flex-col flex-1 min-w-0 p-3 gap-2")}>
						{/* Fixed-height title block so all cards align in grid */}
						<Link href={`/equipment/item/${slug}`} className="block">
							<h3
								className="text-sm font-bold leading-snug hover:text-primary transition-colors"
								style={{
									display: "-webkit-box",
									WebkitLineClamp: 2,
									WebkitBoxOrient: "vertical",
									overflow: "hidden",
									height: "2.6em",
								}}
							>
								{item.title}
							</h3>
						</Link>

						{/* Price + cart always pinned to bottom of card */}
						{variant !== "slider" && (
							<div className="mt-auto">
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
											sourceRef={
												imageRef as React.RefObject<HTMLElement | null>
											}
											size="sm"
											variant="catalog"
											className="w-full"
										/>
									}
								/>
							</div>
						)}
					</div>
				</article>
			</motion.div>
		</AnimatePresence>
	);
}
