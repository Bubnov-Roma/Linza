import { notFound, redirect } from "next/navigation";
// import { getSupportInfo } from "@/actions/admin-settings-actions";
import { auth } from "@/auth";
// import { StudioBookingDetailClient } from "@/components/dashboard/studio-bookings/StudioBookingDetailClient";
import { prisma } from "@/lib/prisma";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function StudioBookingDetailPage({ params }: Props) {
	const session = await auth();
	const { id } = await params;

	if (!session?.user?.id) redirect("/auth");

	const raw = await prisma.studioBooking.findUnique({
		where: { id, userId: session.user.id },
		include: {
			tariff: true,
			items: {
				include: {
					equipment: {
						select: {
							id: true,
							title: true,
							categoryId: true,
							priceStudio: true,
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

	// Логика фолбэка для картинок (как в заказах техники)
	// const titlesWithoutImage = raw.items
	// 	.filter((item) => !item.equipment?.equipmentImageLinks?.[0]?.image?.url)
	// 	.map((item) => item.equipment.title);

	// let imageMap = new Map<string, string>();
	// if (titlesWithoutImage.length > 0) {
	// 	const { getEquipmentImagesByTitles } = await import(
	// 		"@/actions/client-equipment-actions"
	// 	);
	// 	imageMap = await getEquipmentImagesByTitles([
	// 		...new Set(titlesWithoutImage),
	// 	]);
	// }

	// const _enrichedRaw = {
	// 	...raw,
	// 	items: raw.items.map((item) => ({
	// 		...item,
	// 		imageUrl:
	// 			item.equipment?.equipmentImageLinks?.[0]?.image?.url ??
	// 			imageMap.get(item.equipment.title) ??
	// 			null,
	// 	})),
	// };

	// const _support = await getSupportInfo();

	// return <StudioBookingDetailClient booking={enrichedRaw} support={support} />;
}
