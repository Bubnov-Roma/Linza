"use client";

import {
	CalendarIcon,
	CameraIcon,
	HouseSimpleIcon,
	IntersectIcon,
	LightningIcon,
	MegaphoneIcon,
} from "@phosphor-icons/react/dist/ssr";

import type { JSX } from "react";
import type { BannerType } from "@/actions/admin-banner-actions";

export const PLACEMENT_OPTIONS: {
	value: "hero" | "studio" | "both";
	label: string;
	icon: React.ReactNode;
}[] = [
	{
		value: "hero",
		label: "Главный экран",
		icon: <HouseSimpleIcon size={14} />,
	},
	{
		value: "studio",
		label: "Студия",
		icon: <CameraIcon size={14} />,
	},
	{
		value: "both",
		label: "Везде",
		icon: <IntersectIcon size={14} />,
	},
];

export const EVENT_CONFIG = {
	info: {
		label: "Новости",
		icon: MegaphoneIcon,
		gradient: "from-olive-500/10 via-olive-500/40 to-transparent",
		accent: "bg-olive-500",
		badge: "bg-olive-500/25 text-olive-500 border-olive-500/50",
	},
	event: {
		label: "Событие",
		icon: CalendarIcon,
		gradient: "from-blue-500/10 via-blue-500-500/40 to-transparent",
		accent: "bg-blue-500",
		badge: "bg-blue-500/25 text-blue-500 border-blue-500/50",
	},
	promo: {
		label: "Акция",
		icon: LightningIcon,
		gradient: "from-lime-500/10 via-lime-500-500/40 to-transparent",
		accent: "bg-lime-500",
		badge: "bg-lime-500/25 text-lime-400 border-lime-500/50",
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
