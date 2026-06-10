export interface DbAdminNotification {
	id: string;
	type: string;
	userId: string | null;
	entityId: string | null;
	entityType: string | null;
	payload: Record<string, unknown>;
	isRead: boolean;
	createdAt: Date;
	user: { name: string | null; email: string | null } | null;
}

export type AdminNotificationType =
	| "userRegistered"
	| "applicationSubmitted"
	| "applicationUpdated"
	| "userDeletionRequested"
	| "bookingCreated"
	| "studioBookingCreated"
	| "bookingUpdated"
	| "bookingCancelled"
	| "supportMessageClient"
	| "supportMessageReply"
	| "faqQuestionSubmitted"
	| "application_dataUpdated"
	| "booking_dates_changed"
	| "booking_status_changed"
	| "booking_client_changed"
	| "booking_items_changed"
	| "booking_pricing_changed";

export type AdminNotificationEntityType =
	| "booking"
	| "studioBooking"
	| "application"
	| "supportThread"
	| "faqQuestion"
	| "user";

export interface CreateNotificationParams {
	type: AdminNotificationType;
	userId?: string; // клиент, совершивший действие
	entityId?: string; // id заказа / треда / анкеты
	entityType?: AdminNotificationEntityType;
	payload?: Record<string, unknown>;
}

// ─── Звуковые настройки ───────────────────────────────────────────────────────

// Какой профиль назначен каждому типу уведомления.
// Хранится в localStorage через persist.
export type SoundSettings = Record<AdminNotificationType, SoundProfile>;

export type SoundProfile = "off" | "subtle" | "default" | "loud";
