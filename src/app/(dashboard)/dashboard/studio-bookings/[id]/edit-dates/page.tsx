import { notFound, redirect } from "next/navigation";
import { getMyStudioBookingDetailAction } from "@/actions/client-studio-actions";
import { auth } from "@/auth";
import { StudioEditDatesClient } from "@/components/dashboard/studio-bookings/StudioEditDatesClient";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function StudioEditDatesPage({ params }: Props) {
	const { id } = await params;
	const session = await auth();

	if (!session?.user?.id) redirect("/auth");

	const booking = await getMyStudioBookingDetailAction(id);

	if (!booking) notFound();

	if (["ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"].includes(booking.status))
		redirect(`/dashboard/studio-bookings/${id}`);

	return <StudioEditDatesClient booking={booking} />;
}
