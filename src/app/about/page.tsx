import { Suspense } from "react";
import { getAboutSettings } from "@/actions/admin/admin-about-actions";
import { auth } from "@/auth";
import AboutClientView from "@/components/layouts/About/AboutClientView";

export const metadata = {
	title: "О нас | LINZA",
	description:
		"Прокат фото- и видеооборудования в Самаре. Узнайте больше о нашей команде.",
};

export default async function AboutPage() {
	const [settings, session] = await Promise.all([getAboutSettings(), auth()]);

	// Сверяем роли с вашей логикой на главной: ADMIN или MANAGER
	const isAdmin =
		session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

	const defaultData = {
		heroTitle: settings?.heroTitle || "LINZA",
		heroSub: settings?.heroSub || "Готовые решения для вашей съёмки",
		description:
			settings?.description || "Прокат фото- видеооборудования в Самаре.",
		imageUrl: settings?.imageUrl || null,
	};

	return (
		<main className="min-h-screen pb-20 pt-10 md:pt-16">
			<Suspense
				fallback={
					<div className="text-center py-20 opacity-50 uppercase tracking-widest text-xs italic font-black">
						Загрузка...
					</div>
				}
			>
				<AboutClientView initialData={defaultData} isAdmin={isAdmin} />
			</Suspense>
		</main>
	);
}
