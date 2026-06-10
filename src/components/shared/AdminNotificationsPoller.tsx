"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { pollAdminNotificationsAction } from "@/actions/admin-notification-actions";
import {
	getNotificationHref,
	NOTIFICATION_LABELS,
	POLL_INTERVAL,
} from "@/constants";
import { getSoundProfile, playNotificationSound } from "@/lib/use-admin-sound";
import { useAdminNotificationsStore } from "@/store/use-admin-notifications.store";
import type { AdminNotificationType } from "@/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
	initialBookings: number;
	initialApps: number;
	initialStudio: number;
	initialChats: number;
}

// ─── Компонент ────────────────────────────────────────────────────────────────

/**
 * Единый невизуальный поллер для всех admin-уведомлений.
 * Заменяет:
 *   - старый AdminNotificationsPoller (4 отдельных action-вызова)
 *   - use-admin-booking-polling (дублировал счётчик bookings)
 *
 * Монтируется один раз в root layout только для ADMIN/MANAGER.
 */
export function AdminNotificationsPoller({
	initialBookings,
	initialApps,
	initialStudio,
	initialChats,
}: Props) {
	const {
		setCounts,
		setUnreadCount,
		prependNotifications,
		setLastPolledAt,
		lastPolledAt,
		soundSettings,
	} = useAdminNotificationsStore();

	// Ref чтобы poll-колбэк видел актуальный lastPolledAt без пересоздания интервала
	const lastPolledAtRef = useRef<string | null>(lastPolledAt);

	// Инициализируем стор серверными счётчиками при монтировании
	useEffect(() => {
		setCounts(initialBookings, initialApps, initialStudio, initialChats);
	}, [initialBookings, initialApps, initialStudio, initialChats, setCounts]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		// Первый поллинг — сразу, затем по интервалу
		const poll = async () => {
			try {
				const result = await pollAdminNotificationsAction(
					lastPolledAtRef.current
				);

				// Обновляем счётчики бейджей
				setCounts(
					result.pendingBookings,
					result.pendingApps,
					result.pendingStudio,
					result.pendingChats
				);
				setUnreadCount(result.unreadCount);

				// Обрабатываем новые уведомления
				if (result.newNotifications.length > 0) {
					prependNotifications(result.newNotifications);

					// Группируем по типу для звука — играем один звук на самый
					// приоритетный тип из пришедшей пачки
					const types = [
						...new Set(
							result.newNotifications.map(
								(n) => n.type as AdminNotificationType
							)
						),
					];

					// Берём самый «громкий» профиль из всех типов пачки
					const profilePriority: Record<string, number> = {
						off: 0,
						subtle: 1,
						default: 2,
						loud: 3,
					};
					const topProfile = types.reduce(
						(best, type) => {
							const p = getSoundProfile(type, soundSettings);
							return (profilePriority[p] ?? 0) > (profilePriority[best] ?? 0)
								? p
								: best;
						},
						"off" as ReturnType<typeof getSoundProfile>
					);

					playNotificationSound(topProfile);

					// Тост для каждого уведомления (макс. 3, остальные схлопываются)
					const toShow = result.newNotifications.slice(0, 3);
					for (const n of toShow) {
						const label =
							NOTIFICATION_LABELS[n.type as AdminNotificationType] ?? n.type;
						const userName = n.user?.name ?? n.user?.email ?? "Клиент";
						const href = getNotificationHref(n);

						toast(label, {
							description: userName,
							duration: 6000,
							action: href
								? {
										label: "Открыть",
										onClick: () => {
											window.location.href = href;
										},
									}
								: undefined,
						});
					}

					if (result.newNotifications.length > 3) {
						toast(`+${result.newNotifications.length - 3} новых уведомлений`, {
							duration: 4000,
						});
					}
				}

				// Сохраняем метку времени для следующего запроса
				const now = new Date().toISOString();
				lastPolledAtRef.current = now;
				setLastPolledAt(now);
			} catch {
				// Сетевые ошибки — молча пропускаем
			}
		};

		poll();
		const id = setInterval(poll, POLL_INTERVAL);
		return () => clearInterval(id);
		// soundSettings не в deps намеренно — читаем через стор в момент вызова
	}, [setCounts, setUnreadCount, prependNotifications, setLastPolledAt]);

	return null;
}
