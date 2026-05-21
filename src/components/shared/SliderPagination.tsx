"use client";

import { cn } from "@/lib/utils";

interface SliderPaginationProps {
	totalPages: number;
	currentPage: number;
	onPageClick: (index: number) => void;
}

export function SliderPagination({
	totalPages,
	currentPage,
	onPageClick,
}: SliderPaginationProps) {
	if (totalPages <= 1) return null;

	const handlePageClick = (index: number) => {
		if (typeof window !== "undefined" && navigator.vibrate) {
			navigator.vibrate(8);
		}
		onPageClick(index);
	};

	return (
		<div className="flex items-center justify-center gap-2 pt-2 flex-wrap px-4">
			{Array.from({ length: totalPages }).map((_, i) => {
				const isActive = i === currentPage;
				return (
					<button
						key={i}
						type="button"
						onClick={() => handlePageClick(i)}
						className={cn(
							"h-3 rounded-full transition-all duration-300 ease-out outline-none",
							isActive
								? "w-6 bg-foreground/90 scale-105 shadow-xs"
								: "w-3 bg-foreground/20 hover:bg-foreground/40 active:scale-90"
						)}
						aria-label={`Перейти к странице ${i + 1}`}
					/>
				);
			})}
		</div>
	);
}
