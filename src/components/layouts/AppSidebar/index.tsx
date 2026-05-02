import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { AppSidebarClient } from "./AppSidebarClient";

interface Props {
	isAdmin: boolean;
	categories: DbCategory[];
}

export async function AppSidebar({ isAdmin, categories }: Props) {
	return (
		<Sidebar
			collapsible="icon"
			className="border-r-0 bg-background/80 backdrop-blur-2xl"
		>
			<AppSidebarClient isAdmin={isAdmin} categories={categories} />
			<SidebarRail />
		</Sidebar>
	);
}
