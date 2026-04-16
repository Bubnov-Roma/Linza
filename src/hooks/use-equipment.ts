"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getEquipment } from "@/actions/admin-equipment-actions";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";

export type UseEquipmentFilters = {
	search?: string | undefined;
	categorySlug?: string | undefined;
	subcategorySlug?: string | undefined;
	limit?: number | undefined;
	group?: boolean | undefined;
};

export function useEquipment(
	filters: UseEquipmentFilters,
	initialData?: GroupedEquipment[]
) {
	const memoFilters = useMemo(
		() => ({
			search: filters.search?.trim() || undefined,
			categorySlug: filters.categorySlug || "all",
			subcategorySlug: filters.subcategorySlug || undefined,
		}),
		[filters.search, filters.categorySlug, filters.subcategorySlug]
	);

	return useQuery({
		queryKey: ["equipment", memoFilters],
		queryFn: async (): Promise<GroupedEquipment[]> => {
			const data = await getEquipment({
				search: memoFilters.search,
				categorySlug: memoFilters.categorySlug,
				subcategorySlug: memoFilters.subcategorySlug,
			});

			return data;
		},
		initialData,
		staleTime: 1000 * 60 * 3, // 3 минуты
		gcTime: 1000 * 60 * 10,
		refetchOnWindowFocus: false,
		retry: 1,
	});
}
