"use client";

import type { Icon } from "@phosphor-icons/react";
import {
	AirplayIcon,
	CameraIcon,
	ChatsIcon,
	FolderIcon,
	HeartIcon,
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
		icon: AirplayIcon,
	},
	{
		title: "Чаты",
		href: "/admin/reviews",
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
		icon: AirplayIcon,
	},
	{
		title: "Избранное",
		href: "/favorites",
		icon: HeartIcon,
	},
];
