import { notFound, redirect } from "next/navigation";
import { getActiveStudioTariffsAction } from "@/actions/admin-studio-actions";
import {
	getMyStudioBookingDetailAction,
	getStudioAvailableEquipmentAction,
} from "@/actions/client-studio-actions";
import { auth } from "@/auth";
import { StudioEditTariffClient } from "@/components/dashboard/studio-bookings/StudioEditTariffClient";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function StudioEditTariffPage({ params }: Props) {
	const { id } = await params;
	const session = await auth();

	if (!session?.user?.id) redirect("/auth");

	const booking = await getMyStudioBookingDetailAction(id);

	if (!booking) notFound();

	if (["ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"].includes(booking.status))
		redirect(`/dashboard/studio-bookings/${id}`);

	const [tariffs, availableEquipment] = await Promise.all([
		getActiveStudioTariffsAction(),
		getStudioAvailableEquipmentAction(
			booking.startDate,
			booking.endDate,
			booking.id
		),
	]);

	return (
		<StudioEditTariffClient
			booking={booking}
			tariffs={tariffs}
			availableEquipment={availableEquipment}
		/>
	);
}
