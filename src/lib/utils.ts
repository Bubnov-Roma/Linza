import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DbEquipment } from "@/core/domain/entities/Equipment";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Длина рабочего дня (часы выдачи/приёма 10:00–20:00)
export const WORK_DAY_HOURS = 10;
export const DAY_HOURS = 24;
export const WORK_START = 10; // 10:00
export const WORK_END = 20; // 20:00
export const TIME_STEP = 10; // минуты

/**
 * Расчёт цены с учётом рабочих тарифов и рабочего дня 10 ч.
 *
 * Логика:
 *   ≤ 4 ч  → тариф p4  (если задан)
 *   ≤ 8 ч  → тариф p8  (если задан)
 *   ≤ 10 ч → тариф pDay (один рабочий день)
 *   > 10 ч → полные рабочие дни × pDay + остаток по тарифной сетке
 *
 * "Полный рабочий день" = 10 ч, а не 24, т.к. техника
 * выдаётся и возвращается в рабочее время (10:00–20:00).
 */
export function calculateItemPrice(
	equipment: DbEquipment,
	hours: number
): number {
	const p4 = Number(equipment.price4h) || 0;
	const p8 = Number(equipment.price8h) || 0;
	const pDay = Number(equipment.pricePerDay) || 0;

	if (hours <= 0) return 0;

	// ── В пределах одного рабочего дня ──────────────────────────────────────
	if (hours <= DAY_HOURS) {
		if (hours <= 4 && p4 > 0) return p4;
		if (hours <= 8 && p8 > 0) return p8;
		return pDay;
	}

	// ── Свыше суток ──
	const fullDays = Math.floor(hours / DAY_HOURS);
	const remainder = hours % DAY_HOURS;

	let total = fullDays * pDay;

	if (remainder > 0) {
		if (remainder <= 4 && p4 > 0) {
			total += p4;
		} else if (remainder <= 8 && p8 > 0) {
			total += p8;
		} else {
			total += pDay; // остаток > 8 ч — ещё один рабочий день
		}
	}

	return total;
}

/**
 * Утилита для сборки даты и времени без риска undefined
 */
export function combineDateAndTime(
	date: Date | undefined,
	timeString: string
): Date | null {
	if (!date) return null;
	const newDate = new Date(date);
	const [hours, minutes] = timeString.split(":").map(Number);
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
	if (hours !== undefined) newDate.setHours(hours, minutes, 0, 0);
	return newDate;
}

export type Fmt =
	| "time"
	| "date"
	| "date-weekday"
	| "datetime"
	| "full"
	| "full-datetime"
	| "date-numeric";

export function clientTimeFormat(date: Date, fmt: Fmt): string {
	const timeOpts: Intl.DateTimeFormatOptions = {
		hour: "2-digit",
		minute: "2-digit",
	};
	const fullDateOpts: Intl.DateTimeFormatOptions = {
		day: "numeric",
		month: "short",
		year: "numeric",
	};
	switch (fmt) {
		case "time":
			return date.toLocaleTimeString("ru-RU", timeOpts);
		case "date":
			return date.toLocaleDateString("ru-RU", {
				day: "numeric",
				month: "short",
			});
		case "datetime":
			return `${date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}, ${date.toLocaleTimeString("ru-RU", timeOpts)}`;
		case "date-weekday":
			return date.toLocaleDateString("ru-RU", {
				day: "numeric",
				month: "short",
				weekday: "short",
			});
		case "full":
			return date.toLocaleDateString("ru-RU", {
				day: "numeric",
				month: "long",
				year: "numeric",
			});
		case "full-datetime": {
			const d = date.toLocaleDateString("ru-RU", fullDateOpts);
			const t = date.toLocaleTimeString("ru-RU", timeOpts);
			return `${d.replace(/\s*г\./, "")}, ${t}`;
		}
		case "date-numeric":
			return date.toLocaleDateString("ru-RU", {
				day: "numeric",
				month: "2-digit",
			});
		default:
			return date.toLocaleDateString("ru-RU", {
				day: "numeric",
				month: "short",
			});
	}
}

/**
 * time-slots.ts
 * Утилиты для работы со временем в форме бронирования.
 * Шаг — 10 минут, рабочий день 10:00–20:00.
 */

/** Все слоты в рабочем диапазоне с шагом TIME_STEP */
export function generateTimeSlots(fromHour: number, toHour: number): string[] {
	const slots: string[] = [];
	for (let h = fromHour; h <= toHour; h++) {
		const maxMin = h === toHour ? 0 : 60 - TIME_STEP;
		for (let m = 0; m <= maxMin; m += TIME_STEP) {
			slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
		}
	}
	return slots;
}

/**
 * Зажимает время в рабочий диапазон.
 * Если selectedDate — сегодня, отрезает прошедшие слоты.
 */
export function clampTime(
	time: string,
	selectedDate: Date | undefined,
	workStart: number,
	workEnd: number
): string {
	const workSlots = generateTimeSlots(workStart, workEnd);
	const now = new Date();
	const isToday = selectedDate
		? selectedDate.toDateString() === now.toDateString()
		: false;

	const available = workSlots.filter((s) => {
		if (s < `${String(workStart).padStart(2, "0")}:00`) return false;
		if (s > `${String(workEnd).padStart(2, "0")}:00`) return false;
		if (isToday) {
			const [h, m] = s.split(":").map(Number);
			const slotDate = new Date(now);
			if (h && m) slotDate.setHours(h, m, 0, 0);
			if (slotDate <= now) return false;
		}
		return true;
	});

	if (!available.length) return `${String(workStart).padStart(2, "0")}:00`;
	if (available.includes(time)) return time;

	const next = available.find((s) => s >= time);
	return (
		next ??
		available[available.length - 1] ??
		`${String(workStart).padStart(2, "0")}:00`
	);
}
/**
 * Форматирует дату коротко: "15 июн"
 */
export function formatShortDate(date: Date): string {
	return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/**
 * Форматирует дату полно: "15 июня, пт"
 */
export function formatFullDate(date: Date): string {
	return date.toLocaleDateString("ru-RU", {
		day: "numeric",
		month: "long",
		weekday: "short",
	});
}

/**
 * Корректирует время окончания аренды.
 * Если время выпадает на нерабочие часы (после WORK_END или до WORK_START),
 * сдвигает возврат на WORK_START (10:00) ближайшего доступного дня.
 */
export function adjustEndTime(
	endDate: Date,
	workStart: number,
	workEnd: number
): Date {
	const h = endDate.getHours();
	const m = endDate.getMinutes();
	const timeFloat = h + m / 60;

	const adjusted = new Date(endDate);

	if (timeFloat >= workEnd) {
		adjusted.setDate(adjusted.getDate() + 1);
		adjusted.setHours(workStart, 0, 0, 0);
	} else if (timeFloat < workStart) {
		adjusted.setHours(workStart, 0, 0, 0);
	}

	return adjusted;
}

/**
 * форматирование ценников
 */
export function fmtRub(n: number): string {
	return `${n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽`;
}
