"use client";

import { Button } from "@/components/ui";
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
		<div className="flex items-center justify-center gap-2 py-2 flex-wrap px-4 bg-background/30 rounded-full">
			{Array.from({ length: totalPages }).map((_, i) => {
				const isActive = i === currentPage;
				return (
					<Button
						key={i}
						variant="ghost"
						type="button"
						onClick={() => handlePageClick(i)}
						className={cn(
							"h-3 rounded-full transition-all duration-300 ease-out outline-none p-0 bg-foreground/30",
							isActive ? "w-6 scale-105 shadow-xs" : "w-3  active:scale-90"
						)}
						aria-label={`Перейти к странице ${i + 1}`}
					/>
				);
			})}
		</div>
	);
}
