import { redirect } from "next/navigation";
import {
	getPendingStudioBookingsCountAction,
	getStudioTariffsAction,
} from "@/actions/admin/admin-studio-actions";
import { auth } from "@/auth";
import { AdminStudioPageClient } from "@/components/admin/studio/AdminStudioPageClient";

export const metadata = {
	title: "Студия — Панель управления",
};

export default async function AdminStudioPage() {
	const session = await auth();
	if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
		redirect("/");
	}

	const [tariffs, pendingCount] = await Promise.all([
		getStudioTariffsAction(),
		getPendingStudioBookingsCountAction(),
	]);

	return (
		<AdminStudioPageClient
			tariffs={tariffs}
			pendingCount={pendingCount}
			isAdmin={session.user.role === "ADMIN"}
		/>
	);
}
