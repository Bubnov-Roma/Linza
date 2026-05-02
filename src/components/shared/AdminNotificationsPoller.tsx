"use client";

import { useEffect, useRef } from "react";
import { getPendingStudioBookingsCountAction } from "@/actions/admin-studio-actions";
import {
	getPendingApplicationsCountAction,
	getPendingCount,
} from "@/actions/client-booking-actions";
import { useAdminNotificationsStore } from "@/store/use-admin-notifications.store";

interface Props {
	initialBookings: number;
	initialApps: number;
	initialStudio: number;
}

export function AdminNotificationsPoller({
	initialBookings,
	initialApps,
	initialStudio,
}: Props) {
	const setCounts = useAdminNotificationsStore((s) => s.setCounts);

	const prevBookings = useRef(initialBookings);
	const prevApps = useRef(initialApps);
	const prevStudio = useRef(initialStudio);

	// Инициализируем стор серверными данными при первой загрузке
	useEffect(() => {
		setCounts(initialBookings, initialApps, initialStudio);
	}, [initialBookings, initialApps, initialStudio, setCounts]);

	useEffect(() => {
		const playSound = () => {
			/* твоя логика AudioContext */
		};

		const poll = async () => {
			const [bCount, appResult, studioCount] = await Promise.all([
				getPendingCount(),
				getPendingApplicationsCountAction(),
				getPendingStudioBookingsCountAction(),
			]);
			const aCount = appResult.count;

			if (
				bCount > prevBookings.current ||
				aCount > prevApps.current ||
				studioCount > prevStudio.current
			) {
				playSound();
			}

			prevBookings.current = bCount;
			prevApps.current = aCount;
			prevStudio.current = studioCount;

			setCounts(bCount, aCount, studioCount);
		};

		const id = setInterval(poll, 15_000);
		return () => clearInterval(id);
	}, [setCounts]);

	return null;
}
