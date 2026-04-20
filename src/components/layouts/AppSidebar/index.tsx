import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { prisma } from "@/lib/prisma";
import { AppSidebarClient } from "./AppSidebarClient";

interface Props {
	isAdmin: boolean;
	categories: DbCategory[];
}

export async function AppSidebar({ isAdmin, categories }: Props) {
	let initialPendingBookings = 0;
	let initialPendingApplications = 0;

	if (isAdmin) {
		const [bookingCount, appCount] = await Promise.all([
			prisma.booking.count({ where: { status: "PENDING_REVIEW" } }),
			prisma.clientApplication.count({ where: { status: "PENDING" } }),
		]);
		initialPendingBookings = bookingCount;
		initialPendingApplications = appCount;
	}

	return (
		<Sidebar
			collapsible="icon"
			className="border-r-0 bg-background/80 backdrop-blur-2xl"
		>
			<AppSidebarClient
				isAdmin={isAdmin}
				categories={categories}
				initialPendingBookings={initialPendingBookings}
				initialPendingApplications={initialPendingApplications}
			/>
			<SidebarRail />
		</Sidebar>
	);
}
