"use client";

import type { Icon } from "@phosphor-icons/react";
import {
	CameraIcon,
	ChatsIcon,
	FilmSlateIcon,
	FolderIcon,
	HeadsetIcon,
	HouseLineIcon,
	PackageIcon,
	QuestionIcon,
	SquaresFourIcon,
	UserIcon,
} from "@phosphor-icons/react/dist/ssr";

export type NavItem = {
	title: string;
	href: string;
	icon: Icon;
	badge?: string | number;
};

export const ADMIN_NAV: NavItem[] = [
	{
		title: "Клиенты",
		href: "/admin/users",
		icon: UserIcon,
	},
	{
		title: "Заказы",
		href: "/admin/bookings",
		icon: PackageIcon,
	},
	{
		title: "Техника",
		href: "/admin/equipment",
		icon: CameraIcon,
	},
	{
		title: "Категории",
		href: "/admin/categories",
		icon: FolderIcon,
	},
	{
		title: "Студия",
		href: "/admin/studio",
		icon: FilmSlateIcon,
	},
	{
		title: "Чаты",
		href: "/admin/support",
		icon: ChatsIcon,
	},
	{
		title: "FAQ",
		href: "/admin/faq",
		icon: QuestionIcon,
	},
];

export const MOBILE_NAV: NavItem[] = [
	{
		title: "Главная",
		href: "/",
		icon: HouseLineIcon,
	},
	{
		title: "Каталог",
		href: "/equipment",
		icon: SquaresFourIcon,
	},
	{
		title: "Студия",
		href: "/studio",
		icon: FilmSlateIcon,
	},
	{
		title: "Связь",
		href: "/favorites",
		icon: HeadsetIcon,
	},
];
