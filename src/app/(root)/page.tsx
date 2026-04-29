import { getBannersFromDb } from "@/actions/admin-banner-actions";
import { getCategoriesFromDb } from "@/actions/admin-category-actions";
import { getFeaturedEquipment } from "@/actions/admin-equipment-actions";
import { auth } from "@/auth";
import { CategoriesGrid } from "@/components/core/CategoriesGrid";
import { EventsBanner } from "@/components/layouts/home/events-banner/EventsBanner";
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
			<HowItWorks />
			<CategoriesGrid categories={categories} />
			{banners.length > 0 && <EventsBanner banners={banners} />}
			{featuredItems.length > 0 && <PopularItems popular={featuredItems} />}
			<StudioSection />
		</div>
	);
}
