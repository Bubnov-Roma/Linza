"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { EquipmentCard, SliderPagination } from "@/components/shared";
import { Button } from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

export const PopularItems = ({ popular }: { popular: GroupedEquipment[] }) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [currentPage, setCurrentPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	const updatePagination = () => {
		const container = scrollRef.current;
		if (!container) return;

		const { scrollLeft, clientWidth, scrollWidth } = container;
		const maxScrollLeft = scrollWidth - clientWidth;

		if (maxScrollLeft <= 0) {
			setTotalPages(0);
			setCurrentPage(0);
			return;
		}

		const pagesCount = Math.ceil(scrollWidth / clientWidth);
		setTotalPages(pagesCount);

		const activePage = Math.round(
			(scrollLeft / maxScrollLeft) * (pagesCount - 1)
		);
		setCurrentPage(activePage);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		updatePagination();
		window.addEventListener("resize", updatePagination);
		return () => window.removeEventListener("resize", updatePagination);
	}, [popular]);

	const handleScroll = () => {
		updatePagination();
	};

	const handlePageChange = (pageIndex: number) => {
		const container = scrollRef.current;
		if (!container) return;
		const target =
			(pageIndex / (totalPages - 1)) *
			(container.scrollWidth - container.clientWidth);
		container.scrollTo({ left: target, behavior: "smooth" });
	};

	if (popular.length === 0) return null;

	return (
		<section>
			<div className="flex items-baseline justify-between px-4 container mx-auto">
				<h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase italic tracking-tight select-none">
					Популярное
				</h2>
				<Button
					asChild
					variant="link"
					size="xl"
					className="text-sm text-foreground/80 px-2 uppercase font-black italic"
				>
					<Link href="/equipment">Все позиции</Link>
				</Button>
			</div>
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				className={cn(
					"flex gap-4 overflow-x-auto pb-6 px-4 scroll-px-4 scroll-smooth no-scrollbar",
					"snap-x snap-mandatory",
					"mask-[linear-gradient(to_right,transparent,white_4%,white_96%,transparent)]"
				)}
			>
				{popular.map((item) => (
					<div
						key={item.id}
						className={cn(
							"shrink-0 snap-start transition-transform duration-300",
							"w-[70vw] xs:w-[280px] sm:w-72.5 md:w-75 lg:w-77.5 xl:w-78.75"
						)}
					>
						<EquipmentCard item={item} />
					</div>
				))}
			</div>

			{/* Точки навигации ( px-4 на случай если точек будет очень много на мобилках) */}
			{/* {totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 pt-2 flex-wrap px-4">
					{Array.from({ length: totalPages }).map((_, i) => (
						<button
							key={i}
							type="button"
							onClick={() => {
								const container = scrollRef.current;
								if (!container) return;
								const { clientWidth, scrollWidth } = container;
								const maxScrollLeft = scrollWidth - clientWidth;
								const targetScroll = (i / (totalPages - 1)) * maxScrollLeft;
								container.scrollTo({ left: targetScroll, behavior: "smooth" });
							}}
							className={cn(
								"h-3 rounded-full transition-all duration-300",
								i === currentPage
									? "w-6 bg-foreground"
									: "w-3 bg-foreground/20 hover:bg-foreground/40"
							)}
							aria-label={`Перейти к странице ${i + 1}`}
						/>
					))}
				</div>
			)} */}
			<SliderPagination
				totalPages={totalPages}
				currentPage={currentPage}
				onPageClick={handlePageChange}
			/>
		</section>
	);
};
