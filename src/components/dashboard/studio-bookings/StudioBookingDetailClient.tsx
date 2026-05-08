"use client";

import { TagChevronIcon } from "@phosphor-icons/react";
import { differenceInHours } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	CalendarClock,
	CalendarDays,
	Check,
	ChevronDown,
	Clock,
	LayoutDashboard,
	Package,
	Pencil,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { ClientStudioBookingDetail } from "@/actions/client-studio-actions";
import { cancelStudioBookingAction } from "@/actions/client-studio-actions";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { ClientTime } from "@/components/shared";
import { SupportBlock } from "@/components/shared/SupportBlock";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Textarea,
} from "@/components/ui";
import {
	BOOKING_STATUS_LABELS,
	BOOKING_STATUS_STYLES,
	CANCELLATION_PRESETS,
	STATUS_STEPS,
	type SupportInfo,
} from "@/constants";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn, fmtRub } from "@/lib/utils";

// ─── Типы ─────────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABELS: Record<
	ClientStudioBookingDetail["paymentStatus"],
	string
> = {
	UNPAID: "Не оплачено",
	PARTIAL: "Частично оплачено",
	PAID: "Оплачено",
	OVERPAID: "Переплата",
};

const PAYMENT_STATUS_STYLES: Record<
	ClientStudioBookingDetail["paymentStatus"],
	string
> = {
	UNPAID: "text-amber-500 bg-amber-500/10 border-amber-500/20",
	PARTIAL: "text-blue-400 bg-blue-400/10 border-blue-400/20",
	PAID: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
	OVERPAID: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

// ─── CancelDialog ─────────────────────────────────────────────────────────────

function CancelStudioBookingDialog({
	bookingId,
	open,
	onOpenChange,
	onSuccess,
}: {
	bookingId: string;
	open: boolean;
	onOpenChange: (v: boolean) => void;
	onSuccess: () => void;
}) {
	const [selected, setSelected] = useState<string | null>(null);
	const [custom, setCustom] = useState("");
	const [loading, setLoading] = useState(false);

	const isCustom = selected === "Указать свою причину";
	const reason = isCustom ? custom.trim() : (selected ?? "");
	const canSubmit = reason.length > 0;

	const handleSubmit = async () => {
		if (!canSubmit) return;
		setLoading(true);
		const result = await cancelStudioBookingAction(bookingId, reason);
		setLoading(false);
		if (result.success) {
			onSuccess();
			onOpenChange(false);
		} else {
			toast.error(result.error ?? "Ошибка отмены");
		}
	};

	const reset = () => {
		setSelected(null);
		setCustom("");
	};

	return (
		<AlertDialog
			open={open}
			onOpenChange={(o) => {
				if (!o) reset();
				onOpenChange(o);
			}}
		>
			<AlertDialogContent className="border-foreground/10 bg-background/90 backdrop-blur-xl max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle>Отменить заказ?</AlertDialogTitle>
					<AlertDialogDescription>
						Укажите причину отмены — это поможет нам стать лучше.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-2 py-1">
					{CANCELLATION_PRESETS.map((preset) => (
						<button
							key={preset}
							type="button"
							onClick={() => setSelected(preset)}
							className={cn(
								"w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all",
								selected === preset
									? "border-primary/40 bg-primary/10 text-primary"
									: "border-foreground/10 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
							)}
						>
							{preset}
						</button>
					))}
					{isCustom && (
						<Textarea
							value={custom}
							onChange={(e) => setCustom(e.target.value)}
							placeholder="Опишите причину отмены..."
							autoFocus
							rows={3}
							className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-card/40 text-sm placeholder:text-muted-foreground/40 outline-none focus:border-primary/40 focus:bg-card/70 transition-all resize-none"
						/>
					)}
				</div>

				<AlertDialogFooter className="gap-2">
					<AlertDialogCancel onClick={reset} className="flex-1">
						Не отменять
					</AlertDialogCancel>
					<Button
						variant="destructive"
						disabled={!canSubmit || loading}
						onClick={handleSubmit}
						className="flex-1"
					>
						{loading ? (
							<span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
						) : (
							"Отменить заказ"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudioBookingDetailClient({
	booking,
	support,
}: {
	booking: ClientStudioBookingDetail;
	support: SupportInfo;
}) {
	const [isStatusExpanded, setIsStatusExpanded] = useState(false);
	const [isItemsExpanded, setIsItemsExpanded] = useState(true);
	const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(false);
	const [showEditMenu, setShowEditMenu] = useState(false);
	const [showCancel, setShowCancel] = useState(false);
	const [showCancelledDialog, setShowCancelledDialog] = useState(false);

	const status = booking.status as BookingStatus;
	const shortId = booking.id.split("-")[0]?.toUpperCase();
	const hours = Math.ceil(
		differenceInHours(new Date(booking.endDate), new Date(booking.startDate))
	);

	const editable = !["ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"].includes(
		status
	);

	const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === status);
	const isCancelled = status === "CANCELLED";

	return (
		<div className="max-w-6xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-500 pb-20">
			<DashboardBreadcrumb
				items={[
					{ label: "Мои заказы студии", href: "/dashboard/studio-bookings" },
					{ label: `Заказ ${shortId}` },
				]}
			/>

			{/* ── Header ── */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard/studio-bookings"
						className="w-10 h-10 rounded-xl border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 transition-all shrink-0"
					>
						<ArrowLeft size={18} />
					</Link>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
							Заказ студии
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

			{/* ── Main grid ── */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* ── Левая колонка: Статус + Период + Действия ── */}
				<aside className="lg:col-span-5 lg:sticky lg:top-6 space-y-4 order-1">
					{/* Статус-трекер */}
					{!isCancelled && (
						<div className="card-surface rounded-2xl border border-foreground/8 overflow-hidden">
							<button
								type="button"
								onClick={() => setIsStatusExpanded(!isStatusExpanded)}
								className="w-full px-6 py-5 flex items-center justify-between hover:bg-muted-foreground/5 transition-colors"
							>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left">
										Статус заказа
									</p>
									<p className="text-sm font-bold mt-0.5 text-left">
										{BOOKING_STATUS_LABELS[status] ?? status}
									</p>
								</div>
								<ChevronDown
									size={16}
									className={cn(
										"text-muted-foreground/40 transition-transform duration-300",
										isStatusExpanded && "rotate-180"
									)}
								/>
							</button>

							<AnimatePresence initial={false}>
								{isStatusExpanded && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.25, ease: "easeInOut" }}
									>
										<div className="border-t border-foreground/5 px-6 py-5 space-y-4">
											{STATUS_STEPS.filter(
												(s) => s.key !== "CANCELLED" && s.key !== "COMPLETED"
											).map((step, idx) => {
												const isDone = idx < currentStepIndex;
												const isCurrent = idx === currentStepIndex;
												return (
													<div
														key={step.key}
														className="flex items-start gap-4 relative pl-9"
													>
														{idx <
															STATUS_STEPS.filter(
																(s) =>
																	s.key !== "CANCELLED" && s.key !== "COMPLETED"
															).length -
																1 && (
															<div
																className={cn(
																	"absolute left-3 top-6 w-px h-full",
																	isDone
																		? "bg-emerald-500/30"
																		: "bg-foreground/8"
																)}
															/>
														)}
														<div
															className={cn(
																"absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all z-10",
																isDone
																	? "bg-emerald-500 border-emerald-500 text-white"
																	: isCurrent
																		? "bg-background border-primary text-primary"
																		: "bg-background border-foreground/10 text-muted-foreground/20"
															)}
														>
															{isDone ? (
																<Check size={14} strokeWidth={3} />
															) : (
																<div className="w-1.5 h-1.5 rounded-full bg-current" />
															)}
														</div>
														<div>
															<p
																className={cn(
																	"text-sm font-bold",
																	isCurrent ? "text-primary" : "text-foreground"
																)}
															>
																{step.label}
															</p>
															<p className="text-xs text-muted-foreground">
																{step.desc}
															</p>
														</div>
													</div>
												);
											})}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}

					{/* Отменён */}
					{isCancelled && (
						<div className="card-surface rounded-2xl border border-destructive/20 p-5 space-y-2">
							<p className="text-[10px] font-bold uppercase tracking-widest text-destructive/60">
								Заказ отменён
							</p>
							{booking.cancellationReason && (
								<p className="text-sm text-muted-foreground">
									{booking.cancellationReason}
								</p>
							)}
							{booking.cancelledAt && (
								<p className="text-xs text-muted-foreground/50">
									<ClientTime iso={booking.cancelledAt} fmt="full-datetime" />
								</p>
							)}
						</div>
					)}

					{/* Период */}
					<div className="card-surface p-6 space-y-6 rounded-2xl border border-foreground/8">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							Период аренды студии
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-muted-foreground mb-2">
									<CalendarDays size={14} />
									<span className="text-xs uppercase font-bold">Начало</span>
								</div>
								<p className="text-lg font-black">
									<ClientTime iso={booking.startDate} fmt="full-datetime" />
								</p>
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-muted-foreground mb-2">
									<CalendarClock size={14} />
									<span className="text-xs uppercase font-bold">Конец</span>
								</div>
								<p className="text-lg font-black">
									<ClientTime iso={booking.endDate} fmt="full-datetime" />
								</p>
							</div>
						</div>
						<div className="pt-4 border-t border-foreground/5 flex items-center justify-between">
							<span className="text-sm text-muted-foreground">
								Длительность
							</span>
							<span className="text-sm font-bold bg-foreground/5 px-3 py-1 rounded-lg flex items-center gap-1.5">
								<Clock size={12} className="opacity-40" />
								{hours} ч.
							</span>
						</div>
					</div>

					{/* Тариф */}
					<div className="card-surface p-5 rounded-2xl border border-foreground/8 space-y-3">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							Тариф
						</p>
						<div className="flex items-center justify-between">
							<p className="font-bold">{booking.tariffName}</p>
							<p className="text-sm text-muted-foreground font-mono">
								{fmtRub(booking.tariffPriceAtBooking)}/ч
							</p>
						</div>
					</div>

					{/* Редактирование */}
					{editable && (
						<div className="relative">
							<Button
								variant="outline"
								onClick={() => setShowEditMenu(!showEditMenu)}
								className="w-full h-14 rounded-2xl border-foreground/10 justify-between px-6"
							>
								<div className="flex items-center gap-3">
									<Pencil size={16} />
									<span className="font-bold uppercase tracking-tight text-xs">
										Редактирование заказа
									</span>
								</div>
								<ChevronDown
									className={cn(
										"transition-transform",
										showEditMenu && "rotate-180"
									)}
									size={16}
								/>
							</Button>

							<AnimatePresence>
								{showEditMenu && (
									<motion.div
										initial={{ y: 10, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										exit={{ y: 10, opacity: 0 }}
										className="absolute bottom-full left-0 w-full mb-2 p-2 rounded-2xl border border-foreground/10 bg-background/95 backdrop-blur-xl shadow-2xl z-20"
									>
										<Link
											href={`/dashboard/studio-bookings/${booking.id}/edit-dates`}
											className="flex items-center gap-3 p-4 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors"
										>
											<CalendarClock size={16} className="opacity-40" />
											Изменить даты
										</Link>
										<Link
											href={`/dashboard/studio-bookings/${booking.id}/edit-tariff`}
											className="flex items-center gap-3 p-4 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors"
										>
											<Package size={16} className="opacity-40" />
											Изменить тариф / технику
										</Link>
										<button
											type="button"
											onClick={() => {
												setShowEditMenu(false);
												setShowCancel(true);
											}}
											className="w-full flex items-center gap-3 p-4 text-sm font-medium text-destructive hover:bg-destructive/5 rounded-xl transition-colors border-t border-foreground/5"
										>
											<X size={16} /> Отменить заказ
										</button>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}

					<SupportBlock
						info={support}
						variant="inline"
						className="justify-center opacity-60"
					/>
				</aside>

				{/* ── Правая колонка: Техника + Оплата ── */}
				<div className="lg:col-span-7 space-y-6 order-2">
					{/* Техника */}
					<div className="card-surface rounded-2xl border border-foreground/8 overflow-hidden">
						<button
							type="button"
							onClick={() => setIsItemsExpanded(!isItemsExpanded)}
							className="w-full px-6 py-5 flex items-center justify-between hover:bg-muted-foreground/5 transition-colors"
						>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
								Техника ({booking.items.length} поз.)
							</p>
							<ChevronDown
								size={18}
								className={cn(
									"transition-transform duration-300 text-muted-foreground/40",
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
										{booking.items.length === 0 ? (
											<p className="px-6 py-8 text-sm text-muted-foreground/50 text-center">
												Дополнительная техника не выбрана
											</p>
										) : (
											booking.items.map((item) => (
												<div
													key={item.id}
													className="flex items-center gap-3 px-5 py-3.5 border-b border-foreground/5 last:border-0"
												>
													<div className="w-10 h-10 rounded-lg overflow-hidden bg-foreground/5 shrink-0">
														{item.equipmentImageUrl ? (
															<Image
																src={item.equipmentImageUrl}
																alt={item.equipmentTitle}
																width={40}
																height={40}
																className="w-full h-full object-cover"
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
													<div className="flex-1 min-w-0">
														<p className="text-sm font-bold truncate leading-none mb-1">
															{item.equipmentTitle}
														</p>
													</div>
													<p className="text-sm font-mono font-bold shrink-0">
														{fmtRub(item.priceAtBooking)} /шт
													</p>
												</div>
											))
										)}

										<div className="px-6 py-4 bg-foreground/3 border-t border-foreground/5 space-y-3">
											{/* Промокод */}
											{booking.promoCode && (
												<div className="flex items-center justify-between rounded-xl border border-green-500/25 bg-green-500/8 px-4 py-2.5">
													<div className="flex items-center gap-2">
														<TagChevronIcon
															size={13}
															className="text-green-600 shrink-0"
														/>
														<div>
															<p className="text-xs font-bold font-mono text-green-700 dark:text-green-400">
																{booking.promoCode}
															</p>
															<p className="text-[10px] text-muted-foreground">
																Промокод применён
															</p>
														</div>
													</div>
													{booking.discountAmount > 0 && (
														<span className="text-sm font-bold text-green-600 tabular-nums">
															−{fmtRub(booking.discountAmount)}
														</span>
													)}
												</div>
											)}
											{/* Итого */}
											<div className="flex justify-between items-center text-sm">
												<div className="space-y-0.5">
													<span className="text-muted-foreground">Итого</span>
													{booking.discountAmount > 0 && (
														<p className="text-[11px] text-muted-foreground/50 line-through tabular-nums">
															{fmtRub(
																booking.totalAmount + booking.discountAmount
															)}
														</p>
													)}
												</div>
												<span className="font-bold text-lg tabular-nums">
													{fmtRub(booking.totalAmount)}
												</span>
											</div>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Оплата */}
					<div className="card-surface rounded-2xl border border-foreground/8 overflow-hidden">
						<button
							type="button"
							onClick={() => setIsPaymentsExpanded(!isPaymentsExpanded)}
							className="w-full px-6 py-5 flex items-center justify-between hover:bg-muted-foreground/5 transition-colors"
						>
							<div className="flex items-center gap-3">
								<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
									Оплата
								</p>
								<span
									className={cn(
										"text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
										PAYMENT_STATUS_STYLES[booking.paymentStatus]
									)}
								>
									{PAYMENT_STATUS_LABELS[booking.paymentStatus]}
								</span>
							</div>
							<ChevronDown
								size={18}
								className={cn(
									"transition-transform duration-300 text-muted-foreground/40",
									isPaymentsExpanded && "rotate-180"
								)}
							/>
						</button>

						<AnimatePresence initial={false}>
							{isPaymentsExpanded && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.3, ease: "easeInOut" }}
								>
									<div className="border-t border-foreground/5">
										{booking.payments.length === 0 ? (
											<p className="px-6 py-8 text-sm text-muted-foreground/50 text-center">
												Платежей пока нет
											</p>
										) : (
											booking.payments.map((p) => (
												<div
													key={p.id}
													className="flex items-center gap-3 px-5 py-3.5 border-b border-foreground/5 last:border-0"
												>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-bold">
															{p.type === "REFUND" ? "Возврат" : "Платёж"}
														</p>
														{p.note && (
															<p className="text-xs text-muted-foreground truncate">
																{p.note}
															</p>
														)}
														<p className="text-xs text-muted-foreground/50">
															<ClientTime iso={p.paidAt} fmt="full-datetime" />
														</p>
													</div>
													<p
														className={cn(
															"text-sm font-mono font-bold shrink-0",
															p.type === "REFUND"
																? "text-red-400"
																: "text-emerald-500"
														)}
													>
														{p.type === "REFUND" ? "-" : "+"}
														{fmtRub(p.amount)}
													</p>
												</div>
											))
										)}

										<div className="px-6 py-4 bg-foreground/3 border-t border-foreground/5 space-y-2">
											<div className="flex justify-between items-center text-sm">
												<span className="text-muted-foreground">
													Оплачено / Итого
												</span>
												<span className="font-bold">
													{fmtRub(booking.totalPaid)} /{" "}
													{fmtRub(booking.totalAmount)}
												</span>
											</div>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>

			{/* ── Dialogs ── */}
			<CancelStudioBookingDialog
				bookingId={booking.id}
				open={showCancel}
				onOpenChange={setShowCancel}
				onSuccess={() => setShowCancelledDialog(true)}
			/>

			<AlertDialog
				open={showCancelledDialog}
				onOpenChange={setShowCancelledDialog}
			>
				<AlertDialogContent className="bg-background/40 backdrop-blur-xl">
					<AlertDialogHeader>
						<div className="flex items-center gap-3 mb-1">
							<Check
								size={20}
								className="bg-emerald-400 p-1 rounded-full text-white"
							/>
							<AlertDialogTitle>Заказ отменён</AlertDialogTitle>
						</div>
						<AlertDialogDescription>
							Ваш заказ студии № {shortId} успешно отменён.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2 w-full sm:justify-between pt-4">
						<AlertDialogAction asChild>
							<Button
								asChild
								variant="outline"
								className="flex items-center gap-2 flex-1"
							>
								<Link href="/dashboard">
									<LayoutDashboard size={14} /> В дашборд
								</Link>
							</Button>
						</AlertDialogAction>
						<AlertDialogCancel asChild>
							<Button
								asChild
								variant="outline"
								className="flex items-center gap-2 flex-1"
							>
								<Link href="/dashboard/studio-bookings">
									<Package size={14} /> К заказам студии
								</Link>
							</Button>
						</AlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
