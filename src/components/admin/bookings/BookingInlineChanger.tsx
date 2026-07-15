"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	adminClearBookingPaymentsAction,
	adminForceSetBookingStatusAction,
	adminHalfPayBookingAction,
	adminQuickPayBookingAction,
} from "@/actions/admin/admin-booking-actions";
import {
	Badge,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui";
import { BOOKING_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/constants";
import type {
	BookingStatus,
	PaymentStatus,
} from "@/core/domain/entities/Booking";
import { cn } from "@/lib/utils";

// ─── InlineStatusChanger ──────────────────────────────────────────────────────

interface InlineStatusChangerProps {
	bookingId: string;
	status: BookingStatus;
	/** Таблица: инвалидирует query-кэш */
	onRefresh?: () => void;
	/** Sheet: обновляет localBooking напрямую */
	onChanged?: (s: BookingStatus) => void;
}

export function InlineStatusChanger({
	bookingId,
	status,
	onRefresh,
	onChanged,
}: InlineStatusChangerProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState<BookingStatus | null>(null);

	const cfg = BOOKING_STATUS_CONFIG[status] ?? {
		label: status,
		color: "bg-foreground/8 text-foreground/50",
		dot: "bg-foreground/30",
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						"text-[10px] gap-1.5 border font-semibold cursor-pointer hover:opacity-80 transition-opacity select-none rounded-2xl",
						cfg.color
					)}
					onClick={(e) => {
						e.stopPropagation();
						setOpen(true);
					}}
				>
					<span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
					{cfg.label}
					<CaretDownIcon size={8} className="opacity-60" />
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-44 rounded-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{(Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[])
					.filter((s) => s !== status)
					.map((s) => {
						const scfg = BOOKING_STATUS_CONFIG[s];
						return (
							<DropdownMenuItem
								key={s}
								disabled={loading !== null}
								className={cn(
									"text-xs gap-2 rounded-full",
									s === "CANCELLED" && "text-red-500 focus:text-red-500"
								)}
								onClick={async (e) => {
									e.stopPropagation();
									setLoading(s);
									const r = await adminForceSetBookingStatusAction(
										bookingId,
										s
									);
									setLoading(null);
									setOpen(false);
									if (r.success) {
										toast.success(`Статус → ${scfg.label}`);
										onRefresh?.();
										onChanged?.(s);
									} else {
										toast.error(r.error ?? "Ошибка");
									}
								}}
							>
								<span
									className={cn("w-1.5 h-1.5 rounded-full shrink-0", scfg.dot)}
								/>
								{scfg.label}
								{loading === s && (
									<span className="ml-auto w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
								)}
							</DropdownMenuItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ─── InlinePaymentChanger ─────────────────────────────────────────────────────

interface InlinePaymentChangerProps {
	bookingId: string;
	status: PaymentStatus;
	/** Таблица: инвалидирует query-кэш */
	onRefresh?: () => void;
	/** Sheet: обновляет localBooking напрямую */
	onChanged?: (
		paymentStatus: PaymentStatus,
		bookingStatus: BookingStatus
	) => void;
}

export function InlinePaymentChanger({
	bookingId,
	status,
	onRefresh,
	onChanged,
}: InlinePaymentChangerProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const cfg = PAYMENT_STATUS_CONFIG[status] ?? {
		label: status,
		color: "bg-foreground/8 text-foreground/50",
		dot: "bg-foreground/30",
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						"text-[10px] gap-1.5 border font-semibold cursor-pointer hover:opacity-80 transition-opacity select-none rounded-2xl",
						cfg.color
					)}
					onClick={(e) => {
						e.stopPropagation();
						setOpen(true);
					}}
				>
					<span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
					{cfg.label}
					<CaretDownIcon size={8} className="opacity-60" />
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-52 rounded-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Полная оплата */}
				<DropdownMenuItem
					disabled={isPending || status === "PAID" || status === "OVERPAID"}
					className="text-xs gap-2 rounded-full text-green-600 focus:text-green-600"
					onClick={(e) => {
						e.stopPropagation();
						startTransition(async () => {
							const r = await adminQuickPayBookingAction(bookingId);
							if (r.success) {
								toast.success("Оплачен полностью → Готов к выдаче");
								onRefresh?.();
								onChanged?.("PAID", "READY_TO_RENT");
							} else {
								toast.error(r.error);
							}
							setOpen(false);
						});
					}}
				>
					<span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
					Полностью оплачен
				</DropdownMenuItem>

				{/* Предоплата 50% */}
				<DropdownMenuItem
					disabled={
						isPending ||
						status === "PAID" ||
						status === "OVERPAID" ||
						status === "PARTIAL"
					}
					className="text-xs gap-2 rounded-full text-blue-500 focus:text-blue-500"
					onClick={(e) => {
						e.stopPropagation();
						startTransition(async () => {
							const r = await adminHalfPayBookingAction(bookingId);
							if (r.success) {
								toast.success("Предоплата 50% → Готов к выдаче");
								onRefresh?.();
								onChanged?.("PARTIAL", "READY_TO_RENT");
							} else {
								toast.error(r.error);
							}
							setOpen(false);
						});
					}}
				>
					<span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
					Предоплата 50%
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{/* Сброс */}
				<DropdownMenuItem
					disabled={isPending || status === "UNPAID"}
					className="text-xs gap-2 rounded-full text-red-500 focus:text-red-500"
					onClick={(e) => {
						e.stopPropagation();
						if (window.confirm("Удалить ВСЕ платежи по этому заказу?")) {
							startTransition(async () => {
								const r = await adminClearBookingPaymentsAction(bookingId);
								if (r.success) {
									toast.success("Все платежи сброшены");
									onRefresh?.();
									onChanged?.("UNPAID", "PENDING_REVIEW");
								} else {
									toast.error(r.error);
								}
								setOpen(false);
							});
						}
					}}
				>
					<span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
					Не оплачен (сбросить)
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
