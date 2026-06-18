"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { pollClientNotificationsAction } from "@/actions/notification-actions";
import { VERIFICATION_CONFIG } from "@/constants";
import {
	getClientSoundProfile,
	playNotificationSound,
} from "@/lib/use-notification-sound";
import { useClientNotificationsStore } from "@/store/use-client-notifications.store";

const BOOKING_STATUS_LABELS: Record<string, string> = {
	PENDING_REVIEW: "На проверке",
	WAIT_PAYMENT: "Ожидает оплаты",
	READY_TO_RENT: "Готов к выдаче",
	ACTIVE: "Активен",
	COMPLETED: "Завершён",
	CANCELLED: "Отменён",
	EXPIRED: "Истёк",
};

interface Props {
	initialUnreadChats: number;
}

const POLL_INTERVAL = 20_000;

export function ClientNotificationsPoller({ initialUnreadChats }: Props) {
	const {
		setUnreadChats,
		setHasNewApplicationStatus,
		addBookingChanges,
		setLastPolledAt,
		lastPolledAt,
		soundSettings,
	} = useClientNotificationsStore();

	const lastPolledAtRef = useRef<string | null>(lastPolledAt);
	const isFirstRunRef = useRef(true);

	// Инициализируем счётчик чатов серверным значением
	useEffect(() => {
		setUnreadChats(initialUnreadChats);
	}, [initialUnreadChats, setUnreadChats]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		const poll = async () => {
			try {
				const result = await pollClientNotificationsAction(
					lastPolledAtRef.current
				);

				// Всегда обновляем счётчик чатов
				setUnreadChats(result.unreadChats);

				// Первый запуск — только baseline, без тостов и звуков
				if (isFirstRunRef.current) {
					isFirstRunRef.current = false;
					const now = new Date().toISOString();
					lastPolledAtRef.current = now;
					setLastPolledAt(now);
					return;
				}

				// ── Новые сообщения в чатах ──────────────────────────────────────
				if (result.newChatMessages.length > 0) {
					const profile = getClientSoundProfile("chatMessage", soundSettings);
					playNotificationSound(profile);

					for (const msg of result.newChatMessages.slice(0, 3)) {
						toast("Новое сообщение в поддержке", {
							description: msg.threadSubject,
							duration: 7000,
							action: {
								label: "Открыть",
								onClick: () => {
									window.location.href = `/dashboard/support/${msg.threadId}`;
								},
							},
						});
					}
				}

				// ── Изменение статуса анкеты ─────────────────────────────────────
				if (result.applicationStatusChanged) {
					setHasNewApplicationStatus(true);
					const profile = getClientSoundProfile(
						"applicationStatus",
						soundSettings
					);
					playNotificationSound(profile);

					const statusLabel =
						VERIFICATION_CONFIG?.[result.applicationStatusChanged.newStatus] ??
						result.applicationStatusChanged.newStatus;

					toast("Статус анкеты изменён", {
						description: statusLabel.description,
						duration: 8000,
						action: {
							label: "Перейти",
							onClick: () => {
								window.location.href = "/dashboard/profile";
							},
						},
					});
				}

				// ── Изменения статусов заказов ───────────────────────────────────
				const allBookingChanges = [
					...result.bookingStatusChanges,
					...result.studioBookingStatusChanges,
				];

				if (allBookingChanges.length > 0) {
					addBookingChanges(allBookingChanges);
					const profile = getClientSoundProfile("bookingStatus", soundSettings);
					playNotificationSound(profile);

					for (const change of allBookingChanges.slice(0, 3)) {
						const label =
							BOOKING_STATUS_LABELS[change.newStatus] ?? change.newStatus;
						const isStudio = change.type === "studio";
						toast(
							isStudio ? "Статус бронирования студии" : "Статус заказа изменён",
							{
								description: label,
								duration: 7000,
								action: {
									label: "Открыть",
									onClick: () => {
										window.location.href = isStudio
											? `/dashboard/studio-bookings/${change.bookingId}`
											: `/dashboard/bookings/${change.bookingId}`;
									},
								},
							}
						);
					}
				}

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
	}, [
		setUnreadChats,
		setHasNewApplicationStatus,
		addBookingChanges,
		setLastPolledAt,
	]);

	return null;
}
