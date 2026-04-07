import { notFound, redirect } from "next/navigation";
import { getSupportInfo } from "@/actions/settings-actions";
import { auth } from "@/auth";
import { BookingDetailClient } from "@/components/dashboard/bookings/BookingDetailClient";
import { toBookingDetailRow } from "@/core/domain/entities/Booking";
import { prisma } from "@/lib/prisma";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: Props) {
	const session = await auth();
	const { id } = await params;

	if (!session?.user?.id) redirect("/auth");

	const raw = await prisma.booking.findUnique({
		where: { id, userId: session.user.id },
		include: {
			bookingItems: {
				include: {
					equipment: {
						select: {
							id: true,
							title: true,
							categoryId: true,
							price4h: true,
							price8h: true,
							pricePerDay: true,
							deposit: true,
						},
					},
				},
			},
		},
	});

	if (!raw) notFound();

	const support = await getSupportInfo();

	return (
		<BookingDetailClient booking={toBookingDetailRow(raw)} support={support} />
	);
}
