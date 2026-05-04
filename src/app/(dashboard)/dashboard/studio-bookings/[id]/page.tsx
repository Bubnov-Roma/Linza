import { notFound, redirect } from "next/navigation";
import { getSupportInfo } from "@/actions/admin-settings-actions";
import { getMyStudioBookingDetailAction } from "@/actions/client-studio-actions";
import { auth } from "@/auth";
import { StudioBookingDetailClient } from "@/components/dashboard/studio-bookings/StudioBookingDetailClient";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function StudioBookingDetailPage({ params }: Props) {
	const session = await auth();
	const { id } = await params;

	if (!session?.user?.id) redirect("/auth");

	const [booking, support] = await Promise.all([
		getMyStudioBookingDetailAction(id),
		getSupportInfo(),
	]);

	if (!booking) notFound();

	return <StudioBookingDetailClient booking={booking} support={support} />;
}
