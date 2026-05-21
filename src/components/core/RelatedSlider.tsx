"use client";

import { useEffect, useRef, useState } from "react";
import { getRelatedEquipmentAction } from "@/actions/admin-equipment-actions";
import { EquipmentCard } from "@/components/shared";
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
		const pagesCount = Math.ceil(scrollWidth / clientWidth);
		setTotalPages(pagesCount);
		setCurrentPage(
			Math.round(
				(scrollLeft / (scrollWidth - clientWidth)) * (pagesCount - 1)
			) || 0
		);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		updatePagination();
		window.addEventListener("resize", updatePagination);
		return () => window.removeEventListener("resize", updatePagination);
	}, [items]);

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
			<div className={cn("relative group")}>
				{/* Контейнер с карточками */}
				<div className="overflow-hidden pb-6">
					<div
						ref={scrollRef}
						onScroll={updatePagination}
						className="flex gap-4 overflow-x-auto no-scrollbar px-6"
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

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-1.5">
					{Array.from({ length: totalPages }).map((_, i) => (
						<button
							key={i}
							type="button"
							onClick={() => {
								const container = scrollRef.current;
								if (!container) return;
								const target =
									(i / (totalPages - 1)) *
									(container.scrollWidth - container.clientWidth);
								container.scrollTo({ left: target, behavior: "smooth" });
							}}
							className={cn(
								"rounded-full transition-all duration-300",
								i === currentPage
									? "w-6 h-3 bg-foreground/80"
									: "w-3 h-3 bg-foreground/20"
							)}
						/>
					))}
				</div>
			)}
		</div>
	);
}
