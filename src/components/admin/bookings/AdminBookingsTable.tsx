"use client";

import {
	CaretDownIcon,
	CaretUpDownIcon,
	CaretUpIcon,
	DotsThreeVerticalIcon,
	EyeIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
	PlusIcon,
	ProhibitIcon,
	UploadSimpleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import {
	adminClearBookingPaymentsAction,
	adminForceSetBookingStatusAction,
	adminQuickPayBookingAction,
	getPaginatedAdminBookingsAction,
} from "@/actions/admin-booking-actions";
import { BookingDetailSheet } from "@/components/admin/bookings/BookingDetailSheet";
import { CreateBookingSheet } from "@/components/admin/bookings/create/CreateBookingSheet";
import {
	PAYMENT_STATUS_CONFIG,
	type PaymentStatus,
} from "@/components/admin/bookings/PaymentsPanel";
import {
	Badge,
	Button,
	Card,
	CardContent,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
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
import { BOOKING_STATUS_CONFIG } from "@/constants";
import type {
	AdminBookingRow,
	BookingStatus,
} from "@/core/domain/entities/Booking";
import { cn } from "@/lib/utils";
import { formatPlural } from "@/utils";

export type { AdminBookingRow };

const PAGE_SIZE = 25;

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortField = "createdAt" | "startDate" | "totalAmount" | "status";
type SortDir = "asc" | "desc";

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

// ─── Inline Status Changers ───────────────────────────────────────────────────

function InlineStatusChanger({
	bookingId,
	status,
	onRefresh,
}: {
	bookingId: string;
	status: BookingStatus;
	onRefresh: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState<BookingStatus | null>(null);
	const cfg = BOOKING_STATUS_CONFIG[status] ?? {
		label: status,
		color: "bg-foreground/8 text-foreground/50",
		dot: "bg-foreground/30",
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						"text-[10px] gap-1.5 border font-semibold cursor-pointer hover:opacity-80 transition-opacity select-none rounded-2xl",
						cfg.color
					)}
					onClick={(e) => {
						e.stopPropagation();
						setOpen(true);
					}}
				>
					<span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
					{cfg.label}
					<CaretDownIcon size={8} className="opacity-60" />
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-44 rounded-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{(Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[])
					.filter((s) => s !== status)
					.map((s) => {
						const scfg = BOOKING_STATUS_CONFIG[s];
						return (
							<DropdownMenuItem
								key={s}
								disabled={loading !== null}
								className={cn(
									"text-xs gap-2 rounded-full",
									s === "CANCELLED" && "text-red-500 focus:text-red-500"
								)}
								onClick={async (e) => {
									e.stopPropagation();
									setLoading(s);
									const r = await adminForceSetBookingStatusAction(
										bookingId,
										s
									);
									setLoading(null);
									setOpen(false);
									if (r.success) {
										onRefresh();
										toast.success(`Статус → ${scfg.label}`);
									} else {
										toast.error(r.error ?? "Ошибка");
									}
								}}
							>
								<span
									className={cn("w-1.5 h-1.5 rounded-full shrink-0", scfg.dot)}
								/>
								{scfg.label}
								{loading === s && (
									<span className="ml-auto w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
								)}
							</DropdownMenuItem>
						);
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function InlinePaymentChanger({
	bookingId,
	status,
	onRefresh,
}: {
	bookingId: string;
	status: PaymentStatus;
	onRefresh: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const cfg = PAYMENT_STATUS_CONFIG[status] ?? {
		label: status,
		color: "bg-foreground/8 text-foreground/50",
		dot: "bg-foreground/30",
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						"text-[10px] gap-1.5 border font-semibold cursor-pointer hover:opacity-80 transition-opacity select-none rounded-2xl",
						cfg.color
					)}
					onClick={(e) => {
						e.stopPropagation();
						setOpen(true);
					}}
				>
					<span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
					{cfg.label}
					<CaretDownIcon size={8} className="opacity-60" />
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-48 rounded-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<DropdownMenuItem
					disabled={isPending || status === "PAID" || status === "OVERPAID"}
					className="text-xs gap-2 rounded-full text-green-600 focus:text-green-600"
					onClick={(e) => {
						e.stopPropagation();
						startTransition(async () => {
							const r = await adminQuickPayBookingAction(bookingId);
							if (r.success) {
								toast.success("Заказ отмечен как оплаченный");
								onRefresh();
							} else toast.error(r.error);
							setOpen(false);
						});
					}}
				>
					<span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
					Полностью оплачен
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					disabled={isPending || status === "UNPAID"}
					className="text-xs gap-2 rounded-full text-red-500 focus:text-red-500"
					onClick={(e) => {
						e.stopPropagation();
						if (window.confirm("Удалить ВСЕ платежи по этому заказу?")) {
							startTransition(async () => {
								const r = await adminClearBookingPaymentsAction(bookingId);
								if (r.success) {
									toast.success("Все платежи сброшены");
									onRefresh();
								} else toast.error(r.error);
								setOpen(false);
							});
						}
					}}
				>
					<span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
					Не оплачен (сбросить)
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ─── Elements ─────────────────────────────────────────────────────────────────

function EquipmentCell({ booking }: { booking: AdminBookingRow }) {
	if (booking.itemCount <= 1) {
		return (
			<p className="text-sm truncate max-w-36 text-muted-foreground">
				{booking.equipmentTitles[0] ?? "—"}
			</p>
		);
	}
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
					<p className="text-[10px] text-muted-foreground underline underline-offset-2">
						+{booking.itemCount - 1} поз. — смотреть все
					</p>
				</button>
			</HoverCardTrigger>
			<HoverCardContent
				className="w-72 p-3 space-y-1 bg-background/50 backdrop-blur-2xl rounded-2xl shadow-lg shadow-muted-foreground"
				align="start"
				onClick={(e) => e.stopPropagation()}
			>
				<p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2">
					Техника в заказе - {formatPlural(booking.itemCount, "equipment")}
				</p>
				{booking.equipmentTitles.map((title, i) => (
					<div
						key={`${title}-${i}`}
						className="flex items-center gap-2 py-1 border-b border-foreground/5 last:border-0"
					>
						<span className="text-[10px] text-muted-foreground/40 font-mono w-4 shrink-0">
							{i + 1}.
						</span>
						<span className="text-xs text-foreground/80 leading-tight">
							{title}
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
		<span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium border border-primary/20">
			{label}
			<button
				type="button"
				onClick={onRemove}
				className="hover:text-primary/60 transition-colors"
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

	// ── Filter State
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounceValue(search, 300);
	const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
		"all"
	);
	const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentStatus>(
		"all"
	);
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [showFilters, setShowFilters] = useState(false);

	// ── Pagination & Sort State
	const [page, setPage] = useState(1);
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	// ── UI State
	const [activeBooking, setActiveBooking] = useState<AdminBookingRow | null>(
		null
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Сброс страницы при изменении фильтров>
	useEffect(() => {
		setPage(1);
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

	const openBooking = (booking: AdminBookingRow) => {
		setActiveBooking(booking);
		setSheetOpen(true);
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDir("desc");
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

	return (
		<div className="space-y-4 relative">
			{/* Controls */}
			<Card>
				<CardContent className="p-3 space-y-3">
					<div className="flex flex-col sm:flex-row gap-3">
						{/* Search */}
						<div className="relative flex-1">
							<MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								placeholder="Клиент, техника, ID, метка..."
								className="pl-9 h-9"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							{search && (
								<button
									type="button"
									onClick={() => setSearch("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									<XIcon size={12} />
								</button>
							)}
						</div>

						{/* Status filter */}
						<Select
							value={statusFilter}
							onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
						>
							<SelectTrigger className="h-9 w-44">
								<SelectValue placeholder="Все статусы" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Все статусы</SelectItem>
								{(Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[]).map(
									(s) => (
										<SelectItem key={s} value={s}>
											{BOOKING_STATUS_CONFIG[s].label}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>

						{/* Payment filter */}
						<Select
							value={paymentFilter}
							onValueChange={(v) => setPaymentFilter(v as typeof paymentFilter)}
						>
							<SelectTrigger className="h-9 w-44">
								<SelectValue placeholder="Все оплаты" />
							</SelectTrigger>
							<SelectContent>
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

						{/* Buttons */}
						<div className="flex gap-2 shrink-0">
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"h-9 gap-2",
									showFilters && "border-primary text-primary"
								)}
								onClick={() => setShowFilters((v) => !v)}
							>
								<FunnelIcon size={13} />
								Ещё
								{(dateFrom || dateTo) && (
									<span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
										{(dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
									</span>
								)}
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-9 gap-2"
								onClick={handleExport}
							>
								<UploadSimpleIcon size={13} />
								CSV
							</Button>
							<Button
								size="sm"
								className="h-9 gap-2 font-bold"
								onClick={() => setCreateOpen(true)}
							>
								<PlusIcon size={14} />
								Новый заказ
							</Button>
						</div>
					</div>

					{/* Extended date filters */}
					{showFilters && (
						<div className="pt-2 border-t border-foreground/5 flex flex-wrap gap-3 items-end">
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">
									Дата начала от
								</p>
								<Input
									type="date"
									className="h-8 text-xs w-36"
									value={dateFrom}
									onChange={(e) => setDateFrom(e.target.value)}
								/>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">до</p>
								<Input
									type="date"
									className="h-8 text-xs w-36"
									value={dateTo}
									onChange={(e) => setDateTo(e.target.value)}
								/>
							</div>
							{(dateFrom || dateTo) && (
								<Button
									variant="ghost"
									size="sm"
									className="h-8 text-xs text-muted-foreground gap-1"
									onClick={() => {
										setDateFrom("");
										setDateTo("");
									}}
								>
									<XIcon size={11} /> Сброс дат
								</Button>
							)}
						</div>
					)}

					{/* Active filter chips */}
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
			<div className="flex items-center gap-4 text-sm text-muted-foreground px-1">
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
					{totalAmountSum.toLocaleString("ru-RU")} ₽
				</span>
			</div>

			{/* Table */}
			<Card className="overflow-hidden relative">
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
					<Table className="w-full backdrop-blur-2xl bg-muted-foreground/5 rounded-xl overflow-hidden">
						<TableHeader
							className={cn(
								"bg-muted-foreground/20 rounded-2xl",
								isFetching &&
									!isLoading &&
									"opacity-80 transition-opacity duration-200"
							)}
						>
							<TableRow className="border-foreground/5 hover:bg-transparent font-black">
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
								<TableHead>Клиент</TableHead>
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
												"bg-foreground/5"
										)}
										onClick={() => openBooking(booking)}
									>
										<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
											{createdDate}
										</TableCell>
										<TableCell>
											<p className="text-sm font-medium truncate max-w-32">
												{booking.clientName || "Без имени"}
											</p>
											<p className="text-[11px] text-muted-foreground truncate max-w-32">
												{booking.clientEmail || "—"}
											</p>
										</TableCell>
										<TableCell>
											<EquipmentCell booking={booking} />
										</TableCell>
										<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
											{startDate} — {endDate}
										</TableCell>
										<TableCell className="font-bold text-sm whitespace-nowrap">
											{booking.totalAmount.toLocaleString("ru-RU")} ₽
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
