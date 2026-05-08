import type { AdminPermissions } from "@/actions/admin-permissions-actions";

export const EMPTY_PERMISSIONS: AdminPermissions = {
	bookings_view: false,
	bookings_edit: false,
	bookings_delete: false,
	studio_view: false,
	studio_edit: false,
	studio_delete: false,
	users_view: false,
	users_edit: false,
	users_balance: false,
	equipment_view: false,
	equipment_edit: false,
	categories_edit: false,
	finance_view: false,
	finance_export: false,
	content_edit: false,
	settings_view: false,
	settings_edit: false,
	promo_edit: false,
};

export const ALL_PERMISSIONS: AdminPermissions = {
	bookings_view: true,
	bookings_edit: true,
	bookings_delete: true,
	studio_view: true,
	studio_edit: true,
	studio_delete: true,
	users_view: true,
	users_edit: true,
	users_balance: true,
	equipment_view: true,
	equipment_edit: true,
	categories_edit: true,
	finance_view: true,
	finance_export: true,
	content_edit: true,
	settings_view: true,
	settings_edit: true,
	promo_edit: true,
};

/** Группировка прав для отображения в UI */
export const PERMISSION_GROUPS: {
	group: string;
	keys: (keyof AdminPermissions)[];
	labels: Record<string, string>;
}[] = [
	{
		group: "Заказы (оборудование)",
		keys: ["bookings_view", "bookings_edit", "bookings_delete"],
		labels: {
			bookings_view: "Просмотр заказов",
			bookings_edit: "Редактирование (статус, цена, платежи)",
			bookings_delete: "Удаление заказов",
		},
	},
	{
		group: "Студия",
		keys: ["studio_view", "studio_edit", "studio_delete"],
		labels: {
			studio_view: "Просмотр заказов студии",
			studio_edit: "Редактирование заказов студии",
			studio_delete: "Удаление заказов студии",
		},
	},
	{
		group: "Клиенты",
		keys: ["users_view", "users_edit", "users_balance"],
		labels: {
			users_view: "Просмотр клиентов",
			users_edit: "Редактирование профилей / блокировка",
			users_balance: "Управление балансом клиентов",
		},
	},
	{
		group: "Оборудование и каталог",
		keys: ["equipment_view", "equipment_edit", "categories_edit"],
		labels: {
			equipment_view: "Просмотр оборудования",
			equipment_edit: "Редактирование оборудования",
			categories_edit: "Редактирование категорий",
		},
	},
	{
		group: "Финансы",
		keys: ["finance_view", "finance_export"],
		labels: {
			finance_view: "Просмотр финансовой статистики",
			finance_export: "Экспорт финансовых отчётов",
		},
	},
	{
		group: "Контент",
		keys: ["content_edit"],
		labels: {
			content_edit: "Баннеры, FAQ, контент сайта",
		},
	},
	{
		group: "Настройки сайта",
		keys: ["settings_view", "settings_edit"],
		labels: {
			settings_view: "Просмотр настроек",
			settings_edit: "Изменение настроек сайта",
		},
	},
	{
		group: "Промокоды",
		keys: ["promo_edit"],
		labels: {
			promo_edit: "Создание и управление промокодами",
		},
	},
];
