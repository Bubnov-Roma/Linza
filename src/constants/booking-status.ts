import type { BookingStatus } from "@/core/domain/entities/Booking";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
	PENDING_REVIEW: "Проверка техники",
	WAIT_PAYMENT: "Ожидает оплаты",
	READY_TO_RENT: "Готов к выдаче",
	ACTIVE: "В аренде",
	COMPLETED: "Завершён",
	CANCELLED: "Отменён",
	EXPIRED: "Просрочен",
};

export const STATUS_STEPS: {
	key: BookingStatus;
	label: string;
	desc: string;
}[] = [
	{
		key: "PENDING_REVIEW",
		label: "Проверка",
		desc: "Менеджер проверяет наличие техники",
	},
	{
		key: "WAIT_PAYMENT",
		label: "Оплата",
		desc: "Заказ собран, ожидается внесение предоплаты",
	},
	{
		key: "READY_TO_RENT",
		label: "Выдача",
		desc: "Заказ подтверждён, техника готова к выдаче",
	},
	{
		key: "ACTIVE",
		label: "Аренда",
		desc: "Техника находится в аренде",
	},
	{ key: "COMPLETED", label: "Завершён", desc: "Заказ успешно завершён" },
];

export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
	PENDING_REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
	WAIT_PAYMENT: "bg-green-500/10 text-green-400 border-green-500/20",
	READY_TO_RENT: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
	ACTIVE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
	COMPLETED: "bg-foreground/5 text-muted-foreground border-foreground/10",
	CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
	EXPIRED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

// ─── Status config ────────────────────────────────────────────────────────────

export const BOOKING_STATUS_CONFIG: Record<
	BookingStatus,
	{ label: string; color: string; dot: string }
> = {
	PENDING_REVIEW: {
		label: "Ожидает проверки",
		color: "bg-amber-500/15 text-amber-400 border-amber-500/20",
		dot: "bg-amber-400",
	},
	WAIT_PAYMENT: {
		label: "Ждёт оплаты",
		color: "bg-blue-500/15 text-blue-400 border-blue-500/20",
		dot: "bg-blue-400",
	},
	READY_TO_RENT: {
		label: "Готов к выдаче",
		color: "bg-green-500/15 text-green-400 border-green-500/20",
		dot: "bg-green-400",
	},
	ACTIVE: {
		label: "В аренде",
		color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
		dot: "bg-emerald-400",
	},
	COMPLETED: {
		label: "Завершён",
		color: "bg-foreground/8 text-foreground/50 border-foreground/10",
		dot: "bg-foreground/30",
	},
	CANCELLED: {
		label: "Отменён",
		color: "bg-red-500/15 text-red-400 border-red-500/20",
		dot: "bg-red-400",
	},
	EXPIRED: {
		label: "Истёк",
		color: "bg-orange-500/15 text-orange-400 border-orange-500/20",
		dot: "bg-orange-400",
	},
};

// Quick cancellation reason presets shown in the dialog
export const CANCELLATION_PRESETS = [
	"Отменились съёмки",
	"Нужная техника оказалась недоступна",
	"Техника была занята в нужное время",
	"Нашёл другой прокат",
	"Изменились даты съёмок",
	"Указать свою причину",
] as const;

export type CancellationPreset = (typeof CANCELLATION_PRESETS)[number];
