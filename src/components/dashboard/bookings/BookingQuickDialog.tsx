import {
	CameraIcon,
	CaretRightIcon,
	FilmSlateIcon,
	PackageIcon,
	TagChevronIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { StatusPill } from "@/components/dashboard/bookings/StatusPill";
import type { UnifiedBooking } from "@/components/dashboard/bookings/UnifiedBookingsDashboard";
import { ClientTime } from "@/components/shared";
import {
	Button,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui";
import { cn, fmtRub } from "@/lib/utils";

export function BookingQuickDialog({
	booking,
	hours,
	href,
}: {
	booking: UnifiedBooking;
	hours: number;
	href: string;
}) {
	const isEquipment = booking.kind === "equipment";

	return (
		<DialogContent
			className={cn(
				"p-0 gap-0 flex flex-col overflow-hidden",
				"max-h-[85dvh] w-[calc(100vw-1rem)] sm:w-full"
			)}
		>
			{/* Header */}
			<DialogHeader className="flex flex-col sm:flex-row sm:items-start gap-3 px-5 pt-5 pb-4 shrink-0">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						{isEquipment ? (
							<CameraIcon
								size={14}
								weight="fill"
								className="text-muted-foreground/70"
							/>
						) : (
							<FilmSlateIcon
								size={14}
								weight="fill"
								className="text-muted-foreground/70"
							/>
						)}
						<span className="text-xs text-muted-foreground">
							{isEquipment ? "Аренда техники" : "Аренда студии"}
						</span>
					</div>
					<DialogTitle className="text-xl font-black uppercase italic tracking-tighter leading-tight">
						№ {booking.id.split("-")[0]?.toUpperCase()}
					</DialogTitle>
					<span className="text-[11px] text-muted-foreground">
						<ClientTime
							iso={booking.createdAt.toISOString()}
							fmt="full"
							fallback="-"
						/>
					</span>
				</div>
				<DialogDescription className="contents">
					<StatusPill status={booking.status} />
				</DialogDescription>
			</DialogHeader>

			{/* Body */}
			<div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
				<div className="rounded-2xl bg-background overflow-hidden">
					{/* Summary row */}
					<div className="grid grid-cols-4 gap-2 px-4 py-3 bg-muted-foreground/20 rounded-t-2xl">
						<div>
							<p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">
								Начало
							</p>
							<p className="text-sm font-bold leading-snug">
								<ClientTime
									iso={booking.startDate.toISOString()}
									fmt="date-numeric"
									fallback="-"
								/>
							</p>
							<p className="text-xs text-muted-foreground">
								<ClientTime
									iso={booking.startDate.toISOString()}
									fmt="time"
									fallback="-"
								/>
							</p>
						</div>
						<div>
							<p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">
								Конец
							</p>
							<p className="text-sm font-bold leading-snug">
								<ClientTime
									iso={booking.endDate.toISOString()}
									fmt="date-numeric"
									fallback="-"
								/>
							</p>
							<p className="text-xs text-muted-foreground">
								<ClientTime
									iso={booking.endDate.toISOString()}
									fmt="time"
									fallback="-"
								/>
							</p>
						</div>
						<div>
							<p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">
								Время
							</p>
							<p className="text-sm font-bold">{hours} ч.</p>
						</div>
						<div>
							<p className="text-[9px] uppercase text-muted-foreground font-bold mb-1 text-right">
								Итого
							</p>
							<p className="text-sm font-black italic text-right tabular-nums">
								{fmtRub(booking.totalAmount)}
							</p>
							{booking.promoCode && (
								<div className="flex items-center justify-end gap-0.5 mt-0.5">
									<TagChevronIcon size={8} className="text-green-500" />
									<span className="text-[9px] font-mono text-green-600">
										{booking.promoCode}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Items */}
					<div className="divide-y divide-border/40 max-h-72 overflow-y-auto">
						{isEquipment ? (
							booking.bookingItems?.map((item, i) => (
								<div
									key={`${item.equipment.title}-${i}`}
									className="flex items-center gap-3 px-4 py-3 hover:bg-muted-foreground/10 transition-colors"
								>
									<div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted-foreground/15 shrink-0">
										{item.imageUrl ? (
											<Image
												src={item.imageUrl}
												alt={item.equipment.title}
												fill
												sizes="40px"
												className="object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<PackageIcon
													size={13}
													className="text-muted-foreground/30"
												/>
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-sm leading-snug truncate">
											{item.equipment.title}
										</p>
										<p className="text-[11px] text-muted-foreground font-mono">
											{fmtRub(item.priceAtBooking || 0)}
										</p>
									</div>
								</div>
							))
						) : (
							<div className="flex items-center gap-3 px-4 py-3">
								<div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
									<FilmSlateIcon
										size={20}
										className="text-foreground/60"
										weight="duotone"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-sm">{booking.tariffName}</p>
									<p className="text-[11px] text-muted-foreground font-mono">
										{fmtRub(booking.tariffPriceAtBooking ?? 0)} /ч ×{" "}
										{booking.durationHours} ч.
									</p>
								</div>
								{booking.itemsCount != null && booking.itemsCount > 0 && (
									<span className="text-xs text-muted-foreground">
										+{booking.itemsCount} техн.
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Footer */}
			<DialogFooter className="p-3 pt-2">
				<Button asChild variant="ghost" className="flex-1 py-3" size="xl">
					<Link href={href}>
						К заказу <CaretRightIcon size={13} weight="bold" />
					</Link>
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
