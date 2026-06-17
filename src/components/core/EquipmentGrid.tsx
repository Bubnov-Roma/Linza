"use client";

import { PackageIcon } from "@phosphor-icons/react";
import { EquipmentCard } from "@/components/shared/EquipmentCard";
import { Skeleton } from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";

interface EquipmentGridProps {
	items: GroupedEquipment[];
	isLoading: boolean;
}

function CardSkeleton() {
	return (
		<div className="flex flex-col h-full overflow-hidden rounded-3xl border border-foreground/3 bg-card/40 shadow-sm">
			{/* Image Wrapper */}
			<Skeleton className="aspect-4/3 w-full rounded-none bg-foreground/5" />

			{/* Content Body */}
			<div className="px-4 pt-4 flex flex-col gap-3 flex-1">
				{/* Title Line */}
				<div className="space-y-2">
					<Skeleton className="h-4 w-11/12 rounded bg-foreground/5" />
					<Skeleton className="h-4 w-3/4 rounded bg-foreground/5" />
				</div>
			</div>

			{/* Footer with Price Selectors */}
			<div className="mt-auto p-4 flex flex-col gap-4">
				{/* Options mimic (h4, h8, day tabs) */}
				<div className="flex p-1 gap-1 rounded-2xl bg-foreground/5">
					<Skeleton className="h-8 flex-1 rounded-xl bg-background/50" />
					<Skeleton className="h-8 flex-1 rounded-xl bg-transparent" />
					<Skeleton className="h-8 flex-1 rounded-xl bg-transparent" />
				</div>

				{/* Price and Add button mimic */}
				<div className="flex items-end justify-between gap-4">
					<Skeleton className="h-8 w-24 rounded-lg bg-foreground/5" />
					<Skeleton className="h-10 w-10 rounded-2xl bg-foreground/5" />
				</div>
			</div>
		</div>
	);
}

export function EquipmentGrid({ items, isLoading }: EquipmentGridProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-1 sm:gap-2 md:gap-4">
				{Array.from({ length: 10 }).map((_, i) => (
					<CardSkeleton key={i} />
				))}
			</div>
		);
	}

	const visibleItems = items.filter(
		(item) => item.isAvailable && item.isPrimary
	);

	if (visibleItems.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95 duration-300">
				<div className="w-20 h-20 mb-6 bg-foreground/5 rounded-3xl flex items-center justify-center shadow-inner">
					<PackageIcon size={42} className="opacity-30" weight="duotone" />
				</div>
				<h3 className="text-2xl font-black uppercase italic tracking-tight opacity-80">
					Ничего не найдено
				</h3>
				<p className="text-base text-muted-foreground mt-2 font-medium">
					Попробуйте изменить фильтры или выбрать другую категорию
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-1 sm:gap-4 md:gap-4">
			{visibleItems.map((item) => (
				<EquipmentCard key={item.id} item={item} />
			))}
		</div>
	);
}
