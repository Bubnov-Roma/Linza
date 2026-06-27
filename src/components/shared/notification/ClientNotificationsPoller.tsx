"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { pollClientNotificationsAction } from "@/actions/notification-actions";
import { BOOKING_STATUS_LABELS, VERIFICATION_CONFIG } from "@/constants";
import {
	getClientSoundProfile,
	playNotificationSound,
} from "@/lib/use-notification-sound";
import { useClientNotificationsStore } from "@/store/use-client-notifications.store";

interface Props {
	initialUnreadChats: number;
}

const POLL_INTERVAL = 20_000;

export function ClientNotificationsPoller({ initialUnreadChats }: Props) {
	const {
		setUnreadChats,
		setHasNewApplicationStatus,
		setApplicationStatusNotification,
		addBookingChanges,
		setLastPolledAt,
		lastPolledAt,
		soundSettings,
		setAvailableAutoPromo,
		availableAutoPromo,
	} = useClientNotificationsStore();

	// Трекер показанных авто-промо-тостов за сессию — чтобы не спамить
	const autoPromoToastShownRef = useRef(false);
	// Запоминаем код из стора на момент монтирования — если уже есть, не тостим
	const initialAutoPromoCode = useRef(availableAutoPromo?.code ?? null);

	const lastPolledAtRef = useRef<string | null>(lastPolledAt);
	const isFirstRunRef = useRef(true);

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

				setUnreadChats(result.unreadChats);

				if (isFirstRunRef.current) {
					isFirstRunRef.current = false;
					const now = new Date().toISOString();
					lastPolledAtRef.current = now;
					setLastPolledAt(now);
					return;
				}

				// ── Новые сообщения в чатах (только звук + тост, бейдж не в панели) ─
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
					setApplicationStatusNotification({
						newStatus: result.applicationStatusChanged.newStatus,
						changedAt: result.applicationStatusChanged.changedAt,
						clarificationThreadId:
							result.applicationStatusChanged.clarificationThreadId ?? null,
					});

					const profile = getClientSoundProfile(
						"applicationStatus",
						soundSettings
					);
					playNotificationSound(profile);

					const statusConfig =
						VERIFICATION_CONFIG?.[
							result.applicationStatusChanged
								.newStatus as keyof typeof VERIFICATION_CONFIG
						];

					toast("Статус анкеты изменён", {
						description:
							statusConfig?.label ?? result.applicationStatusChanged.newStatus,
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

				// ── Авто-промокод ───────────────────────────────────────────────
				setAvailableAutoPromo(result.autoPromo);

				if (
					result.autoPromo &&
					!autoPromoToastShownRef.current &&
					result.autoPromo.code !== initialAutoPromoCode.current
				) {
					autoPromoToastShownRef.current = true;
					const profile = getClientSoundProfile("promoApplied", soundSettings);
					playNotificationSound(profile);

					const discountText =
						result.autoPromo.type === "PERCENT"
							? `${result.autoPromo.value}%`
							: `${result.autoPromo.value.toLocaleString("ru-RU")} ₽`;
					const minNote = result.autoPromo.minOrderAmount
						? ` при заказе от ${result.autoPromo.minOrderAmount.toLocaleString("ru-RU")} ₽`
						: "";

					toast.success(`🎁 Вам доступна скидка ${discountText}`, {
						description: `Промокод ${result.autoPromo.code} применится автоматически${minNote} при первом заказе.`,
						duration: 10000,
					});
				}

				// Если промокод исчез — сбрасываем флаг для нового промокода
				if (!result.autoPromo) {
					autoPromoToastShownRef.current = false;
					initialAutoPromoCode.current = null;
				}

				const now = new Date().toISOString();
				lastPolledAtRef.current = now;
				setLastPolledAt(now);
			} catch {
				// ignore
			}
		};

		poll();
		const id = setInterval(poll, POLL_INTERVAL);
		return () => clearInterval(id);
	}, [
		setUnreadChats,
		setHasNewApplicationStatus,
		setApplicationStatusNotification,
		addBookingChanges,
		setLastPolledAt,
	]);

	return null;
}
