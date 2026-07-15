import { Suspense } from "react";
import { getActiveStudioTariffsAction } from "@/actions/admin/admin-studio-actions";
import { StudioPageClient } from "@/components/studio/StudioPageClient";

export const metadata = {
	title: "Аренда студии — Linza",
	description:
		"Аренда профессиональной фотостудии с постоянным и импульсным светом, циклорамой и зоной ожидания.",
};

export default async function StudioPage() {
	const tariffs = await getActiveStudioTariffsAction();

	return (
		<Suspense fallback={<StudioPageSkeleton />}>
			<StudioPageClient tariffs={tariffs} />
		</Suspense>
	);
}

function StudioPageSkeleton() {
	return (
		<div className="min-h-screen animate-pulse">
			<div className="h-[60vh] bg-foreground/5 rounded-3xl mx-4 mb-12" />
		</div>
	);
}
