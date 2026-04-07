import type { DbEquipment } from "@/core/domain/entities/Equipment";

// export type Status =
// 	| "PENDING"
// 	| "CONFIRMED"
// 	| "ACTIVE"
// 	| "COMPLETED"
// 	| "CANCELED";

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
}

export interface BookingDetailRow extends Omit<BookingRow, "booking_items"> {
	updatedAt: string | null;
	cancellationReason: string | null;
	cancelledAt: string | null;
	bookingItems: BookingItemDetailRow[];
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
