import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getClientSupportThreadsAction } from "@/actions/support-actions";
import { auth } from "@/auth";
import AdminClientThreadsClient from "@/components/admin/support/AdminClientThreadsClient";

export const metadata = {
	title: "Все чаты клиента | Поддержка | LINZA",
};

export default async function AdminClientThreadsPage({
	params,
}: {
	params: { clientId: string };
}) {
	const session = await auth();
	const role = session?.user?.role;

	if (role !== "ADMIN" && role !== "MANAGER") {
		redirect("/");
	}

	const result = await getClientSupportThreadsAction(params.clientId);

	if (!result.success) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<AdminClientSkeleton />}>
				<AdminClientThreadsClient
					clientId={params.clientId}
					initialThreads={result.threads || []}
				/>
			</Suspense>
		</div>
	);
}

function AdminClientSkeleton() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
			<div className="h-10 w-1/2 rounded-lg bg-foreground/5 animate-pulse" />
			<div className="space-y-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="h-20 rounded-lg bg-foreground/4 animate-pulse"
						style={{ animationDelay: `${i * 60}ms` }}
					/>
				))}
			</div>
		</div>
	);
}
