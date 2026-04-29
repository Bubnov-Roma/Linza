"use client";

import {
	CalendarIcon,
	CameraIcon,
	CheckCircleIcon,
	ClockIcon,
	CurrencyRubIcon,
	MagnifyingGlassIcon,
	PackageIcon,
	PlusIcon,
	TrashIcon,
	UserIcon,
	VideoIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import { searchUsersAction } from "@/actions/admin-booking-actions";
import type { StudioTariffData } from "@/actions/admin-studio-actions";
import { createStudioBookingByAdminAction } from "@/actions/admin-studio-actions";
import {
	checkStudioAvailabilityAction,
	getStudioAvailableEquipmentAction,
} from "@/actions/client-studio-actions";
import {
	getDefaultRentalPeriod,
	RentalPeriod,
	type RentalPeriodValue,
} from "@/components/shared/RentalPeriod";
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Textarea,
} from "@/components/ui";
import { BOOKING_STATUS_CONFIG } from "@/constants";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn, combineDateAndTime } from "@/lib/utils";
import { useSiteSettingsStore } from "@/store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientResult {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
}
interface StudioEquipmentItem {
	id: string;
	title: string;
	priceStudio: number;
	imageUrl: string | null;
	categoryName: string;
}

const ALL_STATUSES = Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[];

function fmtRub(n: number) {
	return `${n.toLocaleString("ru-RU")} ₽`;
}

function SectionTitle({
	icon: Icon,
	children,
}: {
	icon: React.ElementType;
	children: React.ReactNode;
}) {
	return (
		<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
			<Icon size={11} />
			{children}
		</p>
	);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateStudioBookingSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tariffs: StudioTariffData[];
	onCreated?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateStudioBookingSheet({
	open,
	onOpenChange,
	tariffs,
	onCreated,
}: CreateStudioBookingSheetProps) {
	const { workStart, workEnd } = useSiteSettingsStore();

	// ── Client search ──────────────────────────────────────────────────────────
	const [clientQuery, setClientQuery] = useState("");
	const [debouncedClientQuery] = useDebounceValue(clientQuery, 250);
	const [clientResults, setClientResults] = useState<ClientResult[]>([]);
	const [clientSearchOpen, setClientSearchOpen] = useState(false);
	const [selectedClient, setSelectedClient] = useState<ClientResult | null>(
		null
	);
	const [isSearchingClient, startClientSearch] = useTransition();

	// ── Period ─────────────────────────────────────────────────────────────────
	const [period, setPeriod] = useState<RentalPeriodValue | null>(null);

	// ── Tariff ─────────────────────────────────────────────────────────────────
	const [selectedTariffId, setSelectedTariffId] = useState<string>(
		tariffs[0]?.id ?? ""
	);

	// ── Equipment ──────────────────────────────────────────────────────────────
	const [availableEquipment, setAvailableEquipment] = useState<
		StudioEquipmentItem[]
	>([]);
	const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
		[]
	);
	const [isLoadingEq, startLoadEq] = useTransition();

	// ── Availability ───────────────────────────────────────────────────────────
	const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
	const [isCheckingAvail, startCheckAvail] = useTransition();

	// ── Pricing ───────────────────────────────────────────────────────────────
	const [useManualTotal, setUseManualTotal] = useState(false);
	const [manualTotal, setManualTotal] = useState("");

	// ── Status & note ─────────────────────────────────────────────────────────
	const [initialStatus, setInitialStatus] =
		useState<BookingStatus>("PENDING_REVIEW");
	const [internalNote, setInternalNote] = useState("");

	// ── Saving ────────────────────────────────────────────────────────────────
	const [isSaving, startSaving] = useTransition();

	// ── Init on open ──────────────────────────────────────────────────────────
	useEffect(() => {
		if (open && !period) setPeriod(getDefaultRentalPeriod(workStart, workEnd));
		if (open && !selectedTariffId && tariffs[0])
			setSelectedTariffId(tariffs[0].id);
	}, [open, period, workStart, workEnd, selectedTariffId, tariffs]);

	// ── Computed dates ─────────────────────────────────────────────────────────
	const startFull = useMemo(
		() =>
			period?.startDate
				? combineDateAndTime(period.startDate, period.startTime ?? "10:00")
				: null,
		[period]
	);
	const endFull = useMemo(
		() =>
			period?.endDate
				? combineDateAndTime(period.endDate, period.endTime ?? "20:00")
				: null,
		[period]
	);

	const durationHours = useMemo(() => {
		if (!startFull || !endFull) return 0;
		return Math.max(0, (endFull.getTime() - startFull.getTime()) / 3_600_000);
	}, [startFull, endFull]);

	// ── Check availability + load equipment when period changes ───────────────
	// biome-ignore lint/correctness/useExhaustiveDependencies: dates as strings
	useEffect(() => {
		if (!startFull || !endFull || durationHours < 1) {
			setIsAvailable(null);
			setAvailableEquipment([]);
			return;
		}
		startCheckAvail(async () => {
			const r = await checkStudioAvailabilityAction(startFull, endFull);
			setIsAvailable(r.available);
		});
		startLoadEq(async () => {
			const eq = await getStudioAvailableEquipmentAction(startFull, endFull);
			setAvailableEquipment(eq);
			setSelectedEquipmentIds((prev) =>
				prev.filter((id) => eq.some((e) => e.id === id))
			);
		});
	}, [startFull?.toISOString(), endFull?.toISOString()]);

	// ── Client search ──────────────────────────────────────────────────────────
	useEffect(() => {
		if (!debouncedClientQuery || debouncedClientQuery.length < 2) {
			setClientResults([]);
			return;
		}
		startClientSearch(async () => {
			const data = await searchUsersAction(debouncedClientQuery);
			setClientResults(data);
		});
	}, [debouncedClientQuery]);

	// ── Selected tariff & auto price ──────────────────────────────────────────
	const selectedTariff = tariffs.find((t) => t.id === selectedTariffId);

	const autoTotal = useMemo(() => {
		if (!selectedTariff || durationHours < 1) return 0;
		const tariffCost = selectedTariff.pricePerHour * durationHours;
		const eqCost = availableEquipment
			.filter((e) => selectedEquipmentIds.includes(e.id))
			.reduce((s, e) => s + e.priceStudio, 0);
		return tariffCost + eqCost;
	}, [selectedTariff, durationHours, availableEquipment, selectedEquipmentIds]);

	useEffect(() => {
		if (!useManualTotal) setManualTotal(String(Math.round(autoTotal)));
	}, [autoTotal, useManualTotal]);

	const finalTotal = useManualTotal
		? Number(manualTotal) || autoTotal
		: autoTotal;

	// ── Reset ─────────────────────────────────────────────────────────────────
	const resetForm = useCallback(() => {
		setSelectedClient(null);
		setClientQuery("");
		setClientResults([]);
		setPeriod(null);
		setSelectedTariffId(tariffs[0]?.id ?? "");
		setSelectedEquipmentIds([]);
		setAvailableEquipment([]);
		setIsAvailable(null);
		setManualTotal("");
		setUseManualTotal(false);
		setInitialStatus("PENDING_REVIEW");
		setInternalNote("");
	}, [tariffs]);

	// ── Save ──────────────────────────────────────────────────────────────────
	const handleSave = useCallback(() => {
		if (!selectedClient) return toast.error("Выберите клиента");
		if (!selectedTariffId) return toast.error("Выберите тариф");
		if (!startFull || !endFull) return toast.error("Укажите период аренды");
		if (durationHours < 1) return toast.error("Минимальная аренда — 1 час");
		if (finalTotal <= 0) return toast.error("Сумма должна быть больше нуля");
		if (endFull <= startFull)
			return toast.error("Дата окончания должна быть позже начала");

		return startSaving(async () => {
			const result = await createStudioBookingByAdminAction({
				userId: selectedClient.id,
				tariffId: selectedTariffId,
				startDate: startFull,
				endDate: endFull,
				equipmentIds: selectedEquipmentIds,
				note: internalNote.trim() || "",
			});
			if (!result.success) {
				toast.error(result.error ?? "Ошибка создания заказа");
				return;
			}
			toast.success("Заказ на студию создан");
			onCreated?.();
			resetForm();
			onOpenChange(false);
			return;
		});
	}, [
		selectedClient,
		selectedTariffId,
		startFull,
		endFull,
		durationHours,
		finalTotal,
		selectedEquipmentIds,
		internalNote,
		onCreated,
		onOpenChange,
		resetForm,
	]);

	// ── Selected equipment items ───────────────────────────────────────────────
	const selectedItems = availableEquipment.filter((e) =>
		selectedEquipmentIds.includes(e.id)
	);

	const toggleEquipment = (id: string) =>
		setSelectedEquipmentIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);

	return (
		<Sheet
			open={open}
			onOpenChange={(v) => {
				if (!v) resetForm();
				onOpenChange(v);
			}}
		>
			<SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
				<SheetHeader className="px-5 py-4 border-b border-foreground/5 shrink-0">
					<SheetTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
						<VideoIcon size={18} className="text-primary" />
						Новый заказ — студия
					</SheetTitle>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 custom-scrollbar">
					{/* ── 1. Клиент ── */}
					<div>
						<SectionTitle icon={UserIcon}>Клиент</SectionTitle>
						{selectedClient ? (
							<div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
								<div className="flex-1 min-w-0">
									<p className="text-sm font-bold truncate">
										{selectedClient.name || "Без имени"}
									</p>
									<p className="text-[11px] text-muted-foreground truncate">
										{selectedClient.email}{" "}
										{selectedClient.phone && `· ${selectedClient.phone}`}
									</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 text-xs shrink-0"
									onClick={() => {
										setSelectedClient(null);
										setClientQuery("");
									}}
								>
									Изменить
								</Button>
							</div>
						) : (
							<div className="relative">
								<MagnifyingGlassIcon
									size={13}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									placeholder="Поиск по имени, email, телефону..."
									className="pl-9 h-9 text-sm"
									value={clientQuery}
									onChange={(e) => {
										setClientQuery(e.target.value);
										setClientSearchOpen(true);
									}}
									onFocus={() => setClientSearchOpen(true)}
									onBlur={() =>
										setTimeout(() => setClientSearchOpen(false), 200)
									}
								/>
								{isSearchingClient && (
									<div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-primary/40 border-t-primary rounded-full animate-spin" />
								)}
								{clientSearchOpen && clientResults.length > 0 && (
									<div className="absolute left-0 right-0 top-full mt-1 z-50 border border-foreground/10 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto backdrop-blur-xl bg-background/90">
										{clientResults.map((c) => (
											<button
												key={c.id}
												type="button"
												onMouseDown={() => {
													setSelectedClient(c);
													setClientQuery("");
													setClientSearchOpen(false);
												}}
												className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-foreground/5 text-left transition-colors"
											>
												<div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold">
													{(c.name ?? c.email ?? "?")[0]?.toUpperCase()}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate">
														{c.name || "Без имени"}
													</p>
													<p className="text-[11px] text-muted-foreground truncate">
														{c.email}
													</p>
												</div>
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* ── 2. Период ── */}
					<div>
						<SectionTitle icon={CalendarIcon}>Период аренды</SectionTitle>
						<div className="rounded-2xl border border-foreground/8 bg-foreground/3 p-4">
							{period && (
								<RentalPeriod
									value={period}
									onChange={setPeriod}
									disablePast={false}
								/>
							)}
						</div>

						{/* Availability status */}
						<div className="mt-2 space-y-1">
							{durationHours > 0 && durationHours < 1 && (
								<p className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
									<WarningCircleIcon size={13} /> Минимальная аренда — 1 час
								</p>
							)}
							{durationHours >= 1 && isCheckingAvail && (
								<p className="text-xs text-muted-foreground animate-pulse">
									Проверяем доступность…
								</p>
							)}
							{durationHours >= 1 &&
								!isCheckingAvail &&
								isAvailable === false && (
									<p className="text-xs text-amber-400 font-medium flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
										<WarningCircleIcon size={13} />
										Студия занята в это время. Заказ будет создан с
										пересечением.
									</p>
								)}
							{durationHours >= 1 &&
								!isCheckingAvail &&
								isAvailable === true && (
									<p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
										<CheckCircleIcon weight="fill" size={13} /> Студия свободна
									</p>
								)}
							{durationHours >= 1 && (
								<p className="text-xs text-muted-foreground flex items-center gap-1.5">
									<ClockIcon size={12} />
									{durationHours % 1 === 0
										? `${durationHours} ч`
										: `${durationHours.toFixed(1)} ч`}
								</p>
							)}
						</div>
					</div>

					{/* ── 3. Тариф ── */}
					<div>
						<SectionTitle icon={VideoIcon}>Тариф студии</SectionTitle>
						<div className="space-y-2">
							{tariffs.map((tariff) => {
								const isSelected = selectedTariffId === tariff.id;
								const cost = tariff.pricePerHour * Math.max(1, durationHours);
								return (
									<button
										key={tariff.id}
										type="button"
										onClick={() => setSelectedTariffId(tariff.id)}
										className={cn(
											"w-full text-left rounded-xl border p-3 transition-all duration-150",
											isSelected
												? "border-primary bg-primary/8"
												: "border-foreground/8 bg-foreground/3 hover:border-foreground/20"
										)}
									>
										<div className="flex items-center justify-between">
											<span className="font-bold text-sm">{tariff.name}</span>
											<span className="text-sm font-black text-primary">
												{fmtRub(tariff.pricePerHour)}
												<span className="text-xs font-normal text-muted-foreground">
													/ч
												</span>
											</span>
										</div>
										{tariff.description && (
											<p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
												{tariff.description}
											</p>
										)}
										{durationHours >= 1 && isSelected && (
											<p className="text-[11px] text-primary font-bold mt-1">
												Итого тариф: {fmtRub(cost)}
											</p>
										)}
									</button>
								);
							})}
						</div>
					</div>

					{/* ── 4. Доп. оборудование ── */}
					<div>
						<SectionTitle icon={CameraIcon}>
							Доп. оборудование
							<span className="font-normal normal-case ml-1 text-muted-foreground/50">
								(опционально)
							</span>
						</SectionTitle>

						{durationHours < 1 ? (
							<p className="text-xs text-muted-foreground italic">
								Укажите период для выбора оборудования
							</p>
						) : isLoadingEq ? (
							<div className="grid grid-cols-2 gap-2">
								{[1, 2].map((i) => (
									<div
										key={i}
										className="h-12 rounded-xl bg-foreground/5 animate-pulse"
									/>
								))}
							</div>
						) : availableEquipment.length === 0 ? (
							<p className="text-xs text-muted-foreground italic">
								Нет доступного оборудования для этого периода
							</p>
						) : (
							<div className="space-y-2">
								{/* Selected items */}
								{selectedItems.map((item) => (
									<div
										key={item.id}
										className="flex items-center gap-2 p-2.5 rounded-xl border border-primary/20 bg-primary/5"
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">
												{item.title}
											</p>
											<p className="text-[11px] text-primary font-bold">
												+ {fmtRub(item.priceStudio)}
											</p>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 hover:text-red-500"
											onClick={() => toggleEquipment(item.id)}
										>
											<TrashIcon size={12} />
										</Button>
									</div>
								))}

								{/* Not-yet-selected */}
								<div className="grid grid-cols-2 gap-2">
									{availableEquipment
										.filter((e) => !selectedEquipmentIds.includes(e.id))
										.map((item) => (
											<button
												key={item.id}
												type="button"
												onClick={() => toggleEquipment(item.id)}
												className="flex items-center gap-2 p-2.5 rounded-xl border border-foreground/8 bg-foreground/3 hover:border-foreground/20 text-left transition-all"
											>
												<div className="flex-1 min-w-0">
													<p className="text-xs font-medium leading-tight line-clamp-2">
														{item.title}
													</p>
													<p className="text-[10px] text-primary font-bold mt-0.5">
														+ {fmtRub(item.priceStudio)}
													</p>
												</div>
												<PlusIcon size={13} className="text-primary shrink-0" />
											</button>
										))}
								</div>
							</div>
						)}
					</div>

					{/* ── 5. Стоимость ── */}
					<div>
						<SectionTitle icon={CurrencyRubIcon}>Стоимость</SectionTitle>
						<div className="space-y-3">
							<div className="flex items-center justify-between p-3 rounded-xl bg-foreground/3 border border-foreground/8">
								<p className="text-sm text-muted-foreground">Расчётная сумма</p>
								<p className="text-sm font-bold">{fmtRub(autoTotal)}</p>
							</div>
							<div className="space-y-1.5">
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										id="studio-manual-price"
										checked={useManualTotal}
										onChange={(e) => setUseManualTotal(e.target.checked)}
										className="rounded"
									/>
									<Label
										htmlFor="studio-manual-price"
										className="text-sm cursor-pointer"
									>
										Указать сумму вручную
									</Label>
								</div>
								{useManualTotal && (
									<div className="relative">
										<Input
											type="number"
											value={manualTotal}
											onChange={(e) => setManualTotal(e.target.value)}
											placeholder="0"
											className="pr-8 h-9 text-sm"
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
											₽
										</span>
									</div>
								)}
							</div>
							<div className="flex items-center justify-between py-2 border-t border-foreground/8">
								<p className="text-sm font-bold">Итого к оплате</p>
								<p
									className={cn(
										"text-base font-black",
										finalTotal > 0 ? "text-foreground" : "text-muted-foreground"
									)}
								>
									{fmtRub(finalTotal)}
								</p>
							</div>
						</div>
					</div>

					{/* ── 6. Начальный статус ── */}
					<div>
						<SectionTitle icon={CalendarIcon}>Начальный статус</SectionTitle>
						<Select
							value={initialStatus}
							onValueChange={(v) => setInitialStatus(v as BookingStatus)}
						>
							<SelectTrigger className="h-9 text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ALL_STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										{BOOKING_STATUS_CONFIG[s]?.label ?? s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* ── 7. Комментарий ── */}
					<div>
						<SectionTitle icon={PackageIcon}>
							Внутренний комментарий
						</SectionTitle>
						<Textarea
							placeholder="Необязательно — будет записан в историю изменений"
							value={internalNote}
							onChange={(e) => setInternalNote(e.target.value)}
							className="text-sm resize-none h-20"
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="shrink-0 px-5 py-4 border-t border-foreground/5 flex items-center gap-3">
					{isAvailable === false && (
						<div className="flex-1 text-[10px] text-amber-400 font-medium flex items-center gap-1">
							<WarningCircleIcon size={12} /> Пересечение с другим заказом
						</div>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							resetForm();
							onOpenChange(false);
						}}
						disabled={isSaving}
					>
						Отмена
					</Button>
					<Button
						size="sm"
						className="flex-1 font-bold"
						onClick={handleSave}
						disabled={
							isSaving ||
							!selectedClient ||
							!selectedTariffId ||
							durationHours < 1
						}
					>
						{isSaving ? "Сохранение..." : `Создать · ${fmtRub(finalTotal)}`}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
