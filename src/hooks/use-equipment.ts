"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { getEquipment } from "@/actions/admin-equipment-actions";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";

type UseEquipmentFilters = {
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
	// 1. Фиксируем фильтры, которые были на странице в самый первый момент её монтирования
	const initialFiltersRef = useRef(memoFilters);

	// 2. Проверяем, совпадают ли текущие фильтры с начальными
	const isMatchingInitialFilters = useMemo(() => {
		return (
			memoFilters.search === initialFiltersRef.current.search &&
			memoFilters.categorySlug === initialFiltersRef.current.categorySlug &&
			memoFilters.subcategorySlug === initialFiltersRef.current.subcategorySlug
		);
	}, [memoFilters]);

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
		// 3. Передаем initialData только если фильтры совпадают с исходными.
		// Если клиент переключил категорию, initialData станет undefined, и включится чистый скелетон без мигания старыми данными.
		initialData: isMatchingInitialFilters ? initialData : undefined,
		staleTime: 1000 * 60 * 3,
		gcTime: 1000 * 60 * 10,
		refetchOnWindowFocus: false,
		retry: 1,
	});
}
