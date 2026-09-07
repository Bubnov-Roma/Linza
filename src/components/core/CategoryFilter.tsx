"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
	categories: DbCategory[];
	isPending?: boolean;
}

export function CategoryFilter({
	categories,
	isPending = false,
}: CategoryFilterProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isPendingInternal, startTransition] = useTransition();

	const currentCategory = searchParams.get("category") || "all";
	const currentSubcategory = searchParams.get("subcategory") || "";

	const [optimisticCategory, setOptimisticCategory] =
		useOptimistic(currentCategory);
	const [optimisticSubcategory, setOptimisticSubcategory] =
		useOptimistic(currentSubcategory);

	const [manualExpanded, setManualExpanded] = useState<string>(() => {
		if (currentSubcategory && currentCategory !== "all") return currentCategory;
		return currentCategory !== "all" ? currentCategory : "";
	});

	const expandedCategory = manualExpanded;

	const subcategories = useMemo(
		() =>
			categories.find((c) => c.slug === expandedCategory)?.subcategories ?? [],
		[expandedCategory, categories]
	);

	const navigate = (params: Record<string, string | null>) => {
		const next = new URLSearchParams(searchParams.toString());
		for (const [key, val] of Object.entries(params)) {
			if (val === null) next.delete(key);
			else next.set(key, val);
		}
		router.push(`?${next.toString()}`, { scroll: false });
	};

	const handleCategoryClick = (slug: string) => {
		if (slug === "all") {
			startTransition(() => {
				setOptimisticCategory("all");
				setOptimisticSubcategory("");
				navigate({ category: null, subcategory: null });
			});
			setManualExpanded("");
			return;
		}

		const cat = categories.find((c) => c.slug === slug);
		const hasSubs = (cat?.subcategories?.length ?? 0) > 0;

		if (slug === optimisticCategory) {
			if (hasSubs) setManualExpanded((prev) => (prev === slug ? "" : slug));
			return;
		}

		startTransition(() => {
			setOptimisticCategory(slug);
			setOptimisticSubcategory("");
			navigate({ category: slug, subcategory: null });
		});
		setManualExpanded(hasSubs ? slug : "");
	};

	const handleSubcategoryClick = (catSlug: string, subSlug: string) => {
		if (optimisticSubcategory === subSlug) {
			startTransition(() => {
				setOptimisticSubcategory("");
				navigate({ category: catSlug, subcategory: null });
			});
		} else {
			startTransition(() => {
				setOptimisticSubcategory(subSlug);
				navigate({ category: catSlug, subcategory: subSlug });
			});
		}
	};

	const loading = isPending || isPendingInternal;
	const allCategories = [
		{ id: "all", slug: "all", name: "Все категории" },
		...categories,
	];

	return (
		<div
			className={
				"relative space-y-0.5 p-1 overflow-hidden transition-all duration-300"
			}
		>
			{/* Category row */}
			<div className="w-full flex items-center gap-1 overflow-x-auto scroll-smooth no-scrollbar tabs-group">
				<div className="no-scrollbar flex items-center gap-1">
					{allCategories.map((cat) => {
						const isActive = optimisticCategory === cat.slug;

						return (
							<Button
								key={cat.slug}
								isActive={isActive}
								variant="ghost"
								onClick={() => handleCategoryClick(cat.slug)}
								className={cn(
									"relative flex items-center gap-1 whitespace-nowrap shrink-0 rounded-2xl transition-all font-bold uppercase tracking-[0.12em]",
									"h-8 px-3 text-[11px]",
									loading && isActive && "opacity-50",
									isActive
										? "bg-foreground/7 dark:bg-primary/15 text-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{cat.name}
								{isActive && expandedCategory && subcategories.length > 0 && (
									<div
										className={`absolute brightness-110 bottom-0 left-5 right-5 rounded-full h-0.5 ${isActive ? "bg-primary shadow-[0_0_10px_white]" : "bg-white/20"}`}
										style={{
											transform: isActive ? "scale(1)" : "scale(0.1)",
											transition:
												"transform 0.2s ease-in-out, color 0.1s ease-in-out",
										}}
									/>
								)}
								{isActive && (
									<XIcon
										size={12}
										className={cn(
											"transition-transform duration-200",
											expandedCategory ? "rotate-0" : "rotate-45"
										)}
									/>
								)}
							</Button>
						);
					})}
				</div>
			</div>

			{/* Subcategory row */}
			<AnimatePresence>
				{expandedCategory && subcategories.length > 0 && (
					<motion.div
						initial={{ height: 0, opacity: 0, marginTop: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0, marginTop: 0 }}
						className="w-full overflow-hidden"
					>
						<div className="w-full flex items-center gap-1 overflow-x-auto scroll-smooth no-scrollbar tabs-group">
							<div className="no-scrollbar flex items-center gap-1">
								{subcategories.map((sub) => {
									const isActive = optimisticSubcategory === sub.slug;
									return (
										<Button
											key={sub.slug}
											isActive={isActive}
											variant="ghost"
											onClick={() =>
												handleSubcategoryClick(expandedCategory, sub.slug)
											}
											className={cn(
												"relative flex items-center gap-1 whitespace-nowrap shrink-0 rounded-2xl transition-all font-bold uppercase tracking-[0.12em]",
												"h-8 px-3 text-[11px]",
												loading && isActive && "opacity-50",
												isActive
													? "snap-center bg-foreground/7 dark:bg-primary/15 text-foreground"
													: "text-muted-foreground hover:text-foreground"
											)}
										>
											{sub.name}
											<div
												className={`absolute brightness-110 bottom-0 left-5 right-5 rounded-full h-0.5 ${isActive ? "bg-primary shadow-[0_0_10px_white]" : "bg-white/20"}`}
												style={{
													transform: isActive ? "scale(1)" : "scale(0.1)",
													transition:
														"transform 0.2s ease-in-out, color 0.1s ease-in-out",
												}}
											/>
										</Button>
									);
								})}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Integrated Progress Bar */}
			<AnimatePresence>
				{loading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className={cn(
							"absolute insert-x-0 top-1 left-5 right-5 h-0.5 bg-primary/10 overflow-hidden"
						)}
					>
						<motion.div
							className="h-full bg-primary rounded-full"
							initial={{ x: "-100%" }}
							animate={{ x: "200%" }}
							transition={{
								repeat: Infinity,
								duration: 1.2,
								ease: "easeInOut",
							}}
							style={{ width: "40%" }}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
