import { getCategoriesFromDb } from "@/actions/admin/admin-category-actions";
import AdminCategoriesClient from "@/components/admin/categories/AdminCategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
	const categories = await getCategoriesFromDb();
	return <AdminCategoriesClient initialCategories={categories} />;
}
