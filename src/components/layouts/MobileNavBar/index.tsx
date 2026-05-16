"use client";

import type { Icon } from "@phosphor-icons/react";
import {
	CameraIcon,
	CaretDownIcon,
	MagnifyingGlassIcon,
	PackageIcon,
	ShoppingCartSimpleIcon,
	SquaresFourIcon,
	UserIcon,
	VideoIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { UserMenu } from "@/components/layouts/UserMenu";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { getCategoryIcon } from "@/constants";
import { MOBILE_NAV } from "@/constants/navigation";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";
import { useAdminNotificationsStore } from "@/store";
import { useCartStore } from "@/store/use-cart.store";
import { MobileSearch, type MobileSearchHandle } from "./MobileSearch";

// ─── TabBtn — базовая кнопка таба ────────────────────────────────────────────

function TabBtn({
	isActive,
	onClick,
	icon: Icon,
	label,
	badge,
	className,
}: {
	isActive: boolean;
	onClick?: () => void;
	icon?: Icon;
	label: string;
	badge?: string | number;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"relative flex flex-col items-center justify-center gap-0.5 transition-colors group shrink-0",
				className
			)}
		>
			{isActive && (
				<span className="absolute inset-x-1 top-1 bottom-1 bg-primary/10 rounded-xl" />
			)}
			<div className="relative z-10">
				{Icon && (
					<Icon
						size={24}
						weight={isActive ? "fill" : "regular"}
						className={cn(
							"transition-all duration-200",
							isActive
								? "text-primary scale-105"
								: "text-muted-foreground group-active:scale-90"
						)}
					/>
				)}
				{badge !== undefined && (
					<span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground animate-in zoom-in">
						{Number(badge) > 99 ? "99+" : badge}
					</span>
				)}
			</div>
			<span
				className={cn(
					"relative z-10 text-[9px] font-semibold tracking-wide transition-colors leading-none mt-0.5",
					isActive ? "text-primary" : "text-muted-foreground"
				)}
			>
				{label}
			</span>
		</button>
	);
}

// ─── MobileNavBar ─────────────────────────────────────────────────────────────

interface MobileNavBarProps {
	categories: DbCategory[];
	isAdmin: boolean;
}

export function MobileNavBar({ categories, isAdmin }: MobileNavBarProps) {
	const cartCount = useCartStore((s) =>
		s.items.reduce((sum, i) => sum + i.quantity, 0)
	);

	const pathname = usePathname();
	const router = useRouter();
	const [searchOpen, setSearchOpen] = useState(false);
	const [catalogDrawerOpen, setCatalogDrawerOpen] = useState(false);

	const searchRef = useRef<MobileSearchHandle>(null);

	const pendingBookings = useAdminNotificationsStore((s) => s.pendingBookings);
	const pendingApps = useAdminNotificationsStore((s) => s.pendingApps);
	const pendingStudio = useAdminNotificationsStore((s) => s.pendingStudio);

	// Формируем список навигации на основе роли
	const navItems = isAdmin
		? [
				{
					title: "Заказы",
					href: "/admin/bookings",
					icon: PackageIcon,
					badge: pendingBookings > 0 ? pendingBookings : undefined,
				},
				{
					title: "Студия",
					href: "/admin/studio",
					icon: VideoIcon,
					badge: pendingStudio > 0 ? pendingStudio : undefined,
				},
				{
					title: "Клиенты",
					href: "/admin/users",
					icon: UserIcon,
					badge: pendingApps > 0 ? pendingApps : undefined,
				},
				{
					title: "Техника",
					href: "/admin/equipment",
					icon: CameraIcon,
				},
			]
		: [
				...MOBILE_NAV,
				{
					title: "Корзина",
					href: "/checkout",
					icon: ShoppingCartSimpleIcon,
					badge: cartCount > 0 ? cartCount : undefined,
				},
			];

	return (
		<>
			{/* MobileSearch — выезжает сверху */}
			<MobileSearch
				ref={searchRef}
				isOpen={searchOpen}
				onClose={() => setSearchOpen(false)}
				categories={categories}
			/>

			{/* ── Таб-панель ── */}
			<nav className="md:hidden fixed bottom-0 inset-x-0 z-50">
				<div
					className="flex items-stretch mx-0 border-t border-foreground/8 bg-background/55 backdrop-blur-2xl"
					style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
				>
					{/* ── Левый закрепленный блок (User) ── */}
					<div className="shrink-0 w-14 flex items-center justify-center border-r border-muted-foreground/5">
						<UserMenu isAdmin={isAdmin} variant="mobile" />
					</div>

					{/* ── Прокручиваемые пункты меню ── */}
					<div className="flex-1 flex items-center h-14 overflow-x-auto custom-scrollbar snap-x snap-mandatory">
						<div className="flex items-stretch justify-center h-full px-1 gap-1 min-w-full">
							{navItems.map((item) => {
								const { href, title, icon: Icon, badge } = item;
								const isActive =
									href === "/" ? pathname === "/" : pathname.startsWith(href);

								// Особая обработка для кнопки "Каталог" (вызов Drawer'а)
								if (href === "/equipment") {
									return (
										<Drawer
											key={href}
											open={catalogDrawerOpen}
											onOpenChange={setCatalogDrawerOpen}
										>
											<DrawerTrigger asChild>
												<div className="h-full snap-center px-1 shrink-0 flex">
													<TabBtn
														isActive={isActive}
														icon={Icon}
														label={title}
														className="w-16"
													/>
												</div>
											</DrawerTrigger>
											<DrawerContent className="max-h-[85vh] flex flex-col">
												<DrawerHeader className="text-left pb-2">
													<DrawerTitle className="text-xl font-bold">
														Каталог техники
													</DrawerTitle>
												</DrawerHeader>
												<div className="overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
													<Link
														href="/equipment"
														onClick={() => setCatalogDrawerOpen(false)}
														className="flex items-center gap-4 px-4 h-14 rounded-2xl bg-primary/10 text-primary font-bold mb-4 active:scale-95 transition-transform"
													>
														<SquaresFourIcon size={24} weight="fill" />
														Весь каталог
													</Link>
													{categories.map((cat) => {
														const CatIcon = getCategoryIcon(cat.iconName);
														return (
															<Collapsible
																key={cat.id}
																className="group/collapsible bg-muted-foreground/5 rounded-2xl overflow-hidden"
															>
																<CollapsibleTrigger className="flex w-full items-center justify-between p-4 active:bg-muted-foreground/10 transition-colors">
																	<div className="flex items-center gap-3">
																		<CatIcon
																			size={24}
																			className="text-muted-foreground group-data-[state=open]/collapsible:text-foreground transition-colors"
																		/>
																		<span className="font-semibold text-[15px]">
																			{cat.name}
																		</span>
																	</div>
																	<CaretDownIcon
																		size={20}
																		className="text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180"
																	/>
																</CollapsibleTrigger>
																<CollapsibleContent className="px-4 pb-3 flex flex-col gap-1">
																	{cat.subcategories.map((sub) => (
																		<Link
																			key={sub.id}
																			href={`/equipment?category=${cat.slug}&subcategory=${sub.slug}`}
																			onClick={() =>
																				setCatalogDrawerOpen(false)
																			}
																			className="py-2.5 px-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground transition-colors"
																		>
																			{sub.name}
																		</Link>
																	))}
																</CollapsibleContent>
															</Collapsible>
														);
													})}
												</div>
											</DrawerContent>
										</Drawer>
									);
								}

								return (
									<TabBtn
										key={href}
										isActive={isActive}
										icon={Icon}
										label={title}
										{...(badge && { badge })}
										onClick={() => router.push(href)}
										className="w-16 h-full snap-center px-1"
									/>
								);
							})}
						</div>
					</div>

					{/* ── Правый закрепленный блок (Поиск) ── */}
					<div className="shrink-0 w-14 flex items-center justify-center border-l border-muted-foreground/5">
						<button
							type="button"
							onClick={() => {
								const nextState = !searchOpen;
								setSearchOpen(nextState);
								if (nextState) searchRef.current?.focus();
							}}
							className="flex flex-col h-full w-full items-center justify-center group active:scale-90 transition-transform"
							aria-label={searchOpen ? "Закрыть поиск" : "Открыть поиск"}
						>
							<div className="relative w-10 h-10">
								<AnimatePresence mode="wait" initial={false}>
									{searchOpen ? (
										<motion.div
											key="close"
											initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
											animate={{ opacity: 1, rotate: 0, scale: 1 }}
											exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
											transition={{ duration: 0.15, ease: "easeOut" }}
											className="absolute inset-0 flex items-center justify-center h-full"
										>
											<XCircleIcon
												weight="duotone"
												size={34}
												className="text-muted-foreground dark:text-primary group-active:scale-90"
											/>
										</motion.div>
									) : (
										<motion.div
											key="search"
											initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
											animate={{ opacity: 1, rotate: 0, scale: 1 }}
											exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
											transition={{ duration: 0.15, ease: "easeOut" }}
											className="absolute inset-0 flex items-center justify-around"
										>
											<MagnifyingGlassIcon
												weight="duotone"
												size={34}
												className="text-muted-foreground group-active:scale-90"
											/>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</button>
					</div>
				</div>
			</nav>
		</>
	);
}
