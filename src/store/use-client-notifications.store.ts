import { create } from "zustand";

interface ClientNotificationsState {
	unreadChats: number;
	setUnreadChats: (count: number) => void;
}

export const useClientNotificationsStore = create<ClientNotificationsState>(
	(set) => ({
		unreadChats: 0,
		setUnreadChats: (count) => set({ unreadChats: count }),
	})
);
