import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAdminAllSupportThreadsAction } from "@/actions/support-actions";
import { auth } from "@/auth";
import AdminSupportListClient from "@/components/admin/support/AdminSupportListClient";

export const metadata = {
	title: "Поддержка клиентов | Администратор | LINZA",
};

export default async function AdminSupportPage() {
	const session = await auth();
	const role = session?.user?.role;

	if (role !== "ADMIN" && role !== "MANAGER") {
		redirect("/");
	}

	const threads = await getAdminAllSupportThreadsAction();

	return (
		<div className="min-h-screen bg-background">
			<Suspense fallback={<AdminSupportSkeleton />}>
				<AdminSupportListClient initialThreads={threads} />
			</Suspense>
		</div>
	);
}

function AdminSupportSkeleton() {
	return (
		<div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
			<div className="h-12 w-48 rounded-lg bg-foreground/5 animate-pulse" />
			<div className="grid gap-2 md:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="h-24 rounded-lg bg-foreground/4 animate-pulse"
						style={{ animationDelay: `${i * 60}ms` }}
					/>
				))}
			</div>
		</div>
	);
}
