"use client";

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
	Table,
	X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CancelBookingDialog } from "@/components/dashboard/bookings/CancelBookingDialog";
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
} from "@/components/ui";
import {
	BOOKING_STATUS_LABELS,
	BOOKING_STATUS_STYLES,
	STATUS_STEPS,
	type SupportInfo,
} from "@/constants";
import type {
	BookingDetailRow,
	BookingStatus,
} from "@/core/domain/entities/Booking";
import { cn } from "@/lib/utils";
import { formatPlural } from "@/utils";

export function BookingDetailClient({
	booking,
	support,
}: {
	booking: BookingDetailRow;
	support: SupportInfo;
}) {
	const [isStatusExpanded, setIsStatusExpanded] = useState(false);
	const [isEquipExpanded, setIsEquipExpanded] = useState(true);
	const [showEditMenu, setShowEditMenu] = useState(false);
	const [showCancel, setShowCancel] = useState(false);
	const [showCancelledDialog, setShowCancelledDialog] = useState(false);

	const status = booking.status as BookingStatus;
	const shortId = booking.id.split("-")[0]?.toUpperCase();
	const hours = Math.ceil(
		differenceInHours(new Date(booking.endDate), new Date(booking.startDate))
	);

	const editable = ![
		"PENDING_REVIEW",
		"ACTIVE",
		"COMPLETED",
		"CANCELLED",
		"EXPIRED",
	].includes(status);

	// Определяем индекс текущего шага
	const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === status);
	const isCancelled = status === "CANCELLED";

	return (
		<div className="max-w-6xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-500 pb-20">
			<DashboardBreadcrumb
				items={[
					{ label: "Мои заказы", href: "/dashboard/bookings" },
					{ label: `Заказ ${shortId}` },
				]}
			/>
			{/* ── Header ── */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link
						href="/dashboard/bookings"
						className="w-10 h-10 rounded-xl border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 transition-all shrink-0"
					>
						<ArrowLeft size={18} />
					</Link>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
							Детализация заказа
						</p>
						<h1 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">
							Заказ № {shortId}
						</h1>
					</div>
				</div>
			</div>
			{/* ── Основная сетка ── */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* ЛЕВАЯ КОЛОНКА: Статус, Период, Действия */}
				{/* <div className="lg:col-span-7 space-y-6"> */}
				<aside className="lg:col-span-5 lg:sticky h-fit lg:top-20 space-y-6 order-1">
					{/* Блок статуса со Stepper */}
					<div className="card-surface overflow-hidden border border-foreground/5">
						<button
							type="button"
							onClick={() => setIsStatusExpanded(!isStatusExpanded)}
							className="w-full px-6 py-5 flex items-center justify-between hover:bg-muted-foreground/20 transition-colors"
						>
							<div className="flex items-center gap-4 text-left">
								<div
									className={cn(
										"w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0",
										BOOKING_STATUS_STYLES[status]
									)}
								>
									{isCancelled ? (
										<X size={20} />
									) : (
										<Clock size={20} className="animate-pulse" />
									)}
								</div>
								<div>
									<p className="text-sm font-bold uppercase tracking-tight">
										{isCancelled
											? "Заказ отменен"
											: `${BOOKING_STATUS_LABELS[status]}`}
									</p>
								</div>
							</div>
							<ChevronDown
								className={cn(
									"transition-transform duration-300",
									isStatusExpanded && "rotate-180"
								)}
								size={20}
							/>
						</button>

						<AnimatePresence>
							{isStatusExpanded && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									className="px-6 pb-8 border-t border-foreground/5 pt-6"
								>
									{isCancelled ? (
										<div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive text-sm">
											Этот заказ был отменен.
										</div>
									) : (
										<div className="relative space-y-6 before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-foreground/5">
											{STATUS_STEPS.map((step, idx) => {
												const isDone =
													idx < currentStepIndex || status === "COMPLETED";
												const isCurrent = idx === currentStepIndex;
												return (
													<div
														key={step.key}
														className="relative flex gap-4 pl-8"
													>
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
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Период аренды */}
					<div className="card-surface p-6 space-y-6">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							Период аренды
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-muted-foreground mb-2">
									<CalendarDays size={14} />
									<span className="text-xs uppercase font-bold">Выдача</span>
								</div>
								<p className="text-lg font-black">
									<ClientTime iso={booking.startDate} fmt="full-datetime" />
								</p>
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-muted-foreground mb-2">
									<CalendarClock size={14} />
									<span className="text-xs uppercase font-bold">Возврат</span>
								</div>
								<p className="text-lg font-black">
									<ClientTime iso={booking.endDate} fmt="full-datetime" />
								</p>
							</div>
						</div>
						<div className="pt-4 border-t border-foreground/5 flex items-center justify-between">
							<span className="text-sm text-muted-foreground">Общее время</span>
							<span className="text-sm font-bold bg-foreground/5 px-3 py-1 rounded-lg">
								{hours} ч.
							</span>
						</div>
					</div>

					{/* Редактирование и действия */}
					{editable && (
						<div className="space-y-3">
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
												href={`/dashboard/bookings/${booking.id}/edit-dates`}
												className="flex items-center gap-3 p-4 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors"
											>
												<CalendarClock size={16} className="opacity-40" />{" "}
												Изменить даты
											</Link>
											<Link
												href={`/dashboard/bookings/${booking.id}/edit-items`}
												className="flex items-center gap-3 p-4 text-sm font-medium hover:bg-foreground/5 rounded-xl transition-colors"
											>
												<Package size={16} className="opacity-40" /> Изменить
												технику
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
						</div>
					)}
					<SupportBlock
						info={support}
						variant="inline"
						className="justify-center opacity-60"
					/>
				</aside>

				{/* ПРАВАЯ КОЛОНКА: Техника и Оплата */}
				<div className="lg:col-span-7 space-y-6 order-2">
					<div
						className={cn(
							"card-surface rounded-2xl border border-foreground/8 overflow-hidden"
						)}
					>
						{/* Header / Trigger */}
						<button
							type="button"
							onClick={() => setIsEquipExpanded(!isEquipExpanded)}
							className="w-full px-6 py-5 flex items-center justify-between hover:bg-muted-foreground/20 transition-colors"
						>
							<div className="flex gap-2">
								<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
									Состав заказа: (
									{formatPlural(booking.bookingItems.length, "equipment")})
								</p>
							</div>
							<ChevronDown
								className={cn(
									"transition-transform duration-300",
									isStatusExpanded && "rotate-180"
								)}
								size={18}
							/>
						</button>

						<AnimatePresence initial={false}>
							{isEquipExpanded && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.3, ease: "easeInOut" }}
								>
									<div className="border-t border-foreground/5">
										{booking.bookingItems.map((item) => {
											return (
												<div
													key={item.id}
													className={cn(
														"flex items-center gap-3 px-5 py-3.5 border-b border-foreground/5 last:border-0"
													)}
												>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-bold truncate leading-none mb-1">
															{item.equipment?.title}
														</p>
														<p className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">
															{item.equipment?.categoryId}
														</p>
													</div>
													<p className="text-sm font-mono font-bold">
														{item.priceAtBooking.toLocaleString()} ₽
													</p>
												</div>
											);
										})}
										<div className="px-6 py-6 bg-foreground/3 border-t border-foreground/5 space-y-4">
											<div className="flex justify-between items-center text-sm">
												<span className="text-muted-foreground">Итого</span>
												<span className="font-bold text-lg">
													{booking.totalAmount.toLocaleString()} ₽
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
			<CancelBookingDialog
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
							Ваш заказ № {shortId} успешно отменён.
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
									<LayoutDashboard size={14} />B дашборд
								</Link>
							</Button>
						</AlertDialogAction>
						<AlertDialogCancel asChild>
							<Button
								asChild
								variant="outline"
								className="flex items-center gap-2 flex-1"
							>
								<Link href="/dashboard/bookings">
									<Table size={14} />К заказам
								</Link>
							</Button>
						</AlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
