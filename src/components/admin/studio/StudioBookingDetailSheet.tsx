"use client";

import {
	CalendarIcon,
	ClockIcon,
	UserIcon,
	VideoIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import type { StudioBookingDetail } from "@/actions/admin-studio-actions";
import {
	deleteStudioPaymentAction,
	getStudioBookingDetailAction,
	getStudioPaymentsAction,
	recordStudioPaymentAction,
	refundStudioToBalanceAction,
	updateStudioBookingStatusAction,
} from "@/actions/admin-studio-actions";
import { getUserBalanceAction } from "@/actions/audit-and-balance-actions";
import { PaymentsPanel } from "@/components/admin/bookings/PaymentsPanel";
import {
	Badge,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui";
import { BOOKING_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/constants";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn, fmtRub } from "@/lib/utils";

function fmtDateTime(d: Date | string) {
	return new Date(d).toLocaleString("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

type TabId = "info" | "payments" | "history";

const TABS: { id: TabId; label: string }[] = [
	{ id: "info", label: "Детали" },
	{ id: "payments", label: "Платежи" },
	{ id: "history", label: "История" },
];

// ─── InfoTab ──────────────────────────────────────────────────────────────────

function InfoTab({
	booking,
	onRefresh,
}: {
	booking: StudioBookingDetail;
	onRefresh: () => void;
}) {
	const [isChangingStatus, startStatusChange] = useTransition();
	const statusCfg = BOOKING_STATUS_CONFIG[booking.status];
	const psCfg = PAYMENT_STATUS_CONFIG[booking.paymentStatus];
	const start = new Date(booking.startDate);
	const end = new Date(booking.endDate);

	return (
		<div className="space-y-5">
			{/* Status selector */}
			<div className="flex items-center gap-3 p-4 rounded-2xl border border-foreground/8 bg-foreground/3">
				<Badge
					variant="outline"
					className={cn(
						"text-[11px] gap-1.5 font-semibold rounded-2xl shrink-0",
						statusCfg?.color
					)}
				>
					<span className={cn("w-1.5 h-1.5 rounded-full", statusCfg?.dot)} />
					{statusCfg?.label ?? booking.status}
				</Badge>
				<Select
					disabled={isChangingStatus}
					onValueChange={(v) => {
						startStatusChange(async () => {
							const r = await updateStudioBookingStatusAction(
								booking.id,
								v as BookingStatus
							);
							if (r.success) {
								toast.success(
									`Статус → ${BOOKING_STATUS_CONFIG[v as BookingStatus]?.label}`
								);
								onRefresh();
							} else toast.error(r.error ?? "Ошибка");
						});
					}}
				>
					<SelectTrigger className="h-7 text-xs flex-1 max-w-44 border-dashed">
						<SelectValue placeholder="Сменить статус…" />
					</SelectTrigger>
					<SelectContent>
						{(Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[])
							.filter((s) => s !== booking.status)
							.map((s) => (
								<SelectItem key={s} value={s} className="text-xs">
									{BOOKING_STATUS_CONFIG[s]?.label}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
			</div>

			{/* Client */}
			<div className="space-y-1">
				<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
					<UserIcon size={11} /> Клиент
				</p>
				<div className="flex items-start justify-between gap-2">
					<div>
						<p className="font-bold">{booking.userName || "Без имени"}</p>
						<p className="text-sm text-muted-foreground">
							{booking.userEmail || "—"}
						</p>
						{booking.userPhone && (
							<p className="text-sm text-muted-foreground">
								{booking.userPhone}
							</p>
						)}
					</div>
					{/* Баланс клиента — чип рядом с клиентом */}
					{booking.userBalance > 0 && (
						<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400 shrink-0">
							Баланс: {fmtRub(booking.userBalance)}
						</span>
					)}
				</div>
			</div>

			{/* Tariff + period */}
			<div className="space-y-2">
				<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
					<VideoIcon size={11} /> Аренда студии
				</p>
				<div className="rounded-xl border border-foreground/8 bg-foreground/3 p-3 space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-bold">{booking.tariffName}</span>
						<span className="text-sm font-black text-primary">
							{fmtRub(booking.tariffPriceAtBooking)}
							<span className="text-xs text-muted-foreground font-normal">
								/ч
							</span>
						</span>
					</div>
					<p className="text-xs text-muted-foreground flex items-center gap-1.5">
						<CalendarIcon size={11} />
						{start.toLocaleDateString("ru-RU", {
							day: "numeric",
							month: "short",
							year: "numeric",
						})}
						{" · "}
						{start.toLocaleTimeString("ru-RU", {
							hour: "2-digit",
							minute: "2-digit",
						})}
						{" → "}
						{end.toLocaleTimeString("ru-RU", {
							hour: "2-digit",
							minute: "2-digit",
						})}
						{start.toDateString() !== end.toDateString() && (
							<>
								{" "}
								(
								{end.toLocaleDateString("ru-RU", {
									day: "numeric",
									month: "short",
								})}
								)
							</>
						)}
					</p>
					<p className="text-xs text-muted-foreground flex items-center gap-1.5">
						<ClockIcon size={11} />
						{booking.durationHours % 1 === 0
							? `${booking.durationHours} ч`
							: `${booking.durationHours.toFixed(1)} ч`}
					</p>
				</div>
			</div>

			{/* Extra equipment */}
			{booking.items.length > 0 && (
				<div className="space-y-2">
					<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Доп. оборудование ({booking.items.length})
					</p>
					<div className="space-y-1.5">
						{booking.items.map((item) => (
							<div
								key={item.id}
								className="flex items-center gap-2 px-3 py-2 rounded-xl border border-foreground/8 bg-foreground/3"
							>
								<span className="flex-1 text-sm truncate">
									{item.equipmentTitle}
								</span>
								<span className="text-sm font-bold text-primary shrink-0">
									+ {fmtRub(item.priceAtBooking)}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Financial summary */}
			<div className="rounded-xl border border-foreground/8 bg-foreground/3 p-3 space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Итого</span>
					<span className="font-black text-base">
						{fmtRub(booking.totalAmount)}
					</span>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">Оплачено</span>
					<span
						className={cn(
							"font-bold",
							booking.totalPaid >= booking.totalAmount
								? "text-emerald-500"
								: "text-amber-500"
						)}
					>
						{fmtRub(booking.totalPaid)}
					</span>
				</div>
				{booking.paymentStatus === "OVERPAID" && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-blue-400">Переплата</span>
						<span className="font-bold text-blue-400">
							{fmtRub(booking.totalPaid - booking.totalAmount)}
						</span>
					</div>
				)}
				<div className="pt-1 border-t border-foreground/8">
					<Badge
						variant="outline"
						className={cn("text-[10px] gap-1.5 rounded-2xl", psCfg?.color)}
					>
						<span className={cn("w-1.5 h-1.5 rounded-full", psCfg?.dot)} />
						{psCfg?.label}
					</Badge>
				</div>
			</div>
		</div>
	);
}

// ─── HistoryTab ───────────────────────────────────────────────────────────────

function HistoryTab({ booking }: { booking: StudioBookingDetail }) {
	const ACTION_LABELS: Record<string, string> = {
		CREATED: "Заказ создан",
		STATUS_CHANGED: "Статус изменён",
		PAYMENT_ADDED: "Платёж добавлен",
		PAYMENT_DELETED: "Платёж удалён",
		REFUND_TO_BALANCE: "Возврат на баланс",
		CANCELLED: "Заказ отменён",
	};

	if (booking.auditLogs.length === 0) {
		return (
			<p className="text-center text-sm text-muted-foreground py-8 italic">
				История изменений пуста
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{booking.auditLogs.map((log) => (
				<div
					key={log.id}
					className="flex gap-3 px-3 py-2.5 rounded-xl border border-foreground/8 bg-foreground/3"
				>
					<div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium">
							{ACTION_LABELS[log.action] ?? log.action}
						</p>
						{log.fieldName === "status" &&
							log.valueBefore &&
							log.valueAfter && (
								<p className="text-[11px] text-muted-foreground mt-0.5">
									{BOOKING_STATUS_CONFIG[log.valueBefore as BookingStatus]
										?.label ?? log.valueBefore}
									{" → "}
									{BOOKING_STATUS_CONFIG[log.valueAfter as BookingStatus]
										?.label ?? log.valueAfter}
								</p>
							)}
						{log.fieldName === "payment" && log.valueAfter && (
							<p className="text-[11px] text-muted-foreground">
								{fmtRub(Number(log.valueAfter))}
							</p>
						)}
						<p className="text-[10px] text-muted-foreground/50 mt-1">
							{log.authorName && <span>{log.authorName} · </span>}
							{fmtDateTime(log.createdAt)}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function StudioBookingDetailSheet({
	bookingId,
	open,
	onOpenChange,
	onStatusUpdate,
}: {
	bookingId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onStatusUpdate?: () => void;
}) {
	const [booking, setBooking] = useState<StudioBookingDetail | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<TabId>("info");

	const loadBooking = useCallback(async (id: string) => {
		setIsLoading(true);
		const data = await getStudioBookingDetailAction(id);
		setBooking(data);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		if (open && bookingId) loadBooking(bookingId);
		if (!open)
			setTimeout(() => {
				setBooking(null);
				setActiveTab("info");
			}, 300);
	}, [open, bookingId, loadBooking]);

	const handleRefresh = useCallback(() => {
		if (bookingId) loadBooking(bookingId);
		onStatusUpdate?.();
	}, [bookingId, loadBooking, onStatusUpdate]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
				{/* Header */}
				<SheetHeader className="px-5 py-4 border-b border-foreground/5 shrink-0">
					<div className="flex items-center gap-2">
						<VideoIcon size={16} weight="duotone" />
						<SheetTitle className="text-base font-black italic uppercase tracking-tighter">
							Аренда студии
						</SheetTitle>
						{booking && (
							<span className="text-[10px] text-muted-foreground ml-1 font-mono select-all">
								{booking.id.slice(-6).toUpperCase()}
							</span>
						)}
					</div>
				</SheetHeader>

				{/* Tabs */}
				<div className="flex border-b border-foreground/5 px-5 shrink-0">
					{TABS.map(({ id, label }) => (
						<button
							key={id}
							type="button"
							onClick={() => setActiveTab(id)}
							className={cn(
								"px-3 py-3 text-xs font-bold whitespace-nowrap transition-all relative",
								activeTab === id
									? "text-primary"
									: "text-foreground/50 hover:text-foreground"
							)}
						>
							{label}
							{activeTab === id && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
							)}
						</button>
					))}
				</div>

				{/* Body:
				    - info + history: overflow-y-auto (всё скроллируется целиком)
				    - payments: flex column, PaymentsPanel сам управляет скроллом истории
				*/}
				{isLoading ? (
					<div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
						{[60, 40, 80, 40, 55].map((w, i) => (
							<div
								key={i}
								className="h-4 bg-foreground/5 rounded animate-pulse"
								style={{ width: `${w}%` }}
							/>
						))}
					</div>
				) : !booking ? (
					<div className="flex-1 flex items-center justify-center">
						<p className="text-sm text-muted-foreground">Заказ не найден</p>
					</div>
				) : (
					<>
						{activeTab === "info" && (
							<div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
								<InfoTab booking={booking} onRefresh={handleRefresh} />
							</div>
						)}

						{activeTab === "payments" && (
							// Payments tab: фиксированный верх (summary + форма) + скроллируемая история
							<div className="flex-1 flex flex-col min-h-0 px-5 py-5">
								<PaymentsPanel
									key={booking?.id}
									bookingId={booking.id} // Передаем ID вместо массива payments
									totalAmount={booking.totalAmount}
									userId={booking?.userId ?? ""}
									// userBalance={booking.userBalance}
									showOpType={false}
									// canRefundToBalance={booking.totalPaid > booking.totalAmount}
									bookingStatus={booking.status}
									// onRefresh={handleRefresh}
									actions={{
										getPayments: getStudioPaymentsAction,
										recordPayment: recordStudioPaymentAction,
										deletePayment: deleteStudioPaymentAction,
										getUserBalance: getUserBalanceAction,
										refundToBalance: async (id, amount) =>
											refundStudioToBalanceAction(id, amount),
										applyBalance: async (id, amount) =>
											recordStudioPaymentAction({
												bookingId: id,
												amount: Number(amount),
												method: "BALANCE",
												type: "PAYMENT",
												note: "Оплата с баланса",
											}),
									}}
								/>
							</div>
						)}

						{activeTab === "history" && (
							<div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
								<HistoryTab booking={booking} />
							</div>
						)}
					</>
				)}
			</SheetContent>
		</Sheet>
	);
}
