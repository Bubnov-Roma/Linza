"use client";

import {
	ArrowCounterClockwiseIcon,
	InfoIcon,
	SpeakerHighIcon,
	SpeakerLowIcon,
	SpeakerNoneIcon,
	SpeakerSimpleSlashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import { DEFAULT_SOUND_SETTINGS, NOTIFICATION_LABELS } from "@/constants";
import { previewNotificationSound } from "@/lib/use-notification-sound";
import { cn } from "@/lib/utils";
import { useAdminNotificationsStore } from "@/store/use-admin-notifications.store";
import type { AdminNotificationType, SoundProfile } from "@/types";

// ─── Иконки и лейблы профилей ─────────────────────────────────────────────────

const PROFILE_META: Record<
	SoundProfile,
	{ label: string; icon: React.ReactNode; description: string }
> = {
	off: {
		label: "Выкл",
		icon: <SpeakerSimpleSlashIcon size={14} weight="bold" />,
		description: "Без звука",
	},
	subtle: {
		label: "Тихий",
		icon: <SpeakerNoneIcon size={14} weight="bold" />,
		description: "Мягкий одиночный бип",
	},
	default: {
		label: "Обычный",
		icon: <SpeakerLowIcon size={14} weight="bold" />,
		description: "Двойной сигнал",
	},
	loud: {
		label: "Громкий",
		icon: <SpeakerHighIcon size={14} weight="bold" />,
		description: "Тройной тревожный",
	},
};

const PROFILES: SoundProfile[] = ["off", "subtle", "default", "loud"];

// ─── Группировка типов уведомлений ───────────────────────────────────────────

const GROUPS: { label: string; types: AdminNotificationType[] }[] = [
	{
		label: "Клиенты",
		types: [
			"userRegistered",
			"applicationSubmitted",
			"applicationUpdated",
			"userDeletionRequested",
		],
	},
	{
		label: "Заказы",
		types: [
			"bookingCreated",
			"studioBookingCreated",
			"bookingUpdated",
			"bookingCancelled",
		],
	},
	{
		label: "Чат и FAQ",
		types: [
			"supportMessageClient",
			"supportMessageReply",
			"faqQuestionSubmitted",
		],
	},
];

// ─── Строка одного типа уведомления ──────────────────────────────────────────

function NotificationRow({ type }: { type: AdminNotificationType }) {
	const { soundSettings, setSoundProfile } = useAdminNotificationsStore();
	const current = soundSettings[type] ?? "subtle";

	const handleSelect = (profile: SoundProfile) => {
		setSoundProfile(type, profile);
		if (profile !== "off") previewNotificationSound(profile);
	};

	return (
		<div className="flex items-center justify-between gap-4 py-3 border-b border-foreground/5 last:border-0">
			<span className="text-sm text-foreground/80 min-w-0 flex-1 truncate">
				{NOTIFICATION_LABELS[type]}
			</span>

			<div className="flex items-center gap-1 shrink-0">
				{PROFILES.map((profile) => {
					const meta = PROFILE_META[profile];
					const isActive = current === profile;
					return (
						<button
							key={profile}
							type="button"
							title={`${meta.label} — ${meta.description}`}
							onClick={() => handleSelect(profile)}
							className={cn(
								"flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all border",
								isActive
									? "bg-foreground text-background border-foreground"
									: "bg-foreground/5 text-foreground/50 border-transparent hover:border-foreground/20 hover:text-foreground/80"
							)}
						>
							{meta.icon}
							<span className="hidden sm:inline">{meta.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}

// ─── Основной компонент ───────────────────────────────────────────────────────

export function NotificationsSoundSection() {
	const { soundSettings, resetSoundSettings } = useAdminNotificationsStore();

	// Проверяем есть ли отклонения от дефолта
	const isModified = (
		Object.keys(soundSettings) as AdminNotificationType[]
	).some((t) => soundSettings[t] !== DEFAULT_SOUND_SETTINGS[t]);

	const handleReset = () => {
		resetSoundSettings();
		toast.success("Звуковые настройки сброшены");
	};

	// Превью всех профилей
	const handlePreviewAll = () => {
		const profiles: SoundProfile[] = ["subtle", "default", "loud"];
		profiles.forEach((p, i) => {
			setTimeout(() => previewNotificationSound(p), i * 800);
		});
	};

	return (
		<Card className="lg:col-span-2 py-6">
			<CardHeader>
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-baseline gap-4">
						<CardTitle className="self-baseline">Звуки уведомлений</CardTitle>
						<Tooltip>
							<TooltipTrigger>
								<InfoIcon
									size={14}
									weight="bold"
									className="inline text-muted-foreground"
								/>
							</TooltipTrigger>
							<TooltipContent side="top" className="w-50">
								Настройте звуковой сигнал для каждого типа события. Нажмите на
								профиль чтобы выбрать и услышать.
							</TooltipContent>
						</Tooltip>
					</div>
					<CardDescription className="hidden">
						Настройте звуковой сигнал для каждого типа события. Нажмите на
						профиль чтобы выбрать и услышать.
					</CardDescription>
					<div className="flex items-center gap-2 shrink-0">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handlePreviewAll}
							className="gap-2 text-xs rounded-xl border-0"
						>
							<SpeakerHighIcon size={14} weight="bold" />
							<span className="hidden sm:inline">Прослушать все</span>
						</Button>
						{isModified && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={handleReset}
								className="gap-2 text-xs text-muted-foreground hover:text-foreground rounded-xl"
							>
								<ArrowCounterClockwiseIcon size={14} weight="bold" />
								<span className="hidden sm:inline">Сбросить</span>
							</Button>
						)}
					</div>
				</div>

				{/* Легенда профилей */}
				<div className="flex flex-wrap gap-3 my-3">
					{PROFILES.map((p) => {
						const meta = PROFILE_META[p];
						return (
							<button
								key={p}
								type="button"
								onClick={() => p !== "off" && previewNotificationSound(p)}
								className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
							>
								{p === "off" ? <SpeakerSimpleSlashIcon size={13} /> : meta.icon}
								<span>{meta.label}</span>
								<span className="text-muted-foreground/50">
									— {meta.description}
								</span>
							</button>
						);
					})}
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{GROUPS.map((group) => (
					<div key={group.label}>
						<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
							{group.label}
						</p>
						<div>
							{group.types.map((type) => (
								<NotificationRow key={type} type={type} />
							))}
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
