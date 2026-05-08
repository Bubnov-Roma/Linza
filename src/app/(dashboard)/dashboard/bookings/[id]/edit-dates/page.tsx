import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EditDatesClient } from "@/components/dashboard/bookings/EditDatesClient";
import { toBookingDetailRow } from "@/core/domain/entities/Booking";
import { prisma } from "@/lib/prisma";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function EditDatesPage({ params }: Props) {
	const { id } = await params;
	const session = await auth();

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

	let promoValidUntil: string | null = null;
	if (raw.promoCode) {
		const promo = await prisma.promoCode.findUnique({
			where: { code: raw.promoCode },
			select: { validUntil: true },
		});
		promoValidUntil = promo?.validUntil?.toISOString() ?? null;
	}

	const booking = toBookingDetailRow({
		...raw,
		promoValidUntil,
	} as Parameters<typeof toBookingDetailRow>[0] & {
		promoValidUntil: string | null;
	});

	if (["ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"].includes(booking.status))
		redirect(`/dashboard/bookings/${id}`);

	return <EditDatesClient booking={booking} />;
}
