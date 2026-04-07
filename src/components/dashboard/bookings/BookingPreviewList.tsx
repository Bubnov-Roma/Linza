"use client";

import { differenceInHours } from "date-fns";
import { ChevronRight, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BookingDetailDialog } from "@/components/dashboard/bookings/Bookingdetailsdialog";
import { ClientTime } from "@/components/shared";
import { Button } from "@/components/ui";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_STYLES } from "@/constants";
import type {
	BookingStatus,
	DashboardBooking,
} from "@/core/domain/entities/Booking";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
	bookings: DashboardBooking[];
}

// ─── BookingPreviewList ────────────────────────────────────────────────────────
export function BookingPreviewList({ bookings }: Props) {
	if (bookings.length === 0) {
		return (
			<div className="py-12 text-center px-6">
				<Package className="mx-auto h-10 w-10 text-gray-400/30 mb-3" />
				<h3 className="text-sm font-semibold text-foreground/60">
					Бронирований нет
				</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Найдите оборудование для аренды
				</p>
				<Button asChild className="mt-4 rounded-xl" size="sm">
					<Link href="/equipment">Каталог</Link>
				</Button>
			</div>
		);
	}

	// Show first 5 directly, rest behind scroll (max-h + overflow-y-auto)
	const visible = bookings.slice(0, 5);

	return visible.map((booking) => (
		<BookingPreviewRow key={booking.id} booking={booking} />
	));
}

// ─── Single row ───────────────────────────────────────────────────────────────
function BookingPreviewRow({ booking }: { booking: DashboardBooking }) {
	const firstItem = booking.bookingItems[0];
	const extraCount = booking.bookingItems.length - 1;

	const hours = Math.ceil(
		differenceInHours(new Date(booking.endDate), new Date(booking.startDate))
	);

	const statusLabel =
		BOOKING_STATUS_LABELS[booking.status as BookingStatus] ?? booking.status;
	const statusStyle =
		BOOKING_STATUS_STYLES[booking.status as BookingStatus] ??
		"bg-foreground/5 text-muted-foreground";

	return (
		<Link
			href={`/dashboard/bookings/${booking.id}`}
			className="flex items-center gap-3 px-4 sm:px-6 py-3.5 hover:bg-foreground/4 transition-colors group"
		>
			{/* Thumbnail */}
			<div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-muted-foreground/10 shrink-0">
				{firstItem?.imageUrl ? (
					<Image
						src={firstItem.imageUrl}
						alt={firstItem.equipment.title}
						fill
						sizes="56px"
						className="object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<Package size={18} className="text-muted-foreground/20" />
					</div>
				)}
				{/* Extra items badge */}
				{extraCount > 0 && (
					<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
						<span className="text-white text-[10px] font-black">
							+{extraCount}
						</span>
					</div>
				)}
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-0.5">
					<span className="font-mono text-[10px] font-bold text-muted-foreground/60">
						№ {booking.id.split("-")[0]?.toUpperCase()}
					</span>
					<span
						className={cn(
							"inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
							statusStyle
						)}
					>
						{statusLabel}
					</span>
				</div>

				<p className="font-semibold text-sm leading-tight truncate">
					{firstItem?.equipment.title ?? "—"}
				</p>

				{/* Dates */}
				<div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
					<ClientTime iso={booking.startDate} fmt="date" fallback="..." />
					<span className="opacity-40">→</span>
					<ClientTime iso={booking.endDate} fmt="date" fallback="..." />
					{/* Desktop: show exact times */}
					<span className="hidden sm:inline opacity-40">·</span>
					<span className="hidden sm:inline">
						{<ClientTime iso={booking.startDate} fmt="time" fallback="..." />}
						{" — "}
						<ClientTime iso={booking.endDate} fmt="time" fallback="..." />
					</span>
					{/* Mobile: just hours */}
					<span className="sm:hidden opacity-40">·</span>
					<span className="sm:hidden">{hours} ч.</span>
				</div>
			</div>

			{/* Details button */}
			<BookingDetailDialog key={booking.id} booking={booking} hours={hours}>
				<ChevronRight
					size={15}
					className="text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0"
				/>
			</BookingDetailDialog>
		</Link>
	);
}
