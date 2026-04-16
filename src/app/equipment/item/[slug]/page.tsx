import { notFound } from "next/navigation";
import { getCategoriesFromDb } from "@/actions/admin-category-actions";
import { getEquipmentBySlug } from "@/actions/admin-equipment-actions";
import EquipmentDetails, {
	type EquipmentFormState,
} from "@/components/core/EquipmentDetails";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
		<div className="min-h-screen bg-background text-foreground pb-20">
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
