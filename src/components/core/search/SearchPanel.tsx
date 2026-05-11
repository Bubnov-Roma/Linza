"use client";

import {
	ClockCounterClockwiseIcon,
	MagnifyingGlassIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useDebounceValue } from "usehooks-ts";
import { clientSearchEquipmentAction } from "@/actions/client-equipment-actions";
import { AddToCartButton } from "@/components/core/AddToCartButton";
import { SearchFilters } from "@/components/core/search/SearchFilters";
import { Skeleton } from "@/components/ui/skeleton";
import type {
	DbCategory,
	DbEquipment,
	GroupedEquipment,
} from "@/core/domain/entities/Equipment";
import type { SearchPanelState } from "@/hooks";
import { useSearchHistory } from "@/hooks/use-search-history";
import { cn, fmtRub } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart.store";
import { slugify } from "@/utils";

function ResultSkeleton({
	count = 5,
	size = "md",
}: {
	count?: number;
	size?: "sm" | "md";
}) {
	return (
		<div className="space-y-1 py-2">
			{Array.from({ length: count }).map((_, i) => (
				<div
					key={i}
					className={cn(
						"flex items-center gap-3 px-2",
						size === "sm" ? "py-1.5" : "py-2"
					)}
				>
					<Skeleton
						className={cn(
							"rounded-xl shrink-0",
							size === "sm" ? "w-10 h-10" : "w-12 h-12"
						)}
					/>
					<div className="flex-1 space-y-2">
						<Skeleton className="h-3.5 w-3/4 rounded" />
						<Skeleton className="h-3 w-1/4 rounded" />
					</div>
					<Skeleton className="w-8 h-8 rounded-xl shrink-0" />
				</div>
			))}
		</div>
	);
}

interface SearchPanelProps {
	state: SearchPanelState;
	categories: DbCategory[];
	variant: "desktop" | "mobile";
	onClose?: () => void;
	className?: string;
}

export function SearchPanel({
	state,
	categories = [],
	variant,
	onClose,
	className,
}: SearchPanelProps) {
	const { query, setQuery, category, subcategory, expandedCat } = state;
	const router = useRouter();
	const cartItems = useCartStore((s) => s.items);
	const { history, addToHistory, removeFromHistory, clearHistory } =
		useSearchHistory();

	const [debouncedQuery] = useDebounceValue(query, 180);

	const {
		data: allResults,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: ["search-panel", debouncedQuery],
		queryFn: () => clientSearchEquipmentAction(debouncedQuery),
		enabled: debouncedQuery.length > 1,
		staleTime: 1000 * 60 * 2,
		placeholderData: (prev) => prev,
	});

	const results = useMemo(() => {
		if (!allResults) return undefined;
		if (category === "all") return allResults;

		// Найти UUID категории по slug
		const catId = categories.find((c) => c.slug === category)?.id;

		return allResults.filter((item: DbEquipment) => {
			const catMatch = catId ? item.categoryId === catId : true;
			if (!subcategory) return catMatch;
			// Найти UUID подкатегории по slug
			const catData = categories.find((c) => c.slug === category);
			const subId = catData?.subcategories.find(
				(s) => s.slug === subcategory
			)?.id;
			return catMatch && (subId ? item.subcategoryId === subId : true);
		});
	}, [allResults, category, subcategory, categories]);

	const handleItemClick = useCallback(
		(item: DbEquipment) => {
			addToHistory(item.title);
			router.push(`/equipment/item/${slugify(item.title)}`);
			onClose?.();
		},
		[addToHistory, router, onClose]
	);

	const showFilters = debouncedQuery.length > 1;
	const showSkeletons = isLoading && debouncedQuery.length > 1;
	const dimResults = isFetching && !isLoading;
	const isDesktop = variant === "desktop";

	return (
		<div className={cn("flex flex-col min-h-0 min-w-0", className)}>
			{showFilters && isDesktop && (
				<div className="shrink-0 border-b border-foreground/5 space-y-1 px-3 py-2">
					<SearchFilters
						categories={categories}
						category={category}
						subcategory={subcategory}
						expandedCat={expandedCat}
						onCategory={state.handleCategoryClick}
						onSubcategory={state.selectSubcategory}
						variant="desktop"
					/>
				</div>
			)}

			<div
				className={cn(
					"overflow-y-auto custom-scrollbar transition-opacity duration-150",
					isDesktop ? "max-h-96 px-1" : "flex-1 px-2",
					dimResults && "opacity-60"
				)}
			>
				{showSkeletons ? (
					<ResultSkeleton
						count={isDesktop ? 4 : 6}
						size={isDesktop ? "sm" : "md"}
					/>
				) : debouncedQuery.length === 0 ? (
					<div className="py-1">
						{history.length > 0 && (
							<div className="flex items-center justify-between px-3 py-1.5 mb-0.5">
								<span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
									История
								</span>
								<button
									type="button"
									onClick={clearHistory}
									className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
								>
									<TrashIcon weight="duotone" size={10} />
									Очистить
								</button>
							</div>
						)}
						{history.length > 0 ? (
							history.map((term) => (
								<div
									key={term}
									className="flex items-center rounded-xl hover:bg-foreground/5 transition-colors group/h"
								>
									<button
										type="button"
										className="flex items-center gap-3 flex-1 px-3 py-2.5 text-left text-sm"
										onClick={() => setQuery(term)}
									>
										<ClockCounterClockwiseIcon
											size={15}
											weight="duotone"
											className="text-muted-foreground group-hover/h:text-foreground transition-colors shrink-0"
										/>
										<span className="text-foreground/80 truncate">{term}</span>
									</button>
									<button
										type="button"
										onClick={() => removeFromHistory(term)}
										className="opacity-0 group-hover/h:opacity-100 transition-opacity mr-2 p-1.5 hover:bg-foreground/10 rounded-lg shrink-0"
									>
										<XIcon size={11} className="text-muted-foreground" />
									</button>
								</div>
							))
						) : (
							<div className={cn("text-center", isDesktop ? "py-10" : "py-20")}>
								<MagnifyingGlassIcon
									size={28}
									weight="duotone"
									className="mx-auto text-muted-foreground/20 mb-3"
								/>
								<p className="text-sm text-muted-foreground/50">
									История поиска пуста
								</p>
							</div>
						)}
					</div>
				) : results?.length ? (
					<div className="py-1 space-y-0.5">
						<p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40 px-3 py-1.5">
							Результаты ({results.length})
						</p>
						{results.map((item) => {
							const inCart = cartItems.some((c) => c.equipment.id === item.id);
							return (
								<div
									key={item.id}
									className="flex items-center rounded-xl hover:bg-foreground/5 transition-all group/item"
								>
									<button
										type="button"
										className="flex items-center gap-3 flex-1 min-w-0 px-2 py-2 text-left"
										onClick={() => handleItemClick(item)}
									>
										<div
											className={cn(
												"rounded-xl overflow-hidden bg-foreground/5 shrink-0",
												isDesktop ? "w-10 h-10" : "w-12 h-12"
											)}
										>
											<Image
												src={
													item.equipmentImageLinks?.[0]?.image?.url ||
													"/placeholder-equipment.png"
												}
												alt={item.title}
												width={48}
												height={48}
												className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300"
											/>
										</div>
										<div className="min-w-0 flex-1">
											<div
												className={cn(
													"font-medium truncate group-hover/item:text-primary transition-colors leading-tight",
													isDesktop ? "text-sm max-w-65" : "text-sm max-w-50"
												)}
											>
												{item.title}
											</div>
											<div className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
												{fmtRub(item.pricePerDay)}/сут
											</div>
										</div>
									</button>
									<div
										className={cn(
											"shrink-0 mr-2 transition-opacity",
											!inCart &&
												isDesktop &&
												"opacity-0 group-hover/item:opacity-100"
										)}
									>
										<AddToCartButton
											item={item as unknown as GroupedEquipment}
											variant="icon"
											size="sm"
										/>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className={cn("text-center", isDesktop ? "py-10" : "py-20")}>
						<p className="text-sm text-muted-foreground font-medium">
							Ничего не нашли по «{debouncedQuery}»
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
