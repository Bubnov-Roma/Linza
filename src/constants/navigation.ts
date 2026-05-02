"use client";

import type { Icon } from "@phosphor-icons/react";
import {
	CameraIcon,
	ChatsIcon,
	FolderIcon,
	HeartIcon,
	HouseLineIcon,
	PackageIcon,
	SquaresFourIcon,
	UserIcon,
	VideoIcon,
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
		title: "Студия",
		href: "/admin/studio",
		icon: VideoIcon,
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
		title: "Чаты",
		href: "/admin/reviews",
		icon: ChatsIcon,
	},
];

export const MOBILE_NAV: NavItem[] = [
	{
		title: "Главная",
		href: "/",
		icon: HouseLineIcon,
	},
	{
		title: "Избранное",
		href: "/favorites",
		icon: HeartIcon,
	},
	{
		title: "Каталог",
		href: "/equipment",
		icon: SquaresFourIcon,
	},
];
