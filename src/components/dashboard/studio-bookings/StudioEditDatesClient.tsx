"use client";

import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronDown, InfoIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ClientStudioBookingDetail } from "@/actions/client-studio-actions";
import {
	checkStudioAvailabilityAction,
	updateStudioBookingDatesAction,
} from "@/actions/client-studio-actions";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import {
	BookingButton,
	ClientTime,
	RentalPeriod,
	type RentalPeriodValue,
} from "@/components/shared";
import { Separator } from "@/components/ui";
import {
	BOOKING_STATUS_LABELS,
	BOOKING_STATUS_STYLES,
} from "@/constants/booking-status";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn, combineDateAndTime, fmtRub } from "@/lib/utils";

interface StudioEditDatesClientProps {
	booking: ClientStudioBookingDetail;
}

export function StudioEditDatesClient({ booking }: StudioEditDatesClientProps) {
	const router = useRouter();
	const [isItemsExpanded, setIsItemsExpanded] = useState(true);

	const [period, setPeriod] = useState<RentalPeriodValue>(() => {
		const start = new Date(booking.startDate);
		const end = new Date(booking.endDate);
		return {
			startDate: start,
			endDate: end,
			startTime: format(start, "HH:mm"),
			endTime: format(end, "HH:mm"),
		};
	});

	const [isChecking, setIsChecking] = useState(false);
	const [isAvailable, setIsAvailable] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const math = useMemo(() => {
		const start = combineDateAndTime(period.startDate, period.startTime);
		const end = combineDateAndTime(period.endDate, period.endTime);
		if (!start || !end)
			return {
				hours: 0,
				startFull: null as Date | null,
				endFull: null as Date | null,
			};
		const hours = Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
		return { hours, startFull: start, endFull: end };
	}, [period]);

	// Проверяем доступность при смене дат
	const checkAvailability = async (start: Date, end: Date) => {
		setIsChecking(true);
		try {
			const result = await checkStudioAvailabilityAction(
				start,
				end,
				booking.id
			);
			setIsAvailable(result.available);
		} finally {
			setIsChecking(false);
		}
	};

	const handlePeriodChange = (v: RentalPeriodValue) => {
		setPeriod(v);
		const start = combineDateAndTime(v.startDate, v.startTime);
		const end = combineDateAndTime(v.endDate, v.endTime);
		if (start && end && end > start) {
			checkAvailability(start, end);
		}
	};

	const hasChanges = useMemo(() => {
		if (!math.startFull || !math.endFull) return false;
		const origStart = Math.floor(new Date(booking.startDate).getTime() / 60000);
		const origEnd = Math.floor(new Date(booking.endDate).getTime() / 60000);
		const newStart = Math.floor(math.startFull.getTime() / 60000);
		const newEnd = Math.floor(math.endFull.getTime() / 60000);
		return newStart !== origStart || newEnd !== origEnd;
	}, [math.startFull, math.endFull, booking.startDate, booking.endDate]);

	const canSave =
		isAvailable &&
		!!math.startFull &&
		!!math.endFull &&
		math.hours >= 1 &&
		hasChanges;

	const handleSave = async () => {
		if (!canSave || !math.startFull || !math.endFull) return;
		setIsSubmitting(true);
		try {
			const result = await updateStudioBookingDatesAction(
				booking.id,
				math.startFull.toISOString(),
				math.endFull.toISOString()
			);
			if (result.success) {
				toast.success("Даты обновлены. Менеджер подтвердит изменения.");
				router.push(`/dashboard/studio-bookings/${booking.id}`);
			} else {
				toast.error(result.error ?? "Ошибка при обновлении");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const status = booking.status as BookingStatus;
	const shortId = booking.id.split("-")[0]?.toUpperCase();

	return (
		<div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300 pb-16">
			<DashboardBreadcrumb
				items={[
					{ label: "Мои заказы студии", href: "/dashboard/studio-bookings" },
					{
						label: `Заказ ${shortId}`,
						href: `/dashboard/studio-bookings/${booking.id}`,
					},
					{ label: "Изменить даты" },
				]}
			/>

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link
						href={`/dashboard/studio-bookings/${booking.id}`}
						className="w-10 h-10 rounded-xl border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 transition-colors shrink-0"
					>
						<ArrowLeft size={18} />
					</Link>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
							Редактирование
						</p>
						<h1 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">
							Заказ № {shortId}
						</h1>
					</div>
				</div>
				<span
					className={cn(
						"text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border shrink-0 self-start sm:self-auto",
						BOOKING_STATUS_STYLES[status] ??
							"bg-foreground/5 text-muted-foreground"
					)}
				>
					{BOOKING_STATUS_LABELS[status] ?? status}
				</span>
			</div>

			{/* Main grid */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* Left: editor */}
				<div className="lg:col-span-7 space-y-5">
					<div className="card-surface px-5 py-6 rounded-2xl border border-foreground/5">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
							Текущий период
						</p>
						<div className="flex items-center gap-3 text-sm font-medium text-muted-foreground/60">
							<ClientTime iso={booking.startDate} fmt="datetime" />
							<span className="opacity-30">→</span>
							<ClientTime iso={booking.endDate} fmt="datetime" />
						</div>

						<Separator className="my-6 bg-muted-foreground/10" />

						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
							Новый период
						</p>
						<RentalPeriod value={period} onChange={handlePeriodChange} />

						{!isAvailable && (
							<div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
								Студия занята в выбранный период. Пожалуйста, выберите другое
								время.
							</div>
						)}

						{isChecking && isAvailable && (
							<p className="mt-3 text-[11px] text-muted-foreground/40 flex items-center gap-2">
								<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
								Проверяем доступность…
							</p>
						)}
					</div>

					<div
						className={cn(
							"px-4 py-4 rounded-xl border transition-all duration-300 flex items-start gap-3",
							canSave
								? "border-amber-500/20 bg-amber-500/5 text-amber-500/80"
								: "border-foreground/5 bg-foreground/5 text-muted-foreground opacity-40"
						)}
					>
						<InfoIcon size={16} className="shrink-0 mt-0.5" />
						<p className="text-xs leading-relaxed">
							При изменении дат заказ будет отправлен на повторную проверку
							менеджером.
						</p>
					</div>

					<div className="pt-2">
						<BookingButton
							onClick={handleSave}
							disabled={!canSave}
							loading={isSubmitting}
							mode="update"
						/>
						{!hasChanges && (
							<p className="text-[11px] text-muted-foreground/40 text-center mt-3">
								Чтобы сохранить, измените дату или время
							</p>
						)}
					</div>
				</div>

				{/* Right: items summary */}
				<div className="lg:col-span-5 lg:sticky lg:top-6">
					<div className="card-surface rounded-2xl border border-foreground/8 overflow-hidden">
						<button
							type="button"
							onClick={() => setIsItemsExpanded(!isItemsExpanded)}
							className="w-full px-5 py-4 flex items-center justify-between hover:bg-foreground/2 transition-colors"
						>
							<div className="flex flex-col items-start">
								<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
									Состав заказа
								</p>
								<p className="text-xs font-semibold mt-0.5">
									Тариф: {booking.tariffName} ·{" "}
									{booking.items.length > 0
										? `+${booking.items.length} поз.`
										: "без техники"}{" "}
									· {fmtRub(booking.totalAmount)}
								</p>
							</div>
							<ChevronDown
								size={18}
								className={cn(
									"text-muted-foreground/40 transition-transform duration-300",
									isItemsExpanded && "rotate-180"
								)}
							/>
						</button>

						<AnimatePresence initial={false}>
							{isItemsExpanded && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.3, ease: "easeInOut" }}
								>
									<div className="border-t border-foreground/5">
										{/* Тариф */}
										<div className="flex items-center gap-3 px-5 py-3.5 border-b border-foreground/5">
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">
													{booking.tariffName}
												</p>
												<span className="text-[9px] uppercase font-bold text-muted-foreground/50">
													Тариф
												</span>
											</div>
											<span className="text-xs text-muted-foreground/40 font-mono shrink-0">
												{fmtRub(booking.tariffPriceAtBooking)} /ч
											</span>
										</div>

										{/* Техника */}
										{booking.items.map((item) => (
											<div
												key={item.id}
												className="flex items-center gap-3 px-5 py-3.5 border-b border-foreground/5 last:border-0"
											>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate">
														{item.equipmentTitle}
													</p>
												</div>
												<span className="text-xs text-muted-foreground/40 font-mono shrink-0">
													{fmtRub(item.priceAtBooking)} /шт
												</span>
											</div>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</div>
	);
}
