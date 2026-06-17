"use client";

import { XIcon } from "@phosphor-icons/react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { clientAutocompleteEquipmentAction } from "@/actions/autocomplete-actions";
import { SearchFilters } from "@/components/core/search/SearchFilters";
import { SearchPanel } from "@/components/core/search/SearchPanel";
import { Button, InlineSearchInput } from "@/components/ui";
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
			if (!isOpen) {
				reset();
				return;
			}

			// 1. Блокируем стандартный overflow и убираем bouncing эффект
			const originalOverflow = document.body.style.overflow;
			const originalOverscroll = document.body.style.overscrollBehavior;

			document.body.style.overflow = "hidden";
			document.body.style.overscrollBehavior = "none";

			// requestAnimationFrame дает браузеру отрендерить появление оверлея,
			// после чего плавно вешает фокус и поднимает клавиатуру
			const focusTimeout = setTimeout(() => {
				inputRef.current?.focus();
				// Дополнительный трюк для iOS: имитируем клик, если фокус не встал
				inputRef.current?.click();
			}, 150); // 150мс — оптимально, чтобы успела начаться анимация клип-паса
			// ------------------------------

			// 2. Жесткая блокировка touch-скролла для iOS на внешних элементах
			const preventTouchScroll = (e: TouchEvent) => {
				const target = e.target as HTMLElement;
				if (target.closest("[data-slot='search-panel-scroll']")) {
					return;
				}
				if (e.touches.length === 1) {
					e.preventDefault();
				}
			};

			document.addEventListener("touchmove", preventTouchScroll, {
				passive: false,
			});

			return () => {
				document.body.style.overflow = originalOverflow;
				document.body.style.overscrollBehavior = originalOverscroll;
				document.removeEventListener("touchmove", preventTouchScroll);
				clearTimeout(focusTimeout); // Не забываем очищать таймаут
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
					"fixed inset-x-0 top-0 h-dvh z-55 flex flex-col bg-background/60 backdrop-blur-2xl",
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
						<div className="flex-1 bg-white dark:bg-black rounded-2xl h-12 shadow-xs transition-all overflow-hidden flex items-center">
							<InlineSearchInput
								ref={inputRef}
								value={state.query}
								onChange={state.setQuery}
								fetchSuggestion={clientAutocompleteEquipmentAction}
								placeholder="Поиск техники..."
								className="bg-transparent border-none shadow-none h-full"
							/>
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
						<div className="px-1 py-2 w-full overflow-hidden animate-in slide-in-from-top-1 duration-150 snap-center">
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
				<div
					data-slot="search-panel-scroll"
					className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
				>
					<SearchPanel
						state={state}
						categories={categories}
						variant="mobile"
						onClose={handleClose}
						className="h-full"
					/>
				</div>
			</div>
		);
	}
);

MobileSearch.displayName = "MobileSearch";
