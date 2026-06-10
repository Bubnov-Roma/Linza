"use client";

import { useEffect, useRef } from "react";
import { getClientUnreadChatsCountAction } from "@/actions/support-actions";

interface Props {
	initialCount: number;
	onCountChange: (count: number) => void;
}

export function ClientChatsPoller({ initialCount, onCountChange }: Props) {
	const prev = useRef(initialCount);

	useEffect(() => {
		onCountChange(initialCount);
	}, [initialCount, onCountChange]);

	useEffect(() => {
		const poll = async () => {
			const count = await getClientUnreadChatsCountAction();
			if (count !== prev.current) {
				prev.current = count;
				onCountChange(count);
			}
		};

		const id = setInterval(poll, 20_000);
		return () => clearInterval(id);
	}, [onCountChange]);

	return null;
}
