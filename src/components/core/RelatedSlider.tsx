"use client";

import { useEffect, useRef, useState } from "react";
import { getRelatedEquipmentAction } from "@/actions/admin-equipment-actions";
import { EquipmentCard, SliderPagination } from "@/components/shared";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

export function RelatedSlider({ ids }: { ids: string[] }) {
	const [items, setItems] = useState<GroupedEquipment[]>([]);
	const [loading, setLoading] = useState(true);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [currentPage, setCurrentPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);

	useEffect(() => {
		if (!ids.length) return;
		let cancelled = false;
		setLoading(true);
		getRelatedEquipmentAction(ids).then((data) => {
			if (!cancelled) {
				setItems(data.filter((i): i is GroupedEquipment => i !== undefined));
				setLoading(false);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [ids]);

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

		const activePage =
			Math.round((scrollLeft / maxScrollLeft) * (pagesCount - 1)) || 0;

		// Тактильный клик при свайпе пальцем, когда точка реально переключается
		setCurrentPage((prev) => {
			if (prev !== activePage) {
				if (typeof window !== "undefined" && navigator.vibrate) {
					navigator.vibrate(6); // Микро-клик, как на колесиках в iOS
				}
				return activePage;
			}
			return prev;
		});
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		updatePagination();
		window.addEventListener("resize", updatePagination);
		return () => window.removeEventListener("resize", updatePagination);
	}, [items]);

	const handlePageChange = (pageIndex: number) => {
		const container = scrollRef.current;
		if (!container) return;
		const target =
			(pageIndex / (totalPages - 1)) *
			(container.scrollWidth - container.clientWidth);
		container.scrollTo({ left: target, behavior: "smooth" });
	};

	if (loading || !items.length)
		return (
			<div className="h-40 animate-pulse bg-foreground/5 rounded-3xl aspect-3/4" />
		);

	return (
		<div
			className={cn(
				"space-y-6",
				"mask-[linear-gradient(to_right,transparent,white_3%,white_97%,transparent)]"
			)}
		>
			<div className="relative group">
				<div className="overflow-hidden pb-6">
					<div
						ref={scrollRef}
						onScroll={updatePagination}
						className={cn(
							"flex gap-4 overflow-x-auto no-scrollbar px-6",
							"snap-x snap-mandatory scroll-px-6 scroll-smooth"
						)}
					>
						{items.map((item) => (
							<div
								key={item.id}
								className="shrink-0 snap-start w-[calc(50%-6px)] md:w-55"
							>
								<EquipmentCard item={item} variant="slider" />
							</div>
						))}
					</div>
				</div>
			</div>

			<SliderPagination
				totalPages={totalPages}
				currentPage={currentPage}
				onPageClick={handlePageChange}
			/>
		</div>
	);
}
