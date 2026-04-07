"use client";

import { Box } from "lucide-react";
import { EquipmentCard } from "@/components/shared/EquipmentCard";
import { Skeleton } from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";

interface EquipmentGridProps {
	items: GroupedEquipment[];
	isLoading: boolean;
}

function CardSkeleton() {
	return (
		<div className="flex flex-col gap-2.5">
			<Skeleton className="aspect-4/3 w-full rounded-xl bg-foreground/6" />
			<div className="px-0.5 space-y-1.5">
				<Skeleton className="h-3 w-5/6 rounded bg-foreground/6" />
				<Skeleton className="h-3 w-3/5 rounded bg-foreground/6" />
				<div className="flex items-center justify-between pt-1">
					<Skeleton className="h-4 w-16 rounded-lg bg-foreground/6" />
					<Skeleton className="h-8 w-24 rounded-xl bg-foreground/6" />
				</div>
			</div>
		</div>
	);
}

export function EquipmentGrid({ items, isLoading }: EquipmentGridProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-3 gap-y-6">
				{Array.from({ length: 12 }).map((_, i) => (
					<CardSkeleton key={i} />
				))}
			</div>
		);
	}

	const visibleItems = items.filter((item) => item.isAvailable);

	if (visibleItems.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center">
				<div className="w-16 h-16 mb-4 bg-foreground/5 rounded-full flex items-center justify-center">
					<Box size={28} className="opacity-20" />
				</div>
				<h3 className="text-lg font-bold">Ничего не найдено</h3>
				<p className="text-sm text-muted-foreground mt-1">
					Попробуйте изменить фильтры или категорию
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-x-3 gap-y-6 md:gap-4">
			{visibleItems.map((item) => (
				<EquipmentCard key={item.id} item={item} />
			))}
		</div>
	);
}
