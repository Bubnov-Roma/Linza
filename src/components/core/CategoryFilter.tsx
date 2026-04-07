"use client";

import { ChevronRight } from "lucide-react";
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

	// "Все категории" всегда первый пункт
	const allCategories: Array<{ id: string; slug: string; name: string }> = [
		{ id: "all", slug: "all", name: "Все категории" },
		...categories,
	];

	return (
		<div className="space-y-1">
			{/* Category row */}
			<div className="w-full flex items-center gap-1 overflow-x-auto scroll-smooth no-scrollbar">
				<div className="tabs-group no-scrollbar">
					{allCategories.map((cat) => {
						const isActive = optimisticCategory === cat.slug;
						const hasSubs =
							cat.slug !== "all" &&
							(categories.find((c) => c.slug === cat.slug)?.subcategories
								?.length ?? 0) > 0;
						const isExpanded = expandedCategory === cat.slug;

						return (
							<Button
								key={cat.slug}
								isActive={isActive}
								variant="tab"
								onClick={() => handleCategoryClick(cat.slug)}
								className={cn("relative", loading && isActive && "opacity-70")}
							>
								{cat.name}
								{hasSubs && (
									<ChevronRight
										size={11}
										className={cn(
											"transition-transform duration-200 opacity-60",
											isExpanded && "rotate-90"
										)}
									/>
								)}
							</Button>
						);
					})}
				</div>
			</div>

			{/* Subcategory row */}
			{expandedCategory && subcategories.length > 0 && (
				<div className="w-full flex items-center gap-1 overflow-x-auto scroll-smooth no-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
					<div className="no-scrollbar tabs-group">
						{subcategories.map((sub) => {
							const isActive = optimisticSubcategory === sub.slug;
							return (
								<Button
									key={sub.slug}
									isActive={isActive}
									variant="tab"
									onClick={() =>
										handleSubcategoryClick(expandedCategory, sub.slug)
									}
									className={cn(
										"relative",
										loading && isActive && "opacity-70",
										isActive && "snap-center shrink-0"
									)}
								>
									{sub.name}
								</Button>
							);
						})}
					</div>
				</div>
			)}

			{loading && (
				<div className="h-0.5 w-full overflow-hidden rounded-full bg-foreground/5">
					<div
						className="h-full bg-primary/40 rounded-full"
						style={{ width: "40%", animation: "slide 1s ease-in-out infinite" }}
					/>
				</div>
			)}
		</div>
	);
}
