"use client";

import {
	CalendarIcon,
	CameraIcon,
	CheckCircleIcon,
	ClockIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import type { StudioTariffData } from "@/actions/admin-studio-actions";
import { getActiveStudioTariffsAction } from "@/actions/admin-studio-actions";
import {
	checkStudioAvailabilityAction,
	getStudioAvailableEquipmentAction,
	submitStudioBookingAction,
} from "@/actions/client-studio-actions";
import { BookingSuccessScreen } from "@/components/dashboard/bookings/BookingSuccessScreen";
import {
	type AppliedPromo,
	applyPromoDiscount,
	getDefaultRentalPeriod,
	PromoCodeField,
	RentalPeriod,
} from "@/components/shared";
import {
	Button,
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui";
import { useRequireAuth } from "@/hooks";
import { cn, combineDateAndTime, fmtRub } from "@/lib/utils";
import { useSiteSettingsStore } from "@/store/use-site-settings.store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioEquipmentItem {
	id: string;
	title: string;
	priceStudio: number;
	imageUrl: string | null;
	categoryName: string;
}

interface StudioBookingSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialTariffId?: string;
}

// ─── TariffCard ───────────────────────────────────────────────────────────────

function TariffCard({
	tariff,
	selected,
	durationHours,
	onSelect,
}: {
	tariff: StudioTariffData;
	selected: boolean;
	durationHours: number;
	onSelect: () => void;
}) {
	const total = tariff.pricePerHour * Math.max(1, durationHours);
	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"relative w-full text-left rounded-2xl border p-4 transition-all duration-200",
				selected
					? "border-primary bg-primary/8 shadow-sm shadow-primary/20"
					: "border-foreground/8 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/5"
			)}
		>
			{selected && (
				<CheckCircleIcon
					weight="fill"
					size={18}
					className="absolute top-3 right-3 text-primary"
				/>
			)}
			<div className="flex items-start justify-between pr-6">
				<div>
					<p className="font-bold text-sm">{tariff.name}</p>
					{tariff.description && (
						<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
							{tariff.description}
						</p>
					)}
				</div>
			</div>
			<div className="mt-2 flex items-baseline gap-1">
				<span className="text-lg font-black text-primary">
					{fmtRub(tariff.pricePerHour)}
				</span>
				<span className="text-xs text-muted-foreground">/час</span>
				{durationHours >= 1 && (
					<span className="ml-auto text-sm font-bold">= {fmtRub(total)}</span>
				)}
			</div>
		</button>
	);
}

// ─── EquipmentPicker ──────────────────────────────────────────────────────────

function EquipmentPicker({
	items,
	selected,
	onToggle,
	loading,
}: {
	items: StudioEquipmentItem[];
	selected: string[];
	onToggle: (id: string) => void;
	loading: boolean;
}) {
	if (loading) {
		return (
			<div className="grid grid-cols-2 gap-2">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="h-20 rounded-xl bg-foreground/5 animate-pulse"
					/>
				))}
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<p className="text-xs text-muted-foreground italic text-center py-4">
				Нет доступного оборудования для выбранного периода
			</p>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-2">
			{items.map((item) => {
				const isSelected = selected.includes(item.id);
				return (
					<button
						key={item.id}
						type="button"
						onClick={() => onToggle(item.id)}
						className={cn(
							"relative flex flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-all duration-150",
							isSelected
								? "border-primary bg-primary/8"
								: "border-foreground/8 bg-foreground/3 hover:border-foreground/20"
						)}
					>
						{isSelected && (
							<CheckCircleIcon
								weight="fill"
								size={14}
								className="absolute top-2 right-2 text-primary"
							/>
						)}
						<div className="relative w-full aspect-video rounded-lg overflow-hidden bg-foreground/5">
							{item.imageUrl ? (
								<Image
									src={item.imageUrl}
									alt={item.title}
									fill
									sizes="150px"
									className="object-cover"
								/>
							) : (
								<div className="flex items-center justify-center h-full">
									<CameraIcon size={20} className="text-muted-foreground/30" />
								</div>
							)}
						</div>
						<p className="text-[11px] font-semibold leading-tight line-clamp-2">
							{item.title}
						</p>
						<p className="text-[11px] font-black text-primary">
							{item.priceStudio > 0
								? `+ ${fmtRub(item.priceStudio)}`
								: "Включено"}
						</p>
					</button>
				);
			})}
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudioBookingSheet({
	open,
	onOpenChange,
	initialTariffId,
}: StudioBookingSheetProps) {
	const { workStart, workEnd } = useSiteSettingsStore();
	const requireAuth = useRequireAuth();

	// ── State ──────────────────────────────────────────────────────────────────
	const [tariffs, setTariffs] = useState<StudioTariffData[]>([]);
	const [selectedTariffId, setSelectedTariffId] = useState<string>(
		initialTariffId ?? ""
	);
	const [period, setPeriod] = useState(() =>
		getDefaultRentalPeriod(workStart, workEnd)
	);
	const [availableEquipment, setAvailableEquipment] = useState<
		StudioEquipmentItem[]
	>([]);
	const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
		[]
	);
	const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
	const [isChecking, startCheckTransition] = useTransition();
	const [isLoadingEquipment, startEquipmentTransition] = useTransition();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [bookingId, setBookingId] = useState<string | null>(null);
	const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
	const [isMobile, setIsMobile] = useState(false);

	// ── Mobile detection ───────────────────────────────────────────────────────
	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 768);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	// ── Load tariffs on open ───────────────────────────────────────────────────
	useEffect(() => {
		if (!open) return;
		getActiveStudioTariffsAction().then((data) => {
			setTariffs(data);
			if (!selectedTariffId && data[0]) {
				setSelectedTariffId(initialTariffId ?? data[0].id);
			}
		});
	}, [open, initialTariffId, selectedTariffId]);

	// ── Computed dates ─────────────────────────────────────────────────────────
	const startFull = useMemo(
		() => combineDateAndTime(period.startDate, period.startTime),
		[period]
	);
	const endFull = useMemo(
		() => combineDateAndTime(period.endDate, period.endTime),
		[period]
	);

	const durationHours = useMemo(() => {
		if (!startFull || !endFull) return 0;
		return Math.max(0, (endFull.getTime() - startFull.getTime()) / 3_600_000);
	}, [startFull, endFull]);

	// ── Check availability & load equipment when period changes ───────────────
	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		if (!open || !startFull || !endFull || durationHours < 1) {
			setIsAvailable(null);
			return;
		}

		startCheckTransition(async () => {
			const result = await checkStudioAvailabilityAction(startFull, endFull);
			setIsAvailable(result.available);
		});

		startEquipmentTransition(async () => {
			const eq = await getStudioAvailableEquipmentAction(startFull, endFull);
			setAvailableEquipment(eq);
			// Убираем выбранное оборудование если оно стало недоступным
			setSelectedEquipmentIds((prev) =>
				prev.filter((id) => eq.some((e) => e.id === id))
			);
		});
	}, [open, startFull?.toISOString(), endFull?.toISOString(), durationHours]);

	// ── Selected tariff ────────────────────────────────────────────────────────
	const selectedTariff = tariffs.find((t) => t.id === selectedTariffId);

	// ── Total price ────────────────────────────────────────────────────────────
	const totalPrice = useMemo(() => {
		if (!selectedTariff || durationHours < 1) return 0;
		const tariffCost = selectedTariff.pricePerHour * durationHours;
		const equipmentCost = availableEquipment
			.filter((e) => selectedEquipmentIds.includes(e.id))
			.reduce((s, e) => s + e.priceStudio, 0);
		return tariffCost + equipmentCost;
	}, [selectedTariff, durationHours, availableEquipment, selectedEquipmentIds]);

	// ── Handlers ───────────────────────────────────────────────────────────────
	const toggleEquipment = useCallback((id: string) => {
		setSelectedEquipmentIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	}, []);

	const canBook =
		!!selectedTariffId &&
		durationHours >= 1 &&
		isAvailable === true &&
		!isSubmitting;

	const handleSubmit = () => {
		requireAuth(doSubmit, { type: "callback", fn: doSubmit });
	};

	const doSubmit = async () => {
		if (!canBook || !startFull || !endFull) return;
		setIsSubmitting(true);
		try {
			const { finalPrice: _finalTotal, discountAmount } = applyPromoDiscount(
				totalPrice,
				appliedPromo
			);
			const result = await submitStudioBookingAction({
				tariffId: selectedTariffId,
				startDate: startFull,
				endDate: endFull,
				equipmentIds: selectedEquipmentIds,
				promoCode: appliedPromo?.code || "",
				discountAmount,
			});
			if (result.success && result.bookingId) {
				setBookingId(result.bookingId);
			} else {
				toast.error(result.error ?? "Ошибка при создании заказа");
			}
		} catch {
			toast.error("Непредвиденная ошибка");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (isSubmitting) return;
		onOpenChange(false);
		setTimeout(() => {
			setBookingId(null);
			setIsAvailable(null);
			setSelectedEquipmentIds([]);
			setAppliedPromo(null);
		}, 300);
	};

	// ── Success screen ─────────────────────────────────────────────────────────
	const successContent = bookingId ? (
		<div className="flex flex-col items-center justify-center min-h-75 gap-4 p-6">
			<BookingSuccessScreen
				bookingId={bookingId}
				redirectUrl={`/dashboard/studio-bookings/${bookingId}`}
			/>
		</div>
	) : null;

	const TotalPrice = () => {
		const { finalPrice, discountAmount: disc } = applyPromoDiscount(
			totalPrice,
			appliedPromo
		);
		return (
			<div className="space-y-3">
				<PromoCodeField
					appliedPromo={appliedPromo}
					onApply={setAppliedPromo}
					onRemove={() => setAppliedPromo(null)}
					originalPrice={totalPrice}
				/>
				<div className="rounded-2xl bg-primary/5 border border-primary/15 p-4 flex items-center justify-between">
					<div className="space-y-0.5">
						<span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
							Итого
						</span>
						{disc > 0 && (
							<p className="text-xs text-muted-foreground line-through tabular-nums">
								{fmtRub(totalPrice)}
							</p>
						)}
					</div>
					<span className="text-2xl font-black italic tabular-nums">
						{fmtRub(Math.round(finalPrice))}
					</span>
				</div>
			</div>
		);
	};

	// ── Form content ───────────────────────────────────────────────────────────
	const formContent = (
		<div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar px-1 pb-4">
			{/* ── Период ── */}
			<section>
				<p className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-1.5">
					<CalendarIcon size={12} />
					Период аренды
				</p>
				<div className="rounded-2xl border border-foreground/8 bg-foreground/3 p-4">
					<RentalPeriod value={period} onChange={setPeriod} disablePast />
				</div>
				{/* Статус доступности */}
				{durationHours > 0 && (
					<div className="mt-2">
						{isChecking ? (
							<p className="text-xs text-muted-foreground animate-pulse">
								Проверяем доступность…
							</p>
						) : isAvailable === false ? (
							<p className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
								Студия занята в этот период. Выберите другое время.
							</p>
						) : isAvailable === true ? (
							<p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
								<CheckCircleIcon weight="fill" size={14} />
								Студия свободна
							</p>
						) : null}
					</div>
				)}
				{/* Длительность */}
				{durationHours >= 1 && (
					<div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
						<ClockIcon size={12} />
						<span>
							{durationHours % 1 === 0
								? `${durationHours} ч`
								: `${durationHours.toFixed(1)} ч`}
						</span>
					</div>
				)}
				{durationHours > 0 && durationHours < 1 && (
					<p className="mt-2 text-xs text-amber-400 font-medium">
						Минимальная аренда — 1 час
					</p>
				)}
			</section>

			{/* ── Тариф ── */}
			<section>
				<p className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground/60 mb-3">
					Тариф
				</p>
				<div className="flex flex-col gap-2">
					{tariffs.map((tariff) => (
						<TariffCard
							key={tariff.id}
							tariff={tariff}
							selected={selectedTariffId === tariff.id}
							durationHours={durationHours}
							onSelect={() => setSelectedTariffId(tariff.id)}
						/>
					))}
				</div>
			</section>

			{/* ── Доп. оборудование ── */}
			{durationHours >= 1 && isAvailable === true && (
				<section>
					<p className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground/60 mb-3">
						Доп. оборудование{" "}
						<span className="font-normal normal-case not-italic text-muted-foreground/40">
							(опционально)
						</span>
					</p>
					<EquipmentPicker
						items={availableEquipment}
						selected={selectedEquipmentIds}
						onToggle={toggleEquipment}
						loading={isLoadingEquipment}
					/>
				</section>
			)}

			{/* ── Итого ── */}
			{totalPrice > 0 && <TotalPrice />}

			{/* ── Кнопка ── */}
			<Button
				onClick={handleSubmit}
				disabled={!canBook}
				className={cn(
					"w-full h-14 rounded-2xl font-black text-sm uppercase tracking-wide",
					"shadow-lg shadow-primary/20 transition-all duration-200",
					canBook ? "hover:scale-[1.01]" : "opacity-50 cursor-not-allowed"
				)}
			>
				{isSubmitting ? "Отправляем заявку…" : "Забронировать студию"}
			</Button>
		</div>
	);

	const sheetTitle = "Аренда студии";

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={handleClose}>
				<DrawerContent className="max-h-[92vh] flex flex-col">
					<DrawerHeader className="pb-2 px-4">
						<DrawerTitle className="text-xl font-black italic uppercase tracking-tighter">
							{sheetTitle}
						</DrawerTitle>
					</DrawerHeader>
					<div className="flex-1 overflow-y-auto px-4 pb-6">
						{successContent ?? formContent}
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Sheet open={open} onOpenChange={handleClose}>
			<SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
				<SheetHeader className="px-6 py-5 border-b border-foreground/5">
					<SheetTitle className="text-xl font-black italic uppercase tracking-tighter">
						{sheetTitle}
					</SheetTitle>
				</SheetHeader>
				<div className="flex-1 overflow-y-auto px-6 py-5">
					{successContent ?? formContent}
				</div>
			</SheetContent>
		</Sheet>
	);
}
