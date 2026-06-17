"use client";

import { PackageIcon, TagChevronIcon, XIcon } from "@phosphor-icons/react";
import { differenceInHours, isWithinInterval, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BookingQuickDialog } from "@/components/dashboard/bookings/BookingQuickDialog";
import { ClientTime } from "@/components/shared";
import {
	Button,
	Card,
	Dialog,
	DialogTrigger,
	Input,
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

interface Filters {
	search: string;
	status: string;
	dateFrom: string;
	dateTo: string;
}

export function BookingsTable({
	bookings,
	initialStatus = "",
}: {
	bookings: BookingRow[];
	initialStatus?: string;
}) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const [filters, setFilters] = useState<Filters>({
		search: "",
		status: initialStatus,
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

	const filtered = useMemo(() => {
		return bookings.filter((b) => {
			if (filters.search) {
				const q = filters.search.toLowerCase();
				const idMatch = b.id.split("-")[0]?.toLowerCase().includes(q);
				const titleMatch = b.bookingItems.some((item) =>
					item.equipment.title.toLowerCase().includes(q)
				);
				if (!idMatch && !titleMatch) return false;
			}

			if (filters.status && b.status !== filters.status) return false;

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
				<div className="relative flex-1">
					<Input
						type="text"
						placeholder="Поиск по № или названию"
						value={filters.search}
						onChange={(e) => setFilter("search", e.target.value)}
						className="w-full h-9 border border-border/80"
					/>
				</div>

				<select
					value={filters.status}
					onChange={(e) => setFilter("status", e.target.value)}
					className={cn(
						"h-9 px-3 rounded-xl text-sm font-medium",
						"border border-border/80",
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
					<Input
						type="date"
						value={filters.dateFrom}
						onChange={(e) => setFilter("dateFrom", e.target.value)}
						className="h-9 px-3 rounded-xl text-sm bg-muted/30 border border-border/80 text-foreground cursor-pointer"
					/>
					<Input
						type="date"
						value={filters.dateTo}
						onChange={(e) => setFilter("dateTo", e.target.value)}
						className="h-9 px-3 rounded-xl text-sm bg-muted/30 border border-border/80 text-foreground cursor-pointer"
					/>
				</div>

				<Button
					variant="outline"
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
						<span className="px-2.5 py-1 rounded-full bg-primary/foreground text-primary font-medium border border-primary/20 flex items-center gap-1.5">
							«{filters.search}»
							<button type="button" onClick={() => setFilter("search", "")}>
								<XIcon size={10} />
							</button>
						</span>
					)}
					{filters.status && (
						<span className="px-2.5 py-1 rounded-full bg-muted-foreground/20 text-foreground font-medium border border-border flex items-center gap-1.5">
							{getStatusLabel(filters.status)}
							<button type="button" onClick={() => setFilter("status", "")}>
								<XIcon size={10} />
							</button>
						</span>
					)}
					{(filters.dateFrom || filters.dateTo) && (
						<span className="px-2.5 py-1 rounded-full bg-muted-foreground/20 text-foreground font-medium border border-border flex items-center gap-1.5">
							{filters.dateFrom || "…"} — {filters.dateTo || "…"}
							<button
								type="button"
								onClick={() => {
									setFilter("dateFrom", "");
									setFilter("dateTo", "");
								}}
							>
								<XIcon size={10} />
							</button>
						</span>
					)}
					<span className="px-2.5 py-1 text-muted-foreground">
						{filtered.length} из {bookings.length}
					</span>
				</div>
			)}

			{/* ── Table ── */}
			<Card className="rounded-xl overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted-foreground/30">
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
								<Dialog key={booking.id}>
									<DialogTrigger asChild>
										<TableRow
											className={cn(
												"border-border/60 transition-colors cursor-pointer",
												isSelected
													? "bg-secondary/60 hover:bg-secondary"
													: "hover:bg-muted-foreground/10"
											)}
										>
											{/* Чекбокс останавливает всплытие, чтобы при выборе не открывалось модальное окно */}
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

											{/* Номер заказа */}
											<TableCell className="py-4">
												<div className="font-mono text-xs font-bold text-foreground">
													№ {booking.id.split("-")[0]?.toUpperCase()}
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

											{/* Период */}
											<TableCell className="py-4 table-cell">
												<div className="text-sm font-medium">
													<ClientTime
														iso={booking.startDate}
														fmt="datetime"
														fallback="---"
													/>
													{" — "}
													<ClientTime
														iso={booking.endDate}
														fmt="datetime"
														fallback="---"
													/>
												</div>
												<div className="text-[11px] text-muted-foreground mt-0.5">
													{hours} ч.
												</div>
											</TableCell>

											{/* Позиции */}
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

											{/* Статус */}
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

											{/* Сумма */}
											<TableCell className="py-4">
												<div className="font-black text-sm tabular-nums">
													{fmtRub(booking.totalAmount)}
												</div>
											</TableCell>
										</TableRow>
									</DialogTrigger>

									<BookingQuickDialog
										booking={{ ...dashboardBooking, kind: "equipment" }}
										hours={hours}
										href={`/dashboard/bookings/${booking.id}`}
									/>
								</Dialog>
							);
						})}
					</TableBody>
				</Table>

				{filtered.length === 0 && (
					<div className="py-16 text-center text-muted-foreground">
						<PackageIcon weight="duotone" size={32} className="mx-auto mb-3" />
						{hasActiveFilters ? (
							<>
								<p className="text-xs text-muted-foreground font-light">
									Ничего не найдено
								</p>
								<Button variant="ghost" onClick={clearFilters} className="mt-2">
									Сбросить фильтры
								</Button>
							</>
						) : (
							<>
								<p className="text-xs text-muted-foreground font-light">
									Заказов пока нет
								</p>
								<Button asChild variant="ghost" className="mt-2">
									<Link href="/equipment">Перейти в каталог</Link>
								</Button>
							</>
						)}
					</div>
				)}
			</Card>
		</div>
	);
}
