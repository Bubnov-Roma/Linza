import { BookingStatus } from "@prisma/client";
import { getAllBannersAdmin } from "@/actions/admin-banner-actions";
import { DashboardClient } from "@/components/admin/DashboardClient";
import { prisma } from "@/lib/prisma";
import type { AdminDashboardData } from "@/types";

async function getAdminDashboardData(): Promise<AdminDashboardData> {
	const [
		totalUsers,
		totalEquipment,
		totalBookings,
		pendingBookings,
		recentBookings,
		categories,
		faqCount,
		revenueData,
	] = await Promise.all([
		prisma.user.count(),
		prisma.equipment.count(),
		prisma.booking.count(),
		prisma.booking.count({ where: { status: BookingStatus.PENDING_REVIEW } }),
		prisma.booking.findMany({
			orderBy: { createdAt: "desc" },
			take: 10,
			include: {
				user: { select: { name: true, email: true } },
				bookingItems: { include: { equipment: { select: { title: true } } } },
			},
		}),
		prisma.category.findMany({
			select: { id: true, name: true, slug: true },
			orderBy: { sortOrder: "asc" },
			take: 8,
		}),
		prisma.faqItem.count(),
		prisma.booking.findMany({
			where: { status: { not: BookingStatus.CANCELLED } },
			select: { totalAmount: true, createdAt: true },
		}),
	]);

	const totalRevenue = revenueData.reduce((s, b) => s + b.totalAmount, 0);

	const thisMonth = new Date();
	thisMonth.setDate(1);
	thisMonth.setHours(0, 0, 0, 0);

	const monthlyRevenue = revenueData
		.filter((b) => b.createdAt >= thisMonth)
		.reduce((s, b) => s + b.totalAmount, 0);

	return {
		totalUsers,
		totalEquipment,
		totalBookings,
		pendingBookings,
		totalRevenue,
		monthlyRevenue,
		recentBookings,
		categories,
		faqCount,
	};
}

export default async function AdminDashboardPage() {
	const banners = await getAllBannersAdmin();
	const stats = await getAdminDashboardData();
	return <DashboardClient stats={stats} banners={banners} />;
}
