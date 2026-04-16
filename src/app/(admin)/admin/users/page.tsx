import { getPaginatedUsersAction } from "@/actions/admin-user-actions";
import UsersTable from "@/components/admin/users/UsersTable";
import type { UserProfile } from "@/core/domain/entities/User";
import { formatPlural } from "@/utils";

export default async function AdminUsersPage() {
	const initialResult = await getPaginatedUsersAction({
		limit: 25,
		offset: 0,
		sortField: "createdAt",
		sortDir: "desc",
	});

	const enrichedUsers = (initialResult.data ?? []) as UserProfile[];
	const totalCount = initialResult.count ?? 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-black italic uppercase tracking-tight">
					Клиенты
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Управление профилями · {formatPlural(totalCount, "users")}
				</p>
			</div>
			<UsersTable initialUsers={enrichedUsers} initialCount={totalCount} />
		</div>
	);
}
