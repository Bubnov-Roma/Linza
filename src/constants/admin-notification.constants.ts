import type {
	AdminNotificationType,
	DbAdminNotification,
	SoundSettings,
} from "@/types";

export const POLL_INTERVAL = 15_000; // 15 секунд

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
	userRegistered: "subtle",
	applicationSubmitted: "default",
	applicationUpdated: "subtle",
	userDeletionRequested: "loud",
	bookingCreated: "default",
	studioBookingCreated: "default",
	bookingUpdated: "subtle",
	bookingCancelled: "default",
	supportMessageClient: "default",
	supportMessageReply: "subtle",
	faqQuestionSubmitted: "subtle",

	application_dataUpdated: "off",
	booking_dates_changed: "off",
	booking_status_changed: "off",
	booking_client_changed: "off",
	booking_items_changed: "off",
	booking_pricing_changed: "off",
};

// ─── LABELS ───────────────────────────────────────────────────────────────────
export const NOTIFICATION_LABELS: Record<AdminNotificationType, string> = {
	userRegistered: "Новый клиент",
	applicationSubmitted: "Анкета отправлена",
	applicationUpdated: "Анкета обновлена",
	userDeletionRequested: "Запрос на удаление аккаунта",
	bookingCreated: "Новый заказ техники",
	studioBookingCreated: "Новый заказ студии",
	bookingUpdated: "Заказ изменён",
	bookingCancelled: "Заказ отменён",
	supportMessageClient: "Новое обращение в поддержку",
	supportMessageReply: "Ответ клиента в чате",
	faqQuestionSubmitted: "Вопрос в FAQ",

	application_dataUpdated: "Данные анкеты обновлены",
	booking_dates_changed: "Даты аренды изменены",
	booking_status_changed: "Статус заказа изменён",
	booking_client_changed: "Клиент заказа изменён",
	booking_items_changed: "Состав заказа изменён",
	booking_pricing_changed: "Цена заказа скорректирована",
};

// Ссылка для перехода из уведомления
export function getNotificationHref(n: DbAdminNotification): string | null {
	const type = n.type as AdminNotificationType;
	const id = n.entityId;

	switch (type) {
		case "bookingCreated":
		case "bookingUpdated":
		case "bookingCancelled":
			return id ? `/admin/bookings?highlight=${id}` : "/admin/bookings";
		case "studioBookingCreated":
			return id ? `/admin/studio?highlight=${id}` : "/admin/studio";
		case "applicationSubmitted":
		case "applicationUpdated":
		case "userRegistered":
		case "userDeletionRequested":
			return n.userId ? `/admin/users/${n.userId}` : "/admin/users";
		case "supportMessageClient":
		case "supportMessageReply":
			return id ? `/admin/support/thread/${id}` : "/admin/support";
		case "faqQuestionSubmitted":
			return "/admin/faq";
		default:
			return null;
	}
}
// ─── Иконки для типов ─────────────────────────────────────────────────────────

export const ADMIN_NOTIFICATION_TYPE_ICONS: Record<
	AdminNotificationType,
	string
> = {
	userRegistered: "👤",
	applicationSubmitted: "📋",
	applicationUpdated: "✏️",
	userDeletionRequested: "🗑️",
	bookingCreated: "📦",
	studioBookingCreated: "🎬",
	bookingUpdated: "🔄",
	bookingCancelled: "❌",
	supportMessageClient: "💬",
	supportMessageReply: "↩️",
	faqQuestionSubmitted: "❓",

	application_dataUpdated: "✏️",
	booking_dates_changed: "📅",
	booking_status_changed: "🔄",
	booking_client_changed: "👤",
	booking_items_changed: "📦",
	booking_pricing_changed: "💰",
};
