import type { LABEL_COLORS } from "@/constants";
import type { DbEquipment } from "@/core/domain/entities/Equipment";

export type BookingStatus =
	| "PENDING_REVIEW" // ждёт проверки менеджером
	| "WAIT_PAYMENT" // ждёт ынесения предоплаты
	| "READY_TO_RENT" // бронь подтверждена
	| "ACTIVE" // выдан в аренду
	| "COMPLETED" // завершен
	| "CANCELLED" // отменен
	| "EXPIRED"; // устарел

export interface Booking {
	readonly id: string;
	readonly userId: string;
	readonly equipmentId: string;
	readonly equipment?: DbEquipment;
	readonly startDate: Date;
	readonly endDate: Date;
	readonly totalAmount: number;
	readonly status: BookingStatus;
	readonly createdAt: Date;
	readonly price_at_booking: number;
	readonly user?: {
		readonly name: string | null;
		readonly email: string | null;
	};
}

interface BookingEquipmentSnippet {
	title: string;
	categoryId: string;
	price4h: number | null;
	price8h: number | null;
	pricePerDay: number;
}
export interface BookingEquipmentDetailSnippet extends BookingEquipmentSnippet {
	id: string;
	deposit: number | null;
}
export interface BookingItemRow {
	id: string;
	priceAtBooking: number;
	depositAtBooking: number | null;
	replacementValueAtBooking: number | null;
	equipment: BookingEquipmentSnippet;
	imageUrl?: string | null;
}
export interface BookingItemDetailRow {
	id: string;
	priceAtBooking: number;
	depositAtBooking: number;
	replacementValueAtBooking: number;
	equipment: BookingEquipmentDetailSnippet;
}
export interface BookingRow {
	id: string;
	userId: string;
	startDate: Date;
	endDate: Date;
	totalAmount: number;
	status: BookingStatus;
	createdAt: Date;
	totalReplacementValue: number | null;
	insuranceIncluded: boolean | null;
	bookingItems: BookingItemRow[];
	promoCode?: string | null;
	discountAmount?: number | null;
}

export interface BookingDetailRow extends Omit<BookingRow, "booking_items"> {
	updatedAt: string | null;
	cancellationReason: string | null;
	cancelledAt: string | null;
	bookingItems: BookingItemDetailRow[];
	promoCode?: string | null;
	discountAmount?: number | null;
	promoValidUntil?: string | null;
}
export interface DashboardEquipment {
	title: string;
}

export interface DashboardBooking {
	id: string;
	startDate: Date;
	endDate: Date;
	totalAmount: number;
	status: string;
	createdAt: Date;
	bookingItems: DashboardBookingItem[];
	promoCode?: string | null;
	discountAmount?: number | null;
}

export function toBookingDetailRow(
	raw: NonNullable<unknown>
): BookingDetailRow {
	return raw as BookingDetailRow;
}

export function toBookingRow(raw: NonNullable<unknown>): BookingRow {
	return raw as BookingRow;
}

export function toBookingRowArray(raw: NonNullable<unknown>[]): BookingRow[] {
	return raw as BookingRow[];
}

export interface DashboardBookingItem {
	equipment: DashboardEquipment;
	priceAtBooking: number;
	imageUrl: string | null;
}

export function toDashboardBooking(row: BookingRow): DashboardBooking {
	return {
		...row,
		bookingItems: row.bookingItems.map((item) => ({
			...item,
			imageUrl: item.imageUrl ?? null,
		})),
	};
}

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "BALANCE" | "OTHER";

/** Статус оплаты заказа, вычисляется на лету */
export type PaymentStatus =
	| "UNPAID" // ничего не оплачено
	| "PARTIAL" // оплачено частично (< totalAmount)
	| "PAID" // оплачено полностью (= totalAmount ±1%)
	| "OVERPAID"; // переплата (> totalAmount)

export interface BookingPaymentRow {
	id: string;
	amount: number;
	method: PaymentMethod;
	note: string | null;
	paidAt: string;
	createdAt: string;
	authorName: string | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminBookingItemSnippet {
	equipmentId: string;
	title: string;
	inventoryNumber?: string | null;
	imageUrl?: string | null;
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
	paymentStatus?: PaymentStatus;
	totalPaid?: number;
	labelTexts?: string[];
	payments?: BookingPaymentRow[];
	clientImage?: string | null;
	user?: {
		balance: number;
	};
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

export type UserSearchResult = {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
};

export type EquipmentSearchResult = {
	id: string;
	title: string;
	pricePerDay: number;
	price4h: number;
	price8h: number;
	deposit: number;
	replacementValue: number;
};
export interface DraftItem {
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
