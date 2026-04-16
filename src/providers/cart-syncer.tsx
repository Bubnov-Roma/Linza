"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { getEquipmentForCartAction } from "@/actions/client-equipment-actions";
import { useCartStore } from "@/store/use-cart.store";

export function CartSync() {
	const { data: session, status } = useSession();
	const { syncWithServer, clearOnLogout, authenticatedUserId } = useCartStore();

	useEffect(() => {
		// Ждем, пока сессия загрузится
		if (status === "loading") return;

		if (session?.user?.id) {
			// Если юзер залогинился (и мы еще не синхронизировали его)
			if (authenticatedUserId !== session.user.id) {
				syncWithServer(session.user.id, getEquipmentForCartAction).catch(
					console.error
				);
			}
		} else {
			// Если юзера нет (разлогинился)
			if (authenticatedUserId !== null) {
				clearOnLogout();
			}
		}
	}, [session, status, authenticatedUserId, syncWithServer, clearOnLogout]);

	return null;
}
