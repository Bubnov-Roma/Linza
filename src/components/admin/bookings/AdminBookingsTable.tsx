"use client";

import {
	CaretDownIcon,
	CaretUpDownIcon,
	CaretUpIcon,
	DotsThreeVerticalIcon,
	EyeIcon,
	FunnelIcon,
	PackageIcon,
	PlusIcon,
	ProhibitIcon,
	UploadSimpleIcon,
	UserIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import {
	adminForceSetBookingStatusAction,
	getPaginatedAdminBookingsAction,
} from "@/actions/admin/admin-booking-actions";
import { getAutocompleteAction } from "@/actions/autocomplete-actions";
import { BookingDetailSheet } from "@/components/admin/bookings/BookingDetailSheet";
import {
	InlinePaymentChanger,
	InlineStatusChanger,
} from "@/components/admin/bookings/BookingInlineChanger";
import { CreateBookingSheet } from "@/components/admin/bookings/create/CreateBookingSheet";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	InlineSearchInput,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui";
import { BOOKING_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/constants";
import type {
	AdminBookingRow,
	BookingStatus,
	PaymentStatus,
} from "@/core/domain/entities/Booking";
import { useAdminBookingPolling } from "@/hooks/use-admin-booking-polling";
import { cn, fmtRub } from "@/lib/utils";
import { useAdminTablesStore } from "@/store/admin-tables.store";
import { formatPlural } from "@/utils";

export type { AdminBookingRow };

const PAGE_SIZE = 25;

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortField = "createdAt" | "startDate" | "totalAmount" | "status";
type SortDir = "asc" | "desc";
type QuickFilter = "all" | "today" | "pending" | "unpaid" | "active";

function SortIcon({
	field,
	active,
	dir,
}: {
	field: SortField;
	active: SortField;
	dir: SortDir;
}) {
	if (field !== active)
		return <CaretUpDownIcon size={12} className="opacity-30" />;
	return dir === "asc" ? (
		<CaretUpIcon size={12} className="text-primary" />
	) : (
		<CaretDownIcon size={12} className="text-primary" />
	);
}

// ─── Elements ─────────────────────────────────────────────────────────────────

function EquipmentCell({ booking }: { booking: AdminBookingRow }) {
	return (
		<HoverCard openDelay={10} closeDelay={100}>
			<HoverCardTrigger asChild>
				<button
					type="button"
					className="text-left group cursor-pointer"
					onClick={(e) => e.stopPropagation()}
				>
					<p className="text-sm truncate max-w-36 text-muted-foreground group-hover:text-foreground transition-colors">
						{booking.equipmentTitles[0] ?? "—"}
					</p>
					{booking.itemCount > 1 && (
						<p className="text-[10px] text-muted-foreground underline underline-offset-2">
							+{booking.itemCount - 1} поз.
						</p>
					)}
				</button>
			</HoverCardTrigger>
			<HoverCardContent
				className="w-84 p-3 space-y-1 bg-background/50 backdrop-blur-2xl rounded-2xl shadow-lg"
				align="start"
				onClick={(e) => e.stopPropagation()}
			>
				<p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">
					Техника в заказе · {formatPlural(booking.itemCount, "equipment")}
				</p>
				{booking.bookingItems.map((item, i) => (
					<div
						key={`${item.equipmentId}-${i}`}
						className="flex items-center gap-2 py-1.5 border-b border-foreground/5 last:border-0"
					>
						<span className="text-[10px] text-muted-foreground/40 font-mono w-4 shrink-0">
							{i + 1}.
						</span>
						<div className="flex-1 min-w-0">
							<p className="text-xs text-foreground/80 leading-tight truncate">
								{item.title}
							</p>
							{item.inventoryNumber && (
								<p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">
									№ {item.inventoryNumber}
								</p>
							)}
						</div>
						<span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0">
							{fmtRub(item.priceAtBooking)}
						</span>
					</div>
				))}
			</HoverCardContent>
		</HoverCard>
	);
}

function ActiveFilterChip({
	label,
	onRemove,
}: {
	label: string;
	onRemove: () => void;
}) {
	return (
		<span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-muted-foreground/10 text-muted-bg-muted-foreground text-[10px] font-medium border border-muted-foreground/20">
			{label}
			<button
				type="button"
				onClick={onRemove}
				className="hover:text-foreground/60 transition-colors"
			>
				<XIcon size={10} />
			</button>
		</span>
	);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminBookingsTable({
	initialBookings,
}: {
	initialBookings: AdminBookingRow[];
}) {
	const queryClient = useQueryClient();

	const { bookings: tableState, setBookings } = useAdminTablesStore();
	const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

	const search = tableState.search;
	const statusFilter = tableState.statusFilter as "all" | BookingStatus;
	const paymentFilter = tableState.paymentFilter as "all" | PaymentStatus;
	const dateFrom = tableState.dateFrom;
	const dateTo = tableState.dateTo;
	const showFilters = tableState.showFilters;
	const page = tableState.page;
	const sortField = tableState.sortField;
	const sortDir = tableState.sortDir;

	// Сеттеры:
	const setSearch = (v: string) => setBookings({ search: v });
	const setStatusFilter = (v: "all" | BookingStatus) =>
		setBookings({ statusFilter: v });
	const setPaymentFilter = (v: "all" | PaymentStatus) =>
		setBookings({ paymentFilter: v });
	const setDateFrom = (v: string) => setBookings({ dateFrom: v });
	const setDateTo = (v: string) => setBookings({ dateTo: v });
	const setShowFilters = (v: boolean) => setBookings({ showFilters: v });
	const setPage = (fn: (p: number) => number) =>
		setBookings({ page: fn(page) });
	const setSortField = (v: SortField) => setBookings({ sortField: v });
	const setSortDir = (fn: (d: SortDir) => SortDir) =>
		setBookings({ sortDir: fn(sortDir) });

	const [debouncedSearch] = useDebounceValue(search, 300);

	// ── UI State
	const [activeBooking, setActiveBooking] = useState<AdminBookingRow | null>(
		null
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Сброс страницы при изменении фильтров>
	useEffect(() => {
		return setPage(() => 1);
	}, [
		debouncedSearch,
		statusFilter,
		paymentFilter,
		dateFrom,
		dateTo,
		sortField,
		sortDir,
	]);

	// ── Fetch Data
	const queryKey = [
		"admin-bookings",
		debouncedSearch,
		statusFilter,
		paymentFilter,
		dateFrom,
		dateTo,
		sortField,
		sortDir,
		page,
	] as const;

	const applyQuickFilter = (f: QuickFilter) => {
		setQuickFilter(f);
		setDateFrom("");
		setDateTo("");
		setStatusFilter("all");
		setPaymentFilter("all");

		const today = new Date().toISOString().slice(0, 10);
		if (f === "today") {
			setDateFrom(today);
			setDateTo(today);
		} else if (f === "pending") {
			setStatusFilter("PENDING_REVIEW");
		} else if (f === "unpaid") {
			setPaymentFilter("UNPAID");
		} else if (f === "active") {
			setStatusFilter("ACTIVE");
		}
	};

	const { data: queryData, isFetching } = useQuery({
		queryKey,
		queryFn: () =>
			getPaginatedAdminBookingsAction({
				search: debouncedSearch,
				statusFilter,
				paymentFilter,
				dateFrom,
				dateTo,
				sortField,
				sortDir,
				limit: PAGE_SIZE,
				offset: (page - 1) * PAGE_SIZE,
			}),
		placeholderData: (prev) => prev,
	});

	const bookings = queryData?.data ?? initialBookings;
	const totalCount = queryData?.count ?? initialBookings.length;
	const isLoading = isFetching && !queryData;
	const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

	const refreshData = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
	}, [queryClient]);

	useAdminBookingPolling({
		enabled: true,
		onNewBooking: (count) => {
			toast.info(
				`Новый заказ! +${count} заявк${count === 1 ? "а" : "и"} на проверке`,
				{
					duration: 8000,
					icon: "📦",
				}
			);
			refreshData();
		},
	});

	const openBooking = (booking: AdminBookingRow) => {
		setActiveBooking(booking);
		setSheetOpen(true);
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDir(() => "desc");
		}
	};

	// ── Export
	const handleExport = () => {
		const rows = [
			[
				"ID",
				"Клиент",
				"Email",
				"Статус",
				"Сумма",
				"Начало",
				"Конец",
				"Техника",
			],
			...bookings.map((b) => [
				b.id,
				b.clientName ?? "",
				b.clientEmail ?? "",
				BOOKING_STATUS_CONFIG[b.status]?.label ?? b.status,
				b.totalAmount,
				b.startDate,
				b.endDate,
				b.equipmentTitles.join("; "),
			]),
		];
		const csv = rows.map((r) => r.join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("CSV экспортирован (текущая страница)");
	};

	// ── Active filters
	const activeFilters: { label: string; onRemove: () => void }[] = [];
	if (statusFilter !== "all") {
		activeFilters.push({
			label: `Статус: ${BOOKING_STATUS_CONFIG[statusFilter]?.label}`,
			onRemove: () => setStatusFilter("all"),
		});
	}
	if (paymentFilter !== "all") {
		activeFilters.push({
			label: `Оплата: ${PAYMENT_STATUS_CONFIG[paymentFilter]?.label}`,
			onRemove: () => setPaymentFilter("all"),
		});
	}
	if (dateFrom) {
		activeFilters.push({
			label: `От: ${new Date(dateFrom).toLocaleDateString("ru-RU")}`,
			onRemove: () => setDateFrom(""),
		});
	}
	if (dateTo) {
		activeFilters.push({
			label: `До: ${new Date(dateTo).toLocaleDateString("ru-RU")}`,
			onRemove: () => setDateTo(""),
		});
	}

	const totalAmountSum = bookings.reduce((s, b) => s + b.totalAmount, 0);
	const pendingCount = bookings.filter(
		(b) => b.status === "PENDING_REVIEW"
	).length;

	return (
		<div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
			{/* ── Header ── */}
			<div className="px-3 py-4 flex items-start justify-between gap-4">
				<div className="flex items-center gap-2.5">
					<PackageIcon size={20} weight="duotone" />
					<h1 className="text-2xl font-black italic uppercase tracking-tighter">
						Заказы
					</h1>
					{pendingCount > 0 && (
						<Badge className="h-5 px-2 text-[10px] font-bold bg-primary text-primary-foreground">
							{formatPlural(pendingCount, "new")}
						</Badge>
					)}
				</div>

				<Button
					aria-label="Добавить новый заказ"
					size="sm"
					className="h-9 gap-2 font-bold"
					onClick={() => setCreateOpen(true)}
				>
					<PlusIcon size={14} weight="bold" />
				</Button>
			</div>
			{/* Controls */}
			<Card className="p-2 shadow-none!">
				<CardContent className="space-y-3 p-0">
					{/* Строка 1: поиск + кнопки Ещё/CSV */}
					<div className="flex gap-3">
						<div className="flex-1 w-full sm:max-w-md">
							<InlineSearchInput
								value={search}
								className="h-9 glass-input"
								onChange={setSearch}
								placeholder="Клиент, техника, ID, метка..."
								fetchSuggestion={async (q) => {
									const results = await getAutocompleteAction("bookings", q);
									return results[0] || null;
								}}
							/>
						</div>
						<div className="flex gap-2 shrink-0 ml-auto">
							{/** Кнопка ещё */}
							<Button
								variant={"outline"}
								size="sm"
								className={cn(
									"h-9 gap-2",
									showFilters && "border-primary text-primary"
								)}
								onClick={() => setShowFilters(!showFilters)}
							>
								<FunnelIcon
									size={13}
									weight={showFilters ? "fill" : "duotone"}
								/>
								Ещё
								{(dateFrom ||
									dateTo ||
									statusFilter !== "all" ||
									paymentFilter !== "all") && (
									<span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
										{
											[
												dateFrom,
												dateTo,
												statusFilter !== "all",
												paymentFilter !== "all",
											].filter(Boolean).length
										}
									</span>
								)}
							</Button>
							{/* быстрые чипы */}
							<div className="flex items-center gap-2 flex-wrap">
								{(
									[
										{ key: "all", label: "Все" },
										{ key: "today", label: "📅 На сегодня" },
										{ key: "pending", label: "⏳ В ожидании" },
										{ key: "unpaid", label: "💳 Не оплачен" },
										{ key: "active", label: "✅ Активные" },
									] as { key: QuickFilter; label: string }[]
								).map((f) => (
									<button
										key={f.key}
										type="button"
										onClick={() => applyQuickFilter(f.key)}
										className={cn(
											"px-3 py-2.5 rounded-full text-xs font-medium transition-all border",
											quickFilter === f.key
												? "bg-foreground text-background border-foreground"
												: "bg-foreground/5 text-foreground border-foreground/10 hover:border-foreground/30"
										)}
									>
										{f.label}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* Расширенные фильтры (статус, оплата, даты, CSV) */}
					{showFilters && (
						<div className="pt-2 border-t border-foreground/5 flex flex-wrap gap-3 items-end">
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">
									Статус
								</p>
								<Select
									value={statusFilter}
									onValueChange={(v) => {
										setStatusFilter(v as typeof statusFilter);
										setQuickFilter("all");
									}}
								>
									<SelectTrigger className="h-8 w-44 text-xs rounded-2xl">
										<SelectValue placeholder="Все статусы" />
									</SelectTrigger>
									<SelectContent className="rounded-2-xl">
										<SelectItem value="all">Все статусы</SelectItem>
										{(
											Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[]
										).map((s) => (
											<SelectItem key={s} value={s}>
												{BOOKING_STATUS_CONFIG[s].label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">
									Оплата
								</p>
								<Select
									value={paymentFilter}
									onValueChange={(v) => {
										setPaymentFilter(v as typeof paymentFilter);
										setQuickFilter("all");
									}}
								>
									<SelectTrigger className="h-8 w-44 text-xs rounded-2xl">
										<SelectValue placeholder="Все оплаты" />
									</SelectTrigger>
									<SelectContent className="">
										<SelectItem value="all">Все оплаты</SelectItem>
										{(
											Object.entries(PAYMENT_STATUS_CONFIG) as [
												PaymentStatus,
												{ label: string },
											][]
										).map(([k, v]) => (
											<SelectItem key={k} value={k}>
												{v.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">
									Дата начала от
								</p>
								<Input
									type="date"
									className="h-9 border border-border text-xs w-36 glass-input"
									value={dateFrom}
									onChange={(e) => {
										setDateFrom(e.target.value);
										setQuickFilter("all");
									}}
								/>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">до</p>
								<Input
									type="date"
									className="h-9 border border-border text-xs w-36 glass-input"
									value={dateTo}
									onChange={(e) => {
										setDateTo(e.target.value);
										setQuickFilter("all");
									}}
								/>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-9 gap-2"
								onClick={handleExport}
							>
								<UploadSimpleIcon size={13} />
								CSV
							</Button>
							{(dateFrom ||
								dateTo ||
								statusFilter !== "all" ||
								paymentFilter !== "all") && (
								<Button
									variant="ghost"
									size="sm"
									className="h-9 text-xs text-muted-foreground gap-1"
									onClick={() => {
										setDateFrom("");
										setDateTo("");
										setStatusFilter("all");
										setPaymentFilter("all");
										setQuickFilter("all");
									}}
								>
									<XIcon size={11} /> Сбросить
								</Button>
							)}
						</div>
					)}

					{/* Активные чипы фильтров */}
					{activeFilters.length > 0 && (
						<div className="flex flex-wrap gap-1.5 items-center pt-1">
							<span className="text-[10px] text-muted-foreground">
								Активные фильтры:
							</span>
							{activeFilters.map((f) => (
								<ActiveFilterChip
									key={f.label}
									label={f.label}
									onRemove={f.onRemove}
								/>
							))}
							<button
								type="button"
								onClick={() => {
									setStatusFilter("all");
									setPaymentFilter("all");
									setDateFrom("");
									setDateTo("");
									setQuickFilter("all");
								}}
								className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-1"
							>
								Сбросить все
							</button>
						</div>
					)}
				</CardContent>
			</Card>
			{/* Summary strip */}
			<div className="flex items-center gap-4 text-sm text-muted-foreground">
				<span>
					Найдено: <strong className="text-foreground">{totalCount}</strong>
				</span>
				{isFetching && !isLoading && (
					<span className="text-primary-accent/60 flex items-center gap-1">
						<span className="w-2 h-2 border border-primary/40 border-t-primary rounded-full animate-spin" />
						Обновление...
					</span>
				)}
				<span className="ml-auto font-bold text-foreground">
					{fmtRub(totalAmountSum)}
				</span>
			</div>

			{/* Table */}
			<Card className="overflow-hidden relative rounded-xl">
				{/* NpLoader (Top Loading Bar) */}
				<div
					className={cn(
						"absolute top-0 left-0 w-full h-2 z-50 bg-primary/10 overflow-hidden transition-opacity duration-300",
						isFetching ? "opacity-100" : "opacity-0"
					)}
				>
					<div className="h-full bg-primary w-1/2 rounded-full animate-[pulse_1s_ease-in-out_infinite] origin-left" />
				</div>

				<div className="overflow-x-auto">
					<Table className="w-full backdrop-blur-2xl rounded-xl overflow-hidden">
						<TableHeader
							className={cn(
								"bg-muted-foreground/20 rounded-2xl",
								isFetching &&
									!isLoading &&
									"opacity-80 transition-opacity duration-200"
							)}
						>
							<TableRow className="border-foreground/5 hover:bg-transparent font-black">
								<TableHead className="w-10">
									<Checkbox
										checked={
											bookings.length > 0 &&
											selectedIds.size === bookings.length
										}
										onCheckedChange={(checked) => {
											setSelectedIds(
												checked ? new Set(bookings.map((b) => b.id)) : new Set()
											);
										}}
									/>
								</TableHead>
								<TableHead>Клиент</TableHead>
								<TableHead
									className="cursor-pointer select-none hover:text-foreground transition-colors"
									onClick={() => handleSort("createdAt")}
								>
									<span className="flex items-center gap-1">
										Дата{" "}
										<SortIcon
											field="createdAt"
											active={sortField}
											dir={sortDir}
										/>
									</span>
								</TableHead>
								<TableHead>Техника</TableHead>
								<TableHead
									className="cursor-pointer select-none hover:text-foreground transition-colors"
									onClick={() => handleSort("startDate")}
								>
									<span className="flex items-center gap-1">
										Период{" "}
										<SortIcon
											field="startDate"
											active={sortField}
											dir={sortDir}
										/>
									</span>
								</TableHead>
								<TableHead
									className="cursor-pointer select-none hover:text-foreground transition-colors"
									onClick={() => handleSort("totalAmount")}
								>
									<span className="flex items-center gap-1">
										Сумма{" "}
										<SortIcon
											field="totalAmount"
											active={sortField}
											dir={sortDir}
										/>
									</span>
								</TableHead>
								<TableHead>Оплата</TableHead>
								<TableHead
									className="cursor-pointer select-none hover:text-foreground transition-colors"
									onClick={() => handleSort("status")}
								>
									<span className="flex items-center gap-1">
										Статус{" "}
										<SortIcon field="status" active={sortField} dir={sortDir} />
									</span>
								</TableHead>
								<TableHead className="text-right">Действия</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{bookings.map((booking) => {
								const createdDate = new Date(
									booking.createdAt
								).toLocaleDateString("ru-RU", {
									day: "numeric",
									month: "short",
								});
								const startDate = new Date(
									booking.startDate
								).toLocaleDateString("ru-RU", {
									day: "numeric",
									month: "short",
								});
								const endDate = new Date(booking.endDate).toLocaleDateString(
									"ru-RU",
									{ day: "numeric", month: "short" }
								);

								return (
									<TableRow
										key={booking.id}
										className={cn(
											"border-foreground/5 cursor-pointer hover:bg-foreground/3 transition-colors",
											activeBooking?.id === booking.id &&
												sheetOpen &&
												"bg-foreground/7",
											selectedIds.has(booking.id) && "bg-primary/10",
											booking.status === "PENDING_REVIEW" &&
												"bg-amber-500/7 border-l-2 border-l-amber-500/40",
											booking.status === "WAIT_PAYMENT" &&
												"bg-blue-500/7 border-l-2 border-l-blue-500/40",
											booking.status === "READY_TO_RENT" &&
												"bg-green-500/7 border-l-2 border-l-green-500/40",
											booking.status === "ACTIVE" &&
												"bg-emerald-500/7 border-l-2 border-l-emerald-500/40",
											booking.status === "CANCELLED" && "opacity-60",
											booking.status === "EXPIRED" && "opacity-50"
										)}
										onClick={() => openBooking(booking)}
									>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<Checkbox
												checked={selectedIds.has(booking.id)}
												onCheckedChange={(checked) => {
													const newSelected = new Set(selectedIds);
													if (checked) newSelected.add(booking.id);
													else newSelected.delete(booking.id);
													setSelectedIds(newSelected);
												}}
											/>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="h-8 w-8 rounded-full bg-foreground/8 flex items-center justify-center overflow-hidden shrink-0">
													{booking.clientImage ? (
														<Image
															src={booking.clientImage}
															alt=""
															width={32}
															height={32}
															className="object-cover"
														/>
													) : (
														<UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
													)}
												</div>
												<div className="min-w-0">
													<p className="text-sm font-medium truncate max-w-32">
														{booking.clientName || "Без имени"}
													</p>
													<p className="text-[11px] text-muted-foreground truncate max-w-32">
														{booking.clientEmail || "—"}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
											{createdDate}
										</TableCell>
										<TableCell>
											<EquipmentCell booking={booking} />
										</TableCell>
										<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
											{startDate} — {endDate}
										</TableCell>
										<TableCell className="font-bold text-sm whitespace-nowrap">
											{fmtRub(booking.totalAmount)}
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<InlinePaymentChanger
												bookingId={booking.id}
												status={booking.paymentStatus ?? "UNPAID"}
												onRefresh={refreshData}
											/>
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<InlineStatusChanger
												bookingId={booking.id}
												status={booking.status}
												onRefresh={refreshData}
											/>
										</TableCell>
										<TableCell
											className="text-right"
											onClick={(e) => e.stopPropagation()}
										>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
													>
														<DotsThreeVerticalIcon className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() => openBooking(booking)}
													>
														<EyeIcon className="w-4 h-4 mr-2" /> Подробнее
													</DropdownMenuItem>
													{booking.status !== "CANCELLED" && (
														<>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																className="text-red-500"
																onClick={async () => {
																	const r =
																		await adminForceSetBookingStatusAction(
																			booking.id,
																			"CANCELLED"
																		);
																	if (r.success) {
																		refreshData();
																		toast.success("Заказ отменён");
																	} else {
																		toast.error(r.error ?? "Ошибка");
																	}
																}}
															>
																<ProhibitIcon className="w-4 h-4 mr-2" />
																Отменить заказ
															</DropdownMenuItem>
														</>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
				{bookings.length === 0 && !isLoading && (
					<div className="text-center py-12 text-muted-foreground text-sm">
						Бронирования не найдены
					</div>
				)}

				{/* Pagination Footer */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-foreground/5">
						<span className="text-xs text-muted-foreground">
							Страница {page} из {totalPages}
						</span>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page === 1}
								onClick={() => setPage((p) => p - 1)}
							>
								Назад
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								Вперед
							</Button>
						</div>
					</div>
				)}
			</Card>

			{/* Detail Sheet */}
			<BookingDetailSheet
				booking={activeBooking}
				open={sheetOpen}
				onOpenChange={(open) => {
					setSheetOpen(open);
					if (!open) {
						setTimeout(() => setActiveBooking(null), 300);
						refreshData(); // Рефреш при закрытии, чтобы обновить суммы, если они менялись внутри Sheet
					}
				}}
				onStatusUpdate={() => refreshData()}
				onBookingUpdate={(b) => setActiveBooking(b)}
			/>

			{/* Create Sheet */}
			<CreateBookingSheet
				open={createOpen}
				onOpenChange={setCreateOpen}
				onCreated={() => {
					refreshData();
					setCreateOpen(false);
				}}
			/>
		</div>
	);
}
