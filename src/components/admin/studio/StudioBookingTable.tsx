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
	VideoIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import type {
	StudioBookingFilters,
	StudioBookingRow,
	StudioTariffData,
} from "@/actions/admin-studio-actions";
import {
	getStudioBookingsAction,
	updateStudioBookingStatusAction,
} from "@/actions/admin-studio-actions";
import { PAYMENT_STATUS_CONFIG } from "@/components/admin/bookings/PaymentsPanel";
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
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn } from "@/lib/utils";
import { CreateStudioBookingSheet } from "./CreateStudioBookingSheet";
import { StudioBookingDetailSheet } from "./StudioBookingDetailSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "createdAt" | "startDate" | "totalAmount" | "status";
type SortDir = "asc" | "desc";
type PaymentStatus = keyof typeof PAYMENT_STATUS_CONFIG;

const PAGE_SIZE = 25;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Inline Status Changer ────────────────────────────────────────────────────

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
									const r = await updateStudioBookingStatusAction(bookingId, s);
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

// ─── Inline Payment Badge (read-only, click to open detail) ──────────────────

function PaymentBadge({ status }: { status: PaymentStatus }) {
	const cfg = PAYMENT_STATUS_CONFIG[status] ?? {
		label: status,
		color: "bg-foreground/8 text-foreground/50",
		dot: "bg-foreground/30",
	};
	return (
		<Badge
			variant="outline"
			className={cn(
				"text-[10px] gap-1.5 border font-semibold rounded-2xl",
				cfg.color
			)}
		>
			<span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
			{cfg.label}
		</Badge>
	);
}

// ─── Duration cell ────────────────────────────────────────────────────────────

function DurationCell({ booking }: { booking: StudioBookingRow }) {
	const start = new Date(booking.startDate);
	const end = new Date(booking.endDate);
	const startStr = start.toLocaleDateString("ru-RU", {
		day: "numeric",
		month: "short",
	});
	const endStr = end.toLocaleDateString("ru-RU", {
		day: "numeric",
		month: "short",
	});
	const startTime = start.toLocaleTimeString("ru-RU", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const endTime = end.toLocaleTimeString("ru-RU", {
		hour: "2-digit",
		minute: "2-digit",
	});
	const sameDay = startStr === endStr;
	const hours = booking.durationHours;
	const hLabel = hours % 1 === 0 ? `${hours} ч` : `${hours.toFixed(1)} ч`;

	return (
		<div>
			<p className="text-xs text-muted-foreground whitespace-nowrap">
				{sameDay
					? `${startStr}, ${startTime} — ${endTime}`
					: `${startStr} ${startTime} — ${endStr} ${endTime}`}
			</p>
			<p className="text-[10px] text-muted-foreground/50 mt-0.5">{hLabel}</p>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StudioBookingTableProps {
	tariffs: StudioTariffData[];
	isAdmin: boolean;
}

export function StudioBookingTable({ tariffs }: StudioBookingTableProps) {
	const queryClient = useQueryClient();

	// ── Filter / Sort / Page state ─────────────────────────────────────────────
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
		"all"
	);
	const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentStatus>(
		"all"
	);
	const [tariffFilter, setTariffFilter] = useState<"all" | string>("all");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [showFilters, setShowFilters] = useState(false);
	const [page, setPage] = useState(1);
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	const [debouncedSearch] = useDebounceValue(search, 300);

	// ── Sheet state ────────────────────────────────────────────────────────────
	const [activeBooking, setActiveBooking] = useState<StudioBookingRow | null>(
		null
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);

	// Reset page on filter change
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional filter reset
	useEffect(() => {
		setPage(1);
	}, [
		debouncedSearch,
		statusFilter,
		paymentFilter,
		tariffFilter,
		dateFrom,
		dateTo,
		sortField,
		sortDir,
	]);

	// ── Build server filters ───────────────────────────────────────────────────
	const serverFilters: StudioBookingFilters = {
		search: debouncedSearch || "",
		status: statusFilter === "all" ? "ALL" : statusFilter,
		paymentStatus: paymentFilter === "all" ? "ALL" : paymentFilter,
		tariffId: tariffFilter === "all" ? "" : tariffFilter,
		dateFrom: dateFrom ? new Date(dateFrom) : new Date(),
		dateTo: dateTo ? new Date(dateTo) : new Date(),
	};

	// ── Query ──────────────────────────────────────────────────────────────────
	const queryKey = [
		"studio-bookings",
		debouncedSearch,
		statusFilter,
		paymentFilter,
		tariffFilter,
		dateFrom,
		dateTo,
		sortField,
		sortDir,
		page,
	] as const;

	const { data: queryData, isFetching } = useQuery({
		queryKey,
		queryFn: () => getStudioBookingsAction(serverFilters),
		placeholderData: (prev) => prev,
	});

	const allRows = queryData ?? [];

	// Client-side sort (server returns all matching rows for simplicity)
	const sorted = [...allRows].sort((a, b) => {
		const mul = sortDir === "asc" ? 1 : -1;
		if (sortField === "createdAt")
			return (
				mul *
				(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
			);
		if (sortField === "startDate")
			return (
				mul *
				(new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
			);
		if (sortField === "totalAmount")
			return mul * (a.totalAmount - b.totalAmount);
		if (sortField === "status") return mul * a.status.localeCompare(b.status);
		return 0;
	});

	// Client-side pagination
	const totalCount = sorted.length;
	const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
	const bookings = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	const refreshData = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["studio-bookings"] });
	}, [queryClient]);

	const openBooking = (booking: StudioBookingRow) => {
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

	// ── Export CSV ─────────────────────────────────────────────────────────────
	const handleExport = () => {
		const rows = [
			[
				"ID",
				"Клиент",
				"Email",
				"Тариф",
				"Начало",
				"Конец",
				"Часов",
				"Сумма",
				"Статус",
			],
			...bookings.map((b) => [
				b.id,
				b.userName ?? "",
				b.userEmail ?? "",
				b.tariffName,
				new Date(b.startDate).toLocaleString("ru-RU"),
				new Date(b.endDate).toLocaleString("ru-RU"),
				b.durationHours,
				b.totalAmount,
				BOOKING_STATUS_CONFIG[b.status]?.label ?? b.status,
			]),
		];
		const csv = rows.map((r) => r.join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `studio_bookings_${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("CSV экспортирован");
	};

	// ── Active filter chips ────────────────────────────────────────────────────
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
	if (tariffFilter !== "all") {
		const t = tariffs.find((t) => t.id === tariffFilter);
		activeFilters.push({
			label: `Тариф: ${t?.name ?? tariffFilter}`,
			onRemove: () => setTariffFilter("all"),
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

	const totalSum = bookings.reduce((s, b) => s + b.totalAmount, 0);
	const isLoading = isFetching && !queryData;

	return (
		<div className="space-y-4 relative">
			{/* ── Controls ── */}
			<Card>
				<CardContent className="p-3 space-y-3">
					<div className="flex flex-col sm:flex-row gap-3">
						{/* Search */}
						<div className="relative flex-1">
							<MagnifyingGlassIcon className="z-1 absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								placeholder="Клиент, email, телефон..."
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

						{/* Action buttons */}
						<div className="flex gap-2 shrink-0">
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"h-9 gap-2",
									showFilters && "border-primary text-primary"
								)}
								onClick={() => setShowFilters(!showFilters)}
							>
								<FunnelIcon size={13} />
								Ещё
								{(dateFrom || dateTo || tariffFilter !== "all") && (
									<span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
										{(dateFrom ? 1 : 0) +
											(dateTo ? 1 : 0) +
											(tariffFilter !== "all" ? 1 : 0)}
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

					{/* Extended filters */}
					{showFilters && (
						<div className="pt-2 border-t border-foreground/5 flex flex-wrap gap-3 items-end">
							{/* Tariff filter */}
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">
									Тариф
								</p>
								<Select
									value={tariffFilter}
									onValueChange={(v) => setTariffFilter(v)}
								>
									<SelectTrigger className="h-8 w-44 text-xs">
										<SelectValue placeholder="Все тарифы" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Все тарифы</SelectItem>
										{tariffs.map((t) => (
											<SelectItem key={t.id} value={t.id}>
												{t.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{/* Date range */}
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
							{(dateFrom || dateTo || tariffFilter !== "all") && (
								<Button
									variant="ghost"
									size="sm"
									className="h-8 text-xs text-muted-foreground gap-1"
									onClick={() => {
										setDateFrom("");
										setDateTo("");
										setTariffFilter("all");
									}}
								>
									<XIcon size={11} /> Сброс
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
									setTariffFilter("all");
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

			{/* ── Summary strip ── */}
			<div className="flex items-center gap-4 text-sm text-muted-foreground px-1">
				<span>
					Найдено: <strong className="text-foreground">{totalCount}</strong>
				</span>
				{isFetching && !isLoading && (
					<span className="text-primary/60 flex items-center gap-1">
						<span className="w-2 h-2 border border-primary/40 border-t-primary rounded-full animate-spin" />
						Обновление...
					</span>
				)}
				<span className="ml-auto font-bold text-foreground">
					{totalSum.toLocaleString("ru-RU")} ₽
				</span>
			</div>

			{/* ── Table ── */}
			<Card className="overflow-hidden relative">
				{/* Loading bar */}
				<div
					className={cn(
						"absolute top-0 left-0 w-full h-0.5 z-50 bg-primary/10 overflow-hidden transition-opacity duration-300",
						isFetching ? "opacity-100" : "opacity-0"
					)}
				>
					<div className="h-full bg-primary w-1/2 rounded-full animate-[pulse_1s_ease-in-out_infinite] origin-left" />
				</div>

				<div className="overflow-x-auto">
					<Table className="w-full">
						<TableHeader className="bg-muted-foreground/20">
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
								<TableHead>Тариф</TableHead>
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
							{isLoading
								? Array.from({ length: 8 }).map((_, i) => (
										<TableRow key={i} className="border-foreground/5">
											{Array.from({ length: 8 }).map((_, j) => (
												<TableCell key={j}>
													<div className="h-4 bg-foreground/5 rounded animate-pulse" />
												</TableCell>
											))}
										</TableRow>
									))
								: bookings.map((booking) => {
										const createdDate = new Date(
											booking.createdAt
										).toLocaleDateString("ru-RU", {
											day: "numeric",
											month: "short",
										});

										return (
											<TableRow
												key={booking.id}
												className={cn(
													"border-foreground/5 cursor-pointer hover:bg-foreground/3 transition-colors",
													activeBooking?.id === booking.id &&
														sheetOpen &&
														"bg-foreground/7",
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
												<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
													{createdDate}
												</TableCell>
												<TableCell>
													<p className="text-sm font-medium truncate max-w-32">
														{booking.userName || "Без имени"}
													</p>
													<p className="text-[11px] text-muted-foreground truncate max-w-32">
														{booking.userPhone || booking.userEmail || "—"}
													</p>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-1.5">
														<VideoIcon
															size={13}
															className="text-primary/60 shrink-0"
														/>
														<span className="text-sm truncate max-w-28">
															{booking.tariffName}
														</span>
													</div>
													{booking.itemsCount > 0 && (
														<p className="text-[10px] text-muted-foreground mt-0.5">
															+ {booking.itemsCount} позиц.
														</p>
													)}
												</TableCell>
												<TableCell>
													<DurationCell booking={booking} />
												</TableCell>
												<TableCell className="font-bold text-sm whitespace-nowrap">
													{booking.totalAmount.toLocaleString("ru-RU")} ₽
												</TableCell>
												<TableCell onClick={(e) => e.stopPropagation()}>
													<PaymentBadge status={booking.paymentStatus} />
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
																				await updateStudioBookingStatusAction(
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
						Заказов на аренду студии не найдено
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between px-4 py-3 border-t border-foreground/5 bg-foreground/5">
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
								Вперёд
							</Button>
						</div>
					</div>
				)}
			</Card>

			{/* Detail Sheet */}
			<StudioBookingDetailSheet
				booking={(activeBooking?.id as unknown as StudioBookingRow) ?? null}
				open={sheetOpen}
				onOpenChange={(open) => {
					setSheetOpen(open);
					if (!open) setTimeout(() => setActiveBooking(null), 300);
					refreshData();
				}}
				onStatusUpdate={refreshData}
			/>

			{/* Create Sheet */}
			<CreateStudioBookingSheet
				open={createOpen}
				onOpenChange={setCreateOpen}
				tariffs={tariffs}
				onCreated={() => {
					refreshData();
					setCreateOpen(false);
				}}
			/>
		</div>
	);
}
