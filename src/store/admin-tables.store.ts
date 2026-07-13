import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
	EquipmentFilter,
	EquipmentSort,
} from "@/actions/admin/equipment-actions";

// ─── Bookings Table State ──────────────────────────────────────────────────────

export interface BookingsTableState {
	search: string;
	statusFilter: string;
	paymentFilter: string;
	dateFrom: string;
	dateTo: string;
	sortField: "createdAt" | "startDate" | "totalAmount" | "status";
	sortDir: "asc" | "desc";
	page: number;
	showFilters: boolean;
}

const DEFAULT_BOOKINGS: BookingsTableState = {
	search: "",
	statusFilter: "all",
	paymentFilter: "all",
	dateFrom: "",
	dateTo: "",
	sortField: "createdAt",
	sortDir: "desc",
	page: 1,
	showFilters: false,
};

// ─── Equipment Table State ─────────────────────────────────────────────────────

export interface EquipmentTableState {
	search: string;
	filters: EquipmentFilter[]; // EquipmentFilter[]
	sorts: EquipmentSort[]; // EquipmentSort[]
	page: number;
	viewMode: "compact" | "extended";
	showFilters: boolean;
	showSorts: boolean;
}

const DEFAULT_EQUIPMENT: EquipmentTableState = {
	search: "",
	filters: [],
	sorts: [],
	page: 1,
	viewMode: "compact",
	showFilters: false,
	showSorts: false,
};

// ─── Users Table State ─────────────────────────────────────────────────────────

export interface UsersTableState {
	search: string;
	roleFilter: string;
	statusFilter: string;
	discountFilter: "all" | "has_discount" | "no_discount";
	regFrom: string;
	regTo: string;
	showFilters: boolean;
	page: number;
	sortField: string;
	sortDir: "asc" | "desc";
}

const DEFAULT_USERS: UsersTableState = {
	search: "",
	roleFilter: "all",
	statusFilter: "all",
	discountFilter: "all",
	regFrom: "",
	regTo: "",
	showFilters: false,
	page: 1,
	sortField: "createdAt",
	sortDir: "desc",
};

// ─── Combined Store ────────────────────────────────────────────────────────────

interface AdminTablesStore {
	bookings: BookingsTableState;
	equipment: EquipmentTableState;
	users: UsersTableState;

	setBookings: (patch: Partial<BookingsTableState>) => void;
	setEquipment: (patch: Partial<EquipmentTableState>) => void;
	setUsers: (patch: Partial<UsersTableState>) => void;

	resetBookings: () => void;
	resetEquipment: () => void;
	resetUsers: () => void;
}

export const useAdminTablesStore = create<AdminTablesStore>()(
	persist(
		(set) => ({
			bookings: DEFAULT_BOOKINGS,
			equipment: DEFAULT_EQUIPMENT,
			users: DEFAULT_USERS,

			setBookings: (patch) =>
				set((s) => ({ bookings: { ...s.bookings, ...patch } })),
			setEquipment: (patch) =>
				set((s) => ({ equipment: { ...s.equipment, ...patch } })),
			setUsers: (patch) => set((s) => ({ users: { ...s.users, ...patch } })),

			resetBookings: () => set({ bookings: DEFAULT_BOOKINGS }),
			resetEquipment: () => set({ equipment: DEFAULT_EQUIPMENT }),
			resetUsers: () => set({ users: DEFAULT_USERS }),
		}),
		{
			name: "admin-tables-state",
			storage: createJSONStorage(() => sessionStorage),
		}
	)
);
