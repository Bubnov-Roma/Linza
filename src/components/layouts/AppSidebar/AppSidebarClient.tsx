"use client";

import {
	ArrowsClockwiseIcon,
	CaretDownIcon,
	CaretUpIcon,
	CubeIcon,
	SidebarSimpleIcon,
	SquaresFourIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	getPendingApplicationsCountAction,
	getPendingCount,
} from "@/actions/client-booking-actions";
import { Logo } from "@/components/icons/Logo";
import { CategoryNavItem } from "@/components/layouts/AppSidebar/CategoryNavItem";
import { menuBtnClass } from "@/components/layouts/AppSidebar/menuBtnClass";
import { RenderIcon } from "@/components/layouts/AppSidebar/RenderIcon";
import { UserMenu } from "@/components/layouts/UserMenu";
import {
	Button,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui";
import { ADMIN_NAV } from "@/constants/navigation";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

interface Props {
	isAdmin: boolean;
	categories: DbCategory[];
	initialPendingBookings?: number;
	initialPendingApplications?: number;
}

export function AppSidebarClient({
	isAdmin,
	categories,
	initialPendingBookings = 0,
	initialPendingApplications = 0,
}: Props) {
	const [pendingBookings, setPendingBookings] = useState(
		initialPendingBookings
	);
	const [pendingApps, setPendingApps] = useState(initialPendingApplications);
	const prevBookingsRef = useRef(initialPendingBookings);
	const prevAppsRef = useRef(initialPendingApplications);
	const isFirstRunRef = useRef(true);

	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentCategory = searchParams.get("category");
	const currentSubcategory = searchParams.get("subcategory");

	const isAllEquipment = pathname === "/equipment" && !currentCategory;

	const { state, isMobile, toggleSidebar } = useSidebar();
	const isCollapsed = state === "collapsed" && !isMobile;

	const [showAdminNav, setShowAdminNav] = useState(true);

	const playSound = useCallback(() => {
		try {
			const ctx = new (
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext
			)();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = 880;
			osc.type = "sine";
			gain.gain.setValueAtTime(0.3, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + 0.4);
		} catch {
			/* AudioContext недоступен */
		}
	}, []);

	useEffect(() => {
		if (!isAdmin) return;

		async function poll() {
			const [bCount, appResult] = await Promise.all([
				getPendingCount(),
				getPendingApplicationsCountAction(),
			]);
			const aCount = appResult.count;

			if (isFirstRunRef.current) {
				prevBookingsRef.current = bCount;
				prevAppsRef.current = aCount;
				setPendingBookings(bCount);
				setPendingApps(aCount);
				isFirstRunRef.current = false;
				return;
			}

			if (bCount > prevBookingsRef.current) {
				playSound();
			}
			if (aCount > prevAppsRef.current) {
				playSound();
			}

			prevBookingsRef.current = bCount;
			prevAppsRef.current = aCount;
			setPendingBookings(bCount);
			setPendingApps(aCount);
		}

		poll(); // сразу
		const id = setInterval(poll, 15_000);
		return () => clearInterval(id);
	}, [isAdmin, playSound]);

	return (
		<>
			{/* ── HEADER ── */}
			<SidebarHeader
				className={cn(
					"h-16 flex items-center justify-between relative border-b border-foreground/5",
					isCollapsed ? "mx-auto" : "px-4"
				)}
			>
				<div className="flex items-center w-full h-full gap-2 overflow-hidden">
					<Link
						href="/"
						className={cn(
							"flex items-center gap-3 transition-all duration-300",
							isCollapsed ? "w-10 justify-center relative" : "flex-1 min-w-0"
						)}
					>
						{isCollapsed ? (
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
								<Logo
									className={cn(
										"max-h-5 w-4 text-primary-foreground shadow-lg shadow-primary pl-1"
									)}
								/>
							</div>
						) : (
							<>
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
									<Logo className="max-h-5 w-auto text-primary-foreground shadow-lg shadow-primary/20 pl-1" />
								</div>
								<span className="font-black tracking-tighter text-xl truncate">
									LINZA
								</span>
							</>
						)}
					</Link>
					{!isCollapsed && (
						<Button
							variant="ghost"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								toggleSidebar();
							}}
							className="ml-auto hidden md:flex h-8 w-8 shrink-0 rounded-lg text-foreground transition-all duration-300 hover:scale-110"
						>
							<SidebarSimpleIcon size={16} />
						</Button>
					)}
				</div>
			</SidebarHeader>

			{/* ── CONTENT ── */}
			<SidebarContent className="px-1 custom-scrollbar">
				{/* ── Каталог ── */}
				{(!isAdmin || !showAdminNav) && (
					<SidebarGroup>
						<SidebarGroupLabel className={cn("opacity-0 hidden")}>
							Каталог
						</SidebarGroupLabel>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={isAllEquipment}
									className={menuBtnClass(isAllEquipment, isCollapsed)}
								>
									<Link
										href="/equipment"
										className={cn(
											"flex",
											isCollapsed
												? "flex-col items-center justify-center gap-1 w-full h-full"
												: "items-center w-full"
										)}
									>
										<div
											className={cn(
												"flex items-center justify-center shrink-0",
												isCollapsed
													? "h-10 w-14 rounded-xl transition-colors"
													: "w-6",
												isCollapsed && isAllEquipment
													? "bg-muted-foreground/10 text-primary"
													: "text-muted-foreground group-hover/btn:bg-muted-foreground/5 group-hover/btn:shadow-sm"
											)}
										>
											<RenderIcon
												icon={SquaresFourIcon}
												isActive={isAllEquipment}
											/>
										</div>
										{isCollapsed ? (
											<span
												className={cn(
													"text-[10px] font-medium leading-none w-full text-center px-1 truncate",
													isAllEquipment
														? "text-foreground font-bold"
														: "text-muted-foreground"
												)}
											>
												Каталог
											</span>
										) : (
											<span className="font-medium text-base truncate ml-3 flex-1 text-left">
												Весь каталог
											</span>
										)}
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							{categories.map((cat) => (
								<CategoryNavItem
									key={cat.id}
									category={cat}
									isCollapsed={isCollapsed}
									isMobile={isMobile}
									currentCategory={currentCategory}
									currentSubcategory={currentSubcategory}
								/>
							))}
						</SidebarMenu>
					</SidebarGroup>
				)}

				{/* ── Меню администратора ── */}
				{isAdmin && showAdminNav && (
					<SidebarGroup className={cn("mt-4", isCollapsed && "mt-12")}>
						<SidebarGroupLabel
							className={cn(
								"px-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/50 transition-opacity",
								isCollapsed
									? "opacity-0 h-0 mb-0 overflow-hidden"
									: "opacity-100"
							)}
						>
							Меню
						</SidebarGroupLabel>
						<SidebarMenu>
							{ADMIN_NAV.map((item) => {
								const isActive =
									item.href === "/admin"
										? pathname === "/admin"
										: pathname.startsWith(item.href);
								const getNavBadge = (href: string): string | undefined => {
									if (href === "/admin/bookings")
										return pendingBookings > 0
											? String(pendingBookings)
											: undefined;
									if (href === "/admin/users")
										return pendingApps > 0 ? String(pendingApps) : undefined;
									return undefined;
								};
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											className={menuBtnClass(isActive, isCollapsed)}
											tooltip={isCollapsed ? item.title : ""}
										>
											<Link href={item.href}>
												<div
													className={cn(
														"flex items-center justify-center shrink-0",
														isCollapsed ? "w-full relative" : "w-6"
													)}
												>
													<RenderIcon icon={item.icon} isActive={isActive} />
												</div>
												{!isCollapsed && (
													<span className="font-medium text-base truncate ml-3 flex-1 text-left">
														{item.title}
													</span>
												)}
												{getNavBadge(item.href) && !isCollapsed && (
													<span className="ml-auto flex h-5 min-w-3 items-center justify-center rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 shadow-xs">
														{getNavBadge(item.href)}
													</span>
												)}
												{getNavBadge(item.href) && isCollapsed && (
													<span className="absolute top-2 right-2 h-2 w-2 p-0 rounded-full bg-primary" />
												)}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroup>
				)}

				{/* ── Быстрые действия (только для admin) ── */}
				{isAdmin && (
					<SidebarGroup className={cn("mt-4", isCollapsed && "mt-2")}>
						<SidebarGroupLabel
							className={cn(
								"px-2 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/50 transition-opacity",
								isCollapsed
									? "opacity-0 h-0 mb-0 overflow-hidden"
									: "opacity-100"
							)}
						>
							Быстрые действия
						</SidebarGroupLabel>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={pathname === "/admin/equipment/new"}
									className={menuBtnClass(
										pathname === "/admin/equipment/new",
										isCollapsed
									)}
									tooltip={isCollapsed ? "Добавить технику" : ""}
								>
									<Link href="/admin/equipment/new">
										<div
											className={cn(
												"flex items-center justify-center shrink-0",
												isCollapsed ? "w-full relative" : "w-6"
											)}
										>
											<RenderIcon
												icon={CubeIcon}
												isActive={pathname === "/admin/equipment/new"}
											/>
										</div>
										{!isCollapsed && (
											<span className="font-medium text-base truncate ml-3 flex-1 text-left">
												Добавить технику
											</span>
										)}
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							<SidebarMenuItem>
								<SidebarMenuButton
									onClick={() => setShowAdminNav(!showAdminNav)}
									isActive={false}
									className={cn(
										menuBtnClass(false, isCollapsed),
										"cursor-pointer"
									)}
									tooltip={
										isCollapsed ? (showAdminNav ? "На сайт" : "В админку") : ""
									}
								>
									<div
										className={cn(
											"flex items-center justify-center shrink-0",
											isCollapsed ? "w-full relative" : "w-6"
										)}
									>
										<RenderIcon
											icon={showAdminNav ? CaretDownIcon : CaretUpIcon}
											isActive={false}
										/>
									</div>
									{!isCollapsed && (
										<>
											<span className="font-medium text-base truncate ml-3 flex-1 text-left">
												{showAdminNav ? "На сайт" : "В админку"}
											</span>
											<ArrowsClockwiseIcon
												size={14}
												className="ml-auto opacity-50 transition-transform hover:rotate-180 duration-500"
											/>
										</>
									)}
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
				)}
			</SidebarContent>

			{/* ── FOOTER ── */}

			<SidebarFooter className="p-4 mx-auto border-t border-primary/5">
				<UserMenu />
			</SidebarFooter>
		</>
	);
}
