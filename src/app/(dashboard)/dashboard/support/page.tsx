import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUserSupportThreadsAction } from "@/actions/support-actions";
import { auth } from "@/auth";
import SupportThreadListClient from "@/components/dashboard/support/SupportThreadListClient";

export const metadata = {
	title: "Моя поддержка | LINZA",
	description: "Просмотр вашей переписки с поддержкой",
};

export default async function SupportPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/auth/signin");
	}

	const threads = await getUserSupportThreadsAction();

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<SupportListSkeleton />}>
				<SupportThreadListClient initialThreads={threads} />
			</Suspense>
		</div>
	);
}

function SupportListSkeleton() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-10 space-y-4">
			<div className="h-10 w-48 rounded-lg bg-foreground/5 animate-pulse" />
			{Array.from({ length: 5 }).map((_, i) => (
				<div
					key={i}
					className="h-20 rounded-xl bg-foreground/4 animate-pulse"
					style={{ animationDelay: `${i * 60}ms` }}
				/>
			))}
		</div>
	);
}
