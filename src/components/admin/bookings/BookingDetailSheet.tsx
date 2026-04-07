"use client";

import {
	ArrowClockwiseIcon,
	BellIcon,
	CalendarIcon,
	ChatIcon,
	CheckIcon,
	ClockIcon,
	CurrencyRubIcon,
	FileTextIcon,
	MagnifyingGlassIcon,
	PackageIcon,
	PencilIcon,
	PlusIcon,
	ProhibitIcon,
	ShieldIcon,
	TagIcon,
	TrashIcon,
	UserCheckIcon,
	UserIcon,
	XIcon,
} from "@phosphor-icons/react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import {
	type AdminUpdateItemsPayload,
	adminChangeBookingClientAction,
	adminSaveCompleteBookingAction,
	adminUpdateBookingDatesAction,
	adminUpdateBookingItemsAction,
	adminUpdateBookingPricingAction,
	type PriceAdjustment,
	type PriceAdjustmentType,
	searchEquipmentAction,
	searchUsersAction,
} from "@/actions/admin-booking-actions";
import {
	type AuditLogEntry,
	addBookingLabelAction,
	applyBalanceToBookingAction,
	getBookingAuditLogAction,
	getBookingLabelsAction,
	getUserBalanceAction,
	removeBookingLabelAction,
} from "@/actions/audit-and-balance-actions";
import { updateBookingStatusAction } from "@/actions/booking-actions";
import { DocumentsPanel } from "@/components/admin/bookings/documents/DocumentsPanel";
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
	Textarea,
} from "@/components/ui";
import { BOOKING_STATUS_CONFIG } from "@/constants";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { calculateItemPrice, cn, combineDateAndTime } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminBookingItemSnippet {
	equipmentId: string;
	title: string;
	priceAtBooking: number;
	depositAtBooking: number;
	replacementValueAtBooking: number;
	price4h: number | null;
	price8h: number | null;
	pricePerDay: number;
}

export interface AdminBookingRow {
	id: string;
	status: BookingStatus;
	totalAmount: number;
	createdAt: string;
	startDate: string;
	endDate: string;
	insuranceIncluded: boolean | null;
	totalReplacementValue: number | null;
	cancellationReason: string | null;
	cancelledAt: string | null;
	clientId: string;
	clientName: string | null;
	clientEmail: string | null;
	equipmentTitles: string[];
	itemCount: number;
	bookingItems: AdminBookingItemSnippet[];
}

export interface BookingLabel {
	id: string;
	text: string;
	color: keyof typeof LABEL_COLORS;
	dueDate?: string;
	shift?: string;
	createdAt: string;
	author: string;
}

export interface BookingComment {
	id: string;
	text: string;
	author: string;
	createdAt: string;
}

type UserSearchResult = {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
};
type EquipmentSearchResult = {
	id: string;
	title: string;
	pricePerDay: number;
	price4h: number;
	price8h: number;
	deposit: number;
	replacementValue: number;
};
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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
	PENDING_REVIEW: ["WAIT_PAYMENT", "READY_TO_RENT", "CANCELLED"],
	WAIT_PAYMENT: ["READY_TO_RENT", "CANCELLED"],
	READY_TO_RENT: ["ACTIVE", "CANCELLED"],
	ACTIVE: ["COMPLETED"],
	COMPLETED: [],
	CANCELLED: [],
	EXPIRED: ["PENDING_REVIEW", "CANCELLED"],
};

const EDITABLE_PERIOD_STATUSES: BookingStatus[] = [
	"PENDING_REVIEW",
	"WAIT_PAYMENT",
	"READY_TO_RENT",
];
const EDITABLE_ITEMS_STATUSES: BookingStatus[] = [
	"PENDING_REVIEW",
	"WAIT_PAYMENT",
	"READY_TO_RENT",
];
const EDITABLE_PRICE_STATUSES: BookingStatus[] = [
	"PENDING_REVIEW",
	"WAIT_PAYMENT",
	"READY_TO_RENT",
	"ACTIVE",
];

const LABEL_COLORS = {
	amber:
		"bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
	blue: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
	red: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400",
	green:
		"bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400",
	purple:
		"bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
	gray: "bg-foreground/8 text-foreground/60 border-foreground/15",
} as const;

const LABEL_COLOR_OPTIONS = [
	{ value: "amber", label: "Жёлтый" },
	{ value: "blue", label: "Синий" },
	{ value: "red", label: "Красный" },
	{ value: "green", label: "Зелёный" },
	{ value: "purple", label: "Фиолетовый" },
	{ value: "gray", label: "Серый" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function recalculateTotal(
	items: AdminBookingItemSnippet[],
	startDate: Date,
	endDate: Date
): number {
	const hours = Math.max(
		0,
		(endDate.getTime() - startDate.getTime()) / 3_600_000
	);
	return items.reduce((sum, item) => {
		const fake = {
			price4h: item.price4h,
			price8h: item.price8h,
			pricePerDay: item.pricePerDay,
		} as Parameters<typeof calculateItemPrice>[0];
		return sum + calculateItemPrice(fake, hours);
	}, 0);
}

function periodFromBooking(
	startIso: string,
	endIso: string
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

function fmtRub(n: number) {
	return `${n.toLocaleString("ru-RU")} ₽`;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
	const cfg = BOOKING_STATUS_CONFIG[status] ?? {
		label: status,
		color: "bg-foreground/8 text-foreground/50",
		dot: "bg-foreground/30",
	};
	return (
		<Badge
			variant="outline"
			className={cn("text-[10px] gap-1.5 border font-semibold", cfg.color)}
		>
			<span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
			{cfg.label}
		</Badge>
	);
}

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

// ─── Block: Period (2.1) ──────────────────────────────────────────────────────

function PeriodBlock({
	booking,
	onSaved,
}: {
	booking: AdminBookingRow;
	onSaved: (start: string, end: string, newTotal: number) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [isPending, startTransition] = useTransition();

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
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

	const liveTotal = useMemo(
		() => recalculateTotal(booking.bookingItems, resolvedStart, resolvedEnd),
		[booking.bookingItems, resolvedStart, resolvedEnd]
	);

	const delta = liveTotal - booking.totalAmount;
	const canEdit = EDITABLE_PERIOD_STATUSES.includes(booking.status);

	const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
		new Date(iso).toLocaleDateString("ru-RU", opts);

	const handleSave = () =>
		startTransition(async () => {
			const r = await adminUpdateBookingDatesAction(
				booking.id,
				resolvedStart.toISOString(),
				resolvedEnd.toISOString(),
				liveTotal
			);
			if (r.success) {
				onSaved(
					resolvedStart.toISOString(),
					resolvedEnd.toISOString(),
					liveTotal
				);
				setEditing(false);
				toast.success("Период аренды обновлён");
			} else {
				toast.error(r.error ?? "Ошибка обновления дат");
			}
		});

	if (!editing)
		return (
			<div className="px-6 py-4">
				<SectionTitle
					icon={CalendarIcon}
					action={
						canEdit ? (
							<EditBtn
								onClick={() => {
									setPeriod(
										periodFromBooking(booking.startDate, booking.endDate)
									);
									setEditing(true);
								}}
							/>
						) : undefined
					}
				>
					Период аренды
				</SectionTitle>
				<div className="grid grid-cols-2 gap-3">
					{[
						{ label: "Начало", iso: booking.startDate },
						{ label: "Завершение", iso: booking.endDate },
					].map(({ label, iso }) => (
						<div
							key={label}
							className="p-3 rounded-xl bg-foreground/4 border border-foreground/8"
						>
							<p className="text-[10px] text-muted-foreground mb-1">{label}</p>
							<p className="text-sm font-bold">
								{fmt(iso, { day: "numeric", month: "long", year: "numeric" })}
							</p>
							<p className="text-xs text-muted-foreground">
								{new Date(iso).toLocaleTimeString("ru-RU", {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
					))}
				</div>
			</div>
		);

	return (
		<div className="px-6 py-4 space-y-4">
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
			<div className="p-3 rounded-xl bg-foreground/4 border border-foreground/8 space-y-2">
				<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
					Пересчёт стоимости
				</p>
				{[
					{ label: "Было", val: booking.totalAmount, muted: true },
					{ label: "Станет", val: liveTotal, muted: false },
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
			{booking.status === "READY_TO_RENT" && (
				<p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
					После сохранения статус вернётся в «Ожидает проверки».
				</p>
			)}
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

// ─── Block: Client (2.2) ──────────────────────────────────────────────────────

function ClientBlock({
	booking,
	onSaved,
	addAudit,
}: {
	booking: AdminBookingRow;
	onSaved: (id: string, name: string | null, email: string | null) => void;
	addAudit: (
		e: Omit<AuditLogEntry, "id" | "createdAt" | "authorName" | "authorId">
	) => void;
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
			const result = await adminChangeBookingClientAction(
				booking.id,
				selected.id
			);
			if (result.success) {
				addAudit({
					action: "Клиент заказа изменён",
					valueBefore: `${booking.clientName} (${booking.clientEmail})`,
					valueAfter: `${selected.name} (${selected.email})`,
					fieldName: null,
				});
				onSaved(selected.id, selected.name, selected.email);
				reset();
				toast.success("Клиент заказа изменён");
			} else {
				toast.error(result.error ?? "Ошибка");
			}
		});

	if (!editing)
		return (
			<div className="px-6 py-4">
				<SectionTitle
					icon={UserIcon}
					action={<EditBtn onClick={() => setEditing(true)} />}
				>
					Клиент
				</SectionTitle>
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center shrink-0">
						<UserIcon size={16} className="text-muted-foreground" />
					</div>
					<div>
						<p className="font-semibold text-sm">
							{booking.clientName || "Без имени"}
						</p>
						<p className="text-xs text-muted-foreground">
							{booking.clientEmail || "—"}
						</p>
					</div>
				</div>
			</div>
		);

	return (
		<div className="px-6 py-4 space-y-3">
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
					className="pl-8 h-8 text-xs"
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

// ─── Block: Items (2.3) ───────────────────────────────────────────────────────

function ItemsBlock({
	booking,
	onSaved,
	addAudit,
}: {
	booking: AdminBookingRow;
	onSaved: (
		items: AdminBookingItemSnippet[],
		newTotal: number,
		newDeposit: number
	) => void;
	addAudit: (
		e: Omit<AuditLogEntry, "id" | "createdAt" | "authorName" | "authorId">
	) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<EquipmentSearchResult[]>([]);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined
	);

	const startDate = new Date(booking.startDate);
	const endDate = new Date(booking.endDate);
	const hours = Math.max(
		0,
		(endDate.getTime() - startDate.getTime()) / 3_600_000
	);

	const buildDraft = useCallback((): DraftItem[] => {
		const m = new Map<string, DraftItem>();
		for (const item of booking.bookingItems) {
			const ex = m.get(item.equipmentId);
			if (ex) {
				ex.quantity++;
			} else {
				m.set(item.equipmentId, {
					equipmentId: item.equipmentId,
					title: item.title,
					quantity: 1,
					pricePerUnit: item.priceAtBooking,
					depositPerUnit: item.depositAtBooking,
					replacementValuePerUnit: item.replacementValueAtBooking,
					price4h: item.price4h ?? 0,
					price8h: item.price8h ?? 0,
					pricePerDay: item.pricePerDay,
				});
			}
		}
		return Array.from(m.values());
	}, [booking.bookingItems]);

	const [draft, setDraft] = useState<DraftItem[]>(() => buildDraft());

	useEffect(() => {
		setDraft(buildDraft());
	}, [buildDraft]);

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			return;
		}
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			const r = await searchEquipmentAction(query);
			setResults(r);
		}, 350);
		return () => clearTimeout(debounceRef.current);
	}, [query]);

	const draftTotal = draft.reduce((s, d) => s + d.pricePerUnit * d.quantity, 0);
	const draftDeposit = draft.reduce(
		(s, d) => s + d.depositPerUnit * d.quantity,
		0
	);
	const canEdit = EDITABLE_ITEMS_STATUSES.includes(booking.status);

	const addItem = (eq: EquipmentSearchResult) => {
		const price = calculateItemPrice(
			eq as Parameters<typeof calculateItemPrice>[0],
			hours
		);
		setDraft((prev) => {
			const ex = prev.find((d) => d.equipmentId === eq.id);
			if (ex)
				return prev.map((d) =>
					d.equipmentId === eq.id ? { ...d, quantity: d.quantity + 1 } : d
				);
			return [
				...prev,
				{
					equipmentId: eq.id,
					title: eq.title,
					quantity: 1,
					pricePerUnit: price,
					depositPerUnit: eq.deposit,
					replacementValuePerUnit: eq.replacementValue,
					price4h: eq.price4h,
					price8h: eq.price8h,
					pricePerDay: eq.pricePerDay,
				},
			];
		});
		setQuery("");
		setResults([]);
	};

	const updateQty = (id: string, qty: number) => {
		if (qty < 1) {
			setDraft((p) => p.filter((d) => d.equipmentId !== id));
			return;
		}
		setDraft((p) =>
			p.map((d) => (d.equipmentId === id ? { ...d, quantity: qty } : d))
		);
	};
	const updatePrice = (id: string, price: number) =>
		setDraft((p) =>
			p.map((d) => (d.equipmentId === id ? { ...d, pricePerUnit: price } : d))
		);

	const handleSave = () =>
		startTransition(async () => {
			const payload: AdminUpdateItemsPayload = {
				items: draft.map((d) => ({
					equipmentId: d.equipmentId,
					title: d.title,
					quantity: d.quantity,
					pricePerUnit: d.pricePerUnit,
					depositPerUnit: d.depositPerUnit,
					replacementValuePerUnit: d.replacementValuePerUnit,
				})),
				totalAmount: draftTotal,
				totalReplacementValue: draftDeposit,
			};
			const r = await adminUpdateBookingItemsAction(booking.id, payload);
			if (r.success) {
				const newItems: AdminBookingItemSnippet[] = draft.flatMap((d) =>
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
				);
				addAudit({
					action: "Состав заказа изменён",
					valueBefore: `${booking.itemCount} позиций, ${fmtRub(booking.totalAmount)}`,
					valueAfter: `${newItems.length} позиций, ${fmtRub(draftTotal)}`,
					fieldName: "bookingItems",
				});
				onSaved(newItems, draftTotal, draftDeposit);
				setEditing(false);
				toast.success("Состав заказа обновлён");
			} else {
				toast.error(r.error ?? "Ошибка");
			}
		});

	// ── view
	if (!editing) {
		// Group items by equipmentId for display
		const grouped = new Map<
			string,
			AdminBookingItemSnippet & { qty: number }
		>();
		for (const item of booking.bookingItems) {
			const ex = grouped.get(item.equipmentId);
			if (ex) {
				ex.qty++;
			} else {
				grouped.set(item.equipmentId, { ...item, qty: 1 });
			}
		}
		return (
			<div className="px-6 py-4">
				<SectionTitle
					icon={PackageIcon}
					action={
						canEdit ? (
							<EditBtn onClick={() => setEditing(true)} label="Редактировать" />
						) : undefined
					}
				>
					Техника · {booking.bookingItems.length} позиций
				</SectionTitle>
				<div className="space-y-1.5">
					{Array.from(grouped.values()).map((item, i) => (
						<div
							key={item.equipmentId}
							className="flex items-center gap-2 p-2.5 rounded-lg bg-foreground/4 border border-foreground/6"
						>
							<span className="text-[10px] text-muted-foreground w-5 text-center font-mono shrink-0">
								{i + 1}
							</span>
							<p className="text-sm flex-1 truncate">{item.title}</p>
							{item.qty > 1 && (
								<span className="text-[10px] text-muted-foreground shrink-0">
									×{item.qty}
								</span>
							)}
							<span className="text-xs font-medium text-muted-foreground shrink-0">
								{fmtRub(item.priceAtBooking * item.qty)}
							</span>
						</div>
					))}
				</div>
			</div>
		);
	}

	// ── edit
	return (
		<div className="px-6 py-4 space-y-3">
			<SectionTitle
				icon={PackageIcon}
				action={
					<CancelBtn
						onClick={() => {
							setEditing(false);
							setDraft(buildDraft());
						}}
					/>
				}
			>
				Состав заказа
			</SectionTitle>

			<div className="space-y-2">
				{draft.map((d) => (
					<div
						key={d.equipmentId}
						className="rounded-xl border border-foreground/10 p-2.5 space-y-2 bg-foreground/3"
					>
						<div className="flex items-center gap-2">
							<p className="text-xs font-medium flex-1 truncate">{d.title}</p>
							<button
								type="button"
								onClick={() =>
									setDraft((p) =>
										p.filter((x) => x.equipmentId !== d.equipmentId)
									)
								}
								className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
							>
								<TrashIcon size={12} />
							</button>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div className="space-y-1">
								<Label className="text-[10px] text-muted-foreground">
									Кол-во
								</Label>
								<div className="flex items-center gap-1">
									{(["−", "+"] as const).map((sign) => (
										<button
											key={sign}
											type="button"
											onClick={() =>
												updateQty(
													d.equipmentId,
													d.quantity + (sign === "+" ? 1 : -1)
												)
											}
											className="w-6 h-6 rounded border border-foreground/15 text-sm flex items-center justify-center hover:bg-foreground/8"
										>
											{sign}
										</button>
									))}
									<span className="w-6 text-center text-xs font-medium">
										{d.quantity}
									</span>
								</div>
							</div>
							<div className="space-y-1">
								<Label className="text-[10px] text-muted-foreground">
									Цена/ед., ₽
								</Label>
								<Input
									type="number"
									value={d.pricePerUnit}
									onChange={(e) =>
										updatePrice(d.equipmentId, Number(e.target.value))
									}
									className="h-7 text-xs"
								/>
							</div>
						</div>
						<div className="flex justify-between text-[10px] text-muted-foreground">
							<span>Итого за позицию</span>
							<span className="font-medium text-foreground">
								{fmtRub(d.pricePerUnit * d.quantity)}
							</span>
						</div>
					</div>
				))}
			</div>

			{/* MagnifyingGlassIcon to add */}
			<div className="relative">
				<MagnifyingGlassIcon
					size={12}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Добавить технику..."
					className="pl-8 h-8 text-xs"
				/>
			</div>
			{results.length > 0 && (
				<div className="rounded-xl border border-foreground/10 divide-y divide-foreground/6 max-h-48 overflow-y-auto">
					{results.map((eq) => {
						const price = calculateItemPrice(
							eq as Parameters<typeof calculateItemPrice>[0],
							hours
						);
						return (
							<button
								key={eq.id}
								type="button"
								onClick={() => addItem(eq)}
								className="w-full flex items-center gap-2 px-3 py-2 hover:bg-foreground/5 transition-colors text-left"
							>
								<PlusIcon
									size={11}
									className="text-muted-foreground shrink-0"
								/>
								<span className="text-xs flex-1 truncate">{eq.title}</span>
								<span className="text-[10px] text-muted-foreground shrink-0">
									{fmtRub(price)}
								</span>
							</button>
						);
					})}
				</div>
			)}

			<div className="flex justify-between items-center py-2 border-t border-foreground/8 text-sm">
				<span className="text-muted-foreground">Итого</span>
				<span className="font-bold">{fmtRub(draftTotal)}</span>
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
					disabled={isPending || draft.length === 0}
				>
					<CheckIcon size={12} />
					{isPending ? "Сохранение..." : "Сохранить состав"}
				</Button>
			</div>
		</div>
	);
}

// ─── Block: Pricing (2.4) ─────────────────────────────────────────────────────

function PricingBlock({
	booking,
	onSaved,
	addAudit,
}: {
	booking: AdminBookingRow;
	onSaved: (newTotal: number) => void;
	addAudit: (
		e: Omit<AuditLogEntry, "id" | "createdAt" | "authorName" | "authorId">
	) => void;
}) {
	const [editing, setEditing] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [adjustments, setAdjustments] = useState<
		(PriceAdjustment & { _id: string })[]
	>([]);
	const [adjType, setAdjType] = useState<PriceAdjustmentType>("percent");
	const [adjValue, setAdjValue] = useState("");
	const [adjDesc, setAdjDesc] = useState("");
	const [adjPromo, setAdjPromo] = useState("");
	const canEdit = EDITABLE_PRICE_STATUSES.includes(booking.status);

	const finalTotal = useMemo(() => {
		let total = booking.totalAmount;
		for (const adj of adjustments) {
			if (adj.type === "percent") total *= 1 - adj.value / 100;
			else if (adj.type === "fixed" || adj.type === "promo") total -= adj.value;
			else if (adj.type === "penalty") total += adj.value;
		}
		return Math.max(0, Math.round(total));
	}, [booking.totalAmount, adjustments]);

	const addAdj = () => {
		const v = Number(adjValue);
		if (!v || Number.isNaN(v)) {
			toast.error("Введите корректное значение");
			return;
		}
		if (adjType === "promo" && !adjPromo.trim()) {
			toast.error("Введите промокод");
			return;
		}
		setAdjustments((prev) => [
			...prev,
			{
				_id: crypto.randomUUID(),
				type: adjType,
				value: v,
				description: adjDesc || "",
				promoCode: adjPromo || "",
			},
		]);
		setAdjValue("");
		setAdjDesc("");
		setAdjPromo("");
	};

	const handleSave = () =>
		startTransition(async () => {
			const r = await adminUpdateBookingPricingAction(
				booking.id,
				adjustments,
				finalTotal
			);
			if (r.success) {
				addAudit({
					action: "Стоимость скорректирована",
					fieldName: "totalAmount",
					valueBefore: fmtRub(booking.totalAmount),
					valueAfter: fmtRub(finalTotal),
				});
				onSaved(finalTotal);
				setEditing(false);
				setAdjustments([]);
				toast.success("Стоимость обновлена");
			} else {
				toast.error(r.error ?? "Ошибка");
			}
		});

	const adjLabel = (a: PriceAdjustment) => {
		if (a.type === "percent") return `Скидка −${a.value}%`;
		if (a.type === "fixed") return `Скидка −${fmtRub(a.value)}`;
		if (a.type === "promo")
			return `Промокод${a.promoCode ? ` ${a.promoCode}` : ""} −${fmtRub(a.value)}`;
		return `Штраф +${fmtRub(a.value)}`;
	};

	const adjColor = (type: PriceAdjustmentType) =>
		type === "penalty"
			? "bg-red-500/10 text-red-500 border-red-500/20"
			: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400";

	// ── view
	if (!editing)
		return (
			<div className="px-6 py-4">
				<SectionTitle
					icon={CurrencyRubIcon}
					action={
						canEdit ? (
							<EditBtn
								onClick={() => setEditing(true)}
								label="Корректировать"
							/>
						) : undefined
					}
				>
					Финансы
				</SectionTitle>
				<div className="space-y-2">
					<div className="flex justify-between items-center py-2 border-b border-foreground/5">
						<span className="text-sm text-muted-foreground">Сумма аренды</span>
						<span className="font-bold text-base">
							{fmtRub(booking.totalAmount)}
						</span>
					</div>
					{booking.totalReplacementValue ? (
						<div className="flex justify-between items-center py-1.5">
							<span className="text-xs text-muted-foreground">Залог</span>
							<span className="font-semibold text-sm">
								{fmtRub(booking.totalReplacementValue)}
							</span>
						</div>
					) : null}
					<div className="flex justify-between items-center py-1.5">
						<span className="text-xs text-muted-foreground">Страховка</span>
						<span
							className={cn(
								"text-xs font-bold",
								booking.insuranceIncluded
									? "text-green-500"
									: "text-muted-foreground"
							)}
						>
							{booking.insuranceIncluded ? "Включена" : "Нет"}
						</span>
					</div>
					<BalanceSection booking={booking} onApplied={onSaved} />
				</div>
			</div>
		);

	// ── edit
	return (
		<div className="px-6 py-4 space-y-4">
			<SectionTitle
				icon={CurrencyRubIcon}
				action={
					<CancelBtn
						onClick={() => {
							setEditing(false);
							setAdjustments([]);
						}}
					/>
				}
			>
				Корректировка стоимости
			</SectionTitle>

			<div className="flex justify-between text-sm">
				<span className="text-muted-foreground">Базовая сумма</span>
				<span className="font-semibold">{fmtRub(booking.totalAmount)}</span>
			</div>

			{adjustments.length > 0 && (
				<div className="space-y-1.5">
					{adjustments.map((a) => (
						<div
							key={a._id}
							className={cn(
								"flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium",
								adjColor(a.type)
							)}
						>
							<span className="flex-1">
								{adjLabel(a)}
								{a.description && ` — ${a.description}`}
							</span>
							<button
								type="button"
								onClick={() =>
									setAdjustments((prev) => prev.filter((x) => x._id !== a._id))
								}
								className="opacity-60 hover:opacity-100 transition-opacity"
							>
								<XIcon size={11} />
							</button>
						</div>
					))}
				</div>
			)}

			<div className="flex justify-between items-center py-2 border-t border-foreground/8 text-sm font-bold">
				<span>Итого</span>
				<span
					className={cn(
						finalTotal < booking.totalAmount
							? "text-green-500"
							: finalTotal > booking.totalAmount
								? "text-red-500"
								: ""
					)}
				>
					{fmtRub(finalTotal)}
				</span>
			</div>

			{/* Add adjustment form */}
			<div className="p-3 rounded-xl bg-foreground/4 border border-foreground/8 space-y-2.5">
				<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
					Добавить корректировку
				</p>
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-1">
						<Label className="text-[10px] text-muted-foreground">Тип</Label>
						<Select
							value={adjType}
							onValueChange={(v) => setAdjType(v as PriceAdjustmentType)}
						>
							<SelectTrigger className="h-7 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="percent">Скидка %</SelectItem>
								<SelectItem value="fixed">Скидка ₽</SelectItem>
								<SelectItem value="promo">Промокод</SelectItem>
								<SelectItem value="penalty">Штраф ₽</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label className="text-[10px] text-muted-foreground">
							{adjType === "percent" ? "Процент" : "Сумма, ₽"}
						</Label>
						<Input
							type="number"
							value={adjValue}
							onChange={(e) => setAdjValue(e.target.value)}
							placeholder={adjType === "percent" ? "10" : "500"}
							className="h-7 text-xs"
							onKeyDown={(e) => e.key === "Enter" && addAdj()}
						/>
					</div>
				</div>
				{adjType === "promo" && (
					<div className="space-y-1">
						<Label className="text-[10px] text-muted-foreground">
							Промокод
						</Label>
						<Input
							value={adjPromo}
							onChange={(e) => setAdjPromo(e.target.value.toUpperCase())}
							placeholder="PROMO2024"
							className="h-7 text-xs font-mono uppercase"
						/>
					</div>
				)}
				<div className="space-y-1">
					<Label className="text-[10px] text-muted-foreground">
						Описание (опц.)
					</Label>
					<Input
						value={adjDesc}
						onChange={(e) => setAdjDesc(e.target.value)}
						placeholder="Комментарий..."
						className="h-7 text-xs"
					/>
				</div>
				<Button
					size="sm"
					variant="outline"
					className="w-full h-7 text-xs gap-1"
					onClick={addAdj}
					disabled={!adjValue}
				>
					<PlusIcon size={11} /> Добавить
				</Button>
			</div>

			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					className="flex-1 text-xs"
					onClick={() => {
						setEditing(false);
						setAdjustments([]);
					}}
					disabled={isPending}
				>
					Отмена
				</Button>
				<Button
					size="sm"
					className="flex-1 text-xs gap-1"
					onClick={handleSave}
					disabled={isPending || adjustments.length === 0}
				>
					<CheckIcon size={12} />
					{isPending ? "Сохранение..." : "Применить"}
				</Button>
			</div>
		</div>
	);
}

/* Баланс клиента */

function BalanceSection({
	booking,
	onApplied,
}: {
	booking: AdminBookingRow;
	onApplied: (newTotal: number) => void;
}) {
	const [balance, setBalance] = useState<number | null>(null);
	const [applyAmount, setApplyAmount] = useState("");
	const [isPending, startTransition] = useTransition();

	// Загружаем баланс при открытии
	useEffect(() => {
		if (!booking.clientId) return;
		getUserBalanceAction(booking.clientId).then((r) => {
			if (r.success) setBalance(r.balance ?? 0);
		});
	}, [booking.clientId]);

	const handleApply = () => {
		const amount = Number(applyAmount);
		if (!amount || amount <= 0) return;
		startTransition(async () => {
			const r = await applyBalanceToBookingAction(
				booking.clientId,
				booking.id,
				amount
			);
			if (r.success) {
				setBalance(r.newBalance ?? 0);
				onApplied(r.newTotal ?? booking.totalAmount);
				setApplyAmount("");
				toast.success(`Списано ${amount} ₽ с баланса клиента`);
			} else {
				toast.error(r.error ?? "Ошибка");
			}
		});
	};

	if (balance === null || balance <= 0) return null;

	return (
		<div className="mt-3 pt-3 border-t border-foreground/8 space-y-2">
			<div className="flex justify-between items-center">
				<span className="text-xs text-muted-foreground">Баланс клиента</span>
				<span className="text-xs font-semibold text-green-500">
					{fmtRub(balance)}
				</span>
			</div>
			<div className="flex gap-2">
				<Input
					type="number"
					value={applyAmount}
					onChange={(e) => setApplyAmount(e.target.value)}
					placeholder={`до ${balance} ₽`}
					className="h-7 text-xs flex-1"
					max={Math.min(balance, booking.totalAmount)}
				/>
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-xs gap-1 text-green-600 border-green-500/30 hover:bg-green-500/10"
					onClick={handleApply}
					disabled={isPending || !applyAmount}
				>
					<CheckIcon size={11} /> Применить
				</Button>
			</div>
		</div>
	);
}

// ─── Labels & Comments (unchanged) ───────────────────────────────────────────

function LabelsBlock({
	labels,
	onAdd,
	onRemove,
}: {
	labels: BookingLabel[];
	onAdd: (l: Omit<BookingLabel, "id" | "createdAt" | "author">) => void;
	onRemove: (id: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("");
	const [color, setColor] = useState<keyof typeof LABEL_COLORS>("amber");
	const [dueDate, setDueDate] = useState("");
	const [shift, setShift] = useState("");

	const handleAdd = () => {
		if (!text.trim()) return;
		onAdd({
			text: text.trim(),
			color,
			dueDate: dueDate || "",
			shift: shift || "",
		});
		setText("");
		setDueDate("");
		setShift("");
		setOpen(false);
	};

	return (
		<div className="space-y-2">
			{labels.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{labels.map((l) => (
						<div
							key={l.id}
							className={cn(
								"group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
								LABEL_COLORS[l.color]
							)}
						>
							<TagIcon size={9} />
							<span>{l.text}</span>
							{l.dueDate && (
								<span className="opacity-60 text-[10px]">
									·{" "}
									{new Date(l.dueDate).toLocaleDateString("ru-RU", {
										day: "numeric",
										month: "short",
									})}
								</span>
							)}
							{l.shift && (
								<span className="opacity-60 text-[10px]">
									· смена {l.shift}
								</span>
							)}
							<button
								type="button"
								onClick={() => onRemove(l.id)}
								className="opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity ml-0.5"
							>
								<XIcon size={10} />
							</button>
						</div>
					))}
				</div>
			)}
			{open ? (
				<div className="p-3 rounded-xl bg-foreground/4 border border-foreground/8 space-y-2.5">
					<Input
						autoFocus
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Текст метки..."
						className="h-8 text-xs"
						onKeyDown={(e) => e.key === "Enter" && handleAdd()}
					/>
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1">
							<Label className="text-[10px] text-muted-foreground">Цвет</Label>
							<Select
								value={color}
								onValueChange={(v) => setColor(v as typeof color)}
							>
								<SelectTrigger className="h-7 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{LABEL_COLOR_OPTIONS.map((o) => (
										<SelectItem
											key={o.value}
											value={o.value}
											className="text-xs"
										>
											{o.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label className="text-[10px] text-muted-foreground">
								Смена (опц.)
							</Label>
							<Input
								value={shift}
								onChange={(e) => setShift(e.target.value)}
								placeholder="Утренняя..."
								className="h-7 text-xs"
							/>
						</div>
					</div>
					<div className="space-y-1">
						<Label className="text-[10px] text-muted-foreground">
							Дата напоминания (опц.)
						</Label>
						<Input
							type="date"
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							className="h-7 text-xs"
						/>
					</div>
					<div className="flex gap-1.5">
						<Button
							size="sm"
							className="h-7 text-xs flex-1"
							onClick={handleAdd}
							disabled={!text.trim()}
						>
							Добавить
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-7 text-xs"
							onClick={() => setOpen(false)}
						>
							<XIcon size={11} />
						</Button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
				>
					<TagIcon size={10} /> Добавить метку
				</button>
			)}
		</div>
	);
}

function CommentsBlock({
	comments,
	onAdd,
}: {
	comments: BookingComment[];
	onAdd: (t: string) => void;
}) {
	const [text, setText] = useState("");
	const handleAdd = () => {
		if (!text.trim()) return;
		onAdd(text.trim());
		setText("");
	};
	return (
		<div className="space-y-3">
			{comments.length > 0 && (
				<div className="space-y-2">
					{comments.map((c) => (
						<div key={c.id} className="flex gap-2.5">
							<div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
								<UserIcon size={11} className="text-muted-foreground" />
							</div>
							<div className="flex-1">
								<div className="flex items-baseline gap-2 mb-0.5">
									<span className="text-xs font-semibold">{c.author}</span>
									<span className="text-[10px] text-muted-foreground">
										{new Date(c.createdAt).toLocaleString("ru-RU", {
											day: "numeric",
											month: "short",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
								<p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
									{c.text}
								</p>
							</div>
						</div>
					))}
				</div>
			)}
			<div className="space-y-1.5">
				<Textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Комментарий для команды..."
					rows={2}
					className="text-xs resize-none"
					onKeyDown={(e) => {
						if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
					}}
				/>
				<div className="flex items-center justify-between">
					<span className="text-[10px] text-muted-foreground">Ctrl+Enter</span>
					<Button
						size="sm"
						variant="outline"
						className="h-7 text-xs"
						onClick={handleAdd}
						disabled={!text.trim()}
					>
						Отправить
					</Button>
				</div>
			</div>
		</div>
	);
}

function AuditBlock({ entries }: { entries: AuditLogEntry[] }) {
	if (!entries.length)
		return (
			<div className="py-10 text-center text-sm text-muted-foreground">
				История изменений пуста
			</div>
		);

	return (
		<div className="space-y-2">
			{[...entries].reverse().map((e) => (
				<div
					key={e.id}
					className="flex gap-3 p-3 rounded-xl bg-foreground/3 border border-foreground/6"
				>
					<div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
					<div className="flex-1 min-w-0">
						<div className="flex items-baseline gap-2 flex-wrap">
							<span className="text-xs font-semibold">{e.action}</span>
							{e.fieldName && (
								<span className="text-[10px] text-muted-foreground font-mono">
									[{e.fieldName}]
								</span>
							)}
							<span className="text-[10px] text-muted-foreground">
								{e.authorName ?? "—"}
							</span>
							<span className="text-[10px] text-muted-foreground ml-auto">
								{new Date(e.createdAt).toLocaleString("ru-RU", {
									day: "numeric",
									month: "short",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
						{(e.valueBefore || e.valueAfter) && (
							<div className="mt-1 text-[10px] text-muted-foreground space-y-0.5">
								{e.valueBefore && (
									<p>
										Было:{" "}
										<span className="text-foreground/70 line-through">
											{e.valueBefore}
										</span>
									</p>
								)}
								{e.valueAfter && (
									<p>
										Стало:{" "}
										<span className="text-foreground/80">{e.valueAfter}</span>
									</p>
								)}
							</div>
						)}
						{e.meta && "adjustments" in e.meta && (
							<p className="mt-0.5 text-[10px] text-muted-foreground italic">
								Корректировки: {String(e.meta.adjustments)}
							</p>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

type TabId = "info" | "comments" | "labels" | "audit" | "docs";

interface BookingDetailSheetProps {
	booking: AdminBookingRow | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onStatusUpdate: (id: string, status: BookingStatus) => void;
	onPeriodUpdate?: (
		id: string,
		start: string,
		end: string,
		total: number
	) => void;
	onBookingUpdate?: (booking: AdminBookingRow) => void;
}

export function BookingDetailSheet({
	booking,
	open,
	onOpenChange,
	onStatusUpdate,
	onPeriodUpdate,
	onBookingUpdate,
}: BookingDetailSheetProps) {
	const [isPending, startTransition] = useTransition();
	const [labels, setLabels] = useState<BookingLabel[]>([]);
	const [comments, setComments] = useState<BookingComment[]>([]);
	const [audit, setAudit] = useState<AuditLogEntry[]>([]);
	const [activeTab, setActiveTab] = useState<TabId>("info");
	const [localBooking, setLocalBooking] = useState<AdminBookingRow | null>(
		booking
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		if (open && localBooking?.id) {
			loadPersistedData(localBooking.id);
		}
	}, [open, localBooking?.id]);

	const loadPersistedData = async (bookingId: string) => {
		const [labelsResult, auditResult] = await Promise.all([
			getBookingLabelsAction(bookingId),
			getBookingAuditLogAction(bookingId),
		]);
		if (labelsResult.success && labelsResult.data) {
			setLabels(
				labelsResult.data.map((l) => ({
					id: l.id,
					text: l.text,
					color: (l.color as keyof typeof LABEL_COLORS) ?? "amber",
					dueDate: l.dueDate ?? "",
					shift: l.shift ?? "",
					createdAt: l.createdAt,
					author: l.authorName ?? "Администратор",
				}))
			);
		}
		if (auditResult.success && auditResult.data) {
			setAudit(auditResult.data);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		setLocalBooking(booking);

		if (booking) {
			setLabels([]);
			setComments([]);
			setAudit([]);
			loadPersistedData(booking.id);
		}
	}, [booking]);

	if (!localBooking) return null;

	const nextStatuses = NEXT_STATUSES[localBooking.status] ?? [];

	const addAudit = (
		entry: Omit<AuditLogEntry, "id" | "createdAt" | "authorName" | "authorId">
	) =>
		setAudit((prev) => [
			...prev,
			{
				...entry,
				id: crypto.randomUUID(),
				createdAt: new Date().toISOString(),
				authorName: "Администратор",
				authorId: null,
			},
		]);

	const handleStatusChange = (newStatus: BookingStatus) =>
		startTransition(async () => {
			const r = await updateBookingStatusAction(localBooking.id, newStatus);
			if (r.success) {
				addAudit({
					action: "Статус изменён",
					fieldName: "status",
					valueBefore: localBooking.status,
					valueAfter: newStatus,
				});
				const updated = { ...localBooking, status: newStatus };
				setLocalBooking(updated);
				onStatusUpdate(localBooking.id, newStatus);
				onBookingUpdate?.(updated);
				toast.success(`Статус → ${BOOKING_STATUS_CONFIG[newStatus].label}`);
			} else {
				toast.error(r.error ?? "Ошибка");
			}
		});

	const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
		{ id: "info", label: "Детали", icon: ShieldIcon },
		{
			id: "comments",
			label: comments.length ? `Коммент. (${comments.length})` : "Коммент.",
			icon: ChatIcon,
		},
		{
			id: "labels",
			label: labels.length ? `Метки (${labels.length})` : "Метки",
			icon: BellIcon,
		},
		{
			id: "audit",
			label: audit.length ? `История (${audit.length})` : "История",
			icon: ClockIcon,
		},
		{ id: "docs", label: "Документы", icon: FileTextIcon },
	];

	const handleSaveChanges = () => {
		startTransition(async () => {
			try {
				// Собираем единый payload, который ожидает adminSaveCompleteBookingAction
				const payload = {
					// Строки дат из стейта нужно превратить в объекты Date
					startDate: new Date(localBooking.startDate),
					endDate: new Date(localBooking.endDate),
					totalAmount: localBooking.totalAmount,
					totalReplacementValue: localBooking.totalReplacementValue ?? 0,

					// Собираем массив позиций (если позиции лежат в отдельном стейте localItems, используй его вместо localBooking.bookingItems)
					items: localBooking.bookingItems.map((item) => ({
						equipmentId: item.equipmentId,
						priceAtBooking: item.priceAtBooking,
						// Убедись, что эти поля тоже передаются, если ты обновил тип в самом экшене
						depositAtBooking: item.depositAtBooking ?? 0,
						replacementValueAtBooking: item.replacementValueAtBooking ?? 0,
					})),
				};

				// Вызываем один общий транзакционный экшен
				const result = await adminSaveCompleteBookingAction(
					localBooking.id,
					payload
				);

				if (result.success) {
					toast.success("Бронирование успешно обновлено");
					if (onStatusUpdate) {
						onStatusUpdate(localBooking.id, localBooking.status);
					}
				} else {
					toast.error(result.error || "Не удалось сохранить изменения");
				}
			} catch (error) {
				toast.error("Произошла непредвиденная ошибка");
				console.error("Save error:", error);
			}
		});
	};

	const handleAddLabel = async (
		label: Omit<BookingLabel, "id" | "createdAt" | "author">
	) => {
		if (!localBooking) return;
		const r = await addBookingLabelAction(localBooking.id, {
			text: label.text,
			color: label.color,
			dueDate: label.dueDate || "",
			shift: label.shift || "",
		});
		if (r.success && r.data) {
			setLabels((prev) => [
				...prev,
				{
					id: r.data?.id ?? crypto.randomUUID(),
					text: r.data?.text ?? "",
					color: (r.data?.color as keyof typeof LABEL_COLORS) ?? "amber",
					dueDate: r.data?.dueDate ?? "",
					shift: r.data?.shift ?? "",
					createdAt: r.data?.createdAt ?? new Date().toISOString(),
					author: r.data?.authorName ?? "Администратор",
				},
			]);
			toast.success("Метка добавлена");
		} else {
			toast.error(r.error ?? "Ошибка добавления метки");
		}
	};

	const handleRemoveLabel = async (id: string) => {
		if (!localBooking) return;
		const r = await removeBookingLabelAction(localBooking.id, id);
		if (r.success) {
			setLabels((prev) => prev.filter((l) => l.id !== id));
		} else {
			toast.error(r.error ?? "Ошибка удаления метки");
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-2xl flex flex-col p-0 gap-0 overflow-hidden"
			>
				{/* Header */}
				<SheetHeader className="px-6 py-4 border-b border-foreground/8 shrink-0">
					<div className="flex items-start justify-between gap-3">
						<div>
							<SheetTitle className="text-base font-bold">
								Заказ #{localBooking.id.slice(0, 8).toUpperCase()}
							</SheetTitle>
							<p className="text-xs text-muted-foreground mt-0.5">
								Создан{" "}
								{new Date(localBooking.createdAt).toLocaleString("ru-RU", {
									day: "numeric",
									month: "short",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</p>
						</div>
						<StatusBadge status={localBooking.status} />
					</div>
					{labels.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-2">
							{labels.map((l) => (
								<span
									key={l.id}
									className={cn(
										"flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
										LABEL_COLORS[l.color]
									)}
								>
									<TagIcon size={8} /> {l.text}
									{l.dueDate && (
										<span className="opacity-60">
											·{" "}
											{new Date(l.dueDate).toLocaleDateString("ru-RU", {
												day: "numeric",
												month: "short",
											})}
										</span>
									)}
								</span>
							))}
						</div>
					)}
				</SheetHeader>

				{/* Tabs */}
				<div className="flex border-b border-foreground/8 shrink-0 bg-background overflow-x-auto">
					{TABS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => setActiveTab(id)}
							className={cn(
								"flex-1 min-w-0 flex items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition-colors border-b-2 -mb-px whitespace-nowrap px-2",
								activeTab === id
									? "text-primary border-primary"
									: "text-muted-foreground border-transparent hover:text-foreground"
							)}
						>
							<Icon size={11} /> {label}
						</button>
					))}
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto">
					{activeTab === "info" && (
						<div className="divide-y divide-foreground/5">
							{/* Status */}
							{nextStatuses.length > 0 && (
								<div className="px-6 py-4">
									<SectionTitle icon={ArrowClockwiseIcon}>
										Изменить статус
									</SectionTitle>
									<div className="flex flex-wrap gap-1.5">
										{nextStatuses.map((s) => (
											<button
												key={s}
												type="button"
												disabled={isPending}
												onClick={() => handleStatusChange(s)}
												className={cn(
													"text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all",
													BOOKING_STATUS_CONFIG[s].color,
													"hover:opacity-80 active:scale-95 disabled:opacity-40"
												)}
											>
												→ {BOOKING_STATUS_CONFIG[s].label}
											</button>
										))}
									</div>
								</div>
							)}

							{/* 2.2 */}
							<ClientBlock
								booking={localBooking}
								onSaved={(id, name, email) => {
									const updated = {
										...localBooking,
										clientId: id,
										clientName: name,
										clientEmail: email,
									};
									setLocalBooking(updated);
									onBookingUpdate?.(updated);
								}}
								addAudit={addAudit}
							/>

							{/* 2.1 */}
							<PeriodBlock
								booking={localBooking}
								onSaved={(start, end, total) => {
									const updated = {
										...localBooking,
										startDate: start,
										endDate: end,
										totalAmount: total,
										status:
											localBooking.status === "READY_TO_RENT"
												? "PENDING_REVIEW"
												: localBooking.status,
									};
									setLocalBooking(updated);
									onBookingUpdate?.(updated);
									addAudit({
										action: "Период аренды изменён",
										fieldName: "startDate",
										valueBefore: `${new Date(localBooking.startDate).toLocaleDateString("ru-RU")} — ${new Date(localBooking.endDate).toLocaleDateString("ru-RU")}`,
										valueAfter: `${new Date(start).toLocaleDateString("ru-RU")} — ${new Date(end).toLocaleDateString("ru-RU")}`,
									});
									onPeriodUpdate?.(localBooking.id, start, end, total);
								}}
							/>

							{/* 2.3 */}
							<ItemsBlock
								booking={localBooking}
								onSaved={(items, total, deposit) => {
									const updated = {
										...localBooking,
										bookingItems: items,
										itemCount: items.length,
										equipmentTitles: [...new Set(items.map((i) => i.title))],
										totalAmount: total,
										totalReplacementValue: deposit,
										status: "PENDING_REVIEW" as BookingStatus,
									};
									setLocalBooking(updated);
									onBookingUpdate?.(updated);
								}}
								addAudit={addAudit}
							/>

							{/* 2.4 */}
							<PricingBlock
								booking={localBooking}
								onSaved={(total) => {
									const updated = { ...localBooking, totalAmount: total };
									setLocalBooking(updated);
									onBookingUpdate?.(updated);
								}}
								addAudit={addAudit}
							/>

							{/* Cancellation */}
							{localBooking.cancellationReason && (
								<div className="px-6 py-4">
									<SectionTitle icon={ProhibitIcon}>
										Причина отмены
									</SectionTitle>
									<div className="p-3 rounded-xl bg-red-500/8 border border-red-500/15">
										<p className="text-sm text-foreground/80">
											{localBooking.cancellationReason}
										</p>
										{localBooking.cancelledAt && (
											<p className="text-[10px] text-muted-foreground mt-1">
												{new Date(localBooking.cancelledAt).toLocaleString(
													"ru-RU"
												)}
											</p>
										)}
									</div>
								</div>
							)}

							{/* Meta */}
							<div className="px-6 py-4">
								<SectionTitle icon={ClockIcon}>Мета</SectionTitle>
								<p className="text-xs text-muted-foreground font-mono select-all">
									{localBooking.id}
								</p>
							</div>
						</div>
					)}

					{activeTab === "comments" && (
						<div className="px-6 py-4">
							<CommentsBlock
								comments={comments}
								onAdd={(text) => {
									setComments((prev) => [
										...prev,
										{
											id: crypto.randomUUID(),
											text,
											author: "Администратор",
											createdAt: new Date().toISOString(),
										},
									]);
									toast.success("Комментарий добавлен");
								}}
							/>
						</div>
					)}

					{activeTab === "labels" && (
						<div className="px-6 py-4 space-y-4">
							<p className="text-xs text-muted-foreground leading-relaxed">
								Метки видны только команде. Можно добавить напоминание к дате
								или привязать к смене.
							</p>
							<LabelsBlock
								labels={labels}
								onAdd={handleAddLabel}
								onRemove={handleRemoveLabel}
							/>
						</div>
					)}

					{activeTab === "audit" && (
						<div className="px-6 py-4">
							<AuditBlock entries={audit} />
						</div>
					)}

					{activeTab === "docs" && (
						<div className="px-6 py-4">
							<DocumentsPanel bookingId={localBooking.id} />
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-foreground/8 flex gap-2 shrink-0 bg-background">
					<Button
						variant="outline"
						size="sm"
						className="flex-1 text-xs"
						onClick={() => onOpenChange(false)}
					>
						Закрыть
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="flex-1 text-xs"
						onClick={handleSaveChanges}
					>
						Сохранить изменения
					</Button>
					{localBooking.status !== "CANCELLED" &&
						localBooking.status !== "COMPLETED" && (
							<Button
								variant="outline"
								size="sm"
								className="text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs gap-1"
								onClick={() => handleStatusChange("CANCELLED")}
								disabled={isPending || !nextStatuses.includes("CANCELLED")}
							>
								<ProhibitIcon size={11} /> Отменить
							</Button>
						)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
