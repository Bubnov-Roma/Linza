import { getPaginatedUsersAction } from "@/actions/admin/admin-user-actions";
import UsersTable from "@/components/admin/users/UsersTable";
import type { UserProfile } from "@/core/domain/entities/User";

export default async function AdminUsersPage() {
	const initialResult = await getPaginatedUsersAction({
		limit: 25,
		offset: 0,
		sortField: "createdAt",
		sortDir: "desc",
	});

	const enrichedUsers = (initialResult.data ?? []) as UserProfile[];
	const totalCount = initialResult.count ?? 0;

	return <UsersTable initialUsers={enrichedUsers} initialCount={totalCount} />;
}
