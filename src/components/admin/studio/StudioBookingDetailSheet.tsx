"use client";

import {
	CalendarIcon,
	CheckIcon,
	ClockIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	TrashIcon,
	UserCheckIcon,
	UserIcon,
	VideoIcon,
	XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import { searchUsersAction } from "@/actions/admin-booking-actions";
import type { StudioBookingDetail } from "@/actions/admin-studio-actions";
import {
	deleteStudioPaymentAction,
	getStudioBookingDetailAction,
	getStudioPaymentsAction,
	recordStudioPaymentAction,
	refundStudioToBalanceAction,
	type StudioEquipmentSearchResult,
	searchStudioEquipmentAdminAction,
	updateStudioBookingFullAction,
	updateStudioBookingStatusAction,
} from "@/actions/admin-studio-actions";
import { getUserBalanceAction } from "@/actions/audit-and-balance-actions";
import { PaymentsPanel } from "@/components/admin/bookings/PaymentsPanel";
import {
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
} from "@/components/ui";
import { BOOKING_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/constants";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn, combineDateAndTime, fmtRub } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(d: Date | string) {
	return new Date(d).toLocaleString("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function periodFromBooking(
	startIso: Date | string,
	endIso: Date | string
): RentalPeriodValue {
	const start = new Date(startIso);
	const end = new Date(endIso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return {
		startDate: start,
		endDate: end,
		startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
		endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
	};
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionTitle({
	icon: Icon,
	children,
	action,
}: {
	icon: React.ElementType;
	children: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between mb-3">
			<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
				<Icon size={11} />
				{children}
			</p>
			{action}
		</div>
	);
}

function EditBtn({
	onClick,
	label = "Изменить",
}: {
	onClick: () => void;
	label?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
		>
			<PencilIcon size={10} /> {label}
		</button>
	);
}

function CancelBtn({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
		>
			<XIcon size={10} /> Отмена
		</button>
	);
}

// ─── Block: Period ────────────────────────────────────────────────────────────

function PeriodBlock({
	booking,
	onRefresh,
}: {
	booking: StudioBookingDetail;
	onRefresh: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [isPending, startTransition] = useTransition();

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on booking.id
	const initialPeriod = useMemo(
		() => periodFromBooking(booking.startDate, booking.endDate),
		[booking.id]
	);
	const [period, setPeriod] = useState<RentalPeriodValue>(initialPeriod);

	const resolvedStart = useMemo(
		() =>
			combineDateAndTime(period.startDate, period.startTime) ??
			period.startDate,
		[period]
	);
	const resolvedEnd = useMemo(
		() => combineDateAndTime(period.endDate, period.endTime) ?? period.endDate,
		[period]
	);

	const durationHours = Math.max(
		1,
		(resolvedEnd.getTime() - resolvedStart.getTime()) / 3_600_000
	);
	const newTotal =
		booking.tariffPriceAtBooking * durationHours +
		booking.items.reduce((s, i) => s + i.priceAtBooking, 0);
	const delta = newTotal - booking.totalAmount;

	const canEdit = !["ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"].includes(
		booking.status
	);

	const handleSave = () =>
		startTransition(async () => {
			const r = await updateStudioBookingFullAction({
				bookingId: booking.id,
				startDate: resolvedStart,
				endDate: resolvedEnd,
			});
			if (r.success) {
				toast.success("Период аренды обновлён");
				setEditing(false);
				onRefresh();
			} else {
				toast.error(r.error ?? "Ошибка обновления дат");
			}
		});

	if (!editing)
		return (
			<div className="px-5 py-4">
				<SectionTitle
					icon={CalendarIcon}
					action={
						canEdit ? <EditBtn onClick={() => setEditing(true)} /> : undefined
					}
				>
					Период аренды
				</SectionTitle>
				<div className="grid grid-cols-2 gap-3">
					{[
						{ label: "Начало", val: booking.startDate },
						{ label: "Завершение", val: booking.endDate },
					].map(({ label, val }) => (
						<div
							key={label}
							className="p-3 rounded-xl bg-foreground/4 border border-foreground/8"
						>
							<p className="text-[10px] text-muted-foreground mb-1">{label}</p>
							<p className="text-sm font-bold">
								{new Date(val).toLocaleDateString("ru-RU", {
									day: "numeric",
									month: "long",
								})}
							</p>
							<p className="text-xs text-muted-foreground">
								{new Date(val).toLocaleTimeString("ru-RU", {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
					))}
				</div>
				<p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
					<ClockIcon size={11} />
					{booking.durationHours % 1 === 0
						? `${booking.durationHours} ч`
						: `${booking.durationHours.toFixed(1)} ч`}
				</p>
			</div>
		);

	return (
		<div className="px-5 py-4 space-y-4">
			<SectionTitle
				icon={CalendarIcon}
				action={
					<CancelBtn
						onClick={() => {
							setPeriod(initialPeriod);
							setEditing(false);
						}}
					/>
				}
			>
				Период аренды
			</SectionTitle>
			<RentalPeriod value={period} onChange={setPeriod} disablePast={false} />

			{/* Пересчёт */}
			<div className="p-3 rounded-xl bg-foreground/4 border border-foreground/8 space-y-2">
				<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
					Пересчёт стоимости
				</p>
				{[
					{ label: "Было", val: booking.totalAmount, muted: true },
					{ label: "Станет", val: newTotal, muted: false },
				].map(({ label, val, muted }) => (
					<div key={label} className="flex justify-between text-sm">
						<span className="text-muted-foreground">{label}</span>
						<span className={cn("font-bold", muted && "text-muted-foreground")}>
							{fmtRub(val)}
						</span>
					</div>
				))}
				{delta !== 0 && (
					<div className="flex justify-between text-xs border-t border-foreground/8 pt-2">
						<span className="text-muted-foreground">Разница</span>
						<span
							className={cn(
								"font-bold",
								delta > 0 ? "text-green-500" : "text-red-500"
							)}
						>
							{delta > 0 ? "+" : ""}
							{fmtRub(delta)}
						</span>
					</div>
				)}
			</div>

			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					className="flex-1 text-xs"
					onClick={() => {
						setPeriod(initialPeriod);
						setEditing(false);
					}}
					disabled={isPending}
				>
					Отмена
				</Button>
				<Button
					size="sm"
					className="flex-1 text-xs gap-1"
					onClick={handleSave}
					disabled={isPending || resolvedEnd <= resolvedStart}
				>
					<CheckIcon size={12} />
					{isPending ? "Сохранение..." : "Сохранить"}
				</Button>
			</div>
		</div>
	);
}

// ─── Block: Client ────────────────────────────────────────────────────────────

type UserSearchResult = {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
};

function ClientBlock({
	booking,
	onRefresh,
}: {
	booking: StudioBookingDetail;
	onRefresh: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<UserSearchResult[]>([]);
	const [selected, setSelected] = useState<UserSearchResult | null>(null);
	const [isPending, startTransition] = useTransition();
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined
	);

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			return;
		}
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			const r = await searchUsersAction(query);
			setResults(r);
		}, 350);
		return () => clearTimeout(debounceRef.current);
	}, [query]);

	const reset = () => {
		setEditing(false);
		setQuery("");
		setSelected(null);
		setResults([]);
	};

	const handleSave = () =>
		startTransition(async () => {
			if (!selected) return;
			const r = await updateStudioBookingFullAction({
				bookingId: booking.id,
				userId: selected.id,
			});
			if (r.success) {
				toast.success("Клиент заказа изменён");
				reset();
				onRefresh();
			} else {
				toast.error(r.error ?? "Ошибка");
			}
		});

	if (!editing)
		return (
			<div className="px-5 py-4">
				<SectionTitle
					icon={UserIcon}
					action={<EditBtn onClick={() => setEditing(true)} />}
				>
					Клиент
				</SectionTitle>
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center shrink-0">
							<UserIcon size={16} className="text-muted-foreground" />
						</div>
						<div>
							<p className="font-semibold text-sm">
								{booking.userName || "Без имени"}
							</p>
							<p className="text-xs text-muted-foreground">
								{booking.userEmail || "—"}
							</p>
							{booking.userPhone && (
								<p className="text-xs text-muted-foreground">
									{booking.userPhone}
								</p>
							)}
						</div>
					</div>
					{booking.userBalance > 0 && (
						<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400 shrink-0">
							Баланс: {fmtRub(booking.userBalance)}
						</span>
					)}
				</div>
			</div>
		);

	return (
		<div className="px-5 py-4 space-y-3">
			<SectionTitle icon={UserIcon} action={<CancelBtn onClick={reset} />}>
				Сменить клиента
			</SectionTitle>
			<div className="relative">
				<MagnifyingGlassIcon
					size={12}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					autoFocus
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setSelected(null);
					}}
					placeholder="Имя, email или телефон..."
					className="pl-8 h-8 text-xs glass-input"
				/>
			</div>
			{results.length > 0 && !selected && (
				<div className="rounded-xl border border-foreground/10 overflow-hidden divide-y divide-foreground/6">
					{results.map((u) => (
						<button
							key={u.id}
							type="button"
							onClick={() => {
								setSelected(u);
								setQuery(u.name ?? u.email ?? "");
								setResults([]);
							}}
							className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-foreground/5 transition-colors text-left"
						>
							<div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
								<UserIcon size={12} className="text-muted-foreground" />
							</div>
							<div className="min-w-0">
								<p className="text-xs font-medium truncate">
									{u.name || "Без имени"}
								</p>
								<p className="text-[10px] text-muted-foreground truncate">
									{u.email}
								</p>
							</div>
						</button>
					))}
				</div>
			)}
			{selected && (
				<div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-500/8 border border-green-500/20">
					<UserCheckIcon size={14} className="text-green-500 shrink-0" />
					<div className="min-w-0 flex-1">
						<p className="text-xs font-semibold">
							{selected.name || "Без имени"}
						</p>
						<p className="text-[10px] text-muted-foreground">
							{selected.email}
						</p>
					</div>
					<button
						type="button"
						onClick={() => {
							setSelected(null);
							setQuery("");
						}}
						className="text-muted-foreground hover:text-foreground"
					>
						<XIcon size={12} />
					</button>
				</div>
			)}
			<div className="flex gap-2 pt-1">
				<Button
					variant="outline"
					size="sm"
					className="flex-1 text-xs"
					onClick={reset}
					disabled={isPending}
				>
					Отмена
				</Button>
				<Button
					size="sm"
					className="flex-1 text-xs gap-1"
					onClick={handleSave}
					disabled={isPending || !selected}
				>
					<CheckIcon size={12} />
					{isPending ? "Сохранение..." : "Применить"}
				</Button>
			</div>
		</div>
	);
}

// ─── Block: Tariff + Equipment ────────────────────────────────────────────────

function TariffEquipmentBlock({
	booking,
	onRefresh,
}: {
	booking: StudioBookingDetail;
	onRefresh: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [isPending, startTransition] = useTransition();

	// Тариф — текущий ID как начальный
	const [selectedTariffId, setSelectedTariffId] = useState(booking.tariffId);
	const [tariffPrice, setTariffPrice] = useState(booking.tariffPriceAtBooking);

	// Техника
	const buildDraft = useCallback(
		() =>
			booking.items.map((i) => ({
				equipmentId: i.equipmentId,
				title: i.equipmentTitle,
				priceAtBooking: i.priceAtBooking,
				imageUrl: i.equipmentImageUrl,
			})),
		[booking.items]
	);
	const [draft, setDraft] = useState(() => buildDraft());

	// Поиск техники
	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<
		StudioEquipmentSearchResult[]
	>([]);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined
	);

	// Сброс при открытии редактора
	const openEditing = () => {
		setSelectedTariffId(booking.tariffId);
		setTariffPrice(booking.tariffPriceAtBooking);
		setDraft(buildDraft());
		setQuery("");
		setSearchResults([]);
		setEditing(true);
	};

	useEffect(() => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			const r = await searchStudioEquipmentAdminAction(
				query,
				booking.id,
				new Date(booking.startDate),
				new Date(booking.endDate)
			);
			setSearchResults(r);
		}, 350);
		return () => clearTimeout(debounceRef.current);
	}, [query, booking.id, booking.startDate, booking.endDate]);

	const equipTotal = draft.reduce((s, d) => s + d.priceAtBooking, 0);
	const newTotal = tariffPrice * booking.durationHours + equipTotal;
	const delta = newTotal - booking.totalAmount;

	const addEquip = (eq: StudioEquipmentSearchResult) => {
		if (draft.find((d) => d.equipmentId === eq.id)) return;
		setDraft((prev) => [
			...prev,
			{
				equipmentId: eq.id,
				title: eq.title,
				priceAtBooking: eq.priceStudio,
				imageUrl: eq.imageUrl,
			},
		]);
		setQuery("");
		setSearchResults([]);
	};

	const removeEquip = (id: string) =>
		setDraft((p) => p.filter((d) => d.equipmentId !== id));

	const updatePrice = (id: string, price: number) =>
		setDraft((p) =>
			p.map((d) => (d.equipmentId === id ? { ...d, priceAtBooking: price } : d))
		);

	const canEdit = !["ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"].includes(
		booking.status
	);

	const handleSave = () =>
		startTransition(async () => {
			const r = await updateStudioBookingFullAction({
				bookingId: booking.id,
				tariffId: selectedTariffId,
				totalAmount: newTotal,
				// Передаём список equipmentId — action сам загрузит priceStudio
				// Но нам нужны кастомные цены → передадим через equipmentIds
				// и переопределим totalAmount вручную
				equipmentIds: draft.map((d) => d.equipmentId),
			});
			if (r.success) {
				toast.success("Тариф и техника обновлены");
				setEditing(false);
				onRefresh();
			} else {
				toast.error(r.error ?? "Ошибка");
			}
		});

	if (!editing)
		return (
			<div className="px-5 py-4">
				<SectionTitle
					icon={VideoIcon}
					action={
						canEdit ? (
							<EditBtn onClick={openEditing} label="Редактировать" />
						) : undefined
					}
				>
					Аренда студии
				</SectionTitle>

				{/* Тариф */}
				<div className="rounded-xl border border-foreground/8 bg-foreground/3 p-3 mb-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-bold">{booking.tariffName}</span>
						<span className="text-sm font-black text-primary">
							{fmtRub(booking.tariffPriceAtBooking)}
							<span className="text-xs text-muted-foreground font-normal">
								/ч
							</span>
						</span>
					</div>
				</div>

				{/* Техника */}
				{booking.items.length > 0 && (
					<div className="space-y-1.5">
						{booking.items.map((item) => (
							<div
								key={item.id}
								className="flex items-center gap-2 px-3 py-2 rounded-xl border border-foreground/8 bg-foreground/3"
							>
								{item.equipmentImageUrl && (
									<div className="w-7 h-7 rounded-md overflow-hidden shrink-0 bg-foreground/10">
										<Image
											src={item.equipmentImageUrl}
											alt={item.equipmentTitle}
											width={28}
											height={28}
											className="w-full h-full object-cover"
										/>
									</div>
								)}
								<span className="flex-1 text-sm truncate">
									{item.equipmentTitle}
								</span>
								<span className="text-sm font-bold text-primary shrink-0">
									+{fmtRub(item.priceAtBooking)}
								</span>
							</div>
						))}
					</div>
				)}

				{/* Итог */}
				<div className="mt-3 flex justify-between text-sm">
					<span className="text-muted-foreground">Итого</span>
					<span className="font-black">{fmtRub(booking.totalAmount)}</span>
				</div>
			</div>
		);

	return (
		<div className="px-5 py-4 space-y-4">
			<SectionTitle
				icon={VideoIcon}
				action={
					<CancelBtn
						onClick={() => {
							setEditing(false);
							setDraft(buildDraft());
						}}
					/>
				}
			>
				Тариф и техника
			</SectionTitle>

			{/* Тариф — цена ₽/ч вручную, т.к. нет доступа к списку тарифов здесь */}
			<div className="space-y-1.5">
				<Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
					Цена тарифа ₽/ч
				</Label>
				<Input
					type="number"
					value={tariffPrice}
					onChange={(e) => setTariffPrice(Number(e.target.value))}
					className="h-8 text-xs glass-input"
				/>
				<p className="text-[10px] text-muted-foreground">
					Тариф: {booking.tariffName} · {booking.durationHours} ч ={" "}
					{fmtRub(tariffPrice * booking.durationHours)}
				</p>
			</div>

			{/* Список техники */}
			<div className="space-y-2">
				<Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
					Доп. техника ({draft.length})
				</Label>
				{draft.map((d) => (
					<div
						key={d.equipmentId}
						className="rounded-xl border border-foreground/10 p-2.5 space-y-2 bg-foreground/3"
					>
						<div className="flex items-center gap-2">
							{d.imageUrl && (
								<div className="w-7 h-7 rounded-md overflow-hidden shrink-0 bg-foreground/10">
									<Image
										src={d.imageUrl}
										alt={d.title}
										width={28}
										height={28}
										className="w-full h-full object-cover"
									/>
								</div>
							)}
							<p className="text-xs font-medium flex-1 truncate">{d.title}</p>
							<button
								type="button"
								onClick={() => removeEquip(d.equipmentId)}
								className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
							>
								<TrashIcon size={12} />
							</button>
						</div>
						<div className="space-y-1">
							<Label className="text-[10px] text-muted-foreground">
								Цена, ₽
							</Label>
							<Input
								type="number"
								value={d.priceAtBooking}
								onChange={(e) =>
									updatePrice(d.equipmentId, Number(e.target.value))
								}
								className="h-7 text-xs glass-input"
							/>
						</div>
					</div>
				))}
			</div>

			{/* Поиск техники */}
			<div className="relative">
				<MagnifyingGlassIcon
					size={12}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Добавить технику..."
					className="pl-8 h-8 text-xs glass-input"
				/>
			</div>
			{searchResults.length > 0 && (
				<div className="rounded-xl border border-foreground/10 overflow-hidden divide-y divide-foreground/6 max-h-40 overflow-y-auto">
					{searchResults.map((eq) => (
						<button
							key={eq.id}
							type="button"
							onClick={() => addEquip(eq)}
							className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-foreground/5 transition-colors text-left"
						>
							{eq.imageUrl ? (
								<div className="w-7 h-7 rounded-md overflow-hidden shrink-0 bg-foreground/10">
									<Image
										src={eq.imageUrl}
										alt={eq.title}
										width={28}
										height={28}
										className="w-full h-full object-cover"
									/>
								</div>
							) : (
								<div className="w-7 h-7 rounded-md bg-foreground/10 shrink-0" />
							)}
							<div className="min-w-0 flex-1">
								<p className="text-xs font-medium truncate">{eq.title}</p>
								<p className="text-[10px] text-muted-foreground">
									{eq.categoryName}
								</p>
							</div>
							<span className="text-xs font-bold text-primary shrink-0">
								{fmtRub(eq.priceStudio)}
							</span>
						</button>
					))}
				</div>
			)}

			{/* Пересчёт */}
			<div className="p-3 rounded-xl bg-foreground/4 border border-foreground/8 space-y-2">
				<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
					Пересчёт стоимости
				</p>
				{[
					{ label: "Было", val: booking.totalAmount, muted: true },
					{ label: "Станет", val: newTotal, muted: false },
				].map(({ label, val, muted }) => (
					<div key={label} className="flex justify-between text-sm">
						<span className="text-muted-foreground">{label}</span>
						<span className={cn("font-bold", muted && "text-muted-foreground")}>
							{fmtRub(val)}
						</span>
					</div>
				))}
				{delta !== 0 && (
					<div className="flex justify-between text-xs border-t border-foreground/8 pt-2">
						<span className="text-muted-foreground">Разница</span>
						<span
							className={cn(
								"font-bold",
								delta > 0 ? "text-green-500" : "text-red-500"
							)}
						>
							{delta > 0 ? "+" : ""}
							{fmtRub(delta)}
						</span>
					</div>
				)}
			</div>

			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					className="flex-1 text-xs"
					onClick={() => {
						setEditing(false);
						setDraft(buildDraft());
					}}
					disabled={isPending}
				>
					Отмена
				</Button>
				<Button
					size="sm"
					className="flex-1 text-xs gap-1"
					onClick={handleSave}
					disabled={isPending}
				>
					<CheckIcon size={12} />
					{isPending ? "Сохранение..." : "Сохранить"}
				</Button>
			</div>
		</div>
	);
}

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

	return (
		<div className="divide-y divide-foreground/5">
			{/* Status selector */}
			<div className="px-5 py-4">
				<div className="flex items-center gap-3 p-3 rounded-2xl border border-foreground/8 bg-foreground/3">
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
			</div>

			{/* Клиент */}
			<ClientBlock booking={booking} onRefresh={onRefresh} />

			{/* Период */}
			<PeriodBlock booking={booking} onRefresh={onRefresh} />

			{/* Тариф + техника */}
			<TariffEquipmentBlock booking={booking} onRefresh={onRefresh} />

			{/* Financial summary */}
			<div className="px-5 py-4">
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
		</div>
	);
}

// ─── HistoryTab ───────────────────────────────────────────────────────────────

function HistoryTab({ booking }: { booking: StudioBookingDetail }) {
	const ACTION_LABELS: Record<string, string> = {
		CREATED: "Заказ создан",
		STATUS_CHANGED: "Статус изменён",
		BOOKING_UPDATED: "Заказ изменён",
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
						{log.valueAfter && (
							<p className="text-[11px] text-muted-foreground mt-0.5 wrap-break-word">
								{log.valueBefore && (
									<>
										<span className="line-through opacity-50">
											{log.valueBefore}
										</span>
										{" → "}
									</>
								)}
								{log.valueAfter}
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

type TabId = "info" | "payments" | "history";

const TABS: { id: TabId; label: string }[] = [
	{ id: "info", label: "Детали" },
	{ id: "payments", label: "Платежи" },
	{ id: "history", label: "История" },
];

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

				{/* Body */}
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
							<div className="flex-1 overflow-y-auto custom-scrollbar">
								<InfoTab booking={booking} onRefresh={handleRefresh} />
							</div>
						)}

						{activeTab === "payments" && (
							<div className="flex-1  overflow-y-auto px-5 py-5 custom-scrollbar">
								<PaymentsPanel
									key={booking?.id}
									bookingId={booking.id}
									totalAmount={booking.totalAmount}
									userId={booking?.userId ?? ""}
									showOpType={false}
									bookingStatus={booking.status}
									isStudioBooking={true}
									actions={{
										getPayments: getStudioPaymentsAction,
										recordPayment: recordStudioPaymentAction,
										deletePayment: deleteStudioPaymentAction,
										getUserBalance: getUserBalanceAction,
										refundToBalance: async (_userId, amount, bookingId) =>
											refundStudioToBalanceAction(bookingId, amount),
										applyBalance: async (_userId, bookingId, amount) =>
											recordStudioPaymentAction({
												bookingId,
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
