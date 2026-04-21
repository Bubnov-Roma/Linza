"use client";

import {
	ArrowBigDown,
	ArrowBigUp,
	ChevronDown,
	Minus,
	Package,
	Plus,
} from "lucide-react";
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
	BookingButton,
	getDefaultRentalPeriod,
	RentalPeriod,
} from "@/components/shared";
import { Button } from "@/components/ui";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { calculateItemPrice, cn, combineDateAndTime } from "@/lib/utils";
import { useSiteSettingsStore } from "@/store";
import { useCartStore } from "@/store/use-cart.store";
import { formatPlural } from "@/utils";

// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
	const requireAuth = useRequireAuth();
	const router = useRouter();
	const { items, addItem, removeOne, clearCart } = useCartStore();
	// const { status } = useApplicationStatus();

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
	const [itemsExpanded, setItemsExpanded] = useState(false);

	// -- Empty Cart -> top scroll -------------------------------------------
	useEffect(() => {
		if (items.length === 0) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [items.length]);

	// ── Rental period ──────────────────────────────────────────────────────
	const [period, setPeriod] = useState(() =>
		getDefaultRentalPeriod(workStart, workEnd)
	);

	// ── Math ───────────────────────────────────────────────────────────────
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

	// ── Availability check ─────────────────────────────────────────────────
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

	// ── Submit ─────────────────────────────────────────────────────────────
	const doCreateBooking = async (): Promise<boolean> => {
		if (!isCanBook || !math.startFull || !math.endFull) return false;
		setIsSubmitting(true);
		try {
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
				totalPrice: math.totalRental,
				hasInsurance: true,
				totalReplacementValue: math.totalRV,
			});
			if (result.success && result.bookingId) {
				clearCart();
				setBookingId(result.bookingId);
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
		requireAuth(
			() => {
				doCreateBooking();
			},
			{
				type: "callback",
				fn: () => {
					doCreateBooking();
				},
			}
		);
	};

	// ── Success screen ─────────────────────────────────────────────────────
	if (bookingId) return <BookingSuccessScreen bookingId={bookingId} />;
	if (!hydrated) return <CheckoutSkeleton />;
	if (items.length === 0) {
		return (
			<div className="container mx-auto py-40 text-center space-y-6">
				<h1 className="text-6xl font-black uppercase italic opacity-10">
					Пусто
				</h1>
				<Button
					size="xl"
					onClick={() => router.push("/equipment")}
					className="px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase italic text-sm"
				>
					В каталог
				</Button>
			</div>
		);
	}

	// ── Duration label ─────────────────────────────────────────────────────
	const days = Math.floor(math.hours / 24);
	const remH = Math.round(math.hours % 24);
	const durationParts: string[] = [];
	if (days > 0) durationParts.push(`${days} дн.`);
	if (remH > 0) durationParts.push(`${remH} ч.`);
	const durationLabel = durationParts.join(" ") || "—";

	// ── Total items count ──────────────────────────────────────────────────
	const totalQty = activeItems.reduce((s, i) => s + i.quantity, 0);

	return (
		<div className="min-h-screen pb-28 md:pb-12">
			<div className="container mx-auto px-4 lg:px-6 pt-8 max-w-2xl">
				<h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-8">
					Оформление
				</h1>

				<div className="space-y-3">
					{/* ── 1. Rental period ── */}
					<div className="card-surface p-5 rounded-[1.75rem] border border-foreground/8">
						<p className="text-[10px] font-black uppercase italic tracking-widest opacity-40 mb-4">
							Период аренды
						</p>
						<RentalPeriod value={period} onChange={setPeriod} />

						{/* Duration hint */}
						{math.hours > 0 && (
							<p className="mt-3 text-[11px] text-muted-foreground/50 text-center font-medium">
								{durationLabel}
								{isChecking && (
									<span className="ml-2 inline-flex items-center gap-1">
										<span className="w-1 h-1 rounded-full bg-primary/50 animate-pulse" />
										проверяем доступность…
									</span>
								)}
							</p>
						)}

						{/* Busy warning */}
						{hasAnyBusy && (
							<div className="mt-3 px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-400 font-medium">
								<p>
									{`В выбранные даты ${formatPlural(busyItemCount, "items")} ${formatPlural(busyItemCount, "unavailable", false)}.`}
								</p>
								<span>
									Измените период аренды{" "}
									{<ArrowBigUp size={10} className="inline fill-primary" />} или
									комплектацию заказа{" "}
									{<ArrowBigDown size={10} className="inline fill-primary" />}
								</span>
							</div>
						)}
					</div>

					{/* ── 2. Items accordion ── */}
					<div className="card-surface rounded-[1.75rem] border border-foreground/8 overflow-hidden">
						{/* Accordion header — always visible */}
						<button
							type="button"
							onClick={() => setItemsExpanded((v) => !v)}
							className="w-full flex items-center gap-4 p-5 hover:bg-foreground/5 transition-colors"
						>
							<Package
								size={14}
								className="text-muted-foreground/40 shrink-0"
							/>
							<div className="flex-1 min-w-0 text-left">
								<p className="text-[10px] font-black uppercase italic tracking-widest opacity-40 mb-0.5">
									Список техники
								</p>
								<div className="flex items-baseline gap-3">
									{formatPlural(totalQty, "equipment")}
									<span className="text-muted-foreground/40 text-xs">·</span>
									<span className="text-sm font-black text-primary">
										{Math.round(math.totalRental).toLocaleString("ru")} ₽
									</span>
								</div>
							</div>
							<ChevronDown
								size={15}
								className={cn(
									"text-muted-foreground/40 transition-transform shrink-0",
									itemsExpanded && "rotate-180"
								)}
							/>
						</button>

						{/* Expanded item list */}
						{itemsExpanded && (
							<div className="border-t border-foreground/8 animate-in slide-in-from-top-2 duration-200">
								{activeItems.map((item) => {
									const allIds = item.equipment.allUnitIds?.length
										? item.equipment.allUnitIds
										: [item.equipment.id];
									const freeCount = allIds.filter(
										(id) => !busyIds.includes(id)
									).length;
									const isBusy = freeCount < item.quantity;

									// Позиция "занята" только если ВСЕ её единицы заняты
									// (если хотя бы одна свободна — можно бронировать)
									const price = calculateItemPrice(item.equipment, math.hours);
									return (
										<div
											key={item.equipment.id}
											className={cn(
												"px-4 py-3.5 border-b border-foreground/5 last:border-0 space-y-2.5",
												isBusy && "bg-red-500/5"
											)}
										>
											{/* ── Ряд 1: картинка + название ── */}
											<div className="flex items-center gap-3">
												<div className="relative w-12 h-12 rounded-xl overflow-hidden bg-foreground/8 shrink-0">
													{item.equipment.imageUrl ? (
														<Image
															src={item.equipment.imageUrl}
															alt={item.equipment.title}
															fill
															sizes="48px"
															className="object-cover"
														/>
													) : (
														<Package
															size={16}
															className="absolute inset-0 m-auto text-muted-foreground/20"
														/>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<Link
														href={`equipment/item/${item.equipment.slug}`}
														className={cn(
															"text-sm font-semibold leading-snug hover:border-b",
															isBusy && "text-red-400"
														)}
													>
														{item.equipment.title}
													</Link>
													{isBusy && (
														<span className="inline-block mt-0.5 text-[10px] font-bold uppercase bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">
															занято
														</span>
													)}
												</div>
											</div>

											{/* ── Ряд 2: qty controls + цена ── */}
											<div className="flex items-center justify-between gap-3 pl-0.5">
												{/* Qty stepper */}
												<div className="flex items-center gap-0 rounded-xl border border-foreground/12 overflow-hidden">
													<button
														type="button"
														onClick={() => removeOne(item.equipment.id)}
														className="w-9 h-9 flex items-center justify-center hover:bg-foreground/8 active:bg-foreground/15 transition-colors"
													>
														<Minus size={12} />
													</button>
													<span className="w-8 text-center text-sm font-bold tabular-nums border-x border-foreground/8 h-9 flex items-center justify-center">
														{item.quantity}
													</span>
													<button
														type="button"
														onClick={() => addItem(item.equipment)}
														disabled={
															item.quantity >= item.equipment.availableCount
														}
														className="w-9 h-9 flex items-center justify-center hover:bg-foreground/8 active:bg-foreground/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
													>
														<Plus size={12} />
													</button>
												</div>
												{/* Line price */}
												<div className="text-right">
													<p className="text-sm font-black tabular-nums text-foreground">
														{(price * item.quantity).toLocaleString("ru")} ₽
													</p>
													<p className="text-[11px] text-muted-foreground/40 font-mono">
														{price.toLocaleString("ru")} ₽/шт.
													</p>
												</div>
											</div>
										</div>
									);
								})}

								{/* Subtotal row */}
								<div className="flex items-center justify-between px-5 py-3.5 bg-foreground/3">
									<span className="text-xs font-bold uppercase text-muted-foreground/50">
										Итого
									</span>
									<span className="text-lg font-black italic text-primary">
										{Math.round(math.totalRental).toLocaleString("ru")} ₽
									</span>
								</div>
							</div>
						)}
					</div>

					{/* ── 3. Submit button ── */}

					<BookingButton
						onClick={handleBookClick}
						disabled={!isCanBook}
						loading={isSubmitting}
						mode="new"
					/>

					{/* Fine print */}
					<p className="text-[10px] text-muted-foreground/30 text-center font-medium">
						Выдача и возврат: {10}:00 — {20}:00 · После заявки менеджер
						подтвердит заказ
					</p>
				</div>
			</div>
		</div>
	);
}

// ─── CheckoutSkeleton ─────────────────────────────────────────────────────────
function CheckoutSkeleton() {
	return (
		<div className="min-h-screen pb-52 md:pb-20 animate-pulse">
			<div className="container mx-auto px-4 lg:px-6 pt-8">
				<div className="mb-8">
					<div className="h-10 w-52 rounded-xl bg-foreground/8" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
					{/* Левая */}
					<div className="lg:col-span-3 rounded-[2rem] bg-foreground/5 border border-white/8 p-5 space-y-4">
						<div className="flex gap-4">
							<div className="h-3 w-24 rounded bg-foreground/8" />
							<div className="h-3 w-28 rounded bg-foreground/8" />
						</div>
						<div className="rounded-xl bg-foreground/8 h-72 w-full" />
						{[1, 2, 3].map((n) => (
							<div key={n} className="flex items-center gap-3 py-2">
								<div className="w-7 h-7 rounded-lg bg-foreground/10 shrink-0" />
								<div className="flex-1 h-3 rounded bg-foreground/8" />
								<div className="w-12 h-3 rounded bg-foreground/8" />
							</div>
						))}
					</div>
					{/* Правая */}
					<div className="lg:col-span-2 rounded-[2rem] bg-foreground/5 border border-white/8 p-5 space-y-4">
						<div className="h-3 w-14 rounded bg-foreground/8" />
						{[1, 2].map((n) => (
							<div key={n} className="flex justify-between">
								<div className="h-3 w-24 rounded bg-foreground/8" />
								<div className="h-3 w-16 rounded bg-foreground/8" />
							</div>
						))}
						<div className="mt-8">
							<div className="h-14 rounded-2xl bg-primary/15" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
