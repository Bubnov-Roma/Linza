"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

const POLL_INTERVAL = 15_000; // 15 секунд

// Звук уведомления — короткий синтетический "бип"
function playNotificationSound() {
	try {
		const ctx = new (
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext })
				.webkitAudioContext
		)();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.frequency.value = 880;
		osc.type = "sine";
		gain.gain.setValueAtTime(0.3, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + 0.4);
	} catch {
		// AudioContext недоступен — молча пропускаем
	}
}

interface UseAdminBookingPollingOptions {
	onNewBooking?: (count: number) => void;
	enabled?: boolean;
}

export function useAdminBookingPolling({
	onNewBooking,
	enabled = true,
}: UseAdminBookingPollingOptions = {}) {
	const queryClient = useQueryClient();
	const lastCountRef = useRef<number | null>(null);
	const isFirstRunRef = useRef(true);

	const poll = useCallback(async () => {
		try {
			// Инвалидируем кеш таблицы — она сама перефетчится
			await queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });

			// Также получаем счётчик PENDING_REVIEW для бейджа
			const { getPendingReviewCountAction } = await import(
				"@/actions/admin/admin-booking-actions"
			);
			const { count } = await getPendingReviewCountAction();

			if (isFirstRunRef.current) {
				// Первый запуск — просто запоминаем baseline, не уведомляем
				lastCountRef.current = count;
				isFirstRunRef.current = false;
				return;
			}

			if (lastCountRef.current !== null && count > lastCountRef.current) {
				const diff = count - lastCountRef.current;
				playNotificationSound();
				onNewBooking?.(diff);
			}
			lastCountRef.current = count;
		} catch {
			// Сетевые ошибки — игнорируем
		}
	}, [queryClient, onNewBooking]);

	useEffect(() => {
		if (!enabled) return;
		poll(); // Первый запрос сразу
		const id = setInterval(poll, POLL_INTERVAL);
		return () => clearInterval(id);
	}, [enabled, poll]);
}
