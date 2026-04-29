"use client";
import {
	CalendarIcon,
	CurrencyRubIcon,
	MagnifyingGlassIcon,
	MinusIcon,
	PackageIcon,
	PlusIcon,
	TrashIcon,
	UserIcon,
	WarningCircleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import {
	type AdminCreateBookingPayload,
	adminCreateBookingAction,
	searchEquipmentAction,
	searchUsersAction,
} from "@/actions/admin-booking-actions";
import { checkAvailabilityAction } from "@/actions/client-booking-actions";
import {
	getDefaultRentalPeriod,
	RentalPeriod,
	type RentalPeriodValue,
} from "@/components/shared/RentalPeriod";
import {
	Badge,
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
import type {
	AdminBookingRow,
	BookingStatus,
} from "@/core/domain/entities/Booking";
import { calculateItemPrice, cn, combineDateAndTime } from "@/lib/utils";
import { useSiteSettingsStore } from "@/store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientSearchResult {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
}

interface EquipmentSearchResult {
	id: string;
	title: string;
	pricePerDay: number;
	price4h: number;
	price8h: number;
	priceStudio: number;
	deposit: number;
	replacementValue: number;
}

interface DraftItem {
	equipmentId: string;
	title: string;
	quantity: number;
	pricePerUnit: number;
	depositPerUnit: number;
	replacementValuePerUnit: number;
	price4h: number;
	price8h: number;
	pricePerDay: number;
	priceStudio: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_STATUSES = Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[];

function fmtRub(n: number) {
	return `${n.toLocaleString("ru-RU")} ₽`;
}

function calcDraftTotal(
	items: DraftItem[],
	period: RentalPeriodValue | null
): number {
	if (!period?.startDate || !period?.endDate) return 0;
	const start = combineDateAndTime(
		period.startDate,
		period.startTime ?? "00:00"
	);
	const end = combineDateAndTime(period.endDate, period.endTime ?? "00:00");
	if (!end || !start) return 0;
	const hours = Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
	return items.reduce((sum, item) => {
		const price = calculateItemPrice(
			{
				priceStudio: item.priceStudio,
				price4h: item.price4h,
				price8h: item.price8h,
				pricePerDay: item.pricePerDay,
				id: "",
				title: "",
				description: null,
				categoryId: "",
				subcategoryId: null,
				inventoryNumber: null,
				deposit: 0,
				replacementValue: 0,
				isAvailable: false,
				isPrimary: false,
				status: "AVAILABLE",
				ownershipType: "INTERNAL",
				partnerName: null,
				defects: null,
				kit: null,
				kitDescription: null,
				specifications: {},
				comments: [],
				videoUrls: [],
				slug: "",
				createdAt: new Date(),
				updatedAt: new Date(),
				isFeatured: false,
			},
			hours
		);
		return sum + price * item.quantity;
	}, 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

interface CreateBookingSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated?: (booking: AdminBookingRow) => void;
}

export function CreateBookingSheet({
	open,
	onOpenChange,
	onCreated,
}: CreateBookingSheetProps) {
	const { workStart, workEnd } = useSiteSettingsStore();
	// ── Client search ──────────────────────────────────────────────────────────
	const [clientQuery, setClientQuery] = useState("");
	const [debouncedClientQuery] = useDebounceValue(clientQuery, 250);
	const [clientResults, setClientResults] = useState<ClientSearchResult[]>([]);
	const [clientSearchOpen, setClientSearchOpen] = useState(false);
	const [selectedClient, setSelectedClient] =
		useState<ClientSearchResult | null>(null);
	const [isSearchingClient, startClientSearch] = useTransition();

	// ── Equipment search ───────────────────────────────────────────────────────
	const [eqQuery, setEqQuery] = useState("");
	const [debouncedEqQuery] = useDebounceValue(eqQuery, 250);
	const [eqResults, setEqResults] = useState<EquipmentSearchResult[]>([]);
	const [eqSearchOpen, setEqSearchOpen] = useState(false);
	const [isSearchingEq, startEqSearch] = useTransition();
	const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
	const [adminBusyIds, setAdminBusyIds] = useState<string[]>([]);

	// ── Period ─────────────────────────────────────────────────────────────────
	const [period, setPeriod] = useState<RentalPeriodValue | null>(null);

	// ── Pricing ───────────────────────────────────────────────────────────────
	const [autoTotal, setAutoTotal] = useState(0);
	const [manualTotal, setManualTotal] = useState<string>("");
	const [useManualTotal, setUseManualTotal] = useState(false);

	// ── Status & note ─────────────────────────────────────────────────────────
	const [initialStatus, setInitialStatus] =
		useState<BookingStatus>("PENDING_REVIEW");
	const [internalNote, setInternalNote] = useState("");

	// ── Saving ────────────────────────────────────────────────────────────────
	const [isSaving, startSaving] = useTransition();

	// ── Reset form on open ───────────────────────────────────────────────────
	useEffect(() => {
		if (open && !period) {
			setPeriod(getDefaultRentalPeriod(workStart, workEnd));
		}
	}, [open, period, workStart, workEnd]);

	// ── Recalculate total ──────────────────────────────────────────────────────
	useEffect(() => {
		const t = calcDraftTotal(draftItems, period);
		setAutoTotal(t);
		if (!useManualTotal) setManualTotal(String(Math.round(t)));
	}, [draftItems, period, useManualTotal]);

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

	// ── Equipment search ───────────────────────────────────────────────────────
	useEffect(() => {
		if (!debouncedEqQuery || debouncedEqQuery.length < 2) {
			setEqResults([]);
			return;
		}
		startEqSearch(async () => {
			const data = await searchEquipmentAction(debouncedEqQuery);
			setEqResults(
				data.filter((e) => !draftItems.some((d) => d.equipmentId === e.id))
			);
		});
	}, [debouncedEqQuery, draftItems]);

	// check busy items
	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		if (!period?.startDate || !period?.endDate || draftItems.length === 0) {
			setAdminBusyIds([]);
			return;
		}
		let cancelled = false;
		const startFull = combineDateAndTime(
			period.startDate,
			period.startTime ?? "10:00"
		);
		const endFull = combineDateAndTime(
			period.endDate,
			period.endTime ?? "20:00"
		);
		if (!startFull || !endFull) return;

		checkAvailabilityAction(
			draftItems.map((d) => d.equipmentId),
			startFull,
			endFull
		).then((r) => {
			if (!cancelled) setAdminBusyIds(r.busyIds ?? []);
		});
		return () => {
			cancelled = true;
		};
	}, [
		draftItems.map((d) => d.equipmentId).join(","),
		period?.startDate?.toISOString(),
		period?.endDate?.toISOString(),
	]);

	// ── Handlers ──────────────────────────────────────────────────────────────

	const addItem = useCallback((eq: EquipmentSearchResult) => {
		setDraftItems((prev) => {
			const existing = prev.find((d) => d.equipmentId === eq.id);
			if (existing) {
				return prev.map((d) =>
					d.equipmentId === eq.id ? { ...d, quantity: d.quantity + 1 } : d
				);
			}
			return [
				...prev,
				{
					equipmentId: eq.id,
					title: eq.title,
					quantity: 1,
					pricePerUnit: eq.pricePerDay,
					depositPerUnit: eq.deposit,
					replacementValuePerUnit: eq.replacementValue,
					price4h: eq.price4h,
					price8h: eq.price8h,
					priceStudio: eq.priceStudio,
					pricePerDay: eq.pricePerDay,
				},
			];
		});
		setEqQuery("");
		setEqResults([]);
	}, []);

	const removeItem = useCallback((equipmentId: string) => {
		setDraftItems((prev) => prev.filter((d) => d.equipmentId !== equipmentId));
	}, []);

	const changeQty = useCallback((equipmentId: string, delta: number) => {
		setDraftItems((prev) =>
			prev
				.map((d) =>
					d.equipmentId === equipmentId
						? { ...d, quantity: d.quantity + delta }
						: d
				)
				.filter((d) => d.quantity > 0)
		);
	}, []);

	const resetForm = useCallback(() => {
		setSelectedClient(null);
		setClientQuery("");
		setDraftItems([]);
		setPeriod(null);
		setManualTotal("");
		setUseManualTotal(false);
		setInitialStatus("PENDING_REVIEW");
		setInternalNote("");
	}, []);

	const handleSave = useCallback(() => {
		if (!selectedClient) {
			toast.error("Выберите клиента");
			return;
		}
		if (!period?.startDate || !period?.endDate) {
			toast.error("Укажите период аренды");
			return;
		}
		if (draftItems.length === 0) {
			toast.error("Добавьте хотя бы одну позицию");
			return;
		}
		const finalTotal = useManualTotal
			? Number(manualTotal) || autoTotal
			: autoTotal;
		if (finalTotal <= 0) {
			toast.error("Сумма заказа должна быть больше нуля");
			return;
		}

		const startDt = combineDateAndTime(
			period.startDate,
			period.startTime ?? "00:00"
		);
		const endDt = combineDateAndTime(period.endDate, period.endTime ?? "00:00");

		if (endDt && startDt && endDt <= startDt) {
			toast.error("Дата окончания должна быть позже начала");
			return;
		}

		const payload: AdminCreateBookingPayload = {
			userId: selectedClient.id,
			startDate: startDt?.toISOString() ?? new Date().toISOString(),
			endDate: endDt?.toISOString() ?? new Date().toISOString(),
			items: draftItems,
			totalAmount: finalTotal,
			totalReplacementValue: draftItems.reduce(
				(s, i) => s + i.replacementValuePerUnit * i.quantity,
				0
			),
			initialStatus,
			internalNote: internalNote.trim() || "",
		};

		startSaving(async () => {
			const result = await adminCreateBookingAction(payload);
			if (!result.success) {
				toast.error(result.error ?? "Ошибка создания заказа");
				return;
			}
			toast.success("Заказ создан");
			// Собираем минимальный AdminBookingRow для таблицы
			if (onCreated && result.bookingId) {
				const newRow: AdminBookingRow = {
					id: result.bookingId,
					status: initialStatus,
					totalAmount: finalTotal,
					createdAt: new Date().toISOString(),
					startDate: startDt?.toISOString() ?? new Date().toISOString(),
					endDate: endDt?.toISOString() ?? new Date().toISOString(),
					insuranceIncluded: true,
					totalReplacementValue: payload.totalReplacementValue,
					cancellationReason: null,
					cancelledAt: null,
					clientId: selectedClient.id,
					clientName: selectedClient.name,
					clientEmail: selectedClient.email,
					equipmentTitles: draftItems.map((d) => d.title),
					itemCount: draftItems.reduce((s, d) => s + d.quantity, 0),
					bookingItems: draftItems.flatMap((d) =>
						Array.from({ length: d.quantity }, () => ({
							equipmentId: d.equipmentId,
							title: d.title,
							priceAtBooking: d.pricePerUnit,
							depositAtBooking: d.depositPerUnit,
							replacementValueAtBooking: d.replacementValuePerUnit,
							price4h: d.price4h,
							price8h: d.price8h,
							pricePerDay: d.pricePerDay,
						}))
					),
				};
				onCreated(newRow);
			}
			resetForm();
			onOpenChange(false);
		});
	}, [
		selectedClient,
		period,
		draftItems,
		useManualTotal,
		manualTotal,
		autoTotal,
		initialStatus,
		internalNote,
		onCreated,
		onOpenChange,
		resetForm,
	]);

	// ── Render ─────────────────────────────────────────────────────────────────

	const finalTotal = useManualTotal ? Number(manualTotal) || 0 : autoTotal;

	return (
		<Sheet
			open={open}
			onOpenChange={(o) => {
				if (!o) resetForm();
				onOpenChange(o);
			}}
		>
			<SheetContent
				side="right"
				className="w-full sm:max-w-xl flex flex-col gap-0 p-0 overflow-hidden"
			>
				{/* Header */}
				<SheetHeader className="px-5 py-4 border-b border-foreground/5 shrink-0">
					<div className="flex items-center justify-between">
						<SheetTitle className="text-base font-bold">Новый заказ</SheetTitle>
						<Badge variant="outline" className="text-[10px]">
							Администратор
						</Badge>
					</div>
				</SheetHeader>

				{/* Body */}
				<div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
					{/* ── 1. Клиент ──────────────────────────────────────────────────── */}
					<div>
						<SectionTitle icon={UserIcon}>Клиент</SectionTitle>
						{selectedClient ? (
							<div className="flex items-center justify-between p-3 rounded-xl border border-foreground/8 bg-foreground/3">
								<div>
									<p className="text-sm font-medium">
										{selectedClient.name ?? "Без имени"}
									</p>
									<p className="text-[11px] text-muted-foreground">
										{selectedClient.email ?? "—"} ·{" "}
										{selectedClient.phone ?? "—"}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7"
									onClick={() => setSelectedClient(null)}
								>
									<XIcon size={13} />
								</Button>
							</div>
						) : (
							<div className="relative">
								<MagnifyingGlassIcon
									size={13}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									placeholder="Поиск клиента по имени, email, телефону..."
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
												type="button"
												key={c.id}
												onClick={() => {
													setSelectedClient(c);
													setClientQuery("");
													setClientSearchOpen(false);
												}}
												className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-foreground/5 transition-colors text-left"
											>
												<div className="w-7 h-7 rounded-full bg-foreground/8 flex items-center justify-center shrink-0 mt-0.5">
													<UserIcon
														size={12}
														className="text-muted-foreground"
													/>
												</div>
												<div className="min-w-0">
													<p className="text-sm font-medium truncate">
														{c.name ?? "Без имени"}
													</p>
													<p className="text-[11px] text-muted-foreground truncate">
														{c.email ?? "—"} · {c.phone ?? "—"}
													</p>
												</div>
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* ── 2. Период ─────────────────────────────────────────────────── */}
					<div>
						<SectionTitle icon={CalendarIcon}>Период аренды</SectionTitle>
						{period ? (
							<RentalPeriod value={period} onChange={setPeriod} />
						) : (
							<div className="h-26 rounded-xl bg-foreground/5 animate-pulse" />
						)}
					</div>

					{/* ── 3. Состав ─────────────────────────────────────────────────── */}
					<div>
						<SectionTitle icon={PackageIcon}>Состав заказа</SectionTitle>

						{/* Existing items */}
						{draftItems.length > 0 && (
							<div className="space-y-1.5 mb-3">
								{draftItems.map((item) => {
									const startDateTime =
										period?.startDate &&
										combineDateAndTime(
											period.startDate,
											period.startTime ?? "00:00"
										);
									const endDateTime =
										period?.endDate &&
										combineDateAndTime(
											period.endDate,
											period.endTime ?? "00:00"
										);
									const hours =
										startDateTime && endDateTime
											? Math.max(
													0,
													(endDateTime.getTime() - startDateTime.getTime()) /
														3_600_000
												)
											: 0;
									const unitPrice = calculateItemPrice(
										{
											price4h: item.price4h,
											price8h: item.price8h,
											pricePerDay: item.pricePerDay,
											priceStudio: item.priceStudio,
											id: "",
											title: "",
											description: null,
											categoryId: "",
											subcategoryId: null,
											inventoryNumber: null,
											deposit: 0,
											replacementValue: 0,
											isAvailable: false,
											isPrimary: false,
											status: "AVAILABLE",
											ownershipType: "INTERNAL",
											partnerName: null,
											defects: null,
											kit: null,
											kitDescription: null,
											specifications: {},
											comments: [],
											videoUrls: [],
											slug: "",
											createdAt: new Date(),
											updatedAt: new Date(),
											isFeatured: false,
										},
										hours
									);
									return (
										<div
											key={item.equipmentId}
											className="flex items-center gap-2 p-2.5 rounded-xl border border-foreground/8 bg-foreground/3"
										>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">
													{item.title}
												</p>
												<p className="text-[11px] text-muted-foreground">
													{fmtRub(unitPrice)} × {item.quantity} ={" "}
													{fmtRub(unitPrice * item.quantity)}
												</p>
											</div>
											{adminBusyIds.includes(item.equipmentId) && (
												<p className="text-[10px] text-destructive font-bold uppercase flex items-center gap-1">
													<WarningCircleIcon size={10} /> Занято на эти даты
												</p>
											)}
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => changeQty(item.equipmentId, -1)}
												>
													<MinusIcon size={10} />
												</Button>
												<span className="text-sm font-bold w-5 text-center">
													{item.quantity}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6"
													onClick={() => changeQty(item.equipmentId, 1)}
												>
													<PlusIcon size={10} />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 hover:text-red-500"
													onClick={() => removeItem(item.equipmentId)}
												>
													<TrashIcon size={10} />
												</Button>
											</div>
										</div>
									);
								})}
							</div>
						)}

						{/* Equipment search */}
						<div className="relative">
							<MagnifyingGlassIcon
								size={13}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								placeholder="Добавить технику..."
								className="pl-9 h-9 text-sm"
								value={eqQuery}
								onChange={(e) => {
									setEqQuery(e.target.value);
									setEqSearchOpen(true);
								}}
								onFocus={() => setEqSearchOpen(true)}
								onBlur={() => setTimeout(() => setEqSearchOpen(false), 200)}
							/>
							{isSearchingEq && (
								<div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-primary/40 border-t-primary rounded-full animate-spin" />
							)}
							{eqSearchOpen && eqResults.length > 0 && (
								<div className="absolute left-0 right-0 top-full mt-1 z-50 border border-foreground/10 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto backdrop-blur-xl bg-background/90">
									{eqResults.map((eq) => (
										<button
											type="button"
											key={eq.id}
											onClick={() => {
												addItem(eq);
												setEqSearchOpen(false);
											}}
											className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-foreground/5 transition-colors text-left group"
										>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium truncate">
													{eq.title}
												</p>
												<p className="text-[11px] text-muted-foreground">
													{fmtRub(eq.pricePerDay)}/сут
												</p>
											</div>
											<PlusIcon
												size={13}
												className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
											/>
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					{/* ── 4. Стоимость ──────────────────────────────────────────────── */}
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
										id="manual-price-toggle"
										checked={useManualTotal}
										onChange={(e) => setUseManualTotal(e.target.checked)}
										className="rounded"
									/>
									<Label
										htmlFor="manual-price-toggle"
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

					{/* ── 5. Статус ─────────────────────────────────────────────────── */}
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

					{/* ── 6. Внутренний комментарий ─────────────────────────────────── */}
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
					{adminBusyIds.length > 0 && (
						<div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
							Есть пересечения с другими заказами.
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
						disabled={isSaving || !selectedClient || draftItems.length === 0}
					>
						{isSaving
							? "Сохранение..."
							: `Создать заказ · ${fmtRub(finalTotal)}`}
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
