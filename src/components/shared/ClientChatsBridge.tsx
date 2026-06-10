"use client";

import { useCallback } from "react";
import { useClientNotificationsStore } from "@/store/use-client-notifications.store";
import { ClientChatsPoller } from "./ClientChatsPoller";

export function ClientChatsBridge({ initialCount }: { initialCount: number }) {
	const setUnreadChats = useClientNotificationsStore((s) => s.setUnreadChats);
	const handleChange = useCallback(
		(count: number) => setUnreadChats(count),
		[setUnreadChats]
	);
	return (
		<ClientChatsPoller
			initialCount={initialCount}
			onCountChange={handleChange}
		/>
	);
}
