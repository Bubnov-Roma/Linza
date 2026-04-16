import { getBannersFromDb } from "@/actions/admin-banner-actions";
import { getCategoriesFromDb } from "@/actions/admin-category-actions";
import { getEquipment } from "@/actions/admin-equipment-actions";
import { auth } from "@/auth";
import { CategoriesGrid } from "@/components/core/CategoriesGrid";
import { EventsBanner } from "@/components/home/events-banner/EventsBanner";
import { HeroSection } from "@/components/home/hero/HeroSection";
import { HowItWorks } from "@/components/home/how-it-works/HowItWorks";
import { PopularItems } from "@/components/home/popular/PopularItems";
import { StudioSection } from "@/components/home/studio/StudioSection";

export default async function HomePage() {
	const [banners, categories, featuredItems, session] = await Promise.all([
		getBannersFromDb(),
		getCategoriesFromDb(),
		getEquipment({ categorySlug: "all" }),
		auth(),
	]);

	// Популярные позиции — первые 8 isPrimary
	const popular = featuredItems.filter((i) => i.isPrimary).slice(0, 8);
	const isAdmin =
		session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

	return (
		<div className="flex flex-col gap-12 pb-20">
			<HeroSection isAdmin={isAdmin} banners={banners} />
			<HowItWorks />
			<CategoriesGrid categories={categories} />
			{banners.length > 0 && <EventsBanner banners={banners} />}
			{popular.length > 0 && <PopularItems popular={popular} />}
			<StudioSection />
			{/* ── Статистика ── */}
			<section className="container mx-auto px-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{[
						{ value: "500+", label: "Единиц техники" },
						{ value: "98%", label: "Положительных отзывов" },
						{ value: "1000+", label: "Успешных аренд" },
						{ value: "24/7", label: "Техподдержка" },
					].map((stat) => (
						<div
							key={stat.label}
							className="text-center p-6 rounded-2xl border border-foreground/8 bg-foreground/2"
						>
							<div className="text-3xl font-black text-primary">
								{stat.value}
							</div>
							<div className="text-xs text-muted-foreground mt-1">
								{stat.label}
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
