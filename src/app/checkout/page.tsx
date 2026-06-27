"use client";

import {
	CalendarDotsIcon,
	MinusIcon,
	PackageIcon,
	PlusIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NProgress from "nprogress";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
	checkAvailabilityAction,
	submitBookingAction,
} from "@/actions/client-booking-actions";
import { BookingSuccessScreen } from "@/components/dashboard/bookings/BookingSuccessScreen";
import {
	type AppliedPromo,
	applyPromoDiscount,
	BookingButton,
	getDefaultRentalPeriod,
	PromoCodeField,
	RentalPeriod,
} from "@/components/shared";
import { Button } from "@/components/ui";
import { useRequireAuth } from "@/hooks/use-require-auth";
import {
	calculateItemPrice,
	cn,
	combineDateAndTime,
	fmtRub,
} from "@/lib/utils";
import { useCartStore } from "@/store/use-cart.store";
import { useSiteSettingsStore } from "@/store/use-site-settings.store";
import { formatPlural } from "@/utils";

// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
	const requireAuth = useRequireAuth();
	const router = useRouter();
	const { items, addItem, removeOne, clearCart } = useCartStore();

	const { workStart, workEnd } = useSiteSettingsStore();

	// Hydration guard
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => {
		if (useCartStore.persist.hasHydrated()) {
			setHydrated(true);
			return;
		}
		const unsub = useCartStore.persist.onFinishHydration(() =>
			setHydrated(true)
		);
		return unsub;
	}, []);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isChecking, setIsChecking] = useState(false);
	const [busyIds, setBusyIds] = useState<string[]>([]);
	const [bookingId, setBookingId] = useState<string | null>(null);
	const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
	const [appliedPromoCode, setAppliedPromoCode] = useState<{
		code: string;
		discountAmount: number;
	} | null>(null);

	// -- Empty Cart -> top scroll
	useEffect(() => {
		if (items.length === 0) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [items.length]);

	// ── Rental period
	const [period, setPeriod] = useState(() =>
		getDefaultRentalPeriod(workStart, workEnd)
	);

	// ── Math
	const math = useMemo(() => {
		const start = combineDateAndTime(period.startDate, period.startTime);
		const end = combineDateAndTime(period.endDate, period.endTime);
		if (!start || !end)
			return {
				totalRental: 0,
				totalDeposit: 0,
				totalRV: 0,
				hours: 0,
				startFull: null as Date | null,
				endFull: null as Date | null,
			};
		const hours = Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
		const active = items.filter((i) => i.quantity > 0);
		return {
			totalRental: active.reduce(
				(s, i) => s + calculateItemPrice(i.equipment, hours) * i.quantity,
				0
			),
			totalDeposit: active.reduce(
				(s, i) => s + (i.equipment.deposit || 0) * i.quantity,
				0
			),
			totalRV: active.reduce(
				(s, i) => s + (i.equipment.replacementValue || 0) * i.quantity,
				0
			),
			hours,
			startFull: start,
			endFull: end,
		};
	}, [period, items]);

	// ── Availability check
	useEffect(() => {
		let cancelled = false;
		async function check() {
			const ids = items
				.filter((i) => i.quantity > 0)
				.flatMap((i) => i.allUnitIds ?? [i.equipment.id]);
			if (!math.startFull || !math.endFull || !ids.length) {
				setBusyIds([]);
				return;
			}
			setIsChecking(true);
			NProgress.start();
			try {
				const r = await checkAvailabilityAction(
					ids,
					math.startFull,
					math.endFull
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
	}, [math.startFull, math.endFull, items]);

	const activeItems = items.filter((i) => i.quantity > 0);
	const hasAnyBusy = items.some((i) => {
		const allIds = i.allUnitIds?.length ? i.allUnitIds : [i.equipment.id];
		const freeCount = allIds.filter((id) => !busyIds.includes(id)).length;
		return freeCount < i.quantity;
	});

	const busyItemCount = items.reduce((count, i) => {
		const allIds = i.allUnitIds?.length ? i.allUnitIds : [i.equipment.id];
		const freeCount = allIds.filter((id) => !busyIds.includes(id)).length;
		const lackCount = Math.max(0, i.quantity - freeCount);
		return count + lackCount;
	}, 0);

	const isCanBook =
		math.totalRental > 0 && !hasAnyBusy && !!math.startFull && !!math.endFull;

	// ── Submit
	const doCreateBooking = async (): Promise<boolean> => {
		if (!isCanBook || !math.startFull || !math.endFull) return false;
		setIsSubmitting(true);
		try {
			const { finalPrice: finalTotal, discountAmount } = applyPromoDiscount(
				math.totalRental,
				appliedPromo
			);
			const result = await submitBookingAction({
				items: activeItems.map((i) => ({
					id: i.equipment.id,
					allUnitIds: i.equipment.allUnitIds ?? [i.equipment.id],
					quantity: i.quantity,
					priceToPay: calculateItemPrice(i.equipment, math.hours),
					deposit: i.equipment.deposit,
					replacementValue: i.equipment.replacementValue,
				})),
				startDate: math.startFull.toISOString(),
				endDate: math.endFull.toISOString(),
				totalPrice: finalTotal,
				hasInsurance: true,
				totalReplacementValue: math.totalRV,
				promoCode: appliedPromo?.code,
				discountAmount,
			});
			if (result.success && result.bookingId) {
				clearCart();
				setBookingId(result.bookingId);
				if (result.appliedPromoCode) {
					setAppliedPromoCode(result.appliedPromoCode);
				}
				return true;
			}
			toast.error(result.error || "Ошибка брони");
			return false;
		} catch {
			toast.error("Непредвиденная ошибка");
			return false;
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleBookClick = () => {
		if (!isCanBook) return;
		requireAuth(() => doCreateBooking(), {
			type: "callback",
			fn: () => doCreateBooking(),
		});
	};

	// ── Screen States
	if (bookingId)
		return (
			<BookingSuccessScreen
				bookingId={bookingId}
				redirectUrl={`/dashboard/bookings/${bookingId}`}
				appliedPromoCode={appliedPromoCode}
			/>
		);
	if (!hydrated) return <CheckoutSkeleton />;

	if (items.length === 0) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="container mx-auto py-40 text-center space-y-6"
			>
				<PackageIcon
					weight="duotone"
					size={80}
					className="mx-auto text-foreground/10 mb-4"
				/>
				<h1 className="text-4xl md:text-5xl font-black uppercase italic text-foreground/40">
					Корзина пуста
				</h1>
				<Button
					size="xl"
					onClick={() => router.push("/equipment")}
					className="px-10 py-6 rounded-2xl bg-foreground text-background font-black uppercase tracking-wider text-sm shadow-xl"
				>
					Перейти в каталог
				</Button>
			</motion.div>
		);
	}

	// ── Helpers
	const days = Math.floor(math.hours / 24);
	const remH = Math.round(math.hours % 24);
	const durationParts: string[] = [];
	if (days > 0) durationParts.push(`${days} дн.`);
	if (remH > 0) durationParts.push(`${remH} ч.`);
	const durationLabel = durationParts.join(" ") || "—";

	const totalQty = activeItems.reduce((s, i) => s + i.quantity, 0);
	const { finalPrice, discountAmount: disc } = applyPromoDiscount(
		math.totalRental,
		appliedPromo
	);

	return (
		<div className="min-h-screen pb-28 md:pb-16 relative">
			<div className="container mx-auto px-4 lg:px-6 pt-8 max-w-6xl">
				<motion.h1
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-8"
				>
					Оформление
				</motion.h1>

				{/* ── Двухколоночный Grid Layout ── */}
				<div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
					{/* Левая колонка: Настройки + Товары */}
					<div className="w-full lg:col-span-7 xl:col-span-8 space-y-6">
						{/* Блок 1: Период аренды */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="bg-card/40 backdrop-blur-xl p-5 md:p-7 rounded-3xl border border-foreground/5 shadow-sm"
						>
							<div className="flex items-center justify-between mb-5">
								<p className="text-[11px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
									<CalendarDotsIcon size={14} weight="duotone" /> Период аренды
								</p>
								{math.hours > 0 && (
									<span className="text-xs font-bold text-muted-foreground bg-foreground/5 px-2.5 py-1 rounded-lg">
										{durationLabel}
									</span>
								)}
							</div>

							<RentalPeriod value={period} onChange={setPeriod} />

							{/* Loader проверки */}
							<div className="h-4 mt-3 flex items-center justify-center">
								{isChecking && (
									<motion.span
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="text-[11px] text-primary/70 font-medium flex items-center gap-1.5"
									>
										<span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
										проверяем доступность...
									</motion.span>
								)}
							</div>
						</motion.div>

						{/* Блок 2: Список техники */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
							className="bg-card/40 backdrop-blur-xl rounded-3xl border border-foreground/5 shadow-sm overflow-hidden"
						>
							<div className="px-5 md:px-7 py-5 border-b border-foreground/5 flex items-center justify-between">
								<p className="text-[11px] font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
									<PackageIcon size={14} weight="duotone" /> Состав заказа
								</p>
								<span className="text-xs font-bold text-muted-foreground">
									{formatPlural(totalQty, "equipment")}
								</span>
							</div>

							<div className="divide-y divide-foreground/5">
								<AnimatePresence mode="popLayout">
									{activeItems.map((item) => {
										const allIds = item.equipment.allUnitIds?.length
											? item.equipment.allUnitIds
											: [item.equipment.id];
										const freeCount = allIds.filter(
											(id) => !busyIds.includes(id)
										).length;
										const isBusy = freeCount < item.quantity;
										const price = calculateItemPrice(
											item.equipment,
											math.hours
										);

										return (
											<motion.div
												layout
												initial={{ opacity: 0, scale: 0.95 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.95, x: -20 }}
												key={item.equipment.id}
												className={cn(
													"px-5 md:px-7 py-5 transition-colors",
													isBusy && "bg-red-500/5"
												)}
											>
												<div className="flex flex-col sm:flex-row sm:items-center gap-4">
													{/* Картинка */}
													<div className="relative w-26 h-16 rounded-xl overflow-hidden bg-foreground/5 shrink-0 shadow-sm border border-foreground/5">
														{item.equipment.imageUrl ? (
															<Image
																src={item.equipment.imageUrl}
																alt={item.equipment.title}
																fill
																sizes="100px"
																className="object-cover"
															/>
														) : (
															<PackageIcon
																size={20}
																className="absolute inset-0 m-auto text-muted-foreground/30"
															/>
														)}
													</div>

													{/* Инфо */}
													<div className="flex-1 min-w-0">
														<Link
															href={`/equipment/item/${item.equipment.slug}`}
															className="text-sm md:text-base font-bold leading-tight hover:text-primary transition-colors line-clamp-2"
														>
															{item.equipment.title}
														</Link>
														{isBusy ? (
															<span className="inline-block mt-1.5 text-[10px] font-bold uppercase bg-red-500/10 text-red-500 px-2 py-0.5 rounded-md border border-red-500/20">
																Недоступно на эти даты
															</span>
														) : (
															<p className="mt-1 text-xs text-muted-foreground/60 font-medium font-mono">
																{fmtRub(price)} / шт.
															</p>
														)}
													</div>

													{/* Контролы и цена */}
													<div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 mt-2 sm:mt-0 shrink-0">
														<div className="text-right hidden sm:block">
															<p className="text-base font-black tabular-nums">
																{fmtRub(price * item.quantity)}
															</p>
														</div>

														<div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl border border-foreground/5">
															<button
																type="button"
																onClick={() => removeOne(item.equipment.id)}
																className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background shadow-sm transition-all text-foreground/70 hover:text-foreground"
															>
																{item.quantity === 1 ? (
																	<TrashIcon size={14} weight="bold" />
																) : (
																	<MinusIcon size={12} weight="bold" />
																)}
															</button>
															<span className="w-6 text-center text-sm font-black tabular-nums">
																{item.quantity}
															</span>
															<button
																type="button"
																onClick={() => addItem(item.equipment)}
																disabled={
																	item.quantity >= item.equipment.availableCount
																}
																className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background shadow-sm transition-all text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:shadow-none"
															>
																<PlusIcon size={12} weight="bold" />
															</button>
														</div>
														<div className="text-right sm:hidden">
															<p className="text-base font-black tabular-nums">
																{fmtRub(price * item.quantity)}
															</p>
														</div>
													</div>
												</div>
											</motion.div>
										);
									})}
								</AnimatePresence>
							</div>
						</motion.div>
					</div>

					{/* Правая колонка: Итоги (Sticky) */}
					<div className="w-full lg:col-span-5 xl:col-span-4 sticky top-22">
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className="bg-card/60 backdrop-blur-2xl px-4 py-6 md-py-8 rounded-[2rem] border border-foreground/8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
						>
							<h2 className="text-xl font-black italic uppercase tracking-tight border-b border-foreground/5 pb-4">
								Ваш заказ
							</h2>

							<div className="space-y-3 text-sm font-medium">
								<div className="flex justify-between text-muted-foreground">
									<span>Аренда ({formatPlural(totalQty, "equipment")})</span>
									<span className="text-foreground tabular-nums">
										{fmtRub(math.totalRental)}
									</span>
								</div>
								{disc > 0 && (
									<div className="flex justify-between text-green-600 dark:text-green-400">
										<span>Скидка по промокоду</span>
										<span className="tabular-nums">− {fmtRub(disc)}</span>
									</div>
								)}
								{math.totalDeposit > 0 && (
									<div className="flex justify-between text-muted-foreground/60 text-xs">
										<span>Залог (возвратный)</span>
										<span className="tabular-nums">
											{fmtRub(math.totalDeposit)}
										</span>
									</div>
								)}
							</div>

							{math.totalRental > 0 && (
								<div className="pt-2">
									<PromoCodeField
										appliedPromo={appliedPromo}
										onApply={setAppliedPromo}
										onRemove={() => setAppliedPromo(null)}
										originalPrice={math.totalRental}
									/>
								</div>
							)}

							<div className="pt-4 border-t border-foreground/10 flex items-end justify-between">
								<span className="text-sm font-bold uppercase text-muted-foreground">
									Итого
								</span>
								<div className="text-right">
									{disc > 0 && (
										<p className="text-xs text-muted-foreground line-through tabular-nums mb-1">
											{fmtRub(math.totalRental)}
										</p>
									)}
									<span className="text-3xl font-black italic text-foreground tabular-nums leading-none">
										{fmtRub(finalPrice)}
									</span>
								</div>
							</div>

							{/* Warnings */}
							{hasAnyBusy && (
								<div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
									<p className="mb-1">
										Выбранные даты заняты для {busyItemCount} позиций.
									</p>
									<p className="opacity-80">
										Измените даты аренды или удалите недоступные позиции из
										корзины.
									</p>
								</div>
							)}

							<BookingButton
								onClick={handleBookClick}
								disabled={!isCanBook}
								loading={isSubmitting}
								mode="new"
							/>

							<p className="text-xs text-muted-foreground/60 text-center font-medium leading-relaxed px-4">
								Выдача и возврат: {workStart}:00 — {workEnd}:00.
								<br />
								После оформления менеджер подтвердит заказ.
							</p>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Скелетон, полностью совпадающий с новым Layout ────────────────────────
function CheckoutSkeleton() {
	return (
		<div className="min-h-screen pb-28 md:pb-16 animate-pulse relative">
			<div className="container mx-auto px-4 lg:px-6 pt-8 max-w-6xl">
				<div className="h-10 w-64 rounded-xl bg-foreground/5 mb-8" />

				<div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">
					{/* Left Column */}
					<div className="w-full lg:col-span-7 xl:col-span-8 space-y-6">
						<div className="bg-foreground/5 p-5 md:p-7 rounded-3xl h-40 border border-foreground/2" />
						<div className="bg-foreground/5 p-5 md:p-7 rounded-3xl h-96 border border-foreground/2 flex flex-col gap-4">
							<div className="h-4 w-32 bg-foreground/10 rounded mb-4" />
							{[1, 2, 3].map((i) => (
								<div key={i} className="flex gap-4 items-center">
									<div className="w-26 h-16 rounded-xl bg-foreground/10" />
									<div className="flex-1 space-y-2">
										<div className="h-4 w-3/4 bg-foreground/10 rounded" />
										<div className="h-3 w-1/4 bg-foreground/10 rounded" />
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Right Column */}
					<div className="w-full lg:col-span-5 xl:col-span-4">
						<div className="bg-foreground/5 px-4 py-6 md:py-8 rounded-[2rem] h-112.5 border border-foreground/2 flex flex-col gap-6">
							<div className="h-6 w-32 bg-foreground/10 rounded" />
							<div className="space-y-3 flex-1 mt-4">
								<div className="h-4 w-full bg-foreground/10 rounded" />
								<div className="h-4 w-2/3 bg-foreground/10 rounded" />
							</div>
							<div className="h-16 w-full bg-primary/10 rounded-2xl" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
