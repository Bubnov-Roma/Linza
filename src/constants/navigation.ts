"use client";

import type { Icon } from "@phosphor-icons/react";
import {
	CameraIcon,
	ChatsIcon,
	FileTextIcon,
	FolderIcon,
	GearIcon,
	HeartIcon,
	HouseLineIcon,
	LayoutIcon,
	PackageIcon,
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
		title: "Админ-панель",
		href: "/admin",
		icon: LayoutIcon,
	},
	{
		title: "Клиенты",
		href: "/admin/users",
		icon: UserIcon,
		badge: "156",
	},
	{
		title: "Заказы",
		href: "/admin/bookings",
		icon: PackageIcon,
		badge: "18",
	},
	{
		title: "Техника",
		href: "/admin/equipment",
		icon: CameraIcon,
		badge: "42",
	},
	{
		title: "Категории",
		href: "/admin/categories",
		icon: FolderIcon,
		badge: "18",
	},
	{
		title: "Отзывы",
		href: "/admin/reviews",
		icon: ChatsIcon,
		badge: "23",
	},
	{
		title: "Документы",
		href: "/admin/documents",
		icon: FileTextIcon,
	},
	{
		title: "Настройки",
		href: "/admin/settings",
		icon: GearIcon,
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
