import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SoundProfile } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientNotificationEvent =
	| "chatMessage"
	| "applicationStatus"
	| "bookingStatus";

export type ClientSoundSettings = Record<ClientNotificationEvent, SoundProfile>;

interface BookingStatusChange {
	bookingId: string;
	type: "equipment" | "studio";
	newStatus: string;
	seenAt?: string;
}

interface ClientNotificationsState {
	// Счётчики бейджей
	unreadChats: number;
	hasNewApplicationStatus: boolean;
	unseenBookingChanges: BookingStatusChange[];

	// Поллинг
	lastPolledAt: string | null;

	// Звук
	soundSettings: ClientSoundSettings;

	// Мутации
	setUnreadChats: (count: number) => void;
	setHasNewApplicationStatus: (val: boolean) => void;
	addBookingChanges: (changes: BookingStatusChange[]) => void;
	clearBookingChange: (bookingId: string) => void;
	clearAllBookingChanges: () => void;
	setLastPolledAt: (at: string) => void;
	setSoundSetting: (
		event: ClientNotificationEvent,
		profile: SoundProfile
	) => void;
}

// ─── Default sound settings ───────────────────────────────────────────────────

const DEFAULT_SOUND_SETTINGS: ClientSoundSettings = {
	chatMessage: "subtle",
	applicationStatus: "default",
	bookingStatus: "subtle",
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useClientNotificationsStore = create<ClientNotificationsState>()(
	persist(
		(set) => ({
			unreadChats: 0,
			hasNewApplicationStatus: false,
			unseenBookingChanges: [],
			lastPolledAt: null,
			soundSettings: DEFAULT_SOUND_SETTINGS,

			setUnreadChats: (count) => set({ unreadChats: count }),

			setHasNewApplicationStatus: (val) =>
				set({ hasNewApplicationStatus: val }),

			addBookingChanges: (changes) =>
				set((state) => {
					// Дедупликация: обновляем существующие, добавляем новые
					const existing = new Map(
						state.unseenBookingChanges.map((c) => [c.bookingId, c])
					);
					for (const c of changes) existing.set(c.bookingId, c);
					return { unseenBookingChanges: Array.from(existing.values()) };
				}),

			clearBookingChange: (bookingId) =>
				set((state) => ({
					unseenBookingChanges: state.unseenBookingChanges.filter(
						(c) => c.bookingId !== bookingId
					),
				})),

			clearAllBookingChanges: () => set({ unseenBookingChanges: [] }),

			setLastPolledAt: (at) => set({ lastPolledAt: at }),

			setSoundSetting: (event, profile) =>
				set((state) => ({
					soundSettings: { ...state.soundSettings, [event]: profile },
				})),
		}),
		{
			name: "client-notifications",
			// Персистим только настройки звука и lastPolledAt
			// Счётчики всегда пересчитываются с сервера
			partialize: (state) => ({
				soundSettings: state.soundSettings,
				lastPolledAt: state.lastPolledAt,
			}),
		}
	)
);
