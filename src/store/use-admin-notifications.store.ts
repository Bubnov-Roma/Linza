import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SOUND_SETTINGS } from "@/constants";
import type {
	AdminNotificationType,
	DbAdminNotification,
	SoundProfile,
	SoundSettings,
} from "@/types";

// ─── State ────────────────────────────────────────────────────────────────────

interface PersistedSlice {
	// Звуковые настройки
	soundSettings: SoundSettings;
	// Метка времени последнего успешного поллинга —
	// передаётся на сервер чтобы получать только новые уведомления
	lastPolledAt: string | null;
}

interface AdminNotificationsState extends PersistedSlice {
	// Счётчики бейджей в сайдбаре
	pendingBookings: number;
	pendingApps: number;
	pendingStudio: number;
	pendingChats: number;
	// Непрочитанных всего
	unreadCount: number;
	// Последние уведомления для панели
	notifications: DbAdminNotification[];
	// Действия
	setCounts: (
		bookings: number,
		apps: number,
		studio: number,
		chats: number
	) => void;
	setUnreadCount: (count: number) => void;
	prependNotifications: (items: DbAdminNotification[]) => void;
	markRead: (ids: string[]) => void;
	markAllRead: () => void;
	setLastPolledAt: (iso: string) => void;
	setSoundProfile: (type: AdminNotificationType, profile: SoundProfile) => void;
	resetSoundSettings: () => void;
}

export const useAdminNotificationsStore = create<AdminNotificationsState>()(
	persist(
		(set) => ({
			// runtime
			pendingBookings: 0,
			pendingApps: 0,
			pendingStudio: 0,
			pendingChats: 0,
			unreadCount: 0,
			notifications: [],
			// persisted
			lastPolledAt: null,
			soundSettings: DEFAULT_SOUND_SETTINGS,

			setCounts: (bookings, apps, studio, chats) =>
				set({
					pendingBookings: bookings,
					pendingApps: apps,
					pendingStudio: studio,
					pendingChats: chats,
				}),

			setUnreadCount: (count) => set({ unreadCount: count }),

			prependNotifications: (items) =>
				set((state) => {
					if (!items.length) return state;
					// Дедупликация по id
					const existingIds = new Set(state.notifications.map((n) => n.id));
					const fresh = items.filter((n) => !existingIds.has(n.id));
					if (!fresh.length) return state;
					return {
						notifications: [...fresh, ...state.notifications].slice(0, 100),
					};
				}),

			markRead: (ids) =>
				set((state) => ({
					notifications: state.notifications.map((n) =>
						ids.includes(n.id) ? { ...n, isRead: true } : n
					),
					unreadCount: Math.max(0, state.unreadCount - ids.length),
				})),

			markAllRead: () =>
				set((state) => ({
					notifications: state.notifications.map((n) => ({
						...n,
						isRead: true,
					})),
					unreadCount: 0,
				})),

			setLastPolledAt: (iso) => set({ lastPolledAt: iso }),

			setSoundProfile: (type, profile) =>
				set((state) => ({
					soundSettings: { ...state.soundSettings, [type]: profile },
				})),

			resetSoundSettings: () => set({ soundSettings: DEFAULT_SOUND_SETTINGS }),
		}),
		{
			name: "admin-notifications",
			// Персистируем только настройки звука и метку времени.
			// Счётчики и список уведомлений берём с сервера при каждом запуске.
			partialize: (state): PersistedSlice => ({
				soundSettings: state.soundSettings,
				lastPolledAt: state.lastPolledAt,
			}),
		}
	)
);
