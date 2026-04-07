"use client";

import {
	ArrowsClockwiseIcon,
	CaretDownIcon,
	CaretUpDownIcon,
	CaretUpIcon,
	ClockIcon,
	DotsThreeVerticalIcon,
	EyeIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
	ProhibitIcon,
	UploadSimpleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { updateBookingStatusAction } from "@/actions/booking-actions";
import { BookingDetailSheet } from "@/components/admin/bookings/BookingDetailSheet";
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
import type { AdminBookingRow } from "./BookingDetailSheet";

export type { AdminBookingRow };

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

const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
	PENDING_REVIEW: ["WAIT_PAYMENT", "READY_TO_RENT", "CANCELLED"],
	WAIT_PAYMENT: ["READY_TO_RENT", "CANCELLED"],
	READY_TO_RENT: ["ACTIVE", "CANCELLED"],
	ACTIVE: ["COMPLETED"],
	COMPLETED: [],
	CANCELLED: [],
	EXPIRED: ["PENDING_REVIEW", "CANCELLED"],
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminBookingsTable({
	initialBookings,
}: {
	initialBookings: AdminBookingRow[];
}) {
	const [bookings, setBookings] = useState(initialBookings);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
		"all"
	);
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortDir, setSortDir] = useState<SortDir>("desc");
	const [activeBooking, setActiveBooking] = useState<AdminBookingRow | null>(
		null
	);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [showFilters, setShowFilters] = useState(false);
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");

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

	const handleStatusUpdate = useCallback(
		(id: string, status: BookingStatus) => {
			setBookings((prev) =>
				prev.map((b) => (b.id === id ? { ...b, status } : b))
			);
			if (activeBooking?.id === id) {
				setActiveBooking((b) => (b ? { ...b, status } : b));
			}
		},
		[activeBooking]
	);

	const handleBookingUpdate = useCallback(
		(updatedBooking: AdminBookingRow) => {
			setBookings((prev) =>
				prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
			);
			if (activeBooking?.id === updatedBooking.id) {
				setActiveBooking(updatedBooking);
			}
		},
		[activeBooking?.id]
	);

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
			...filtered.map((b) => [
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
		toast.success("CSV экспортирован");
	};

	const filtered = bookings
		.filter((b) => {
			if (statusFilter !== "all" && b.status !== statusFilter) return false;
			if (search) {
				const q = search.toLowerCase();
				const matchesClient =
					b.clientName?.toLowerCase().includes(q) ||
					b.clientEmail?.toLowerCase().includes(q);
				const matchesEquipment = b.equipmentTitles.some((t) =>
					t.toLowerCase().includes(q)
				);
				const matchesId = b.id.toLowerCase().includes(q);
				if (!matchesClient && !matchesEquipment && !matchesId) return false;
			}
			if (dateFrom && new Date(b.startDate) < new Date(dateFrom)) return false;
			if (dateTo && new Date(b.endDate) > new Date(dateTo)) return false;
			return true;
		})
		.sort((a, b) => {
			let cmp = 0;
			if (sortField === "totalAmount") {
				cmp = a.totalAmount - b.totalAmount;
			} else if (sortField === "status") {
				cmp = a.status.localeCompare(b.status);
			} else {
				cmp =
					new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime();
			}
			return sortDir === "asc" ? cmp : -cmp;
		});

	const totalAmount = filtered.reduce((s, b) => s + b.totalAmount, 0);
	const pendingCount = filtered.filter(
		(b) => b.status === "PENDING_REVIEW"
	).length;

	return (
		<div className="space-y-4">
			{/* Controls */}
			<Card>
				<CardContent className="p-3">
					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative flex-1">
							<MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
							<Input
								placeholder="Поиск по клиенту, технике, ID..."
								className="pl-9 h-9"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>

						<Select
							value={statusFilter}
							onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
						>
							<SelectTrigger className="h-9 w-48">
								<SelectValue />
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

						<Button
							variant="outline"
							size="sm"
							className="h-9 gap-2"
							onClick={() => setShowFilters((v) => !v)}
						>
							<FunnelIcon size={13} />
							Фильтры
							{(dateFrom || dateTo) && (
								<span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
									!
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
					</div>

					{showFilters && (
						<div className="mt-3 pt-3 border-t border-foreground/5 flex flex-wrap gap-3 items-end">
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">
									Дата начала от
								</p>
								<Input
									type="date"
									className="h-8 text-xs w-40"
									value={dateFrom}
									onChange={(e) => setDateFrom(e.target.value)}
								/>
							</div>
							<div className="space-y-1">
								<p className="text-xs text-muted-foreground font-medium">до</p>
								<Input
									type="date"
									className="h-8 text-xs w-40"
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
									<XIcon size={11} /> Сбросить
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Summary strip */}
			<div className="flex items-center gap-4 text-sm text-muted-foreground px-1">
				<span>
					Найдено:{" "}
					<strong className="text-foreground">{filtered.length}</strong>
				</span>
				{pendingCount > 0 && (
					<span className="text-amber-400 font-medium flex items-center gap-1">
						<ClockIcon size={12} /> {pendingCount} ожидает проверки
					</span>
				)}
				<span className="ml-auto font-bold text-foreground">
					{totalAmount.toLocaleString("ru-RU")} ₽
				</span>
			</div>

			{/* Table */}
			<Card>
				<Table>
					<TableHeader>
						<TableRow className="border-foreground/5">
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
						{filtered.map((booking) => {
							const createdDate = new Date(
								booking.createdAt
							).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
							const startDate = new Date(booking.startDate).toLocaleDateString(
								"ru-RU",
								{ day: "numeric", month: "short" }
							);
							const endDate = new Date(booking.endDate).toLocaleDateString(
								"ru-RU",
								{
									day: "numeric",
									month: "short",
								}
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
										<p className="text-sm truncate max-w-36 text-muted-foreground">
											{booking.equipmentTitles[0] ?? "—"}
										</p>
										{booking.itemCount > 1 && (
											<p className="text-[10px] text-muted-foreground/60">
												+{booking.itemCount - 1} поз.
											</p>
										)}
									</TableCell>
									<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
										{startDate} — {endDate}
									</TableCell>
									<TableCell className="font-bold text-sm whitespace-nowrap">
										{booking.totalAmount.toLocaleString("ru-RU")} ₽
									</TableCell>
									<TableCell>
										<StatusBadge status={booking.status} />
									</TableCell>
									<TableCell
										className="text-right"
										onClick={(e) => e.stopPropagation()}
									>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<DotsThreeVerticalIcon className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => openBooking(booking)}>
													<EyeIcon className="w-4 h-4 mr-2" /> Подробнее
												</DropdownMenuItem>
												{(NEXT_STATUSES[booking.status] ?? []).length > 0 && (
													<>
														<DropdownMenuSeparator />
														{(NEXT_STATUSES[booking.status] ?? []).map((s) => (
															<DropdownMenuItem
																key={s}
																onClick={async () => {
																	const r = await updateBookingStatusAction(
																		booking.id,
																		s
																	);
																	if (r.success) {
																		handleStatusUpdate(booking.id, s);
																		toast.success(
																			`Статус → ${BOOKING_STATUS_CONFIG[s].label}`
																		);
																	} else {
																		toast.error(r.error ?? "Ошибка");
																	}
																}}
																className={
																	s === "CANCELLED" ? "text-red-500" : ""
																}
															>
																{s === "CANCELLED" ? (
																	<ProhibitIcon className="w-4 h-4 mr-2" />
																) : (
																	<ArrowsClockwiseIcon className="w-4 h-4 mr-2" />
																)}
																→ {BOOKING_STATUS_CONFIG[s].label}
															</DropdownMenuItem>
														))}
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
				{filtered.length === 0 && (
					<div className="text-center py-12 text-muted-foreground text-sm">
						Бронирования не найдены
					</div>
				)}
			</Card>

			{/* Sheet */}
			<BookingDetailSheet
				booking={activeBooking}
				open={sheetOpen}
				onOpenChange={(open) => {
					setSheetOpen(open);
					if (!open) setActiveBooking(null);
				}}
				onStatusUpdate={handleStatusUpdate}
				onBookingUpdate={handleBookingUpdate}
			/>
		</div>
	);
}
