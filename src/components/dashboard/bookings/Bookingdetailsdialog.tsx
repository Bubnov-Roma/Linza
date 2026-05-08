"use client";

import { TagChevronIcon } from "@phosphor-icons/react";
import { ExternalLink, Package, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ClientTime } from "@/components/shared";
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_STYLES } from "@/constants";
import type { DashboardBooking } from "@/core/domain/entities/Booking";
import { cn, fmtRub } from "@/lib/utils";

export function BookingDetailDialog({
	booking,
	hours,
	children,
	className,
	statusLabels = BOOKING_STATUS_LABELS as Record<string, string>,
	statusStyles = BOOKING_STATUS_STYLES as Record<string, string>,
}: {
	booking: DashboardBooking;
	hours: number;
	children: React.ReactNode;
	className?: string;
	statusLabels?: Record<string, string>;
	statusStyles?: Record<string, string>;
}) {
	const trigger = children ?? (
		<button type="button" className={cn("text-left w-full", className)}>
			Детали
		</button>
	);
	return (
		<Dialog>
			<DialogTrigger asChild className={cn(className)}>
				{trigger}
			</DialogTrigger>
			<DialogContent
				showCloseButton={false}
				className={cn(
					"p-0 gap-0 flex flex-col overflow-hidden",
					"max-h-[90dvh] w-[calc(100vw-1rem)] sm:w-full"
				)}
			>
				{/* ── Header ── */}
				<DialogHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-2 sm:px-6 pt-4 sm:pt-6 pb-4 shrink-0 bg-muted-foreground/10">
					<div className="flex-col gap-2">
						<DialogTitle className="text-lg flex-1 sm:text-xl font-black uppercase italic tracking-tighter leading-tight">
							№ {booking.id.split("-")[0]?.toUpperCase()}
						</DialogTitle>
						<span className="text-[11px] text-muted-foreground">
							<ClientTime iso={booking.createdAt} fmt="full" fallback="-" />
						</span>
					</div>
					<DialogDescription
						className={cn(
							"inline-flex items-center px-2 sm:m-0 mx-auto py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 self-start sm:self-auto",
							statusStyles[booking.status] ??
								"bg-foreground/5 text-muted-foreground"
						)}
					>
						{statusLabels[booking.status] ?? booking.status}
					</DialogDescription>
				</DialogHeader>

				{/* ── Scrollable body ── */}
				<div className="flex-1 overflow-y-auto overscroll-contain bg-muted-foreground/10 px-2 sm:px-2">
					<div className="rounded-xl bg-background">
						{/* Inner scroll for long lists */}
						<div className="max-h-100 overflow-y-auto overscroll-contain rounded-xl relative">
							{/* Total grid row */}
							<div className="grid grid-cols-5 gap-2 px-4 py-2 rounded-t-xl bg-muted-foreground/30 backdrop-blur-2xl">
								<div>
									<p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">
										Начало
									</p>
									<p className="text-sm font-bold leading-snug">
										<ClientTime
											iso={booking.startDate}
											fmt="date-numeric"
											fallback="-"
										/>
									</p>
									<p className="text-xs text-muted-foreground">
										<ClientTime
											iso={booking.startDate}
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
											iso={booking.endDate}
											fmt="date-numeric"
											fallback="-"
										/>
									</p>
									<p className="text-xs text-muted-foreground">
										<ClientTime iso={booking.endDate} fmt="time" fallback="-" />
									</p>
								</div>
								<div>
									<p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">
										Время
									</p>
									<p className="text-sm font-bold">{hours} ч.</p>
								</div>
								<div>
									<p className="text-[9px] uppercase text-muted-foreground font-bold mb-1">
										Позиции
									</p>
									<p className="text-sm font-bold">
										{booking.bookingItems.length} шт.
									</p>
								</div>
								<div>
									<p className="text-[9px] uppercase text-muted-foreground font-bold mb-1 text-right">
										Итого
									</p>
									<p className="text-xs font-black italic text-right tabular-nums">
										{fmtRub(booking.totalAmount)}
									</p>
									{booking.promoCode && (
										<div className="flex items-center justify-end gap-1 mt-0.5">
											<TagChevronIcon
												size={9}
												className="text-green-500 shrink-0"
											/>
											<span className="text-[9px] font-mono font-bold text-green-600 truncate max-w-16">
												{booking.promoCode}
											</span>
										</div>
									)}
								</div>
							</div>
							<div className="space-y-2 relative">
								{booking.bookingItems.map((item, i) => (
									<div
										key={`${item.equipment}` + `${i}`}
										className="flex items-center gap-3 p-3 hover:bg-muted-foreground/15 transition-colors"
									>
										{/* Item thumbnail */}
										<div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted-foreground/30 shrink-0">
											{item.imageUrl ? (
												<Image
													src={item.imageUrl}
													alt={item.equipment.title}
													fill
													sizes="48px"
													className="object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center">
													<Package
														size={14}
														className="text-muted-foreground/30"
													/>
												</div>
											)}
										</div>

										{/* Item info */}
										<div className="flex-1 min-w-0">
											<p className="font-semibold text-sm leading-snug truncate">
												{item.equipment.title}
											</p>
											<p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
												{fmtRub(item.priceAtBooking || 0)}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="flex-none w-full p-2 bg-muted-foreground/10">
					<div className="w-full flex pt-2 gap-2">
						{/* Open full page link */}
						<Button
							asChild
							variant="outline"
							className="flex-1 shrink-0 rounded-xl h-12 font-semibold px-3 text-xs gap-1.5 transition-all"
						>
							<Link href={`/dashboard/bookings/${booking.id}`}>
								<ExternalLink size={14} /> К заказу
							</Link>
						</Button>
						<DialogClose asChild>
							<Button
								variant="outline"
								className="flex-1 rounded-xl h-12 font-semibold"
							>
								<X size={14} />
								Закрыть
							</Button>
						</DialogClose>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
