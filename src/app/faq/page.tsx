import { Suspense } from "react";
import { getFaqItemsAction } from "@/actions/admin-faq-actions";
import FaqClientPage from "@/components/layouts/Faq";

export const metadata = {
	title: "Ответы на частые вопросы | LINZA",
	description:
		"Прокат фото- и видеооборудования в Самаре. Ответы на самые популярные вопросы.",
};

export default async function FaqPage() {
	const items = await getFaqItemsAction();
	const active = items.filter((i) => i.isActive);

	return (
		<Suspense fallback={<FaqSkeleton />}>
			<FaqClientPage items={active} />
		</Suspense>
	);
}

function FaqSkeleton() {
	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto max-w-4xl px-4 py-20">
				<div className="mb-12 text-center space-y-4">
					<div className="h-12 w-64 rounded-2xl bg-foreground/5 mx-auto animate-pulse" />
					<div className="h-5 w-48 rounded-xl bg-foreground/4 mx-auto animate-pulse" />
					<div className="h-12 w-full max-w-xl rounded-full bg-foreground/4 mx-auto animate-pulse" />
				</div>
				<div
					className="grid gap-2"
					style={{
						gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
					}}
				>
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className="h-16 rounded-2xl bg-foreground/4 animate-pulse"
							style={{ animationDelay: `${i * 60}ms` }}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
