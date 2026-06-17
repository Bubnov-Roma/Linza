import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BookingsTable } from "@/components/dashboard/bookings/BookingsTable";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { BackButton } from "@/components/shared";
import { prisma } from "@/lib/prisma";

interface Props {
	searchParams: Promise<{ status?: string }>;
}

export default async function BookingsPage({ searchParams }: Props) {
	const session = await auth();
	const userId = session?.user?.id;

	if (!userId) return redirect("/auth");

	const { status } = await searchParams;

	const bookings = await prisma.booking.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		include: {
			bookingItems: {
				include: {
					equipment: {
						select: {
							title: true,
							categoryId: true,
							price4h: true,
							price8h: true,
							pricePerDay: true,
						},
					},
				},
			},
		},
	});

	return (
		<div className="min-h-screen">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
				<DashboardBreadcrumb items={[{ label: "Мои заказы" }]} />
				{/* Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="flex items-center">
						<BackButton fallback="/dashboard" />
						<div>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
								История аренды
							</p>
							<h1 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">
								Мои заказы
							</h1>
						</div>
					</div>
				</div>
				<BookingsTable bookings={bookings} initialStatus={status ?? ""} />
			</div>
		</div>
	);
}
