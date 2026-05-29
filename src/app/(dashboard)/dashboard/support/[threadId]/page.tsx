import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getSupportThreadAction } from "@/actions/support-actions";
import { auth } from "@/auth";
import SupportThreadDetailClient from "@/components/dashboard/support/SupportThreadDetailClient";

export const metadata = {
	title: "Поддержка | LINZA",
};

export default async function SupportThreadPage({
	params,
}: {
	params: { threadId: string };
}) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/auth/signin");
	}

	const result = await getSupportThreadAction(params.threadId);

	if (!result.success || !result.thread) {
		notFound();
	}

	const thread = result.thread;

	// Проверка доступа: клиент может видеть только свои потоки
	if (thread.userId !== session.user.id) {
		const role = session.user.role;
		if (role !== "ADMIN" && role !== "MANAGER") {
			notFound();
		}
	}

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<SupportDetailSkeleton />}>
				<SupportThreadDetailClient initialThread={thread} />
			</Suspense>
		</div>
	);
}

function SupportDetailSkeleton() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
			<div className="h-10 w-1/2 rounded-lg bg-foreground/5 animate-pulse" />
			<div className="space-y-3">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className={cn(
							"h-16 rounded-lg bg-foreground/4 animate-pulse",
							i % 2 === 0 ? "mr-auto w-3/4" : "ml-auto w-2/3"
						)}
						style={{ animationDelay: `${i * 60}ms` }}
					/>
				))}
			</div>
		</div>
	);
}

function cn(...classes: (string | undefined | null | false)[]) {
	return classes.filter(Boolean).join(" ");
}
