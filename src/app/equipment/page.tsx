import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategoriesFromDb } from "@/actions/admin-category-actions";
import { getEquipment } from "@/actions/admin-equipment-actions";
import EquipmentClientPage from "@/components/core/EquipmentClientPage";
import { EquipmentGrid } from "@/components/core/EquipmentGrid";

export type EquipmentSearchParams = {
	category?: string;
	subcategory?: string;
	search?: string;
};

interface PageProps {
	searchParams: Promise<EquipmentSearchParams>;
}

export async function generateMetadata({
	searchParams,
}: PageProps): Promise<Metadata> {
	const params = await searchParams;
	const categories = await getCategoriesFromDb();

	const currentCategory = categories.find((c) => c.slug === params.category);
	const currentSubcategory = currentCategory?.subcategories?.find(
		(s) => s.slug === params.subcategory
	);

	let title = "Каталог проката фото- и видеотехники в Самаре | Linza";
	let description =
		"Каталог аренды профессионального съемочного оборудования в Самаре. Камеры, объективы, свет, звук и аксессуары на сайте Linza.";

	if (currentSubcategory && currentCategory) {
		title = `${currentSubcategory.name.toLowerCase()} Аренда в Самаре — прокат Linza`;
		description = `Ищете прокат оборудования из категории «${currentSubcategory.name}» в Самаре? Большой выбор техники в аренду в разделе ${currentCategory.name} на сайте Linza.`;
	}
	// Если выбрана только основная категория
	else if (currentCategory) {
		title = `Прокат и аренда оборудования «${currentCategory.name}» в Самаре | Linza`;
		description = `Каталог профессиональной техники в категории «${currentCategory.name}» в Самаре. Выгодные условия проката, онлайн-бронирование оборудования на Linza.`;
	}

	const urlParams = new URLSearchParams();
	if (params.category) urlParams.set("category", params.category);
	if (params.subcategory) urlParams.set("subcategory", params.subcategory);

	const queryString = urlParams.toString();
	const queryPath = queryString ? `?${queryString}` : "";

	return {
		title,
		description,
		alternates: {
			canonical: `/equipment${queryPath}`,
		},
		openGraph: {
			title,
			description,
			url: `https://linzarental.ru/equipment${queryPath}`,
		},
	};
}

function PageSkeleton() {
	return (
		<div className="flex flex-col flex-1 min-w-0 p-6 md:p-10 space-y-8">
			<EquipmentGrid items={[]} isLoading={true} />
		</div>
	);
}

export default async function EquipmentPage({ searchParams }: PageProps) {
	const params = await searchParams;

	const [initialData, categories] = await Promise.all([
		getEquipment({
			categorySlug: params.category || "all",
			subcategorySlug: params.subcategory || "",
			search: params.search || "",
		}),
		getCategoriesFromDb(),
	]);

	return (
		<Suspense fallback={<PageSkeleton />}>
			<EquipmentClientPage initialData={initialData} categories={categories} />
		</Suspense>
	);
}
