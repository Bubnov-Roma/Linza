import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import type { SoundProfile } from "@/types";

export type ClientNotificationEvent =
	| "chatMessage"
	| "applicationStatus"
	| "bookingStatus"
	| "promoApplied";

export interface AutoPromoInfo {
	code: string;
	type: string;
	value: number;
	minOrderAmount: number | null;
}

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

	// последний применённый промокод (после submit заказа)
	lastAppliedPromo: { code: string; discountAmount: number } | null;
	// авто-промокод доступный клиенту (из поллера)
	availableAutoPromo: AutoPromoInfo | null;

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
	// NEW:
	setLastAppliedPromo: (
		promo: { code: string; discountAmount: number } | null
	) => void;
	clearLastAppliedPromo: () => void;
	setAvailableAutoPromo: (promo: AutoPromoInfo | null) => void;
}

const DEFAULT_SOUND_SETTINGS: ClientSoundSettings = {
	chatMessage: "subtle",
	applicationStatus: "default",
	bookingStatus: "subtle",
	promoApplied: "default",
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
			lastAppliedPromo: null, // NEW
			availableAutoPromo: null, // NEW

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
			// NEW:
			setLastAppliedPromo: (promo) => set({ lastAppliedPromo: promo }),
			clearLastAppliedPromo: () => set({ lastAppliedPromo: null }),
			setAvailableAutoPromo: (promo) => set({ availableAutoPromo: promo }),
		}),
		{
			name: "client-notifications",
			partialize: (state) => ({
				soundSettings: state.soundSettings,
				lastPolledAt: state.lastPolledAt,
				applicationStatusNotification: state.applicationStatusNotification,
				unseenBookingChanges: state.unseenBookingChanges,
				// персистим чтобы промокод не пропал при перезагрузке страницы
				lastAppliedPromo: state.lastAppliedPromo,
				availableAutoPromo: state.availableAutoPromo,
			}),
		}
	)
);
