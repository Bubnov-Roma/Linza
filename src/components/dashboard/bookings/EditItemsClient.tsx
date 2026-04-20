"use client";

import {
	ArrowLeftIcon,
	ClockIcon,
	InfoIcon,
	MinusIcon,
	PackageIcon,
	PlusIcon,
	TrolleyIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NProgress from "nprogress";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	checkAvailabilityAction,
	updateBookingItemsAction,
} from "@/actions/client-booking-actions";
import { BookingButton, ClientTime } from "@/components/shared";
import {
	BOOKING_STATUS_LABELS,
	BOOKING_STATUS_STYLES,
} from "@/constants/booking-status";
import type {
	BookingDetailRow,
	BookingItemDetailRow,
	BookingStatus,
} from "@/core/domain/entities/Booking";
import type { DbEquipment } from "@/core/domain/entities/Equipment";
import { calculateItemPrice, cn } from "@/lib/utils";

interface LocalItem {
	equipment: NonNullable<BookingItemDetailRow["equipment"]>;
	quantity: number;
	originalPrice: number;
	maxQuantity: number;
}

interface EditItemsClientProps {
	booking: BookingDetailRow;
}

export function EditItemsClient({ booking }: EditItemsClientProps) {
	const router = useRouter();

	const initialItems = useMemo<LocalItem[]>(() => {
		const countMap = new Map<string, number>();
		for (const item of booking.bookingItems) {
			if (!item.equipment) continue;
			countMap.set(
				item.equipment.id,
				(countMap.get(item.equipment.id) ?? 0) + 1
			);
		}
		const map = new Map<string, LocalItem>();
		for (const item of booking.bookingItems) {
			if (!item.equipment) continue;
			if (!map.has(item.equipment.id)) {
				map.set(item.equipment.id, {
					equipment: item.equipment,
					quantity: 1,
					originalPrice: item.priceAtBooking,
					maxQuantity: countMap.get(item.equipment.id) ?? 1,
				});
			} else {
				const existing = map.get(item.equipment.id);
				if (existing) existing.quantity += 1;
			}
		}
		return Array.from(map.values());
	}, [booking.bookingItems]);

	const [items, setItems] = useState<LocalItem[]>(initialItems);
	const [isChecking, setIsChecking] = useState(false);
	const [busyIds, setBusyIds] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const startDate = new Date(booking.startDate);
	const endDate = new Date(booking.endDate);
	const hours = Math.max(
		0,
		(endDate.getTime() - startDate.getTime()) / 3_600_000
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <так надо>
	useEffect(() => {
		let cancelled = false;
		const allIds = items.map((i) => i.equipment.id);
		if (!allIds.length) {
			setBusyIds([]);
			return;
		}

		async function check() {
			setIsChecking(true);
			NProgress.start();
			try {
				const r = await checkAvailabilityAction(
					allIds,
					booking.startDate,
					booking.endDate,
					booking.id
				);
				if (!cancelled) setBusyIds(r.busyIds ?? []);
			} finally {
				if (!cancelled) {
					setIsChecking(false);
					NProgress.done();
				}
			}
		}
		check();
		return () => {
			cancelled = true;
		};
	}, [
		items.map((i) => `${i.equipment.id}:${i.quantity}`).join(","),
		booking.startDate,
		booking.endDate,
		booking.id,
	]);

	const totalRental = useMemo(
		() =>
			items.reduce(
				(s, i) =>
					s +
					calculateItemPrice(i.equipment as unknown as DbEquipment, hours) *
						i.quantity,
				0
			),
		[items, hours]
	);

	const totalRV = useMemo(
		() =>
			items.reduce((s, i) => s + (i.equipment.deposit ?? 0) * i.quantity, 0),
		[items]
	);

	const hasChanges = useMemo(() => {
		const orig = new Map(initialItems.map((i) => [i.equipment.id, i.quantity]));
		const curr = new Map(items.map((i) => [i.equipment.id, i.quantity]));
		if (orig.size !== curr.size) return true;
		for (const [id, qty] of orig) if (curr.get(id) !== qty) return true;
		return false;
	}, [initialItems, items]);

	const hasConflict = busyIds.length > 0;
	const canSave = items.length > 0 && !hasConflict && hasChanges;

	const handleSave = async () => {
		if (!canSave) return;
		setIsSubmitting(true);
		try {
			const result = await updateBookingItemsAction(booking.id, {
				items: items.map((i) => ({
					equipmentId: i.equipment.id,
					quantity: i.quantity,
					pricePerUnit: calculateItemPrice(
						i.equipment as unknown as DbEquipment,
						hours
					),
				})),
				totalAmount: totalRental,
				totalReplacementValue: totalRV,
			});
			if (result.success) {
				toast.success("Комплектация обновлена");
				router.push(`/dashboard/bookings/${booking.id}`);
			} else {
				toast.error(result.error ?? "Ошибка");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const status = booking.status as BookingStatus;
	const shortId = booking.id.split("-")[0]?.toUpperCase();

	return (
		<div className="max-w-6xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-500 pb-20">
			{/* ── Header ── */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link
						href={`/dashboard/bookings/${booking.id}`}
						className="w-10 h-10 rounded-xl border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 transition-all shrink-0"
					>
						<ArrowLeftIcon size={18} />
					</Link>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
							Редактирование состава
						</p>
						<h1 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">
							Заказ № {shortId}
						</h1>
					</div>
				</div>
				<span
					className={cn(
						"text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border self-start sm:self-auto",
						BOOKING_STATUS_STYLES[status]
					)}
				>
					{BOOKING_STATUS_LABELS[status]}
				</span>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* ЛЕВАЯ КОЛОНКА: Список техники */}
				<div className="lg:col-span-7 space-y-6">
					{/* Инфо о периоде (Read-only) */}
					<div className="card-surface p-4 flex items-center gap-4 bg-muted/20 border-dashed">
						<div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center shrink-0">
							<ClockIcon size={18} className="opacity-40" />
						</div>
						<div className="flex-1 text-sm">
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
								Период аренды (неизменно)
							</p>
							<div className="flex items-center gap-2 font-medium">
								<ClientTime iso={startDate} fmt="datetime" />
								<span className="opacity-20">→</span>
								<ClientTime iso={endDate} fmt="datetime" />
								<span className="ml-2 text-xs font-bold text-primary">
									{Math.ceil(hours)} ч.
								</span>
							</div>
						</div>
					</div>

					{/* Список позиций */}
					<div className="card-surface overflow-hidden">
						<div className="px-6 py-4 border-b border-foreground/5 flex justify-between items-center bg-foreground/2">
							<h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
								Техника в заказе
							</h2>
							{isChecking && (
								<div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase animate-pulse">
									<span className="w-1.5 h-1.5 rounded-full bg-current" />
									Проверка...
								</div>
							)}
						</div>

						<div className="divide-y divide-foreground/5">
							<AnimatePresence mode="popLayout">
								{items.length === 0 ? (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="py-20 text-center space-y-3"
									>
										<TrolleyIcon size={40} className="mx-auto opacity-10" />
										<p className="text-sm text-muted-foreground">Заказ пуст</p>
									</motion.div>
								) : (
									items.map((item) => {
										const isBusy = busyIds.includes(item.equipment.id);
										const unitPrice = calculateItemPrice(
											item.equipment as unknown as DbEquipment,
											hours
										);

										return (
											<motion.div
												key={item.equipment.id}
												layout
												initial={{ opacity: 0, x: -10 }}
												animate={{ opacity: 1, x: 0 }}
												exit={{ opacity: 0, scale: 0.95 }}
												className={cn(
													"flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 transition-colors",
													isBusy && "bg-destructive/3"
												)}
											>
												{/* Иконка и Название */}
												<div className="flex-1 flex gap-4 min-w-0">
													<div
														className={cn(
															"w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
															isBusy
																? "bg-destructive/10 border-destructive/20 text-destructive"
																: "bg-foreground/5 border-foreground/5 text-muted-foreground"
														)}
													>
														<PackageIcon size={20} />
													</div>
													<div className="min-w-0">
														<p
															className={cn(
																"text-sm font-bold truncate leading-tight",
																isBusy && "text-destructive"
															)}
														>
															{item.equipment.title}
														</p>
														<p className="text-[10px] uppercase font-bold text-muted-foreground/50 mt-1 tracking-tight">
															{unitPrice.toLocaleString()} ₽ / шт.
														</p>
														{isBusy && (
															<div className="flex items-center gap-1 mt-1 text-destructive font-bold text-[9px] uppercase">
																<WarningCircleIcon size={10} /> Занято на эти
																даты
															</div>
														)}
													</div>
												</div>

												{/* Управление количеством */}
												<div className="flex items-center justify-between sm:justify-end gap-6">
													<div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl border border-foreground/5">
														<button
															type="button"
															onClick={() =>
																setItems((prev) =>
																	prev
																		.map((i) =>
																			i.equipment.id === item.equipment.id
																				? {
																						...i,
																						quantity: Math.max(
																							0,
																							i.quantity - 1
																						),
																					}
																				: i
																		)
																		.filter((i) => i.quantity > 0)
																)
															}
															className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background transition-colors shadow-sm"
														>
															<MinusIcon size={14} />
														</button>
														<span className="w-8 text-center text-sm font-black font-mono">
															{item.quantity}
														</span>
														<button
															type="button"
															onClick={() =>
																item.quantity < item.maxQuantity &&
																setItems((prev) =>
																	prev.map((i) =>
																		i.equipment.id === item.equipment.id
																			? { ...i, quantity: i.quantity + 1 }
																			: i
																	)
																)
															}
															disabled={item.quantity >= item.maxQuantity}
															className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background disabled:opacity-20 transition-colors shadow-sm"
														>
															<PlusIcon size={14} />
														</button>
													</div>

													<div className="text-right min-w-25">
														<p className="text-sm font-black font-mono">
															{(unitPrice * item.quantity).toLocaleString()} ₽
														</p>
														<button
															type="button"
															onClick={() =>
																setItems((prev) =>
																	prev.filter(
																		(i) => i.equipment.id !== item.equipment.id
																	)
																)
															}
															className="text-[10px] uppercase font-bold text-destructive/60 hover:text-destructive transition-colors mt-1"
														>
															Удалить
														</button>
													</div>
												</div>
											</motion.div>
										);
									})
								)}
							</AnimatePresence>
						</div>
					</div>
				</div>

				{/* ПРАВАЯ КОЛОНКА: Итого и Сохранение (Sticky) */}
				<div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
					<div className="card-surface overflow-hidden border border-primary/10">
						<div className="p-6 space-y-6">
							<h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
								Детализация изменений
							</h3>

							<div className="space-y-3">
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">
										Стоимость аренды
									</span>
									<span className="text-sm font-bold">
										{Math.round(totalRental).toLocaleString()} ₽
									</span>
								</div>
							</div>

							<div className="pt-6 border-t border-foreground/5">
								<div className="flex justify-between items-end mb-6">
									<span className="text-xs font-bold uppercase">
										Итого к оплате
									</span>
									<span className="text-3xl font-black italic text-primary leading-none">
										{Math.round(totalRental).toLocaleString()} ₽
									</span>
								</div>

								<BookingButton
									onClick={handleSave}
									disabled={!canSave}
									loading={isSubmitting}
									mode="update"
									className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20"
								/>

								{!hasChanges && items.length > 0 && (
									<div className="mt-4 flex gap-2 p-3 rounded-xl bg-foreground/5 border border-foreground/5 items-center justify-center">
										<InfoIcon size={14} className="opacity-40" />
										<p className="text-[11px] text-muted-foreground/60 font-medium">
											Нет изменений для сохранения
										</p>
									</div>
								)}

								{hasConflict && (
									<div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-2">
										<div className="flex items-center gap-2 font-bold text-[10px] uppercase">
											<WarningCircleIcon size={14} /> Внимание: Конфликт
										</div>
										<p className="text-[11px] leading-relaxed font-medium">
											Некоторые позиции уже забронированы на выбранные даты.
											Пожалуйста, удалите их, чтобы продолжить.
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					<p className="text-[10px] text-center text-muted-foreground/40 px-6 uppercase font-bold tracking-tighter">
						После сохранения менеджер проверит обновленную комплектацию и
						подтвердит заказ вручную
					</p>
				</div>
			</div>
		</div>
	);
}
