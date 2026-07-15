import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoriesFromDb } from "@/actions/admin/admin-category-actions";
import { getEquipmentBySlug } from "@/actions/equipment-actions";
import EquipmentDetails, {
	type EquipmentFormState,
} from "@/components/core/EquipmentDetails";
import { ProductSchema } from "@/components/seo/ProductSchema";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// dynamic metadata
export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const equipment = await getEquipmentBySlug(slug);

	if (!equipment) {
		return {
			title: "Оборудование не найдено | Linza",
		};
	}

	const ogImage = equipment.imageUrl || "https://linzarental.ru/og-image.png";

	const isRepresentative = equipment.isPrimary === true;
	return {
		title: `${equipment.title} – аренда в Самаре | Linza`,
		description: equipment.description || `Аренда ${equipment.title} в Самаре.`,
		robots: isRepresentative
			? { index: true, follow: true }
			: { index: false, follow: true },
		openGraph: {
			title: equipment.title,
			description:
				equipment.description || `Аренда ${equipment.title} в Самаре.`,
			url: `https://linzarental.ru/equipment/item/${equipment.slug}`,
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
					alt: equipment.title,
				},
			],
			type: "website",
		},
		alternates: {
			canonical: `/equipment/item/${equipment.slug}`,
		},
	};
}

export default async function EquipmentDetailsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	const [equipment, categories] = await Promise.all([
		getEquipmentBySlug(slug),
		getCategoriesFromDb(),
	]);

	if (!equipment) notFound();

	const currentCategory = categories.find((c) => c.id === equipment.categoryId);

	return (
		<div className="pb-8">
			<ProductSchema
				name={equipment.title}
				description={
					equipment.description ?? "аренда фото-видео техники в Самаре"
				}
				image={equipment.imageUrl}
				sku={equipment.id}
				price={equipment.pricePerDay}
				priceCurrency="RUB"
				url={`https://linzarental.ru/equipment/item/${equipment.slug}`}
				availability={
					equipment.isAvailable
						? "https://schema.org/InStock"
						: "https://schema.org/OutOfStock"
				}
			/>
			<div className="container mx-auto px-6 py-4">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">Главная</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href="/equipment">Каталог</BreadcrumbLink>
						</BreadcrumbItem>
						{currentCategory && (
							<>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									<BreadcrumbLink
										href={`/equipment?category=${currentCategory.slug}`}
									>
										{currentCategory.name}
									</BreadcrumbLink>
								</BreadcrumbItem>
							</>
						)}
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="max-w-50 truncate">
								{equipment.title}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</div>

			<EquipmentDetails
				equipment={equipment as unknown as EquipmentFormState}
			/>
		</div>
	);
}
