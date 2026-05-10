import { getBannersFromDb } from "@/actions/admin-banner-actions";
import { getCategoriesFromDb } from "@/actions/admin-category-actions";
import { getFeaturedEquipment } from "@/actions/admin-equipment-actions";
import { auth } from "@/auth";
import { CategoriesGrid } from "@/components/core/CategoriesGrid";
import { HeroSection } from "@/components/layouts/home/hero/HeroSection";
import { HowItWorks } from "@/components/layouts/home/how-it-works/HowItWorks";
import { PopularItems } from "@/components/layouts/home/popular/PopularItems";
import { StudioSection } from "@/components/layouts/home/studio/StudioSection";

export default async function HomePage() {
	const [banners, categories, featuredItems, session] = await Promise.all([
		getBannersFromDb(),
		getCategoriesFromDb(),
		getFeaturedEquipment(),
		auth(),
	]);

	const isAdmin =
		session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

	return (
		<div className="flex flex-col gap-12 pb-20">
			<HeroSection isAdmin={isAdmin} banners={banners} />
			<CategoriesGrid categories={categories} />
			{featuredItems.length > 0 && <PopularItems popular={featuredItems} />}
			<HowItWorks />
			<StudioSection banners={banners} />
		</div>
	);
}
