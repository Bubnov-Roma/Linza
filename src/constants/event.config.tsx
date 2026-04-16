import {
	CalendarIcon,
	LightningIcon,
	MegaphoneIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { JSX } from "react";
import type { BannerType } from "@/actions/admin-banner-actions";

export const EVENT_CONFIG = {
	info: {
		label: "Новости",
		icon: MegaphoneIcon,
		gradient: "from-background/80 via-olive-500/20 to-transparent",
		accent: "bg-olive-500",
		badge: "bg-olive-500/15 text-olive-500 border-olive-500/20",
	},
	event: {
		label: "Событие",
		icon: CalendarIcon,
		gradient: "from-background/80 via-violet-500/10 to-transparent",
		accent: "bg-violet-500",
		badge: "bg-violet-500/15 text-violet-400 border-violet-500/20",
	},
	promo: {
		label: "Акция",
		icon: LightningIcon,
		gradient: "from-background/80 via-lime-500/10 to-transparent",
		accent: "bg-lime-500",
		badge: "bg-lime-500/15 text-lime-400 border-lime-500/20",
	},
} as const;

export const TYPE_OPTIONS: {
	value: BannerType;
	label: string;
	icon: JSX.Element;
}[] = [
	{
		value: "info",
		label: "Новости / информация",
		icon: <MegaphoneIcon size={14} />,
	},
	{
		value: "event",
		label: "Событие / мастер-класс",
		icon: <CalendarIcon size={14} />,
	},
	{
		value: "promo",
		label: "Акция / скидка",
		icon: <LightningIcon size={14} />,
	},
];

export const TYPE_COLORS: Record<BannerType, string> = {
	info: "text-lime-400",
	event: "text-violet-400",
	promo: "text-amber-400",
};
