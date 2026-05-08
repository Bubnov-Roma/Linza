"use client";

import { isAfter, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, ChevronDown, Clock } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { DayPicker } from "react-day-picker";
import { createPortal } from "react-dom";
import { ClientTime } from "@/components/shared/ClientTime";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui";
import { clampTime, cn, generateTimeSlots } from "@/lib/utils";
import { useSiteSettingsStore } from "@/store";

export interface RentalPeriodValue {
	startDate: Date;
	endDate: Date;
	startTime: string;
	endTime: string;
}

interface RentalPeriodProps {
	value: RentalPeriodValue;
	onChange: (value: RentalPeriodValue) => void;
	className?: string;
	disablePast?: boolean;
}

type PickerType = "start-date" | "end-date" | "start-time" | "end-time" | null;

export function getDefaultRentalPeriod(
	workStart: number,
	workEnd: number
): RentalPeriodValue {
	const now = new Date();
	const start = new Date(now);
	const mins = Math.ceil((now.getMinutes() + 1) / 10) * 10;
	start.setMinutes(mins, 0, 0);
	if (start.getHours() < workStart) start.setHours(workStart, 0, 0, 0);
	if (start.getHours() >= workEnd) {
		start.setDate(start.getDate() + 1);
		start.setHours(workStart, 0, 0, 0);
	}
	const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
	const pad = (n: number) => String(n).padStart(2, "0");
	return {
		startDate: start,
		endDate: end,
		startTime: clampTime(
			`${pad(start.getHours())}:${pad(start.getMinutes())}`,
			start,
			workStart,
			workEnd
		),
		endTime: clampTime(
			`${pad(end.getHours())}:${pad(end.getMinutes())}`,
			end,
			workStart,
			workEnd
		),
	};
}

export function RentalPeriod({
	value,
	onChange,
	className,
	disablePast = true,
}: RentalPeriodProps) {
	const [openPicker, setOpenPicker] = useState<PickerType>(null);
	const [isMobile, setIsMobile] = useState(false);

	const { workStart, workEnd, disabledDates } = useSiteSettingsStore();

	// Определяем мобильный размер экрана
	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		const listener = () => checkMobile();
		window.addEventListener("resize", listener);
		return () => window.removeEventListener("resize", listener);
	}, []);

	const toggle = useCallback((picker: NonNullable<PickerType>) => {
		setOpenPicker((p) => (p === picker ? null : picker));
	}, []);

	const close = useCallback(() => setOpenPicker(null), []);
	const today = startOfDay(new Date());

	const handleStartDateSelect = useCallback(
		(d: Date | undefined) => {
			if (!d) return;
			const newStart = new Date(d);
			const [sh, sm] = value.startTime.split(":").map(Number);
			newStart.setHours(sh ?? workStart, sm ?? 0, 0, 0);
			let newEnd = new Date(value.endDate);
			if (isBefore(newEnd, newStart))
				newEnd = new Date(newStart.getTime() + 4 * 60 * 60 * 1000);
			onChange({
				...value,
				startDate: newStart,
				endDate: newEnd,
				startTime: clampTime(value.startTime, d, workStart, workEnd),
			});
			close();
		},
		[value, onChange, close, workStart, workEnd]
	);

	const handleEndDateSelect = useCallback(
		(d: Date | undefined) => {
			if (!d || isBefore(d, startOfDay(value.startDate))) return;
			const newEnd = new Date(d);
			const [eh, em] = value.endTime.split(":").map(Number);
			newEnd.setHours(eh ?? workStart, em ?? 0, 0, 0);
			onChange({ ...value, endDate: newEnd });
			close();
		},
		[value, onChange, close, workStart]
	);

	const handleStartTimeSelect = useCallback(
		(time: string) => {
			onChange({ ...value, startTime: time });
			close();
		},
		[value, onChange, close]
	);

	const handleEndTimeSelect = useCallback(
		(time: string) => {
			onChange({ ...value, endTime: time });
			close();
		},
		[value, onChange, close]
	);

	const disabledDatesObjects = useMemo(
		() => disabledDates.map((d) => new Date(d)),
		[disabledDates]
	);

	const disableStartDate = (d: Date) => {
		if (disablePast && isBefore(d, today)) return true;
		return disabledDatesObjects.some(
			(dis) => dis.toDateString() === d.toDateString()
		);
	};

	const disableEndDate = (d: Date) => {
		if (disablePast && isBefore(d, today)) return true;
		if (isBefore(d, startOfDay(value.startDate))) return true;
		return disabledDatesObjects.some(
			(dis) => dis.toDateString() === d.toDateString()
		);
	};

	return (
		<div className={cn("space-y-2", className)}>
			<PeriodRow
				label="Начало аренды"
				date={value.startDate}
				time={value.startTime}
				isDateOpen={openPicker === "start-date"}
				isTimeOpen={openPicker === "start-time"}
				onDateToggle={() => toggle("start-date")}
				onTimeToggle={() => toggle("start-time")}
				onClose={close}
				isMobile={isMobile}
				renderCalendar={() => (
					<PortalCalendar
						selected={value.startDate}
						onSelect={handleStartDateSelect}
						disabled={disableStartDate}
						defaultMonth={value.startDate}
					/>
				)}
				renderTime={() => (
					<PortalTimeDropdown
						value={value.startTime}
						onSelect={handleStartTimeSelect}
						selectedDate={value.startDate}
						isMobile={isMobile}
						workStart={workStart}
						workEnd={workEnd}
					/>
				)}
			/>
			<PeriodRow
				label="Конец аренды"
				date={value.endDate}
				time={value.endTime}
				isDateOpen={openPicker === "end-date"}
				isTimeOpen={openPicker === "end-time"}
				onDateToggle={() => toggle("end-date")}
				onTimeToggle={() => toggle("end-time")}
				onClose={close}
				isMobile={isMobile}
				renderCalendar={() => (
					<PortalCalendar
						selected={value.endDate}
						onSelect={handleEndDateSelect}
						disabled={disableEndDate}
						defaultMonth={value.endDate}
					/>
				)}
				renderTime={() => (
					<PortalTimeDropdown
						value={value.endTime}
						onSelect={handleEndTimeSelect}
						selectedDate={value.endDate}
						isMobile={isMobile}
						workStart={workStart}
						workEnd={workEnd}
					/>
				)}
			/>
		</div>
	);
}

// ─── PeriodRow ────────────────────────────────────────────────────────────────

interface PeriodRowProps {
	label: string;
	date: Date;
	time: string;
	isDateOpen: boolean;
	isTimeOpen: boolean;
	onDateToggle: () => void;
	onTimeToggle: () => void;
	onClose: () => void;
	renderCalendar: () => React.ReactNode;
	renderTime: () => React.ReactNode;
	isMobile: boolean;
}

function PeriodRow({
	label,
	date,
	time,
	isDateOpen,
	isTimeOpen,
	onDateToggle,
	onTimeToggle,
	onClose,
	renderCalendar,
	renderTime,
	isMobile,
}: PeriodRowProps) {
	const dateBtnRef = useRef<HTMLButtonElement>(null);
	const timeBtnRef = useRef<HTMLButtonElement>(null);

	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const dateLabel = useMemo(
		() =>
			mounted ? <ClientTime iso={date} fmt="date" fallback="-" /> : "\u00a0",
		[mounted, date]
	);

	// Mobile Drawer
	if (isMobile) {
		return (
			<div className="space-y-1.5">
				<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1">
					{label}
				</span>
				<div className="flex gap-2">
					{/* Date button - Mobile */}
					<Drawer
						open={isDateOpen}
						onOpenChange={(open) => {
							if (open) onDateToggle();
							else onClose();
						}}
					>
						<button
							ref={dateBtnRef}
							type="button"
							onClick={onDateToggle}
							className={cn(
								"w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-medium transition-all select-none",
								isDateOpen
									? "border-primary/50 bg-primary/5 text-primary"
									: "border-foreground/10 bg-card/60 text-foreground hover:border-foreground/20 hover:bg-foreground/5"
							)}
						>
							<CalendarIcon
								size={13}
								className="text-muted-foreground/50 shrink-0"
							/>
							<span className="flex-1 text-left">{dateLabel}</span>
							<ChevronDown
								size={13}
								className={cn(
									"text-muted-foreground/40 transition-transform shrink-0",
									isDateOpen && "rotate-180"
								)}
							/>
						</button>
						<DrawerContent className="flex flex-col">
							<DrawerHeader className="border-b border-foreground/5 pb-4">
								<DrawerTitle className="text-center font-black uppercase italic">
									Выберите дату
								</DrawerTitle>
							</DrawerHeader>
							<div className="flex-1 overflow-y-auto p-4 flex justify-center">
								{renderCalendar()}
							</div>
						</DrawerContent>
					</Drawer>

					{/* Time button - Mobile */}
					<Drawer
						open={isTimeOpen}
						onOpenChange={(open) => {
							if (open) onTimeToggle();
							else onClose();
						}}
					>
						<button
							ref={timeBtnRef}
							type="button"
							onClick={onTimeToggle}
							className={cn(
								"w-30 flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all select-none",
								isTimeOpen
									? "border-primary/50 bg-primary/5 text-primary"
									: "border-foreground/10 bg-card/60 text-foreground hover:border-foreground/20 hover:bg-foreground/5"
							)}
						>
							<Clock size={13} className="text-muted-foreground/50 shrink-0" />
							<span className="flex-1 text-left font-mono">{time}</span>
							<ChevronDown
								size={13}
								className={cn(
									"text-muted-foreground/40 transition-transform shrink-0",
									isTimeOpen && "rotate-180"
								)}
							/>
						</button>
						<DrawerContent className="flex flex-col max-h-[80vh]">
							<DrawerHeader className="border-b border-foreground/5 pb-4">
								<DrawerTitle className="text-center font-black uppercase italic">
									Выберите время
								</DrawerTitle>
							</DrawerHeader>
							<div className="flex-1 overflow-y-auto p-2">{renderTime()}</div>
						</DrawerContent>
					</Drawer>
				</div>
			</div>
		);
	}

	// Desktop AnchoredPortal
	return (
		<>
			<p className="text-xs uppercase tracking-widest text-muted-foreground">
				{label}:
			</p>
			<div className="flex gap-2 items-center">
				{/* Date button - Desktop */}

				<div className="relative flex-1">
					<button
						ref={dateBtnRef}
						type="button"
						onClick={onDateToggle}
						className={cn(
							"w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-medium transition-all select-none",
							isDateOpen
								? "border-primary/50 bg-primary/5 text-primary"
								: "border-foreground/10 bg-card/60 text-foreground hover:border-foreground/20 hover:bg-foreground/5"
						)}
					>
						<CalendarIcon
							size={13}
							className="text-muted-foreground/50 shrink-0"
						/>
						<span className="flex-1 text-left">{dateLabel}</span>
						<ChevronDown
							size={13}
							className={cn(
								"text-muted-foreground/40 transition-transform shrink-0",
								isDateOpen && "rotate-180"
							)}
						/>
					</button>
					{isDateOpen && (
						<AnchoredPortal
							anchorRef={dateBtnRef}
							align="left"
							onClose={onClose}
						>
							{renderCalendar()}
						</AnchoredPortal>
					)}
				</div>

				{/* Time button - Desktop */}
				<div className="w-30 relative">
					<button
						ref={timeBtnRef}
						type="button"
						onClick={onTimeToggle}
						className={cn(
							"w-full flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all select-none",
							isTimeOpen
								? "border-primary/50 bg-primary/5 text-primary"
								: "border-foreground/10 bg-card/60 text-foreground hover:border-foreground/20 hover:bg-foreground/5"
						)}
					>
						<Clock size={13} className="text-muted-foreground/50 shrink-0" />
						<span className="flex-1 text-left font-mono">{time}</span>
						<ChevronDown
							size={13}
							className={cn(
								"text-muted-foreground/40 transition-transform shrink-0",
								isTimeOpen && "rotate-180"
							)}
						/>
					</button>
					{isTimeOpen && (
						<AnchoredPortal
							anchorRef={timeBtnRef}
							align="right"
							onClose={onClose}
						>
							{renderTime()}
						</AnchoredPortal>
					)}
				</div>
			</div>
		</>
	);
}

// ─── AnchoredPortal ────────────────────────────────────

function AnchoredPortal({
	anchorRef,
	align,
	onClose,
	children,
}: {
	anchorRef: React.RefObject<HTMLElement | null>;
	align: "left" | "right";
	onClose: () => void;
	children: React.ReactNode;
}) {
	const [pos, setPos] = useState<{
		top: number;
		left?: number;
		right?: number;
	} | null>(null);
	const portalRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const anchor = anchorRef.current;
		if (!anchor) return;

		const rect = anchor.getBoundingClientRect();
		const viewportHeight = window.innerHeight;
		const estimatedHeight = align === "right" ? 230 : 340;

		const spaceBelow = viewportHeight - rect.bottom;
		const spaceAbove = rect.top;

		const shouldPlaceAbove =
			spaceBelow < estimatedHeight && spaceAbove > estimatedHeight;

		const top = shouldPlaceAbove
			? rect.top - estimatedHeight - 6 // Выше (отрицательный отступ)
			: rect.bottom + 6; // Ниже (положительный отступ)

		setPos(
			align === "left"
				? { top, left: rect.left }
				: { top, right: window.innerWidth - rect.right }
		);
	}, [anchorRef, align]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			const t = e.target as Node;
			if (
				portalRef.current &&
				!portalRef.current.contains(t) &&
				anchorRef.current &&
				!anchorRef.current.contains(t)
			) {
				onClose();
			}
		};

		const timerId = setTimeout(() => {
			document.addEventListener("mousedown", handler);
		}, 0);

		return () => {
			clearTimeout(timerId);
			document.removeEventListener("mousedown", handler);
		};
	}, [anchorRef, onClose]);

	useEffect(() => {
		const h = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", h);
		return () => document.removeEventListener("keydown", h);
	}, [onClose]);

	if (!pos) return null;

	return createPortal(
		<div
			ref={portalRef}
			onPointerDown={(e) => e.stopPropagation()}
			onWheel={(e) => e.stopPropagation()}
			style={{
				position: "fixed",
				top: pos.top,
				...(pos.left !== undefined ? { left: pos.left } : { right: pos.right }),
				zIndex: 100,
			}}
			className="animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
		>
			{children}
		</div>,
		document.body
	);
}

// ─── PortalCalendar ────────────────────────────────

function PortalCalendar({
	selected,
	onSelect,
	disabled,
	defaultMonth,
}: {
	selected: Date;
	onSelect: (d: Date | undefined) => void;
	disabled?: (d: Date) => boolean;
	defaultMonth?: Date;
}) {
	const now = new Date();
	const fromYear = now.getFullYear() - 5;
	const toYear = now.getFullYear() + 5;

	return (
		<div
			className="relative rounded-2xl border border-foreground/10 bg-background shadow-2xl overflow-hidden"
			style={{ minWidth: 308 }}
		>
			<DayPicker
				mode="single"
				selected={selected}
				onSelect={onSelect}
				disabled={disabled}
				startMonth={new Date(fromYear, 0)}
				endMonth={new Date(toYear, 0)}
				{...defaultMonth}
				locale={ru}
				captionLayout="dropdown"
				showOutsideDays
				classNames={{
					root: "p-3 font-sans",
					month_caption:
						"flex items-center justify-center absolute top-4 left-20",
					caption_label: "text-sm font-bold capitalize hidden",
					nav: "flex items-center justify-between rounded-xl",
					button_previous:
						"w-8 h-8 rounded-lg flex items-center justify-center bg-muted-foreground/30 transition-colors",
					button_next:
						"w-8 h-8 rounded-lg flex items-center justify-center bg-muted-foreground/30 transition-colors",
					month_grid: "w-full border-collapse mt-1",
					weekdays: "flex gap-7 justify-center py-2",
					weekday:
						"text-[11px] font-semibold text-center pb-1 uppercase opacity-40",
					week: "flex",
					day: "p-0",
					day_button:
						"flex items-center justify-center rounded-xl text-sm font-medium transition-all hover:bg-black/8 dark:hover:bg-white/8 cursor-pointer",
					selected:
						"[&>button]:!bg-[var(--brand-color)] [&>button]:!text-[var(--brand-contrast)] [&>button]:!font-bold",
					today: "[&>button]:!font-bold [&>button]:!text-[var(--brand-color)]",
					outside: "opacity-25",
					disabled: "opacity-20 pointer-events-none",
				}}
				components={{
					Day: ({ day, modifiers, ...props }) => (
						<td {...props} style={{ width: 44, height: 44, padding: 0 }}>
							<button
								type="button"
								style={{ width: 44, height: 44 }}
								className={cn(
									"flex items-center justify-center rounded-xl text-sm font-medium transition-all cursor-pointer",
									"hover:bg-black/8 dark:hover:bg-white/8",
									modifiers.selected &&
										"bg-(--brand-color)! text-(--brand-contrast)! font-bold!",
									modifiers.today &&
										!modifiers.selected &&
										"font-bold! text-(--brand-color)!",
									modifiers.outside && "opacity-25",
									modifiers.disabled &&
										"opacity-20 cursor-not-allowed pointer-events-none"
								)}
								onClick={() => !modifiers.disabled && onSelect(day.date)}
							>
								{day.date.getDate()}
							</button>
						</td>
					),
				}}
			/>
		</div>
	);
}

// ─── PortalTimeDropdown ────────────────────────────────

function PortalTimeDropdown({
	value,
	onSelect,
	selectedDate,
	isMobile,
	workStart,
	workEnd,
}: {
	value: string;
	onSelect: (t: string) => void;
	selectedDate?: Date;
	isMobile?: boolean;
	workStart: number;
	workEnd: number;
}) {
	const now = new Date();
	const isToday = selectedDate?.toDateString() === now.toDateString();

	// Генерируем слоты на лету исходя из настроек БД
	const dynamicSlots = generateTimeSlots(workStart, workEnd);

	const slots = dynamicSlots.filter((s) => {
		if (!isToday) return true;
		const [h, m] = s.split(":").map(Number);
		const d = new Date();
		d.setHours(h ?? 0, m ?? 0, 0, 0);
		return isAfter(d, now);
	});

	const selectedRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		const id = setTimeout(() => {
			selectedRef.current?.scrollIntoView({
				block: "center",
				behavior: "instant",
			});
		}, 10);
		return () => clearTimeout(id);
	}, []);

	return (
		<div
			className={cn(
				"overflow-y-scroll bg-background py-1",
				isMobile
					? "w-full max-h-[50vh] px-2"
					: "max-h-56 w-30 rounded-2xl border border-foreground/10 shadow-2xl custom-scrollbar always-show-scrollbar overscroll-contain"
			)}
		>
			{slots.map((slot) => (
				<button
					key={slot}
					ref={slot === value ? selectedRef : undefined}
					type="button"
					onClick={() => onSelect(slot)}
					className={cn(
						"px-4 font-mono transition-colors flex items-center cursor-pointer",
						isMobile
							? "h-14 w-full justify-center text-lg rounded-xl mb-1"
							: "h-9 w-full text-sm text-left hover:bg-foreground/8",
						slot === value
							? "bg-(--brand-color)/10 text-(--brand-color) font-bold"
							: "text-foreground"
					)}
				>
					{slot}
				</button>
			))}
		</div>
	);
}
