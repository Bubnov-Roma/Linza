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
			<div className="flex items-baseline justify-between container mx-auto">
				<h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase italic tracking-tight select-none px-4">
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
					"flex gap-4 overflow-x-auto pb-8 px-4 scroll-px-4 md:px-8 md:scroll-px-8 scroll-smooth no-scrollbar",
					"snap-x snap-mandatory",
					"mask-[linear-gradient(to_right,transparent,white_3%,white_97%,transparent)]"
				)}
			>
				{popular.map((item) => (
					<div
						key={item.id}
						className={cn(
							"shrink-0 snap-start transition-transform duration-300",
							"w-[70vw] xs:w-[280px] sm:w-72.5 md:w-75 lg:w-77.5 xl:w-78.5"
						)}
					>
						<EquipmentCard item={item} />
					</div>
				))}
			</div>
			<SliderPagination
				totalPages={totalPages}
				currentPage={currentPage}
				onPageClick={handlePageChange}
			/>
		</section>
	);
};
