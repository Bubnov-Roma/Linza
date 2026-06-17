export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { AdminBookingRow } from "@/components/admin/bookings/AdminBookingsTable";
import AdminBookingsTable from "@/components/admin/bookings/AdminBookingsTable";
import type {
	AdminBookingItemSnippet,
	PaymentMethod,
} from "@/core/domain/entities/Booking";
import { prisma } from "@/lib/prisma";
import { extractEnrichedUserData } from "@/utils";

export default async function AdminBookingsPage() {
	const rawBookings = await prisma.booking.findMany({
		orderBy: { createdAt: "desc" },
		include: {
			user: {
				select: {
					name: true,
					email: true,
					phone: true,
					balance: true,
					clientApplication: { select: { adminOverrides: true } },
				},
			},
			payments: { include: { author: { select: { name: true } } } },
			bookingItems: {
				select: {
					equipmentId: true,
					priceAtBooking: true,
					depositAtBooking: true,
					replacementValueAtBooking: true,
					equipment: {
						select: {
							title: true,
							price4h: true,
							price8h: true,
							pricePerDay: true,
						},
					},
				},
			},
		},
	});

	const initialBookings: AdminBookingRow[] = rawBookings.map((row) => {
		const equipmentTitles = row.bookingItems
			.map((item) => item.equipment?.title ?? "Без названия")
			.filter(Boolean);

		const overrides = row.user?.clientApplication?.adminOverrides as Record<
			string,
			unknown
		> | null;

		const { fullName } = extractEnrichedUserData(overrides, {
			name: row.user.name,
			phone: row.user.phone,
		});
		const bookingItems: AdminBookingItemSnippet[] = row.bookingItems.map(
			(item) => ({
				equipmentId: item.equipmentId,
				title: item.equipment?.title ?? "Без названия",
				priceAtBooking: item.priceAtBooking,
				depositAtBooking: item.depositAtBooking ?? 0,
				replacementValueAtBooking: item.replacementValueAtBooking ?? 0,
				price4h: item.equipment?.price4h ?? null,
				price8h: item.equipment?.price8h ?? null,
				pricePerDay: item.equipment?.pricePerDay ?? 0,
			})
		);
		return {
			id: row.id,
			clientId: row.userId,
			status: row.status as AdminBookingRow["status"],
			totalAmount: row.totalAmount,
			createdAt: row.createdAt.toISOString(),
			startDate: row.startDate.toISOString(),
			endDate: row.endDate.toISOString(),
			insuranceIncluded: row.insuranceIncluded,
			totalReplacementValue: row.totalReplacementValue,
			cancellationReason: row.cancellationReason,
			cancelledAt: row.cancelledAt?.toISOString() ?? null,
			clientName: fullName,
			clientEmail: row.user.email,
			equipmentTitles: equipmentTitles,
			itemCount: row.bookingItems.length,
			bookingItems,
			payments: row.payments.map((p) => ({
				id: p.id,
				amount: p.amount,
				method: p.method as PaymentMethod,
				note: p.note,
				paidAt: p.paidAt.toISOString(),
				createdAt: p.createdAt.toISOString(),
				authorName: p.author?.name ?? "Система",
			})),
			user: {
				balance: row.user?.balance ?? 0,
			},
		};
	});

	return <AdminBookingsTable initialBookings={initialBookings} />;
}
