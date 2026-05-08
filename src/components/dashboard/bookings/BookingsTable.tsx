"use client";

import { TagChevronIcon } from "@phosphor-icons/react";
import { differenceInHours, isWithinInterval, parseISO } from "date-fns";
import { Package, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientTime } from "@/components/shared";
import {
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_STYLES } from "@/constants";
import type {
	BookingRow,
	BookingStatus,
	DashboardBooking,
} from "@/core/domain/entities/Booking";
import { cn, fmtRub } from "@/lib/utils";
import { BookingDetailDialog } from "./Bookingdetailsdialog";

function getStatusLabel(status: string): string {
	return BOOKING_STATUS_LABELS[status as BookingStatus] ?? status;
}
function getStatusStyle(status: string): string {
	return (
		BOOKING_STATUS_STYLES[status as BookingStatus] ??
		"bg-foreground/5 text-muted-foreground border-foreground/10"
	);
}

function asDashboardBooking(row: BookingRow): DashboardBooking {
	return {
		...row,
		bookingItems: row.bookingItems.map((item) => ({
			...item,
			imageUrl: item.imageUrl ?? null,
		})),
	};
}

// ─── Filter state ─────────────────────────────────────────────────────────────
interface Filters {
	search: string;
	status: string;
	dateFrom: string;
	dateTo: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BookingsTable({ bookings }: { bookings: BookingRow[] }) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const [filters, setFilters] = useState<Filters>({
		search: "",
		status: "",
		dateFrom: "",
		dateTo: "",
	});

	const toggleRow = (id: string) => {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		setSelectedIds(newSet);
	};

	const toggleAll = () => {
		if (selectedIds.size === filtered.length && filtered.length > 0) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(filtered.map((b) => b.id)));
		}
	};

	const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
		setFilters((prev) => ({ ...prev, [key]: value }));

	const clearFilters = () =>
		setFilters({ search: "", status: "", dateFrom: "", dateTo: "" });

	const hasActiveFilters =
		filters.search || filters.status || filters.dateFrom || filters.dateTo;

	// ── Filtered bookings ──────────────────────────────────────────────────────
	const filtered = useMemo(() => {
		return bookings.filter((b) => {
			// Search: order ID prefix or any item title
			if (filters.search) {
				const q = filters.search.toLowerCase();
				const idMatch = b.id.split("-")[0]?.toLowerCase().includes(q);
				const titleMatch = b.bookingItems.some((item) =>
					item.equipment.title.toLowerCase().includes(q)
				);
				if (!idMatch && !titleMatch) return false;
			}

			// Status filter
			if (filters.status && b.status !== filters.status) return false;

			// Date range: booking start_date must fall within the selected range
			if (filters.dateFrom || filters.dateTo) {
				const start = b.startDate;
				const from = filters.dateFrom
					? parseISO(filters.dateFrom)
					: new Date(0);
				const to = filters.dateTo
					? parseISO(`${filters.dateTo}T23:59:59`)
					: new Date(8.64e15);
				if (!isWithinInterval(start, { start: from, end: to })) return false;
			}

			return true;
		});
	}, [bookings, filters]);

	const allStatuses = Array.from(new Set(bookings.map((b) => b.status)));

	return (
		<div className="space-y-4">
			{/* ── Search & filter bar ── */}
			<div className="flex flex-col sm:flex-row gap-2">
				{/* Search */}
				<div className="relative flex-1">
					<input
						type="text"
						placeholder="Поиск по № или названию"
						value={filters.search}
						onChange={(e) => setFilter("search", e.target.value)}
						className={cn(
							"w-full h-9 px-3 rounded-xl text-sm",
							"bg-muted/30 border border-border",
							"placeholder:text-muted-foreground/50",
							"focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
							"transition-all"
						)}
					/>
				</div>

				{/* Status select */}
				<select
					value={filters.status}
					onChange={(e) => setFilter("status", e.target.value)}
					className={cn(
						"h-9 px-3 rounded-xl text-sm font-medium",
						"border border-border",
						"focus:outline-none focus:ring-2 focus:ring-primary/30",
						"text-foreground cursor-pointer min-w-32",
						!filters.status && "text-muted-foreground"
					)}
				>
					<option value="">Все статусы</option>
					{allStatuses.map((s) => (
						<option key={s} value={s}>
							{getStatusLabel(s)}
						</option>
					))}
				</select>

				<div className="relative flex gap-2">
					{/* Date from */}
					<input
						type="date"
						value={filters.dateFrom}
						onChange={(e) => setFilter("dateFrom", e.target.value)}
						className={cn(
							"h-9 px-3 rounded-xl text-sm",
							"bg-muted/30 border border-border",
							"focus:outline-none focus:ring-2 focus:ring-primary/30",
							"text-foreground cursor-pointer"
						)}
					/>
					{/* Date to */}
					<input
						type="date"
						value={filters.dateTo}
						onChange={(e) => setFilter("dateTo", e.target.value)}
						className={cn(
							"h-9 px-3 rounded-xl text-sm",
							"bg-muted/30 border border-border",
							"focus:outline-none focus:ring-2 focus:ring-primary/30",
							"text-foreground cursor-pointer"
						)}
					/>
				</div>

				{/* Clear */}
				<Button
					variant="social"
					onClick={clearFilters}
					disabled={!hasActiveFilters}
				>
					Сбросить
				</Button>
			</div>

			{/* ── Active filter chips ── */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-1.5 text-xs">
					{filters.search && (
						<span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20 flex items-center gap-1.5">
							«{filters.search}»
							<button type="button" onClick={() => setFilter("search", "")}>
								<X size={10} />
							</button>
						</span>
					)}
					{filters.status && (
						<span className="px-2.5 py-1 rounded-full bg-muted/40 text-foreground font-medium border border-border flex items-center gap-1.5">
							{getStatusLabel(filters.status)}
							<button type="button" onClick={() => setFilter("status", "")}>
								<X size={10} />
							</button>
						</span>
					)}
					{(filters.dateFrom || filters.dateTo) && (
						<span className="px-2.5 py-1 rounded-full bg-muted/40 text-foreground font-medium border border-border flex items-center gap-1.5">
							{filters.dateFrom || "…"} — {filters.dateTo || "…"}
							<button
								type="button"
								onClick={() => {
									setFilter("dateFrom", "");
									setFilter("dateTo", "");
								}}
							>
								<X size={10} />
							</button>
						</span>
					)}
					<span className="px-2.5 py-1 text-muted-foreground">
						{filtered.length} из {bookings.length}
					</span>
				</div>
			)}

			{/* ── Table ── */}
			<div className="rounded-xl border border-border overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent border-border bg-muted-foreground/30">
							{/* Чекбокс "Выбрать все" */}
							<TableHead className="w-10 px-4">
								<input
									type="checkbox"
									className="accent-primary scale-110 cursor-pointer"
									checked={
										filtered.length > 0 && selectedIds.size === filtered.length
									}
									onChange={toggleAll}
								/>
							</TableHead>
							<TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2">
								Заказ
							</TableHead>
							<TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2 table-cell">
								Период
							</TableHead>
							<TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2 table-cell">
								Позиции
							</TableHead>
							<TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2">
								Статус
							</TableHead>
							<TableHead className="py-3 w-24">Сумма</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.map((booking) => {
							const isSelected = selectedIds.has(booking.id);
							const hours = Math.ceil(
								differenceInHours(
									new Date(booking.endDate),
									new Date(booking.startDate)
								)
							);

							const dashboardBooking = asDashboardBooking(booking);

							return (
								<BookingDetailDialog
									key={booking.id}
									booking={dashboardBooking}
									hours={hours}
								>
									<TableRow
										className={cn(
											"border-border transition-colors cursor-pointer",
											isSelected
												? "bg-secondary/40 hover:bg-secondary"
												: "hover:bg-muted-foreground/10"
										)}
									>
										<TableCell
											className="px-4"
											onClick={(e) => e.stopPropagation()}
										>
											<input
												type="checkbox"
												className="accent-primary scale-110 cursor-pointer"
												checked={isSelected}
												onChange={() => toggleRow(booking.id)}
											/>
										</TableCell>
										{/* Order ID */}
										<TableCell className="py-4">
											<div className="font-black text-sm tabular-nums">
												{fmtRub(booking.totalAmount)}
											</div>
											{booking.promoCode && (
												<div className="flex items-center gap-1 mt-0.5">
													<TagChevronIcon
														size={9}
														className="text-green-500 shrink-0"
													/>
													<span className="text-[10px] font-mono text-green-600 font-semibold">
														{booking.promoCode}
													</span>
												</div>
											)}
										</TableCell>

										{/* Dates */}
										<TableCell className="py-4 table-cell">
											<div className="text-sm font-medium">
												{
													<ClientTime
														iso={booking.startDate}
														fmt="datetime"
														fallback="---"
													/>
												}
												{" — "}
												{
													<ClientTime
														iso={booking.endDate}
														fmt="datetime"
														fallback="---"
													/>
												}
											</div>
											<div className="text-[11px] text-muted-foreground mt-0.5">
												{hours} ч.
											</div>
										</TableCell>

										{/* Items */}
										<TableCell className="py-4 table-cell">
											<div className="text-sm">
												{booking.bookingItems.length} поз.
											</div>
											<div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-40">
												{booking.bookingItems[0]?.equipment.title}
												{booking.bookingItems.length > 1 &&
													` +${booking.bookingItems.length - 1}`}
											</div>
										</TableCell>

										{/* Status */}
										<TableCell className="py-4">
											<span
												className={cn(
													"inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
													getStatusStyle(booking.status)
												)}
											>
												{getStatusLabel(booking.status)}
											</span>
										</TableCell>

										{/* Amount */}
										<TableCell className="py-4">
											<div className="font-black text-sm tabular-nums">
												{fmtRub(booking.totalAmount)}
											</div>
										</TableCell>
									</TableRow>
								</BookingDetailDialog>
							);
						})}
					</TableBody>
				</Table>

				{filtered.length === 0 && (
					<div className="py-16 text-center text-muted-foreground">
						<Package size={28} className="mx-auto mb-3 opacity-20" />
						{hasActiveFilters ? (
							<>
								<p className="text-sm font-medium">Ничего не найдено</p>
								<button
									type="button"
									onClick={clearFilters}
									className="mt-2 text-primary text-sm hover:underline"
								>
									Сбросить фильтры
								</button>
							</>
						) : (
							<>
								<p className="text-sm font-medium">Заказов пока нет</p>
								<Link
									href="/equipment"
									className="text-primary text-sm hover:underline mt-2 inline-block"
								>
									Перейти в каталог
								</Link>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
