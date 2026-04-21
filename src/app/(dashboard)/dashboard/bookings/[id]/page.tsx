import { notFound, redirect } from "next/navigation";
import { getSupportInfo } from "@/actions/admin-settings-actions";
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
	});

	if (!raw) notFound();

	const titlesWithoutImage = raw.bookingItems
		.filter((item) => !item.equipment?.equipmentImageLinks?.[0]?.image?.url)
		.map((item) => item.equipment.title);

	let imageMap = new Map<string, string>();
	if (titlesWithoutImage.length > 0) {
		const { getEquipmentImagesByTitles } = await import(
			"@/actions/client-equipment-actions"
		);
		imageMap = await getEquipmentImagesByTitles([
			...new Set(titlesWithoutImage),
		]);
	}

	const enrichedRaw = {
		...raw,
		bookingItems: raw.bookingItems.map((item) => ({
			...item,
			imageUrl:
				item.equipment?.equipmentImageLinks?.[0]?.image?.url ??
				imageMap.get(item.equipment.title) ??
				null,
		})),
	};

	const support = await getSupportInfo();

	return (
		<BookingDetailClient
			booking={toBookingDetailRow(enrichedRaw)}
			support={support}
		/>
	);
}
