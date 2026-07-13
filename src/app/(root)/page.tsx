import { Suspense } from "react";
import { getBannersFromDb } from "@/actions/admin-banner-actions";
import { getCategoriesFromDb } from "@/actions/admin-category-actions";
import { getFeaturedEquipment } from "@/actions/equipment-actions";
import { auth } from "@/auth";
import { CategoriesGrid } from "@/components/core/CategoriesGrid";
import { HeroSection } from "@/components/layouts/home/hero/HeroSection";
import { HowItWorks } from "@/components/layouts/home/how-it-works/HowItWorks";
import { PopularItems } from "@/components/layouts/home/popular/PopularItems";
import { PopularItemsSkeleton } from "@/components/layouts/home/popular/PopularItemsSkeleton";
import { StudioSection } from "@/components/layouts/home/studio/StudioSection";
import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";

async function PopularItemsSection() {
	const featuredItems = await getFeaturedEquipment();
	return <PopularItems popular={featuredItems} />;
}

export default async function HomePage() {
	const [allBanners, categories, session] = await Promise.all([
		getBannersFromDb(),
		getCategoriesFromDb(),
		auth(),
	]);

	const isAdmin =
		session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

	const heroBanners = allBanners.filter(
		(b) => b.placement === "hero" || b.placement === "both"
	);

	return (
		<div className="flex flex-col gap-10 pb-20">
			<LocalBusinessSchema />
			<HeroSection isAdmin={isAdmin} banners={heroBanners} />
			<CategoriesGrid categories={categories} />
			<HowItWorks />
			<Suspense fallback={<PopularItemsSkeleton />}>
				<PopularItemsSection />
			</Suspense>
			<StudioSection
				isAdmin={isAdmin}
				banners={allBanners.filter(
					(b) => b.placement === "studio" || b.placement === "both"
				)}
			/>
		</div>
	);
}
