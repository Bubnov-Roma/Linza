import { getSupportInfo } from "@/actions/admin-settings-actions";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { AppSidebarClient } from "./AppSidebarClient";

interface Props {
	isAdmin: boolean;
	categories: DbCategory[];
}

export async function AppSidebar({ isAdmin, categories }: Props) {
	const supportInfo = await getSupportInfo();

	return (
		<Sidebar collapsible="icon">
			<AppSidebarClient
				isAdmin={isAdmin}
				categories={categories}
				supportInfo={supportInfo}
			/>
			<SidebarRail />
		</Sidebar>
	);
}
