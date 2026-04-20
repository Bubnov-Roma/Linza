import {
	BoxArrowDownIcon,
	BoxArrowUpIcon,
	PackageIcon,
	XSquareIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ApplicationStatus, BookingStatus } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BookingPreviewList } from "@/components/dashboard/bookings/BookingPreviewList";
import { VerificationBanner } from "@/components/forms/verification/VerificationBanner";
import { ClientTime } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { DashboardBooking } from "@/core/domain/entities/Booking";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
	const session = await auth();
	const user = session?.user;

	if (!user?.id) redirect("/auth");

	const [
		application,
		bookingsRaw,
		totalBookings,
		activeBookings,
		completedBookings,
		cancelledBookings,
		spendingData,
	] = await Promise.all([
		prisma.clientApplication.findUnique({
			where: { userId: user.id },
			select: { status: true, applicationData: true },
		}),
		prisma.booking.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "desc" },
			take: 10,
			include: {
				bookingItems: {
					include: {
						equipment: {
							select: {
								title: true,
								equipmentImageLinks: {
									include: { image: { select: { url: true } } },
									take: 1,
								},
							},
						},
					},
				},
			},
		}),
		prisma.booking.count({ where: { userId: user.id } }),
		prisma.booking.count({
			where: {
				userId: user.id,
				status: {
					in: [
						BookingStatus.PENDING_REVIEW,
						BookingStatus.READY_TO_RENT,
						BookingStatus.ACTIVE,
					],
				},
			},
		}),
		prisma.booking.count({
			where: { userId: user.id, status: BookingStatus.COMPLETED },
		}),
		prisma.booking.count({
			where: { userId: user.id, status: BookingStatus.CANCELLED },
		}),
		prisma.booking.aggregate({
			where: { userId: user.id, status: BookingStatus.COMPLETED },
			_sum: { totalAmount: true },
		}),
	]);

	const showBanner =
		!application ||
		application.status === ApplicationStatus.NO_APPLICATION ||
		application.status === ApplicationStatus.DRAFT;

	const totalSpent = spendingData._sum.totalAmount ?? 0;

	const bookings: DashboardBooking[] = bookingsRaw.map((booking) => ({
		...booking,
		bookingItems: booking.bookingItems.map((item) => ({
			priceAtBooking: item.priceAtBooking,
			equipment: {
				title: item.equipment.title,
			},
			imageUrl: item.equipment.equipmentImageLinks[0]?.image?.url ?? null,
		})),
	}));

	const stats = {
		totalBookings,
		activeBookings,
		completedBookings,
		cancelledBookings,
		totalSpent,
	};

	const upcoming = bookings
		.filter((b) => new Date(b.endDate) > new Date() && b.status !== "CANCELLED")
		.slice(0, 2);

	const firstName =
		user.nickname ||
		user.name?.trim().split(/\s+/)[0] ||
		user.email?.split("@")[0] ||
		"Пользователь";

	return (
		<div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-8">
			{/* Greeting */}
			<div>
				<h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground/90">
					Привет, {firstName}!
				</h1>
				<p className="text-muted-foreground mt-1 pl-2 text-sm ">
					персональный кабинет управления заказами
				</p>
			</div>

			{showBanner && <VerificationBanner />}

			{/* Stats */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					title="Всего"
					value={stats.totalBookings}
					icon={<PackageIcon size={18} />}
				/>
				<StatCard
					title="Активных"
					value={stats.activeBookings}
					icon={<BoxArrowUpIcon size={18} />}
				/>
				<StatCard
					title="Завершённых"
					value={stats.completedBookings}
					icon={<BoxArrowDownIcon size={18} />}
				/>
				<StatCard
					title="Отменённых"
					value={stats.cancelledBookings}
					icon={<XSquareIcon size={18} />}
				/>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between pb-0 px-4 sm:px-6 pt-4 sm:pt-5">
						<CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
							Последние заказы
						</CardTitle>
						<Link
							href="/dashboard/bookings"
							className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
						>
							Все заказы →
						</Link>
					</CardHeader>
					<CardContent className="p-0 mt-1">
						<BookingPreviewList bookings={bookings} />
					</CardContent>
				</Card>

				{/* ── Sidebar ── */}
				<div className="space-y-6">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
								Предстоящие аренды
							</CardTitle>
						</CardHeader>
						{upcoming.length > 0 && (
							<div className="space-y-2">
								{upcoming.map((booking) => (
									<Link
										href={`/dashboard/bookings/${booking.id}`}
										key={booking.id}
										className="rounded-xl bg-card/40 w-full block p-3 hover:bg-muted-foreground/20 transition-colors"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<p className="font-bold text-sm truncate">
													{booking.bookingItems[0]?.equipment.title ?? "Заказ"}
												</p>
												<div className="flex text-[11px] text-muted-foreground mt-0.5 gap-1">
													<ClientTime
														iso={booking.startDate}
														fmt="datetime"
														fallback="---"
													/>
													<span className="opacity-40">{" → "}</span>
													<ClientTime
														iso={booking.endDate}
														fmt="datetime"
														fallback="---"
													/>
												</div>
											</div>
										</div>
									</Link>
								))}
							</div>
						)}
					</Card>
					{/* <Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
								Быстрый доступ
							</CardTitle>
						</CardHeader>
						<div className="flex flex-col gap-2 w-full">
							<QuickActionLink
								href="/booking/new"
								icon={<CalendarIcon size={18} />}
								label="Новая бронь"
								description="Выбрать технику"
							/>
							<QuickActionLink
								href="/dashboard/profile"
								icon={<UserIcon size={18} />}
								label="Профиль"
								description="Данные и настройки"
							/>
							<QuickActionLink
								href="/favorites"
								icon={<HeartIcon size={18} />}
								label="Избранное"
								description="Понравившаяся техника"
							/>
						</div>
					</Card> */}
				</div>
			</div>
		</div>
	);
}

function StatCard({
	title,
	value,
	icon,
}: {
	title: string;
	value: string | number;
	icon: React.ReactNode;
}) {
	return (
		<Card className="relative overflow-hidden group">
			<CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
				<CardTitle className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground/80 transition-colors uppercase tracking-wider">
					{title}
				</CardTitle>
				<div className="text-foreground/25 group-hover:text-primary/60 transition-all duration-300">
					{icon}
				</div>
			</CardHeader>
			<CardContent className="pb-4 px-4">
				<div className="text-2xl sm:text-3xl font-bold text-foreground/80 tracking-tight">
					{value}
				</div>
			</CardContent>
		</Card>
	);
}
