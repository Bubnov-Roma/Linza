import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { useMemo } from "react";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

export function SearchFilters({
	categories = [],
	category,
	subcategory,
	expandedCat,
	onCategory,
	onSubcategory,
	variant = "desktop",
}: {
	categories: DbCategory[];
	category: string;
	subcategory: string;
	expandedCat: string;
	onCategory: (slug: string) => void;
	onSubcategory: (catSlug: string, subSlug: string) => void;
	variant?: "desktop" | "mobile";
}) {
	const subs = useMemo(
		() => categories.find((c) => c.slug === expandedCat)?.subcategories ?? [],
		[expandedCat, categories]
	);

	const isMobile = variant === "mobile";

	return (
		<div
			className={cn(
				"flex gap-2 w-full min-w-0 overflow-hidden",
				isMobile ? "flex-col-reverse" : "flex-col"
			)}
		>
			{/* ── Строка Категорий ── */}
			<div className="flex gap-1.5 overflow-x-auto no-scrollbar min-w-0 w-full overflow-hidden">
				{/* Кнопка "Все" */}
				<button
					type="button"
					onClick={() => onCategory("all")}
					className={cn(
						"flex items-center gap-1 justify-center whitespace-nowrap shrink-0 rounded-xl transition-all font-bold uppercase tracking-[0.12em]",
						isMobile ? "h-10 px-4 text-xs" : "h-8 px-3 text-[11px]",
						category === "all"
							? "bg-primary/10 text-primary"
							: "bg-foreground/5 text-muted-foreground hover:text-foreground"
					)}
				>
					Все
				</button>
				{categories.map((cat) => {
					const active = category === cat.slug;
					const hasSubs = cat.subcategories.length > 0;
					const expanded = expandedCat === cat.slug;
					return (
						<button
							key={cat.slug}
							type="button"
							onClick={() => onCategory(cat.slug)}
							className={cn(
								"flex items-center gap-1 whitespace-nowrap shrink-0 rounded-xl transition-all font-bold uppercase tracking-[0.12em]",
								isMobile ? "h-10 px-4 text-xs" : "h-8 px-3 text-[11px]",
								active
									? "bg-primary/10 text-primary"
									: "bg-foreground/5 text-muted-foreground hover:text-foreground"
							)}
						>
							{cat.name}
							{hasSubs && active && (
								<XIcon
									size={isMobile ? 12 : 10}
									className={cn(
										"transition-transform duration-200",
										expanded ? "rotate-0" : "rotate-45"
									)}
								/>
							)}
						</button>
					);
				})}
			</div>

			{/* ── Строка Подкатегорий ── */}
			{expandedCat && subs.length > 0 && (
				<div
					className={cn(
						"flex gap-1.5 overflow-x-auto no-scrollbar animate-in fade-in duration-200",
						isMobile ? "slide-in-from-top-1" : "slide-in-from-bottom-1"
					)}
				>
					{subs.map((sub) => {
						const active = subcategory === sub.slug;
						return (
							<button
								key={sub.slug}
								type="button"
								onClick={() => onSubcategory(expandedCat, sub.slug)}
								className={cn(
									"whitespace-nowrap shrink-0 rounded-lg transition-all font-semibold uppercase tracking-widest",
									isMobile
										? "h-9 px-3.5 text-[11px]"
										: "h-7 px-2.5 text-[10px]",
									active
										? "bg-primary/10 text-primary"
										: "bg-foreground/5 text-muted-foreground/70 hover:text-foreground"
								)}
							>
								{sub.name}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
