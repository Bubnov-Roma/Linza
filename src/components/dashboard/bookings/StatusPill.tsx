import { BOOKING_STATUS_LABELS, BOOKING_STATUS_STYLES } from "@/constants";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: string }) {
	const label = BOOKING_STATUS_LABELS[status as BookingStatus] ?? status;
	const style =
		BOOKING_STATUS_STYLES[status as BookingStatus] ??
		"bg-foreground/5 text-muted-foreground";
	return (
		<span
			className={cn(
				"inline-flex mx-auto mt-auto items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0",
				style
			)}
		>
			{label}
		</span>
	);
}
