import { ApplicationStatus, BookingStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import type { ClientStudioBookingRow } from "@/actions/client-studio-actions";
import { auth } from "@/auth";
import { UnifiedBookingsDashboard } from "@/components/dashboard/bookings/UnifiedBookingsDashboard";
import { VerificationBanner } from "@/components/forms/verification/VerificationBanner";
import type { DashboardBooking } from "@/core/domain/entities/Booking";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
	const session = await auth();
	const user = session?.user;

	if (!user?.id) redirect("/auth");

	// Группировка статусов для точного совпадения с табами
	const upcomingStatuses = [
		BookingStatus.PENDING_REVIEW,
		BookingStatus.WAIT_PAYMENT,
		BookingStatus.READY_TO_RENT,
	];
	const activeStatuses = [BookingStatus.ACTIVE];
	const completedStatuses = [BookingStatus.COMPLETED];
	const cancelledStatuses = [BookingStatus.CANCELLED, BookingStatus.EXPIRED];

	const [
		application,
		bookingsRaw,
		studioBookingsRaw,
		spendingData,
		// Счетчики для Техники (Equipment)
		eqTotal,
		eqUpcoming,
		eqActive,
		eqCompleted,
		eqCancelled,
		// Счетчики для Студии (Studio)
		stTotal,
		stUpcoming,
		stActive,
		stCompleted,
		stCancelled,
	] = await Promise.all([
		prisma.clientApplication.findUnique({
			where: { userId: user.id },
			select: { status: true, applicationData: true },
		}),
		prisma.booking.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "desc" },
			take: 30,
			include: {
				bookingItems: {
					include: {
						equipment: {
							select: {
								title: true,
								equipmentImageLinks: {
									include: { image: { select: { url: true } } },
									orderBy: { orderIndex: "asc" },
									take: 1,
								},
							},
						},
					},
				},
			},
		}),
		prisma.studioBooking.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "desc" },
			take: 30,
			include: {
				tariff: { select: { name: true } },
				items: { select: { id: true } },
			},
		}),
		prisma.booking.aggregate({
			where: { userId: user.id, status: BookingStatus.COMPLETED },
			_sum: { totalAmount: true },
		}),
		// Запросы количества для техники
		prisma.booking.count({ where: { userId: user.id } }),
		prisma.booking.count({
			where: { userId: user.id, status: { in: upcomingStatuses } },
		}),
		prisma.booking.count({
			where: { userId: user.id, status: { in: activeStatuses } },
		}),
		prisma.booking.count({
			where: { userId: user.id, status: { in: completedStatuses } },
		}),
		prisma.booking.count({
			where: { userId: user.id, status: { in: cancelledStatuses } },
		}),
		// Запросы количества для студии
		prisma.studioBooking.count({ where: { userId: user.id } }),
		prisma.studioBooking.count({
			where: { userId: user.id, status: { in: upcomingStatuses } },
		}),
		prisma.studioBooking.count({
			where: { userId: user.id, status: { in: activeStatuses } },
		}),
		prisma.studioBooking.count({
			where: { userId: user.id, status: { in: completedStatuses } },
		}),
		prisma.studioBooking.count({
			where: { userId: user.id, status: { in: cancelledStatuses } },
		}),
	]);

	const showBanner =
		!application ||
		application.status === ApplicationStatus.NO_APPLICATION ||
		application.status === ApplicationStatus.DRAFT;

	const totalSpent = spendingData._sum.totalAmount ?? 0;

	// Резолв картинок техники (оставляем твою логику fallback-изображений)
	const titlesWithoutImage = bookingsRaw
		.flatMap((b) => b.bookingItems)
		.filter((item) => !item.equipment.equipmentImageLinks[0]?.image?.url)
		.map((item) => item.equipment.title);

	let fallbackImages = new Map<string, string>();
	if (titlesWithoutImage.length > 0) {
		const { getEquipmentImagesByTitles } = await import(
			"@/actions/client-equipment-actions"
		);
		fallbackImages = await getEquipmentImagesByTitles([
			...new Set(titlesWithoutImage),
		]);
	}

	const bookings: DashboardBooking[] = bookingsRaw.map((booking) => ({
		...booking,
		bookingItems: booking.bookingItems.map((item) => ({
			priceAtBooking: item.priceAtBooking,
			equipment: { title: item.equipment.title },
			imageUrl:
				item.equipment.equipmentImageLinks[0]?.image?.url ??
				fallbackImages.get(item.equipment.title) ??
				null,
		})),
	}));

	const studioBookings: ClientStudioBookingRow[] = studioBookingsRaw.map(
		(b) => ({
			id: b.id,
			tariffName: b.tariff.name,
			tariffPriceAtBooking: b.tariffPriceAtBooking,
			startDate: b.startDate,
			endDate: b.endDate,
			durationHours: b.durationHours,
			totalAmount: b.totalAmount,
			status: b.status,
			itemsCount: b.items.length,
			createdAt: b.createdAt,
		})
	);

	// Объединяем результаты подсчетов техники и студии
	const stats = {
		totalBookings: eqTotal + stTotal,
		upcomingBookings: eqUpcoming + stUpcoming,
		activeBookings: eqActive + stActive,
		completedBookings: eqCompleted + stCompleted,
		cancelledBookings: eqCancelled + stCancelled,
		totalSpent,
	};

	const firstName =
		user.nickname ||
		user.name?.trim().split(/\s+/)[1] ||
		user.email?.split("@")[0] ||
		"Пользователь";

	return (
		<div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-8">
			{/* Greeting */}
			<div>
				<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground/90">
					Привет, {firstName}!
				</h1>
				<p className="text-muted-foreground mt-1 pl-2 text-sm">
					кабинет управления заказами
				</p>
			</div>
			{showBanner && <VerificationBanner />}

			<UnifiedBookingsDashboard
				equipmentBookings={bookings}
				studioBookings={studioBookings}
				stats={stats}
			/>
		</div>
	);
}
