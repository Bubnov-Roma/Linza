import { redirect } from "next/navigation";
import { getFaqItemsAction } from "@/actions/admin/admin-faq-actions";
import { auth } from "@/auth";
import AdminFaqClient from "@/components/admin/faq/AdminFaqClient";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
	const session = await auth();
	const role = session?.user?.role;

	if (role !== "ADMIN" && role !== "MANAGER") {
		redirect("/");
	}

	const items = await getFaqItemsAction();

	return <AdminFaqClient initialItems={items} />;
}
