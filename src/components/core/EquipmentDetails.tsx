"use client";
import {
	BriefcaseMetalIcon,
	InfoIcon,
	LightningIcon,
	VideoIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import NProgress from "nprogress";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	checkAvailabilityAction,
	submitBookingAction,
} from "@/actions/client-booking-actions";
import { AddToCartButton } from "@/components/core/AddToCartButton";
import { Lightbox } from "@/components/core/Lightbox";
import { PriceSelector } from "@/components/core/PriceSelector";
import { RelatedSlider } from "@/components/core/RelatedSlider";
import { BookingSuccessScreen } from "@/components/dashboard/bookings/BookingSuccessScreen";
import {
	type AppliedPromo,
	applyPromoDiscount,
	BookingButton,
	EquipmentActionButtons,
	getDefaultRentalPeriod,
	PromoCodeField,
	RentalPeriod,
	SimpleMarkdown,
	VideoEmbed,
} from "@/components/shared";
import {
	Card,
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { useRequireAuth } from "@/hooks";
import {
	calculateItemPrice,
	cn,
	combineDateAndTime,
	fmtRub,
} from "@/lib/utils";
import { useCartStore } from "@/store/use-cart.store";
import { useSiteSettingsStore } from "@/store/use-site-settings.store";

function MD({ children }: { children: string | null | undefined }) {
	if (!children) return null;
	return <SimpleMarkdown text={children} />;
}

function VideoReviews({ urls }: { urls: string[] }) {
	if (urls.length === 0) return <p>Видеообзоров появятся позже</p>;

	return (
		<div className="space-y-4 py-2">
			{urls.map((url, i) => (
				<VideoEmbed key={i} url={url} />
			))}
		</div>
	);
}

const INFO_TABS = [
	{ id: "description", label: "Описание", icon: InfoIcon },
	{ id: "kit", label: "Комплект", icon: BriefcaseMetalIcon },
	{ id: "reviews", label: "Обзоры", icon: VideoIcon },
] as const;

type InfoTabId = (typeof INFO_TABS)[number]["id"];

export type EquipmentFormState = GroupedEquipment & {
	relatedIds: string[];
};

export default function EquipmentDetails({
	equipment,
}: {
	equipment: EquipmentFormState;
}) {
	const requireAuth = useRequireAuth();
	const { items: cartItems, clearCart } = useCartStore();
	const titleRef = useRef<HTMLHeadingElement>(null);
	const { workStart, workEnd } = useSiteSettingsStore();

	const [activeInfoTab, setActiveInfoTab] = useState<InfoTabId>("description");
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

	const images = equipment.images?.length
		? equipment.images
		: [equipment.imageUrl];

	const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
	const [period, setPeriod] = useState(() =>
		getDefaultRentalPeriod(workStart, workEnd)
	);

	const [isChecking, setIsChecking] = useState(false);
	const [busyIds, setBusyIds] = useState<string[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [bookingId, setBookingId] = useState<string | null>(null);
	const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
	const [appliedPromoCode, setAppliedPromoCode] = useState<{
		code: string;
		discountAmount: number;
	} | null>(null);

	useEffect(() => {
		if (window.innerWidth < 1024 && titleRef.current) {
			const timer = setTimeout(() => {
				titleRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 100);
			return () => clearTimeout(timer);
		}
		return;
	}, []);

	const quantity = useMemo(() => {
		const inCart = cartItems.find((i) => i.equipment.id === equipment.id);
		return inCart ? inCart.quantity : 1;
	}, [cartItems, equipment.id]);

	const math = useMemo(() => {
		const start = combineDateAndTime(period.startDate, period.startTime);
		const end = combineDateAndTime(period.endDate, period.endTime);
		if (!start || !end)
			return { totalRental: 0, hours: 0, startFull: null, endFull: null };

		const hours = Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
		const linePrice = calculateItemPrice(equipment, hours);

		return {
			hours,
			startFull: start,
			endFull: end,
			totalRental: linePrice * quantity,
			totalRV: (equipment.replacementValue || 0) * quantity,
		};
	}, [period, equipment, quantity]);

	const currentMode = useMemo(() => {
		if (math.hours <= 4 && equipment.price4h !== 0) return "h4";
		if (math.hours <= 8 && equipment.price8h !== 0) return "h8";
		return "day";
	}, [math.hours, equipment.price4h, equipment.price8h]);

	const setQuickPeriodMobile = (mode: "h4" | "h8" | "day") => {
		const startFull = combineDateAndTime(period.startDate, period.startTime);
		if (!startFull) return;
		const hoursToAdd = mode === "h4" ? 4 : mode === "h8" ? 8 : 24;
		const newEnd = new Date(startFull.getTime() + hoursToAdd * 3600000);
		setPeriod({
			...period,
			endDate: newEnd,
			endTime: `${String(newEnd.getHours()).padStart(2, "0")}:${String(newEnd.getMinutes()).padStart(2, "0")}`,
		});
	};

	useEffect(() => {
		if (!isQuickBookOpen) return;
		let cancelled = false;
		async function check() {
			if (!math.startFull || !math.endFull) {
				setBusyIds([]);
				return;
			}
			setIsChecking(true);
			NProgress.start();
			try {
				const r = await checkAvailabilityAction(
					equipment.allUnitIds?.length ? equipment.allUnitIds : [equipment.id],
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
	}, [
		math.startFull,
		math.endFull,
		equipment.id,
		isQuickBookOpen,
		equipment.allUnitIds,
	]);

	const availableUnitIds = (
		equipment.allUnitIds?.length ? equipment.allUnitIds : [equipment.id]
	).filter((id) => !busyIds.includes(id));

	const hasConflict = availableUnitIds.length < quantity;
	const canBook =
		!hasConflict && math.totalRental > 0 && !!math.startFull && !!math.endFull;

	const handleQuickBookSubmit = () => {
		if (!canBook) return;
		requireAuth(doCreateBooking, { type: "callback", fn: doCreateBooking });
	};

	const doCreateBooking = async () => {
		if (!canBook || !math.startFull || !math.endFull) return;
		setIsSubmitting(true);
		try {
			const { finalPrice: finalTotal, discountAmount } = applyPromoDiscount(
				math.totalRental,
				appliedPromo
			);
			const result = await submitBookingAction({
				items: [
					{
						id: equipment.id,
						allUnitIds: equipment.allUnitIds ?? [equipment.id],
						quantity,
						priceToPay: calculateItemPrice(equipment, math.hours),
						deposit: equipment.deposit,
						replacementValue: equipment.replacementValue,
					},
				],
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
				setIsQuickBookOpen(false);
				setBookingId(result.bookingId);
				if (result.appliedPromoCode) {
					setAppliedPromoCode(result.appliedPromoCode);
				}
			} else {
				toast.error(result.error || "Ошибка брони");
			}
		} catch {
			toast.error("Непредвиденная ошибка");
		} finally {
			setIsSubmitting(false);
		}
	};

	const visibleTabs = INFO_TABS.filter((tab) => {
		if (tab.id === "description") return !!equipment.description;
		if (tab.id === "kit") return !!equipment.kit;
		if (tab.id === "reviews") return equipment.videoUrls.length > 0;
		return true;
	});

	const hasRelated = !!(
		equipment.relatedIds && equipment.relatedIds.length > 0
	);

	if (bookingId)
		return (
			<BookingSuccessScreen
				bookingId={bookingId}
				appliedPromoCode={appliedPromoCode}
			/>
		);

	const quickBookContent = (
		<>
			<div className="p-3 rounded-xl bg-foreground/5 flex items-center justify-between">
				<span className="text-sm font-bold pr-4">{equipment.title}</span>
				<span className="text-sm font-black whitespace-nowrap">
					{quantity} шт.
				</span>
			</div>
			<div className="card-surface p-5 rounded-[1.75rem] border border-foreground/8">
				<p className="text-[10px] font-black uppercase italic tracking-widest opacity-40 mb-4">
					Период аренды
				</p>
				<RentalPeriod value={period} onChange={setPeriod} />
				{hasConflict && (
					<div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
						В этот период техника занята. Выберите другие даты.
					</div>
				)}
			</div>
		</>
	);

	const TotalPrice = () => {
		const { finalPrice, discountAmount: disc } = applyPromoDiscount(
			math.totalRental,
			appliedPromo
		);
		return (
			<div className="space-y-3">
				<PromoCodeField
					appliedPromo={appliedPromo}
					onApply={setAppliedPromo}
					onRemove={() => setAppliedPromo(null)}
					originalPrice={math.totalRental}
				/>
				<div className="flex justify-between items-end">
					<div className="space-y-0.5">
						<span className="text-xs font-bold uppercase text-muted-foreground">
							Итого к оплате
						</span>
						{disc > 0 && (
							<p className="text-xs text-muted-foreground line-through tabular-nums">
								{fmtRub(math.totalRental)}
							</p>
						)}
					</div>
					<span className="text-2xl font-black italic text-foreground leading-none flex items-center gap-2 tabular-nums">
						{fmtRub(Math.round(finalPrice))}
						{isChecking && (
							<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mb-1" />
						)}
					</span>
				</div>
			</div>
		);
	};

	const quickBookFooter = (
		<>
			<TotalPrice />
			<BookingButton
				onClick={handleQuickBookSubmit}
				disabled={!canBook}
				loading={isSubmitting}
				mode="new"
				className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20"
			/>
		</>
	);

	return (
		<>
			{lightboxSrc && (
				<Lightbox
					src={lightboxSrc}
					title={equipment.title}
					onClose={() => setLightboxSrc(null)}
				/>
			)}

			<div className="lg:px-6 max-w-7xl mx-auto py-4 flex flex-col space-y-2 md:space-y-4 items-center animate-in fade-in duration-500 lg:overflow-visible">
				<div className="flex px-4 w-full items-baseline h-full">
					<h1
						ref={titleRef}
						className="text-3xl font-black italic uppercase tracking-tighter leading-tight scroll-mt-14"
					>
						{equipment.title}
					</h1>
				</div>
				{/* ── Основная сетка страницы (7 + 5 колонок) ── */}
				<div className="grid px-4 grid-cols-1 md:grid-cols-12 gap-8 items-start min-h-0 w-full relative">
					{/* ━━ ЛЕВАЯ КОЛОНКА: Галерея и Табы ━━ */}
					<div className="order-1 md:col-span-6 lg:col-span-7 space-y-4 md:row-start-1">
						<div className="relative rounded-3xl overflow-hidden bg-foreground/5">
							<Carousel className="w-full">
								<CarouselContent>
									{images.map((img, i) => (
										<CarouselItem key={`${img}-${i}`}>
											<Card
												className="relative aspect-4/3 overflow-hidden cursor-zoom-in group border-0 bg-transparent"
												onClick={() => !imgErrors.has(i) && setLightboxSrc(img)}
											>
												<Image
													src={img}
													fill
													sizes="(max-width: 1024px) 100vw, 800px"
													className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
													alt={equipment.title}
													priority={i === 0}
													onError={() =>
														setImgErrors((prev) => new Set(prev).add(i))
													}
												/>
											</Card>
										</CarouselItem>
									))}
								</CarouselContent>
								{images.length > 1 && (
									<>
										<CarouselPrevious className="left-4 bg-background/50 backdrop-blur" />
										<CarouselNext className="right-4 bg-background/50 backdrop-blur" />
									</>
								)}
							</Carousel>
							<EquipmentActionButtons
								id={equipment.id}
								slug={equipment.slug}
								title={equipment.title}
								className="absolute top-2 right-4 left-4"
							/>
						</div>

						{/* Мобильный блок покупки */}
						<div className="md:hidden">
							<PriceSelector
								prices={{
									day: equipment.pricePerDay,
									h4: equipment.price4h,
									h8: equipment.price8h,
								}}
								variant="details"
								activePeriod={currentMode}
								onPeriodChange={setQuickPeriodMobile}
								action={
									<AddToCartButton
										item={equipment}
										variant="details"
										size="md"
										className="w-full h-11"
										onQuickBook={() => setIsQuickBookOpen(true)}
									/>
								}
							/>
						</div>

						{/* Вкладки информации */}
						<div className="mt-8 px-0">
							<div className="flex overflow-x-auto no-scrollbar justify-center">
								{visibleTabs.map(({ id, label, icon: Icon }) => (
									<button
										key={id}
										type="button"
										onClick={() => setActiveInfoTab(id)}
										className={cn(
											"cursor-pointer flex flex-1 items-center justify-center gap-2 px-2 md:px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-all relative shrink-0",
											activeInfoTab === id
												? "text-foreground"
												: "text-foreground/50 hover:text-foreground"
										)}
									>
										<Icon
											size={14}
											weight={activeInfoTab === id ? "fill" : "regular"}
										/>
										{label}
										<div
											className={`absolute brightness-110 bottom-0 left-0 right-0 rounded-full h-0.5 ${activeInfoTab === id ? "bg-foreground shadow-[0_0_10px_gray] dark:bg-primary dark:shadow-[0_0_10px_yellow]" : "bg-transparent"}`}
											style={{
												transform:
													activeInfoTab === id ? "scale(1)" : "scale(0.1)",
												transition:
													"transform 0.2s ease-in-out, color 0.1s ease-in-out",
											}}
										/>
									</button>
								))}
							</div>

							<div className="py-6">
								{activeInfoTab === "description" && (
									<div className="max-w-3xl">
										<MD>{equipment.description}</MD>
									</div>
								)}
								{activeInfoTab === "kit" && (
									<div className="max-w-3xl text-sm leading-relaxed">
										<MD>{equipment.kit}</MD>
									</div>
								)}
								{activeInfoTab === "reviews" &&
									equipment.videoUrls.length > 0 && (
										<VideoReviews
											urls={(equipment.videoUrls as string[]) ?? []}
										/>
									)}
							</div>
						</div>
					</div>

					{/* ━━ ПРАВАЯ КОЛОНКА: Панель заказа (Desktop) ━━ */}
					<Card className="hidden md:block order-2 md:col-span-6 lg:col-span-5 md:sticky md:top-24 self-start md:row-start-1">
						<div className="flex flex-col gap-6">
							<div className="p-3 xl:p-6 shadow-xl shadow-foreground/5 space-y-6">
								<div className="flex items-center justify-between px-1">
									<p className="text-[10px] font-black uppercase italic tracking-widest opacity-40">
										Параметры аренды
									</p>
									<span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
										{math.hours.toFixed(1)} ч. всего
									</span>
								</div>

								<RentalPeriod value={period} onChange={setPeriod} />
								<div className="h-px bg-foreground/5 -mx-6" />

								{equipment.price4h > 0 && equipment.price8h > 0 && (
									<div className="hidden md:grid grid-cols-2 gap-3 pt-2">
										<div className="rounded-2xl border border-foreground/5 bg-foreground/3 p-4 flex flex-col justify-between shadow-neumorph-inset/10">
											<div className="flex items-center justify-between mb-2">
												<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
													4 часа
												</span>
												<span className="text-[9px] font-black bg-lime-500/15 text-lime-600 dark:text-lime-400 px-2 py-0.5 rounded-full">
													−
													{Math.round(
														(1 - equipment.price4h / equipment.pricePerDay) *
															100
													)}
													%
												</span>
											</div>
											<div>
												<p className="text-xl font-black italic tracking-tighter leading-none">
													{fmtRub(equipment.price4h)}
												</p>
												<p className="text-[10px] text-muted-foreground mt-1 font-medium">
													Экономия{" "}
													{fmtRub(equipment.pricePerDay - equipment.price4h)}
												</p>
											</div>
										</div>
										<div className="rounded-2xl border border-foreground/5 bg-foreground/3 p-4 flex flex-col justify-between shadow-neumorph-inset/10">
											<div className="flex items-center justify-between mb-2">
												<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
													8 часов
												</span>
												<span className="text-[9px] font-black bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 px-2 py-0.5 rounded-full">
													−
													{Math.round(
														(1 - equipment.price8h / equipment.pricePerDay) *
															100
													)}
													%
												</span>
											</div>
											<div>
												<p className="text-xl font-black italic tracking-tighter leading-none">
													{fmtRub(equipment.price8h)}
												</p>
												<p className="text-[10px] text-muted-foreground mt-1 font-medium">
													Экономия{" "}
													{fmtRub(equipment.pricePerDay - equipment.price8h)}
												</p>
											</div>
										</div>
									</div>
								)}

								<div className="hidden md:flex flex-col gap-4">
									<div className="flex items-end justify-between px-1">
										<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
											Итого
										</span>
										<div className="flex items-baseline gap-1.5">
											<span className="text-4xl font-black italic uppercase tracking-tighter">
												{fmtRub(math.totalRental)}
											</span>
											<span className="text-xl font-bold text-muted-foreground italic">
												₽
											</span>
										</div>
									</div>
									<AddToCartButton
										item={equipment}
										variant="details"
										size="lg"
										className="w-full h-14 rounded-2xl shadow-lg shadow-primary/20"
										onQuickBook={() => setIsQuickBookOpen(true)}
									/>
								</div>
							</div>
						</div>
					</Card>
				</div>
				{/* ── Блок сопутствующих товаров ── */}
				{hasRelated && equipment.relatedIds && (
					<div className={cn("relative mt-14 w-full space-y-4")}>
						<h3 className="text-xl font-black italic uppercase tracking-tight px-4">
							Вместе с этим арендуют
						</h3>
						<div
							className={cn(
								// "mask-[linear-gradient(to_right,transparent,white_2%,white_98%,transparent)]"
							)}
						>
							<RelatedSlider ids={equipment.relatedIds} />
						</div>
					</div>
				)}
			</div>

			<Dialog open={isQuickBookOpen} onOpenChange={setIsQuickBookOpen}>
				<DialogContent className="max-w-md p-6 sm:rounded-3xl">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-xl font-black italic uppercase">
							<LightningIcon weight="fill" size={20} className="text-primary" />{" "}
							Оформление заказа
						</DialogTitle>
					</DialogHeader>
					<div className="mt-4 space-y-3">{quickBookContent}</div>
					<div className="mt-6 pt-6 border-t border-foreground/5 space-y-4">
						{quickBookFooter}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
