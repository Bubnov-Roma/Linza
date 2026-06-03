import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getSupportThreadAction } from "@/actions/support-actions";
import { auth } from "@/auth";
import AdminThreadDetailClient from "@/components/admin/support/AdminThreadDetailClient";

export const metadata = {
	title: "Просмотр потока | Поддержка | LINZA",
};

export default async function AdminSupportThreadPage({
	params,
}: {
	params: Promise<{ threadId: string }>;
}) {
	const session = await auth();
	const role = session?.user?.role;

	if (role !== "ADMIN" && role !== "MANAGER") {
		redirect("/");
	}

	const { threadId } = await params;

	const result = await getSupportThreadAction(threadId);

	if (!result.success || !result.thread) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<AdminThreadSkeleton />}>
				<AdminThreadDetailClient initialThread={result.thread} />
			</Suspense>
		</div>
	);
}

function AdminThreadSkeleton() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
			<div className="h-10 w-1/2 rounded-lg bg-foreground/5 animate-pulse" />
			<div className="h-64 rounded-lg bg-foreground/4 animate-pulse" />
			<div className="h-24 rounded-lg bg-foreground/4 animate-pulse" />
		</div>
	);
}
