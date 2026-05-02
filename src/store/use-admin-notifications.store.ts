import { create } from "zustand";

interface AdminNotificationsState {
	pendingBookings: number;
	pendingApps: number;
	pendingStudio: number;
	setCounts: (bookings: number, apps: number, studio: number) => void;
}

export const useAdminNotificationsStore = create<AdminNotificationsState>(
	(set) => ({
		pendingBookings: 0,
		pendingApps: 0,
		pendingStudio: 0,
		setCounts: (bookings, apps, studio) =>
			set({
				pendingBookings: bookings,
				pendingApps: apps,
				pendingStudio: studio,
			}),
	})
);
