"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CategoryFilter } from "@/components/core/CategoryFilter";
import { EquipmentGrid } from "@/components/core/EquipmentGrid";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type {
	DbCategory,
	GroupedEquipment,
} from "@/core/domain/entities/Equipment";
import { useEquipment } from "@/hooks";
import { formatPlural } from "@/utils";

interface PageProps {
	initialData: GroupedEquipment[];
	categories: DbCategory[];
}

const crumbLinkClass =
	"text-muted-foreground hover:text-foreground transition-colors text-sm";

export default function EquipmentClientPage({
	initialData,
	categories,
}: PageProps) {
	const searchParams = useSearchParams();

	const categorySlug = searchParams.get("category") || "all";
	const subcategorySlug = searchParams.get("subcategory") || "";
	const searchQuery = searchParams.get("search") || "";

	const { scrollY } = useScroll();
	const [isFilterHidden, setIsFilterHidden] = useState(false);

	useMotionValueEvent(scrollY, "change", (latest) => {
		const previous = scrollY.getPrevious();

		// Если предыдущего значения нет, выходим
		if (previous === undefined) return;

		// Скрываем, если скроллим вниз И уже проскроллили шапку (например, > 150px)
		if (latest > previous && latest > 180) {
			setIsFilterHidden(true);
		}
		// Показываем, если скроллим вверх
		else {
			setIsFilterHidden(false);
		}
	});

	const currentCategory = useMemo(
		() => categories.find((c) => c.slug === categorySlug) ?? null,
		[categorySlug, categories]
	);

	const currentSubcategory = useMemo(() => {
		if (!subcategorySlug || !currentCategory?.subcategories) return null;
		return (
			currentCategory.subcategories.find((s) => s.slug === subcategorySlug) ??
			null
		);
	}, [subcategorySlug, currentCategory]);

	const equipmentFilters = useMemo(
		() => ({
			categorySlug,
			subcategorySlug: subcategorySlug || undefined,
			search: searchQuery || undefined,
		}),
		[categorySlug, subcategorySlug, searchQuery]
	);

	const { data: items, isLoading } = useEquipment(
		equipmentFilters,
		initialData
	);

	const pageTitle =
		currentSubcategory?.name ??
		(categorySlug === "all"
			? "Вся техника"
			: (currentCategory?.name ?? "Каталог"));

	return (
		<div className="flex flex-col flex-1 min-w-0 pb-20 overflow-visible">
			{/* Header Area */}
			<div className="px-4 lg:px-8 pt-8 md:pt-10 space-y-6">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<Link href="/" className={crumbLinkClass}>
								Главная
							</Link>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							{categorySlug === "all" ? (
								<BreadcrumbPage>Каталог</BreadcrumbPage>
							) : (
								<Link href="/equipment" className={crumbLinkClass}>
									Каталог
								</Link>
							)}
						</BreadcrumbItem>
						{categorySlug !== "all" && (
							<>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									{currentSubcategory ? (
										<Link
											href={`/equipment?category=${currentCategory?.slug}`}
											className={crumbLinkClass}
										>
											{currentCategory?.name}
										</Link>
									) : (
										<BreadcrumbPage>{currentCategory?.name}</BreadcrumbPage>
									)}
								</BreadcrumbItem>
							</>
						)}
						{currentSubcategory && (
							<>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbPage>{currentSubcategory.name}</BreadcrumbPage>
								</BreadcrumbItem>
							</>
						)}
					</BreadcrumbList>
				</Breadcrumb>

				<div>
					<h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
						{pageTitle}
					</h1>
					{!isLoading && items ? (
						<p className="text-muted-foreground mt-3 font-medium">
							{items.length === 0
								? "Позиций не найдено"
								: formatPlural(items.length, "equipment")}
						</p>
					) : (
						<p className="text-muted-foreground mt-3 font-medium">Поиск...</p>
					)}
				</div>
			</div>

			{/* 2. Анимированная капсула фильтров */}
			<motion.div
				variants={{
					visible: { y: 0 },
					hidden: { y: "-200%" },
				}}
				animate={isFilterHidden ? "hidden" : "visible"}
				transition={{ duration: 0.3, ease: "easeInOut" }}
				className="sticky top-3 md:top-16 z-15 md:z-5 px-1 lg:px-8 mt-6 pb-4"
			>
				<CategoryFilter categories={categories} isPending={isLoading} />
			</motion.div>

			{/* Grid Area */}
			<div className="px-1 sm:px-2 md:px-4 lg:px-8 mt-6">
				<EquipmentGrid items={items || []} isLoading={isLoading} />
			</div>
		</div>
	);
}
