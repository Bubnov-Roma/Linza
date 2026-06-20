import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import type { SoundProfile } from "@/types";

export type ClientNotificationEvent =
	| "chatMessage"
	| "applicationStatus"
	| "bookingStatus";

export type ClientSoundSettings = Record<ClientNotificationEvent, SoundProfile>;

export interface BookingStatusChange {
	bookingId: string;
	type: "equipment" | "studio";
	newStatus: BookingStatus;
	changedAt?: string;
}

interface ClientNotificationsState {
	// Счётчики бейджей
	unreadChats: number;
	hasNewApplicationStatus: boolean;
	// Детальная информация для панели
	applicationStatusNotification: {
		newStatus: string;
		changedAt: string;
		clarificationThreadId?: string | null;
	} | null;
	unseenBookingChanges: BookingStatusChange[];

	// Поллинг
	lastPolledAt: string | null;

	// Звук
	soundSettings: ClientSoundSettings;

	// Мутации
	setUnreadChats: (count: number) => void;
	setHasNewApplicationStatus: (val: boolean) => void;
	setApplicationStatusNotification: (
		n: {
			newStatus: string;
			changedAt: string;
			clarificationThreadId?: string | null;
		} | null
	) => void;
	addBookingChanges: (changes: BookingStatusChange[]) => void;
	clearBookingChange: (bookingId: string) => void;
	clearAllBookingChanges: () => void;
	setLastPolledAt: (at: string) => void;
	setSoundSetting: (
		event: ClientNotificationEvent,
		profile: SoundProfile
	) => void;
}

const DEFAULT_SOUND_SETTINGS: ClientSoundSettings = {
	chatMessage: "subtle",
	applicationStatus: "default",
	bookingStatus: "subtle",
};

export const useClientNotificationsStore = create<ClientNotificationsState>()(
	persist(
		(set) => ({
			unreadChats: 0,
			hasNewApplicationStatus: false,
			applicationStatusNotification: null,
			unseenBookingChanges: [],
			lastPolledAt: null,
			soundSettings: DEFAULT_SOUND_SETTINGS,

			setUnreadChats: (count) => set({ unreadChats: count }),

			setHasNewApplicationStatus: (val) =>
				set({ hasNewApplicationStatus: val }),

			setApplicationStatusNotification: (n) =>
				set({ applicationStatusNotification: n }),

			addBookingChanges: (changes) =>
				set((state) => {
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
			partialize: (state) => ({
				soundSettings: state.soundSettings,
				lastPolledAt: state.lastPolledAt,
				// Персистим непрочитанные уведомления чтобы не пропали при перезагрузке
				applicationStatusNotification: state.applicationStatusNotification,
				unseenBookingChanges: state.unseenBookingChanges,
			}),
		}
	)
);
