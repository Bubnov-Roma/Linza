"use client";

import {
	CalendarBlankIcon,
	CaretDownIcon,
	ClockIcon,
	CurrencyRubIcon,
	ListIcon,
	UserIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import type {
	StudioBookingDetail,
	StudioBookingRow,
} from "@/actions/admin-studio-actions";
import {
	getStudioBookingDetailAction,
	updateStudioBookingStatusAction,
} from "@/actions/admin-studio-actions";
import { PAYMENT_STATUS_CONFIG } from "@/components/admin/bookings/PaymentsPanel";
import { StudioPaymentsPanel } from "@/components/admin/studio/StudioPaymentsPanel";
import {
	Badge,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui";
import { BOOKING_STATUS_CONFIG } from "@/constants";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(d: Date) {
	return new Date(d).toLocaleString("ru-RU", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function fmtRub(n: number) {
	return `${n.toLocaleString("ru-RU")} ₽`;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = "info" | "payments" | "log";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
	{ id: "info", label: "Детали", icon: ListIcon },
	{ id: "payments", label: "Платежи", icon: CurrencyRubIcon },
	{ id: "log", label: "История", icon: ClockIcon },
];

// ─── StatusChanger ────────────────────────────────────────────────────────────

function StatusChanger({
	bookingId,
	status,
	onRefresh,
}: {
	bookingId: string;
	status: BookingStatus;
	onRefresh: () => void;
}) {
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
						"text-xs gap-1.5 border font-semibold cursor-pointer hover:opacity-80 select-none rounded-2xl px-3 py-1.5",
						cfg.color
					)}
				>
					<span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
					{cfg.label}
					<CaretDownIcon size={10} className="opacity-60" />
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-48 rounded-2xl">
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
								onClick={async () => {
									setLoading(s);
									const r = await updateStudioBookingStatusAction(bookingId, s);
									setLoading(null);
									setOpen(false);
									if (r.success) {
										onRefresh();
										toast.success(`Статус → ${scfg.label}`);
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

// ─── Main ─────────────────────────────────────────────────────────────────────

interface StudioBookingDetailSheetProps {
	booking: StudioBookingRow | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onStatusUpdate?: () => void;
}

export function StudioBookingDetailSheet({
	booking,
	open,
	onOpenChange,
	onStatusUpdate,
}: StudioBookingDetailSheetProps) {
	const [activeTab, setActiveTab] = useState<TabId>("info");
	const [detail, setDetail] = useState<StudioBookingDetail | null>(null);
	const [isLoadingDetail, startLoadTransition] = useTransition();

	// Load full detail when opening
	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		if (!open || !booking) return;
		setDetail(null);
		setActiveTab("info");
		startLoadTransition(async () => {
			const d = await getStudioBookingDetailAction(booking.id);
			setDetail(d);
		});
	}, [open, booking?.id]);

	const refreshDetail = () => {
		if (!booking) return;
		startLoadTransition(async () => {
			const d = await getStudioBookingDetailAction(booking.id);
			setDetail(d);
			onStatusUpdate?.();
		});
	};

	const payStatus = detail?.paymentStatus ?? booking?.paymentStatus;
	const payCfg = payStatus ? PAYMENT_STATUS_CONFIG[payStatus] : null;

	const durationHours = booking?.durationHours ?? 0;
	const durationLabel =
		durationHours % 1 === 0
			? `${durationHours} ч`
			: `${durationHours.toFixed(1)} ч`;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden">
				{/* ── Header ── */}
				<SheetHeader className="px-6 py-5 border-b border-foreground/5 shrink-0">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<SheetTitle className="text-base font-black italic uppercase tracking-tighter truncate">
								{booking?.tariffName ?? "Аренда студии"}
							</SheetTitle>
							<p className="text-xs text-muted-foreground mt-0.5 truncate">
								{booking?.userName || "Без имени"} ·{" "}
								{booking?.id.slice(0, 8).toUpperCase()}
							</p>
						</div>
						<div className="flex flex-col items-end gap-1.5 shrink-0">
							{booking && (
								<StatusChanger
									bookingId={booking.id}
									status={booking.status}
									onRefresh={refreshDetail}
								/>
							)}
							{payCfg && (
								<Badge
									variant="outline"
									className={cn(
										"text-[10px] gap-1 border rounded-xl",
										payCfg.color
									)}
								>
									<span
										className={cn("w-1.5 h-1.5 rounded-full", payCfg.dot)}
									/>
									{payCfg.label}
								</Badge>
							)}
						</div>
					</div>
				</SheetHeader>

				{/* ── Quick summary bar ── */}
				{booking && (
					<div className="grid grid-cols-3 divide-x divide-foreground/5 border-b border-foreground/5 shrink-0">
						<div className="px-4 py-3">
							<p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
								Период
							</p>
							<p className="text-xs font-bold mt-0.5">
								{new Date(booking.startDate).toLocaleDateString("ru-RU", {
									day: "numeric",
									month: "short",
								})}
							</p>
							<p className="text-[10px] text-muted-foreground">
								{new Date(booking.startDate).toLocaleTimeString("ru-RU", {
									hour: "2-digit",
									minute: "2-digit",
								})}{" "}
								—{" "}
								{new Date(booking.endDate).toLocaleTimeString("ru-RU", {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
						<div className="px-4 py-3">
							<p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
								Длительность
							</p>
							<p className="text-xs font-bold mt-0.5">{durationLabel}</p>
							<p className="text-[10px] text-muted-foreground">
								{fmtRub(booking.tariffPriceAtBooking)}/ч
							</p>
						</div>
						<div className="px-4 py-3">
							<p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
								Итого
							</p>
							<p className="text-sm font-black text-primary mt-0.5">
								{fmtRub(booking.totalAmount)}
							</p>
							{booking.itemsCount > 0 && (
								<p className="text-[10px] text-muted-foreground">
									+ {booking.itemsCount} техника
								</p>
							)}
						</div>
					</div>
				)}

				{/* ── Tabs ── */}
				<div className="flex border-b border-foreground/5 shrink-0">
					{TABS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => setActiveTab(id)}
							className={cn(
								"flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all relative",
								activeTab === id
									? "text-primary"
									: "text-foreground/50 hover:text-foreground"
							)}
						>
							<Icon size={13} />
							{label}
							{activeTab === id && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
							)}
						</button>
					))}
				</div>

				{/* ── Content ── */}
				<div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
					{isLoadingDetail && !detail ? (
						<div className="space-y-3 animate-pulse">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="h-12 rounded-xl bg-foreground/5" />
							))}
						</div>
					) : (
						<>
							{/* ── INFO TAB ── */}
							{activeTab === "info" && detail && (
								<div className="space-y-5">
									{/* Client */}
									<section className="space-y-2">
										<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
											<UserIcon size={11} />
											Клиент
										</p>
										<div className="rounded-xl border border-foreground/8 bg-foreground/3 p-3 space-y-1">
											<p className="text-sm font-bold">
												{detail.userName || "Без имени"}
											</p>
											{detail.userEmail && (
												<p className="text-xs text-muted-foreground">
													{detail.userEmail}
												</p>
											)}
											{detail.userPhone && (
												<p className="text-xs text-muted-foreground">
													{detail.userPhone}
												</p>
											)}
										</div>
									</section>

									{/* Tariff */}
									<section className="space-y-2">
										<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
											<CalendarBlankIcon size={11} />
											Тариф и период
										</p>
										<div className="rounded-xl border border-foreground/8 bg-foreground/3 p-3 space-y-2">
											<div className="flex justify-between">
												<span className="text-sm font-bold">
													{detail.tariffName}
												</span>
												<span className="text-sm font-black text-primary">
													{fmtRub(detail.tariffPriceAtBooking)}/ч
												</span>
											</div>
											<div className="flex justify-between text-xs text-muted-foreground">
												<span>
													{fmtDateTime(detail.startDate)} —{" "}
													{fmtDateTime(detail.endDate)}
												</span>
												<span className="font-medium">{durationLabel}</span>
											</div>
											<div className="flex justify-between text-xs border-t border-foreground/5 pt-2">
												<span className="text-muted-foreground">
													Стоимость тарифа
												</span>
												<span className="font-bold">
													{fmtRub(detail.tariffPriceAtBooking * durationHours)}
												</span>
											</div>
										</div>
									</section>

									{/* Equipment items */}
									{detail.items.length > 0 && (
										<section className="space-y-2">
											<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
												Дополнительное оборудование
											</p>
											<div className="space-y-1.5">
												{detail.items.map((item) => (
													<div
														key={item.id}
														className="flex items-center gap-2.5 rounded-xl border border-foreground/6 bg-foreground/2 px-3 py-2"
													>
														<div className="relative shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-foreground/5">
															{item.equipmentImageUrl ? (
																<Image
																	src={item.equipmentImageUrl}
																	alt={item.equipmentTitle}
																	fill
																	sizes="32px"
																	className="object-cover"
																/>
															) : null}
														</div>
														<span className="flex-1 text-xs font-medium truncate">
															{item.equipmentTitle}
														</span>
														<span className="text-xs font-bold text-primary shrink-0">
															{fmtRub(item.priceAtBooking)}
														</span>
													</div>
												))}
											</div>
										</section>
									)}

									{/* Total */}
									<div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 flex justify-between items-center">
										<span className="text-sm font-bold text-muted-foreground">
											Итого
										</span>
										<span className="text-xl font-black text-primary">
											{fmtRub(detail.totalAmount)}
										</span>
									</div>

									{/* Cancellation */}
									{detail.cancellationReason && (
										<div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
											<WarningCircleIcon
												size={14}
												className="text-red-400 shrink-0 mt-0.5"
											/>
											<div>
												<p className="text-xs font-bold text-red-400">
													Причина отмены
												</p>
												<p className="text-xs text-red-400/80 mt-0.5">
													{detail.cancellationReason}
												</p>
											</div>
										</div>
									)}
								</div>
							)}

							{/* ── PAYMENTS TAB ── */}
							{activeTab === "payments" && booking && (
								<StudioPaymentsPanel
									studioBookingId={booking.id}
									totalAmount={booking.totalAmount}
									currentStatus={booking.status}
									onStatusChangeNeeded={() => setActiveTab("info")}
								/>
							)}

							{/* ── LOG TAB ── */}
							{activeTab === "log" && detail && (
								<div className="space-y-2">
									{detail.auditLogs.length === 0 ? (
										<p className="text-xs text-muted-foreground/40 italic text-center py-8">
											История изменений пуста
										</p>
									) : (
										detail.auditLogs.map((log) => (
											<div
												key={log.id}
												className="flex items-start gap-2.5 py-2 border-b border-foreground/5 last:border-0"
											>
												<div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
												<div className="flex-1 min-w-0">
													<div className="flex items-baseline justify-between gap-2">
														<p className="text-xs font-semibold truncate">
															{log.action === "CREATED" && "Заказ создан"}
															{log.action === "STATUS_CHANGED" &&
																`Статус: ${BOOKING_STATUS_CONFIG[log.valueBefore as BookingStatus]?.label ?? log.valueBefore} → ${BOOKING_STATUS_CONFIG[log.valueAfter as BookingStatus]?.label ?? log.valueAfter}`}
															{log.action === "PAYMENT_ADDED" &&
																`Платёж: +${fmtRub(Number(log.valueAfter))}`}
															{log.action === "PAYMENT_DELETED" &&
																`Платёж удалён: ${fmtRub(Number(log.valueBefore))}`}
															{log.action === "CANCELLED" && "Заказ отменён"}
															{![
																"CREATED",
																"STATUS_CHANGED",
																"PAYMENT_ADDED",
																"PAYMENT_DELETED",
																"CANCELLED",
															].includes(log.action) && log.action}
														</p>
														<span className="text-[10px] text-muted-foreground/50 shrink-0">
															{new Date(log.createdAt).toLocaleString("ru-RU", {
																day: "numeric",
																month: "short",
																hour: "2-digit",
																minute: "2-digit",
															})}
														</span>
													</div>
													{log.authorName && (
														<p className="text-[10px] text-muted-foreground/50 mt-0.5">
															{log.authorName}
														</p>
													)}
												</div>
											</div>
										))
									)}
								</div>
							)}
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
