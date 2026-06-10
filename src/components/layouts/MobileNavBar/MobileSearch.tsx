"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { SearchFilters } from "@/components/core/search/SearchFilters";
import { SearchPanel } from "@/components/core/search/SearchPanel";
import { Button } from "@/components/ui";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { useSearchState } from "@/hooks";
import { useSearchHistory } from "@/hooks/use-search-history";
import { cn } from "@/lib/utils";

interface MobileSearchProps {
	isOpen: boolean;
	onClose: () => void;
	categories: DbCategory[];
}
export interface MobileSearchHandle {
	focus: () => void;
}

export const MobileSearch = forwardRef<MobileSearchHandle, MobileSearchProps>(
	({ isOpen, onClose, categories }, ref) => {
		const { state, reset } = useSearchState(categories);
		const { addToHistory } = useSearchHistory();
		const inputRef = useRef<HTMLInputElement>(null);

		useImperativeHandle(ref, () => ({
			focus: () => {
				inputRef.current?.focus();
			},
		}));

		useEffect(() => {
			if (!isOpen) reset();
			document.body.style.overflow = isOpen ? "hidden" : "";
			return () => {
				document.body.style.overflow = "";
			};
		}, [isOpen, reset]);

		const handleClose = () => {
			if (state.query.trim().length > 1) addToHistory(state.query.trim());
			onClose();
		};

		return (
			<div
				aria-hidden={!isOpen}
				className={cn(
					"fixed inset-x-0 top-0 bottom-0 z-55 flex flex-col bg-background/60 backdrop-blur-2xl",
					"transition-[clip-path,opacity] duration-300 ease-[cubic-bezier(0.34,1.06,0.64,1)]",
					isOpen
						? "pointer-events-auto opacity-100"
						: "pointer-events-none opacity-0"
				)}
				style={{
					clipPath: isOpen
						? "inset(0 0 0 0 round 0px)"
						: "inset(0 0 100% 0 round 0px)",
				}}
			>
				{/* Хедер поиска */}
				<div className="shrink-0 flex flex-col w-full backdrop-blur-xl pt-[calc(env(safe-area-inset-top)+0.5rem)] bg-muted-foreground/10 border-b border-foreground/5">
					<div className="mx-3 mb-2 flex items-center gap-2">
						{/* Поле ввода */}
						<div
							className={cn(
								"flex-1 flex items-center gap-3 bg-white dark:bg-black rounded-2xl px-4 h-12 shadow-xs transition-all"
							)}
						>
							<MagnifyingGlassIcon
								size={16}
								className="text-primary shrink-0"
							/>
							<input
								ref={inputRef}
								type="text"
								inputMode="search"
								style={{ fontSize: "16px" }}
								className="flex-1 bg-transparent border-none focus:outline-none placeholder:text-muted-foreground text-foreground w-0 min-w-0"
								placeholder="Поиск техники..."
								value={state.query}
								onChange={(e) => state.setQuery(e.target.value)}
							/>
							{state.query && (
								<button
									type="button"
									onClick={() => state.setQuery("")}
									className="p-1 bg-foreground/5 rounded-full shrink-0 active:scale-90 transition-transform"
								>
									<XIcon size={13} className="text-muted-foreground" />
								</button>
							)}
						</div>

						{/* Кнопка закрытия всего поиска (Поверх MobileSearch) */}
						<Button
							size="icon"
							variant="social"
							onClick={handleClose}
							className="h-12 w-12 transition-all shrink-0"
						>
							<XIcon className="shrink-0" size={22} weight="bold" />
						</Button>
					</div>

					{/* Фильтры */}
					{state.query.trim().length > 1 && (
						<div className="px-1 py-2 w-full overflow-hidden animate-in slide-in-from-top-1 duration-150 bg-muted-foreground/13 snap-center">
							<SearchFilters
								categories={categories}
								category={state.category}
								subcategory={state.subcategory}
								expandedCat={state.expandedCat}
								onCategory={state.handleCategoryClick}
								onSubcategory={state.selectSubcategory}
								variant="mobile"
							/>
						</div>
					)}
				</div>

				{/* Результаты поиска */}
				<SearchPanel
					state={state}
					categories={categories}
					variant="mobile"
					onClose={handleClose}
					className="flex-1 min-h-0 overflow-y-auto"
				/>
			</div>
		);
	}
);

MobileSearch.displayName = "MobileSearch";
