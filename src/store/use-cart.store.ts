import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
	clearServerCartAction,
	deleteServerCartItemAction,
	fetchServerCartAction,
	upsertServerCartItemAction,
} from "@/actions/cart-actions";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";

export interface CartItem {
	allUnitIds: string[];
	equipment: GroupedEquipment;
	quantity: number;
	insurance: boolean;
}

interface CartStore {
	items: CartItem[];
	authenticatedUserId: string | null;

	// Базовые операции (UI + вызов сервера в фоне)
	addItem: (equipment: GroupedEquipment) => void;
	removeOne: (id: string) => void;
	removeAllByType: (id: string) => void;
	clearCart: () => void;

	// Системные функции
	syncWithServer: (
		userId: string,
		equipmentResolver: (ids: string[]) => Promise<GroupedEquipment[]>
	) => Promise<void>;
	clearOnLogout: () => void;
}

export const useCartStore = create<CartStore>()(
	persist(
		(set, get) => ({
			items: [],
			authenticatedUserId: null,

			// ── addItem ─────────────────────────────────────────────────────────
			addItem: (equipment) => {
				const state = get();
				const exists = state.items.find((i) => i.equipment.id === equipment.id);
				const uid = state.authenticatedUserId;

				// 1. Оптимистичное обновление UI
				const updatedEquipment = exists
					? {
							...exists.equipment,
							availableCount: Math.max(
								exists.equipment.availableCount,
								equipment.availableCount
							),
							totalCount: Math.max(
								exists.equipment.totalCount,
								equipment.totalCount
							),
							allUnitIds:
								equipment.allUnitIds.length > exists.equipment.allUnitIds.length
									? equipment.allUnitIds
									: exists.equipment.allUnitIds,
						}
					: equipment;

				let newItems: CartItem[];
				let newQuantity = 1;

				if (exists) {
					if (exists.quantity >= updatedEquipment.availableCount) {
						newQuantity = exists.quantity;
						newItems = state.items.map((i) =>
							i.equipment.id === equipment.id
								? { ...i, equipment: updatedEquipment }
								: i
						);
					} else {
						newQuantity = exists.quantity + 1;
						newItems = state.items.map((i) =>
							i.equipment.id === equipment.id
								? { ...i, equipment: updatedEquipment, quantity: newQuantity }
								: i
						);
					}
				} else {
					newItems = [
						...state.items,
						{
							equipment: updatedEquipment,
							quantity: 1,
							insurance: true,
							allUnitIds: [],
						},
					];
				}

				set({ items: newItems });

				// 2. Фоновый запрос на сервер
				if (uid) {
					upsertServerCartItemAction(equipment.id, newQuantity).catch(
						console.error
					);
				}
			},

			// ── removeOne ───────────────────────────────────────────────────────
			removeOne: (id) => {
				const state = get();
				const uid = state.authenticatedUserId;

				let newQuantity = 0;
				const newItems = state.items
					.map((i) => {
						if (i.equipment.id === id) {
							newQuantity = i.quantity - 1;
							return { ...i, quantity: newQuantity };
						}
						return i;
					})
					.filter((i) => i.quantity > 0);

				set({ items: newItems });

				if (uid) {
					if (newQuantity > 0) {
						upsertServerCartItemAction(id, newQuantity).catch(console.error);
					} else {
						deleteServerCartItemAction(id).catch(console.error);
					}
				}
			},

			// ── removeAllByType ─────────────────────────────────────────────────
			removeAllByType: (id) => {
				const uid = get().authenticatedUserId;
				set((state) => ({
					items: state.items.filter((i) => i.equipment.id !== id),
				}));

				if (uid) deleteServerCartItemAction(id).catch(console.error);
			},

			// ── clearCart ───────────────────────────────────────────────────────
			clearCart: () => {
				const uid = get().authenticatedUserId;
				set({ items: [] });
				if (uid) clearServerCartAction().catch(console.error);
			},

			// ── syncWithServer ──────────────────────────────────────────────────
			syncWithServer: async (userId, equipmentResolver) => {
				const state = get();
				if (state.authenticatedUserId === userId) return;

				// 1. Fetch server cart
				const serverRows = await fetchServerCartAction();

				// 2. Merge local (guest) and server carts
				const mergedMap = new Map<string, number>();

				for (const item of state.items) {
					mergedMap.set(item.equipment.id, item.quantity);
				}

				for (const row of serverRows) {
					const existing = mergedMap.get(row.equipmentId) ?? 0;
					mergedMap.set(row.equipmentId, Math.max(existing, row.quantity));
				}

				if (mergedMap.size === 0) {
					set({ authenticatedUserId: userId, items: [] });
					return;
				}

				// 3. Get full equipment data
				const allIds = [...mergedMap.keys()];
				let equipmentObjects: GroupedEquipment[] = [];
				try {
					equipmentObjects = await equipmentResolver(allIds);
				} catch {
					equipmentObjects = state.items
						.filter((i) => allIds.includes(i.equipment.id))
						.map((i) => i.equipment);
				}

				const equipmentById = new Map(equipmentObjects.map((e) => [e.id, e]));
				const mergedItems: CartItem[] = [];

				for (const [id, quantity] of mergedMap) {
					const equipment = equipmentById.get(id);
					if (!equipment) continue;
					mergedItems.push({
						equipment,
						quantity: Math.min(quantity, equipment.availableCount),
						insurance: true,
						allUnitIds: [],
					});
				}

				// 4. Update UI IMMEDIATELY
				set({ authenticatedUserId: userId, items: mergedItems });

				// 5. Sync merged state back to server (background)
				Promise.all(
					mergedItems.map((item) =>
						upsertServerCartItemAction(item.equipment.id, item.quantity)
					)
				).catch(console.error);
			},

			// ── clearOnLogout ───────────────────────────────────────────────────
			clearOnLogout: () => {
				set({ authenticatedUserId: null, items: [] });
			},
		}),
		{
			name: "photo-rent-cart",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) =>
				state.authenticatedUserId === null
					? { items: state.items, authenticatedUserId: null }
					: { items: [], authenticatedUserId: null },
		}
	)
);
