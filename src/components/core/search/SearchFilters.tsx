import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useMemo, useRef } from "react";
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
	const catRowRef = useRef<HTMLDivElement>(null);
	const subRowRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Центрируем активную категорию при смене>
	useEffect(() => {
		if (!catRowRef.current) return;
		const active = catRowRef.current.querySelector<HTMLElement>(
			"[data-active='true']"
		);
		active?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
			inline: "center",
		});
	}, [category]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Центрируем активную подкатегорию при смене>
	useEffect(() => {
		if (!subRowRef.current) return;
		const active = subRowRef.current.querySelector<HTMLElement>(
			"[data-active='true']"
		);
		active?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
			inline: "center",
		});
	}, [subcategory]);

	return (
		<div
			className={cn(
				"flex gap-2 w-full min-w-0 overflow-hidden drop-shadow-xs flex-col"
			)}
		>
			{/* ── Строка Категорий ── */}
			<div
				ref={catRowRef}
				data-slot="filters-scroll"
				className="flex gap-1.5 overflow-x-auto no-scrollbar min-w-0 w-full snap-x snap-mandatory px-1"
			>
				{/* Кнопка "Все" */}
				<button
					type="button"
					data-active={category === "all"}
					onClick={() => onCategory("all")}
					className={cn(
						"cursor-pointer flex items-center gap-1 justify-center whitespace-nowrap shrink-0 rounded-2xl transition-all font-bold uppercase tracking-[0.12em] snap-center",
						isMobile ? "h-10 px-4 text-xs" : "h-8 px-3 text-[11px]",
						category === "all"
							? "bg-background text-foreground"
							: "bg-foreground/7 text-muted-foreground hover:text-foreground"
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
							data-active={active}
							onClick={() => onCategory(cat.slug)}
							className={cn(
								"cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 rounded-2xl transition-all font-bold uppercase tracking-[0.12em] snap-center",
								isMobile ? "h-10 px-4 text-xs" : "h-8 px-3 text-[11px]",
								active
									? "bg-background dark:bg-primary/10 text-foreground"
									: "bg-foreground/7 text-muted-foreground hover:text-foreground"
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
					ref={subRowRef}
					data-slot="filters-scroll"
					className={cn(
						"flex gap-1.5 overflow-x-auto no-scrollbar animate-in fade-in duration-200 snap-x snap-mandatory slide-in-from-bottom-1 px-1"
					)}
				>
					{subs.map((sub) => {
						const active = subcategory === sub.slug;
						return (
							<button
								key={sub.slug}
								type="button"
								data-active={active}
								onClick={() => onSubcategory(expandedCat, sub.slug)}
								className={cn(
									"relative cursor-pointer rounded-2xl whitespace-nowrap shrink-0 transition-all font-semibold uppercase tracking-widest snap-center",
									isMobile
										? "h-9 px-3.5 text-[11px]"
										: "h-7 px-2.5 text-[10px]",
									active
										? "bg-background dark:bg-primary/10 text-foreground"
										: "bg-foreground/7 text-muted-foreground hover:text-foreground"
								)}
							>
								{sub.name}
								<div
									className={`absolute brightness-110 bottom-0 left-5 right-5 rounded-full h-0.5 ${active ? "bg-primary shadow-[0_0_10px_white]" : "bg-white/20"}`}
									style={{
										transform: active ? "scale(1)" : "scale(0.1)",
										transition:
											"transform 0.2s ease-in-out, color 0.1s ease-in-out",
									}}
								/>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

// import { XIcon } from "@phosphor-icons/react/dist/ssr";
// import { useMemo } from "react";
// import type { DbCategory } from "@/core/domain/entities/Equipment";
// import { cn } from "@/lib/utils";

// export function SearchFilters({
// 	categories = [],
// 	category,
// 	subcategory,
// 	expandedCat,
// 	onCategory,
// 	onSubcategory,
// 	variant = "desktop",
// }: {
// 	categories: DbCategory[];
// 	category: string;
// 	subcategory: string;
// 	expandedCat: string;
// 	onCategory: (slug: string) => void;
// 	onSubcategory: (catSlug: string, subSlug: string) => void;
// 	variant?: "desktop" | "mobile";
// }) {
// 	const subs = useMemo(
// 		() => categories.find((c) => c.slug === expandedCat)?.subcategories ?? [],
// 		[expandedCat, categories]
// 	);

// 	const isMobile = variant === "mobile";

// 	return (
// 		<div
// 			className={cn(
// 				"flex gap-2 w-full min-w-0 overflow-hidden drop-shadow-xs flex-col"
// 			)}
// 		>
// 			{/* ── Строка Категорий ── */}
// 			<div className="flex gap-1.5 overflow-x-auto no-scrollbar min-w-0 w-full overflow-hidden snap-x snap-mandatory">
// 				{/* Кнопка "Все" */}
// 				<button
// 					type="button"
// 					onClick={() => onCategory("all")}
// 					className={cn(
// 						"cursor-pointer flex items-center gap-1 justify-center whitespace-nowrap shrink-0 rounded-2xl transition-all font-bold uppercase tracking-[0.12em]",
// 						isMobile ? "h-10 px-4 text-xs" : "h-8 px-3 text-[11px]",
// 						category === "all"
// 							? "bg-background text-foreground"
// 							: "bg-foreground/7 text-muted-foreground hover:text-foreground"
// 					)}
// 				>
// 					Все
// 				</button>
// 				{categories.map((cat) => {
// 					const active = category === cat.slug;
// 					const hasSubs = cat.subcategories.length > 0;
// 					const expanded = expandedCat === cat.slug;
// 					return (
// 						<button
// 							key={cat.slug}
// 							type="button"
// 							onClick={() => onCategory(cat.slug)}
// 							className={cn(
// 								"cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 rounded-2xl transition-all font-bold uppercase tracking-[0.12em]",
// 								isMobile ? "h-10 px-4 text-xs" : "h-8 px-3 text-[11px]",
// 								active
// 									? "bg-background dark:bg-primary/10 text-foreground"
// 									: "bg-foreground/7 text-muted-foreground hover:text-foreground"
// 							)}
// 						>
// 							{cat.name}
// 							{hasSubs && active && (
// 								<XIcon
// 									size={isMobile ? 12 : 10}
// 									className={cn(
// 										"transition-transform duration-200",
// 										expanded ? "rotate-0" : "rotate-45"
// 									)}
// 								/>
// 							)}
// 						</button>
// 					);
// 				})}
// 			</div>

// 			{/* ── Строка Подкатегорий ── */}
// 			{expandedCat && subs.length > 0 && (
// 				<div
// 					className={cn(
// 						"flex gap-1.5 overflow-x-auto no-scrollbar animate-in fade-in duration-200 snap-x snap-mandatory slide-in-from-bottom-1"
// 					)}
// 				>
// 					{subs.map((sub) => {
// 						const active = subcategory === sub.slug;
// 						return (
// 							<button
// 								key={sub.slug}
// 								type="button"
// 								onClick={() => onSubcategory(expandedCat, sub.slug)}
// 								className={cn(
// 									"relative cursor-pointer rounded-2xl whitespace-nowrap shrink-0 transition-all font-semibold uppercase tracking-widest",
// 									isMobile
// 										? "h-9 px-3.5 text-[11px]"
// 										: "h-7 px-2.5 text-[10px]",
// 									active
// 										? "bg-background dark:bg-primary/10 text-foreground"
// 										: "bg-foreground/7 text-muted-foreground hover:text-foreground"
// 								)}
// 							>
// 								{sub.name}
// 								<div
// 									className={`absolute brightness-110 bottom-0 left-5 right-5 rounded-full h-0.5 ${active ? "bg-primary shadow-[0_0_10px_white]" : "bg-white/20"}`}
// 									style={{
// 										transform: active ? "scale(1)" : "scale(0.1)",
// 										transition:
// 											"transform 0.2s ease-in-out, color 0.1s ease-in-out",
// 									}}
// 								/>
// 							</button>
// 						);
// 					})}
// 				</div>
// 			)}
// 		</div>
// 	);
// }
