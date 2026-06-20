"use client";

import {
	BellSlashIcon,
	ChatCenteredTextIcon,
	FileTextIcon,
	PackageIcon,
	SpeakerHighIcon,
	SpeakerLowIcon,
	SpeakerNoneIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui";
import { previewNotificationSound } from "@/lib/use-notification-sound";
import { cn } from "@/lib/utils";
import {
	type ClientNotificationEvent,
	useClientNotificationsStore,
} from "@/store/use-client-notifications.store";
import type { SoundProfile } from "@/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const EVENTS: {
	key: ClientNotificationEvent;
	label: string;
	hint: string;
	icon: React.ReactNode;
}[] = [
	{
		key: "chatMessage",
		label: "Сообщения поддержки",
		hint: "Новый ответ от администратора в чате",
		icon: (
			<ChatCenteredTextIcon
				size={15}
				weight="duotone"
				className="text-green-500"
			/>
		),
	},
	{
		key: "applicationStatus",
		label: "Статус анкеты",
		hint: "Одобрение, отклонение или уточнение",
		icon: <FileTextIcon size={15} weight="duotone" className="text-blue-500" />,
	},
	{
		key: "bookingStatus",
		label: "Статус заказа",
		hint: "Изменения по заказам техники и студии",
		icon: <PackageIcon size={15} weight="duotone" className="text-amber-500" />,
	},
];

const PROFILES: {
	value: SoundProfile;
	label: string;
	icon: React.ReactNode;
}[] = [
	{
		value: "off",
		label: "Выкл",
		icon: <BellSlashIcon size={14} weight="duotone" />,
	},
	{
		value: "subtle",
		label: "Тихо",
		icon: <SpeakerNoneIcon size={14} weight="duotone" />,
	},
	{
		value: "default",
		label: "Средне",
		icon: <SpeakerLowIcon size={14} weight="duotone" />,
	},
	{
		value: "loud",
		label: "Громко",
		icon: <SpeakerHighIcon size={14} weight="duotone" />,
	},
];

export function ClientNotificationSoundSettings() {
	const { soundSettings, setSoundSetting } = useClientNotificationsStore();

	const handleSet = (event: ClientNotificationEvent, profile: SoundProfile) => {
		setSoundSetting(event, profile);
		if (profile !== "off") previewNotificationSound(profile);
	};

	return (
		<div className="divide-y divide-foreground/5">
			{EVENTS.map(({ key, label, hint, icon }) => {
				const current = soundSettings[key];
				return (
					<div key={key} className="px-5 py-4 space-y-2.5">
						{/* Заголовок строки */}
						<div className="flex items-center gap-2.5">
							{icon}
							<div className="min-w-0">
								<p className="text-sm font-medium leading-tight">{label}</p>
								<p className="text-[11px] text-muted-foreground/50 mt-0.5">
									{hint}
								</p>
							</div>
						</div>

						{/* Пикер профиля */}
						<div className="flex gap-1.5">
							{PROFILES.map(
								({ value, label: profileLabel, icon: profileIcon }) => {
									const active = current === value;
									return (
										<Button
											key={value}
											variant="ghost"
											size="lg"
											onClick={() => handleSet(key, value)}
											className={cn(
												"flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] font-semibold transition-all duration-150",
												active
													? "bg-muted-foreground/10 border-muted-foreground/30 text-foreground"
													: "border-foreground/8 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
											)}
										>
											{profileIcon}
											{profileLabel}
										</Button>
									);
								}
							)}
						</div>
					</div>
				);
			})}

			<div className="px-5 py-3">
				<p className="text-[11px] text-muted-foreground/40">
					При выборе профиля воспроизводится предпросмотр звука
				</p>
			</div>
		</div>
	);
}
