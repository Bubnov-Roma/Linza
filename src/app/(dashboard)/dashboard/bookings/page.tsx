import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BookingsTable } from "@/components/dashboard/bookings/BookingsTable";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { prisma } from "@/lib/prisma";

export default async function BookingsPage() {
	const session = await auth();
	const userId = session?.user?.id;

	if (!userId) return redirect("/auth");

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
					<div className="flex items-center gap-4">
						<Link
							href="/dashboard"
							className="w-10 h-10 rounded-xl border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 transition-all shrink-0"
						>
							<CaretLeftIcon size={18} />
						</Link>
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
				<BookingsTable bookings={bookings} />
			</div>
		</div>
	);
}
