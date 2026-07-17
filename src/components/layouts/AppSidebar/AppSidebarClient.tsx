"use client";

import {
	CaretRightIcon,
	ChatCenteredTextIcon,
	ChatsCircleIcon,
	EnvelopeSimpleIcon,
	FilmSlateIcon,
	HeadsetIcon,
	InfoIcon,
	PhoneIcon,
	QuestionIcon,
	SidebarSimpleIcon,
	SquaresFourIcon,
	StackIcon,
	TelegramLogoIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { Logo, VkLogoIcon } from "@/components/icons";
import { CategoryNavItem } from "@/components/layouts/AppSidebar/CategoryNavItem";
import { CollapseLabel } from "@/components/layouts/AppSidebar/CollapseLabel";
import { menuBtnClass } from "@/components/layouts/AppSidebar/menuBtnClass";
import { RenderIcon } from "@/components/layouts/AppSidebar/RenderIcon";
import { ThemeIconButton } from "@/components/layouts/ThemeToggle";
import { UserMenu } from "@/components/layouts/UserMenu";
import { SupportModal } from "@/components/shared";
import {
	Button,
	CardContent,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
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
import { getCategoryIcon } from "@/constants";
import { ADMIN_NAV } from "@/constants/navigation";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";
import { useAdminNotificationsStore } from "@/store/use-admin-notifications.store";
import { useClientNotificationsStore } from "@/store/use-client-notifications.store";

interface Props {
	isAdmin: boolean;
	categories: DbCategory[];
	supportInfo: {
		phone: string;
		telegram: string;
		vk: string;
		address: string;
		email: string;
	};
	initialUnreadChats?: number | undefined;
}

const containerVariants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.05,
			delayChildren: 0.02,
		},
	},
};

const itemVariants: Variants = {
	hidden: {
		opacity: 0,
		y: 40,
		scale: 0.7,
		filter: "blur(4px)",
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		filter: "blur(0px)",
		transition: {
			type: "spring",
			stiffness: 380,
			damping: 22,
		},
	},
};

export function AppSidebarClient({
	isAdmin,
	categories,
	supportInfo,
	initialUnreadChats,
}: Props) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentCategory = searchParams.get("category");
	const currentSubcategory = searchParams.get("subcategory");

	const unreadChats = useClientNotificationsStore((s) => s.unreadChats);

	const setUnreadChats = useClientNotificationsStore((s) => s.setUnreadChats);

	useEffect(() => {
		if (!isAdmin && initialUnreadChats !== undefined)
			setUnreadChats(initialUnreadChats);
	}, [initialUnreadChats, isAdmin, setUnreadChats]);

	const isAllEquipment = pathname === "/equipment" && !currentCategory;

	const { state, isMobile, toggleSidebar } = useSidebar();
	const isCollapsed = state === "collapsed" && !isMobile;

	// Контроль открытия модального окна встроенного чата поддержки
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [isSupportOpen, setIsSupportOpen] = useState(false);

	const getTelegramHref = (username: string) =>
		username.startsWith("http")
			? username
			: `https://t.me/${username.replace("@", "")}`;

	const getVkHref = (slug: string) =>
		slug.startsWith("http") ? slug : `https://vk.com/${slug}`;

	const supportChannels = [
		{
			id: "chat",
			label: "Новый чат",
			icon: ChatCenteredTextIcon,
			action: () => setIsChatOpen(true),
			isLink: false,
		},
		...(supportInfo.telegram
			? [
					{
						id: "telegram",
						label: "Telegram",
						icon: TelegramLogoIcon,
						href: getTelegramHref(supportInfo.telegram),
						isLink: true,
					},
				]
			: []),
		...(supportInfo.vk
			? [
					{
						id: "vk",
						label: "ВКонтакте",
						icon: VkLogoIcon,
						href: getVkHref(supportInfo.vk),
						isLink: true,
					},
				]
			: []),
		...(supportInfo.email
			? [
					{
						id: "email",
						label: "Email",
						icon: EnvelopeSimpleIcon,
						href: `mailto:${supportInfo.email}`,
						isLink: true,
					},
				]
			: []),
		...(supportInfo.phone
			? [
					{
						id: "phone",
						label: "Телефон",
						icon: PhoneIcon,
						href: `tel:${supportInfo.phone}`,
						isLink: true,
					},
				]
			: []),
		{
			id: "chats",
			label: "Мои чаты",
			icon: ChatsCircleIcon,
			href: "/dashboard/support",
			isLink: true,
			badge: unreadChats,
		},
	];

	const getAdminNavBadge = (href: string): string | undefined => {
		if (href === "/admin/bookings")
			return pendingBookings > 0 ? String(pendingBookings) : undefined;
		if (href === "/admin/users")
			return pendingApps > 0 ? String(pendingApps) : undefined;
		if (href === "/admin/studio")
			return pendingStudio > 0 ? String(pendingStudio) : undefined;
		if (href === "/admin/support")
			return pendingChats > 0 ? String(pendingChats) : undefined;
		return undefined;
	};

	const pendingBookings = useAdminNotificationsStore((s) => s.pendingBookings);
	const pendingApps = useAdminNotificationsStore((s) => s.pendingApps);
	const pendingStudio = useAdminNotificationsStore((s) => s.pendingStudio);
	const pendingChats = useAdminNotificationsStore((s) => s.pendingChats);

	const [catalogHovered, setCatalogHovered] = useState(false);
	const debouncedHideCatalog = useDebounceCallback(
		() => setCatalogHovered(false),
		250
	);

	// Функция рендеринга общих пользовательских пунктов меню (Корзина, Студия, FAQ, Тема)
	const renderClientExtraItems = () => {
		const extraLinks = [
			{
				title: "Студия",
				href: "/studio",
				icon: FilmSlateIcon,
				isActive: pathname.startsWith("/studio"),
			},
			{
				title: "FAQ",
				href: "/faq",
				icon: QuestionIcon,
				isActive: pathname === "/faq",
			},
			{
				title: "О нас",
				href: "/about",
				icon: InfoIcon,
				isActive: pathname === "/about",
			},
		];

		return (
			<>
				{/* Тонкий разделитель перед дополнительными сервисами */}
				<div className="h-px bg-foreground/5 my-1 mx-3 shrink-0" />

				{extraLinks.map((item) => (
					<SidebarMenuItem key={item.title}>
						<SidebarMenuButton
							asChild
							isActive={item.isActive}
							className={menuBtnClass(item.isActive, isCollapsed)}
							tooltip={!isCollapsed ? item.title : ""}
						>
							<Link
								href={item.href}
								className={cn(
									"flex active:scale-95 active:shadow-none relative group/btn w-full h-full",
									isCollapsed
										? "flex-col items-center justify-center gap-1"
										: "items-center"
								)}
							>
								{/* Интерактивная пилюля вокруг иконки */}
								<div
									className={cn(
										"flex items-center justify-center shrink-0 transition-all duration-300",
										isCollapsed
											? "w-12 h-7 rounded-full group-hover/btn:bg-foreground/10 group-hover/btn:scale-110"
											: "w-6",
										isCollapsed &&
											item.isActive &&
											"bg-muted-foreground/10 text-foreground"
									)}
								>
									<RenderIcon icon={item.icon} isActive={item.isActive} />
								</div>

								{!isCollapsed && (
									<span className="font-medium text-base truncate ml-3 flex-1 text-left">
										{item.title}
									</span>
								)}

								{isCollapsed && <CollapseLabel text={item.title} />}
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
				<ThemeIconButton
					isSidebar={true}
					isCollapsed={isCollapsed}
					CollapseLabel={CollapseLabel}
				/>
			</>
		);
	};

	return (
		<>
			{/* ── HEADER ── */}
			<SidebarHeader className="h-20 p-0 flex items-center justify-between relative z-10">
				<div
					className={cn(
						"flex items-center justify-between h-full pb-4 w-full gap-2 overflow-hidden",
						isCollapsed ? "px-3 justify-center" : "px-5"
					)}
				>
					<Link
						href="/"
						className={cn(
							"flex items-center gap-3 transition-all duration-300 px-4 bg-primary shadow-lg shadow-primary/20 rounded-full h-10 z-5 backdrop-blur-2xl relative",
							isCollapsed ? "w-10 justify-center px-0" : "w-fit min-w-0"
						)}
					>
						<Logo className="max-h-5 w-4 text-primary-foreground shadow-lg shadow-primary pl-1" />
						<span
							className={cn(
								"text-xl font-black tracking-tighter text-primary-foreground",
								isCollapsed && "hidden"
							)}
						>
							LINZA
						</span>
					</Link>
					{!isCollapsed && (
						<Button
							variant="ghost"
							aria-label="Свернуть меню"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								toggleSidebar();
							}}
							className="absolute top-4 right-4 ml-auto hidden md:flex h-8 w-8 shrink-0 rounded-lg text-foreground transition-all duration-300 hover:scale-110"
						>
							<SidebarSimpleIcon size={16} weight="duotone" />
						</Button>
					)}
				</div>
			</SidebarHeader>

			{/* ── CONTENT ── */}
			<SidebarContent className="custom-scrollbar relative z-20">
				{!isAdmin && (
					<SidebarGroup>
						<SidebarGroupLabel className="opacity-0 hidden">
							Каталог
						</SidebarGroupLabel>
						<SidebarMenu>
							{isCollapsed ? (
								<>
									<fieldset
										className="relative"
										onMouseEnter={() => {
											debouncedHideCatalog.cancel();
											setCatalogHovered(true);
										}}
										onMouseLeave={debouncedHideCatalog}
									>
										<SidebarMenuItem>
											<SidebarMenuButton
												asChild
												isActive={pathname.startsWith("/equipment")}
												className={menuBtnClass(
													pathname.startsWith("/equipment"),
													true
												)}
											>
												<button
													type="button"
													className="flex active:scale-95 active:shadow-none relative flex-col items-center justify-center gap-1 w-full h-full group/btn"
												>
													{/* Унифицированная пилюля для иконки Каталога */}
													<div
														className={cn(
															"flex items-center justify-center shrink-0 transition-all duration-300 text-muted-foreground group-hover/btn:text-foreground w-12 h-7 rounded-full group-hover/btn:bg-foreground/10 group-hover/btn:scale-110",
															pathname.startsWith("/equipment") &&
																"bg-muted-foreground/10 text-foreground"
														)}
													>
														<RenderIcon
															icon={SquaresFourIcon}
															isActive={pathname.startsWith("/equipment")}
														/>
													</div>
													<CollapseLabel text="Каталог" />
												</button>
											</SidebarMenuButton>
										</SidebarMenuItem>

										{/* Flyout меню каталога в режиме collapsed */}
										{catalogHovered && (
											<CardContent
												className="p-0 rounded-r-2xl fixed left-20 top-0 bottom-0 w-72 z-90 bg-sidebar backdrop-blur-2xl border-r border-muted-foreground/8 flex flex-col shadow-md shadow-foreground/20"
												onMouseEnter={() => {
													debouncedHideCatalog.cancel();
													setCatalogHovered(true);
												}}
												onMouseLeave={debouncedHideCatalog}
											>
												<p className="flex items-center px-8 pt-6 pb-10 font-black text-xl tracking-tight leading-none">
													Каталог техники
												</p>
												<div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 space-y-0.5">
													{/* Весь каталог */}
													<Link
														href="/equipment"
														className={cn(
															"flex items-center gap-4 px-4 rounded-2xl h-14 transition-all duration-200 group/btn",
															isAllEquipment
																? "bg-sidebar-accent-foreground/5 text-foreground font-bold"
																: "text-muted-foreground/70 hover:bg-sidebar-accent-foreground/5 hover:text-foreground"
														)}
													>
														<SquaresFourIcon
															size={20}
															weight="duotone"
															className={cn(
																"shrink-0 group-hover/btn:scale-110 transition-transform duration-200 group-hover/btn:text-foreground",
																isAllEquipment
																	? "text-foreground"
																	: "text-muted-foreground/60"
															)}
														/>
														<span className="text-base font-medium truncate">
															Весь каталог
														</span>
														{isAllEquipment && (
															<div className="ml-auto mr-2 h-5 w-1 rounded-full bg-foreground shrink-0" />
														)}
													</Link>

													{/* Список категорий */}
													{categories.map((cat) => {
														const CatIcon = getCategoryIcon(cat.iconName);
														const inThisCat = currentCategory === cat.slug;
														const hasSub = cat.subcategories.length > 0;

														const rowClass = cn(
															"flex items-center justify-between w-full gap-4 px-4 rounded-2xl h-14 transition-all duration-200 group/cat text-left select-none cursor-pointer",
															inThisCat
																? "bg-sidebar-accent-foreground/5 text-foreground font-bold"
																: "text-muted-foreground/70 hover:bg-sidebar-accent-foreground/5 hover:text-foreground"
														);

														return (
															<Collapsible
																key={cat.id}
																defaultOpen={inThisCat}
																className="group/collapsible w-full space-y-0.5"
															>
																{hasSub ? (
																	<CollapsibleTrigger asChild>
																		<button type="button" className={rowClass}>
																			<div className="flex items-center gap-4 min-w-0 flex-1">
																				<CatIcon
																					size={20}
																					weight="duotone"
																					className={cn(
																						"shrink-0 group-hover/cat:scale-110 transition-all duration-200 group-hover/cat:text-foreground",
																						inThisCat
																							? "text-foreground"
																							: "text-muted-foreground/60"
																					)}
																				/>
																				<span className="text-base font-medium truncate flex-1">
																					{cat.name}
																				</span>
																			</div>
																			<CaretRightIcon
																				size={16}
																				className="transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:text-foreground shrink-0 text-muted-foreground/60"
																			/>
																		</button>
																	</CollapsibleTrigger>
																) : (
																	<Link
																		href={`/equipment?category=${cat.slug}`}
																		className={rowClass}
																	>
																		<div className="flex items-center gap-4 min-w-0 flex-1">
																			<CatIcon
																				size={20}
																				weight="duotone"
																				className={cn(
																					"shrink-0 group-hover/cat:scale-110 transition-transform duration-200",
																					inThisCat
																						? "text-foreground"
																						: "text-muted-foreground/60"
																				)}
																			/>
																			<span className="text-base font-medium truncate flex-1">
																				{cat.name}
																			</span>
																		</div>
																		{inThisCat && (
																			<div className="ml-auto h-5 w-1 rounded-full bg-foreground shrink-0" />
																		)}
																	</Link>
																)}

																{hasSub && (
																	<CollapsibleContent className="space-y-0.5 mt-0.5 w-full">
																		<Link
																			href={`/equipment?category=${cat.slug}`}
																			className={cn(
																				"flex items-center gap-4 pl-12 pr-4 rounded-2xl h-11 transition-all duration-200 group/sub",
																				inThisCat && !currentSubcategory
																					? "bg-sidebar-accent-foreground/5 text-foreground font-semibold"
																					: "text-muted-foreground/60 hover:bg-sidebar-accent-foreground/5 hover:text-foreground"
																			)}
																		>
																			<span className="text-sm font-medium truncate">
																				Все позиции
																			</span>
																			{inThisCat && !currentSubcategory && (
																				<div className="ml-auto mr-2 h-4 w-1 rounded-full bg-foreground shrink-0" />
																			)}
																		</Link>

																		{/* Подкатегории списка */}
																		{cat.subcategories.map((sub) => {
																			const subActive =
																				currentSubcategory === sub.slug &&
																				inThisCat;
																			return (
																				<Link
																					key={sub.id}
																					href={`/equipment?category=${cat.slug}&subcategory=${sub.slug}`}
																					className={cn(
																						"flex items-center gap-4 pl-12 pr-4 rounded-2xl h-11 transition-all duration-200 group/sub",
																						subActive
																							? "bg-sidebar-accent-foreground/5 text-foreground font-semibold"
																							: "text-muted-foreground/60 hover:bg-sidebar-accent-foreground/5 hover:text-foreground"
																					)}
																				>
																					<span className="text-sm font-medium truncate">
																						{sub.name}
																					</span>
																					{subActive && (
																						<div className="ml-auto mr-2 h-4 w-1 rounded-full bg-foreground shrink-0" />
																					)}
																				</Link>
																			);
																		})}
																	</CollapsibleContent>
																)}
															</Collapsible>
														);
													})}
												</div>
											</CardContent>
										)}
									</fieldset>

									{/* Отрисовка дополнительных элементов */}
									{renderClientExtraItems()}
								</>
							) : (
								<>
									{/* Развернутый режим: весь блок каталога Collapsible */}
									<Collapsible
										defaultOpen={true}
										className="group/catalog w-full space-y-0.5"
									>
										<SidebarMenuItem>
											<CollapsibleTrigger asChild>
												<SidebarMenuButton
													className={cn(
														menuBtnClass(
															pathname.startsWith("/equipment"),
															false
														),
														"w-full flex items-center justify-between pr-4 select-none cursor-pointer"
													)}
												>
													<div className="flex items-center min-w-0 w-full gap-4 flex-1">
														<div className="w-6 flex items-center justify-center shrink-0">
															<RenderIcon
																icon={SquaresFourIcon}
																isActive={pathname.startsWith("/equipment")}
															/>
														</div>
														<span className="font-medium text-base truncate text-left">
															Каталог
														</span>
													</div>
													<CaretRightIcon
														size={16}
														className="transition-transform duration-300 group-data-[state=open]/catalog:rotate-90 shrink-0 text-muted-foreground/70"
													/>
												</SidebarMenuButton>
											</CollapsibleTrigger>

											<CollapsibleContent className="space-y-0.5 mt-1">
												<ul className="space-y-0.5 list-none p-0 m-0 w-full">
													{/* Внутренний пункт "Весь каталог" */}
													<SidebarMenuItem>
														<SidebarMenuButton
															asChild
															isActive={isAllEquipment}
															className={menuBtnClass(isAllEquipment, false)}
														>
															<Link
																href="/equipment"
																className="flex items-center w-full"
															>
																<div className="flex items-center min-w-0 flex-1">
																	<div className="flex items-center justify-center shrink-0 w-6">
																		<RenderIcon
																			icon={StackIcon}
																			isActive={isAllEquipment}
																		/>
																	</div>
																	<span className="font-medium text-base truncate ml-3 text-left">
																		Вся техника
																	</span>
																</div>
															</Link>
														</SidebarMenuButton>
													</SidebarMenuItem>

													{/* Рендеринг вложенных категорий */}
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
												</ul>
											</CollapsibleContent>
										</SidebarMenuItem>
									</Collapsible>

									{/* Отрисовка остальных пунктов меню */}
									{renderClientExtraItems()}
								</>
							)}
							{/* ─── БЛОК ПОДДЕРЖКИ ─── */}
							{isCollapsed ? (
								/* СВЕРНУТЫЙ САЙДБАР (Креативный Speed Dial, вылетающий вверх поверх меню) */
								<SidebarMenuItem className="relative flex flex-col items-center justify-center w-full">
									<SidebarMenuButton
										asChild
										isActive={isSupportOpen || isChatOpen}
										className={cn(
											menuBtnClass(isSupportOpen || isChatOpen, true),
											"relative z-30"
										)}
									>
										<button
											type="button"
											onClick={() => setIsSupportOpen((prev) => !prev)}
											className="flex active:scale-95 active:shadow-none relative flex-col items-center justify-center gap-1 w-full h-full group/btn"
										>
											<div
												className={cn(
													"flex items-center justify-center shrink-0 transition-all duration-300 text-muted-foreground group-hover/btn:text-foreground w-12 h-7 rounded-full group-hover/btn:bg-foreground/10 group-hover/btn:scale-110",
													(isSupportOpen || isChatOpen) &&
														"bg-muted-foreground/10 text-foreground"
												)}
											>
												<RenderIcon
													icon={HeadsetIcon}
													isActive={isSupportOpen || isChatOpen}
												/>
											</div>
											<CollapseLabel text="Поддержка" />
											{unreadChats > 0 && (
												<span className="absolute top-1 right-2 flex h-2.5 min-w-2.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border border-sidebar shadow-sm animate-in zoom-in px-1" />
											)}
										</button>
									</SidebarMenuButton>

									{/* Вылетающие кнопки каналов связи */}
									<AnimatePresence>
										{isSupportOpen && (
											<motion.div
												variants={containerVariants}
												initial="hidden"
												animate="visible"
												exit="hidden"
												className="fixed left-3 top-3 rounded-full w-14 z-50 flex flex-col-reverse items-center gap-2.5 pb-4 pointer-events-auto backdrop-blur-xs bg-sidebar/60"
											>
												{supportChannels.map((channel) => {
													const Icon = channel.icon;

													const innerContent = (
														<motion.div
															variants={itemVariants}
															whileHover={{ scale: 1.12, y: -2 }}
															whileTap={{ scale: 0.92 }}
															className="flex flex-col items-center group/speeddial cursor-pointer"
														>
															{/* Круглая стеклянная кнопка-пилюля */}
															<div className="flex items-center justify-center w-11 h-11 rounded-full bg-sidebar/60 border border-muted-foreground/5 shadow-lg drop-shadow-2xl shadow-muted-foreground/10 group-hover/speeddial:bg-sidebar/80 group-hover/speeddial:text-foreground text-muted-foreground transition-colors duration-200">
																<Icon
																	size={20}
																	weight="fill"
																	className="transition-transform duration-200 group-hover/speeddial:rotate-6"
																/>
																{channel.badge !== undefined &&
																	channel.badge > 0 && (
																		<span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border border-sidebar shadow-md animate-in zoom-in px-1">
																			{channel.badge}
																		</span>
																	)}
															</div>
															<span className="mt-1 text-[9px] font-black tracking-tight text-muted-foreground/90 group-hover/speeddial:text-foreground px-1 rounded truncate max-w-16 text-center">
																{channel.label}
															</span>
														</motion.div>
													);

													if (channel.isLink) {
														return (
															<a
																key={channel.id}
																href={channel.href || ""}
																target="_blank"
																rel="noopener noreferrer"
																className="focus:outline-none select-none"
																onClick={() => setIsSupportOpen(false)}
															>
																{innerContent}
															</a>
														);
													}

													return (
														<button
															key={channel.id}
															type="button"
															onClick={(e) => {
																e.stopPropagation();
																channel.action?.();
																setIsSupportOpen(false);
															}}
															className="bg-transparent border-0 p-0 m-0 focus:outline-none select-none"
														>
															{innerContent}
														</button>
													);
												})}
											</motion.div>
										)}
									</AnimatePresence>
								</SidebarMenuItem>
							) : (
								/* РАЗВЕРНУТЫЙ САЙДБАР (Группа Collapsible в стиле каталога) */
								<Collapsible className="group/support w-full space-y-0.5">
									<SidebarMenuItem>
										<CollapsibleTrigger asChild>
											<SidebarMenuButton
												className={cn(
													menuBtnClass(false, false),
													"w-full flex items-center justify-between pr-4 select-none cursor-pointer"
												)}
											>
												<div className="flex items-center min-w-0 flex-1">
													<div className="w-6 flex items-center justify-center shrink-0">
														<HeadsetIcon
															size={24}
															weight="duotone"
															className="text-muted-foreground"
														/>
													</div>
													<span className="font-medium text-base truncate ml-3 text-left">
														Поддержка
													</span>
												</div>
												<CaretRightIcon
													size={16}
													className="transition-transform duration-300 group-data-[state=open]/support:rotate-90 shrink-0 text-muted-foreground/70"
												/>
											</SidebarMenuButton>
										</CollapsibleTrigger>

										<CollapsibleContent className="space-y-0.5 mt-1">
											<ul className="space-y-0.5 list-none p-0 m-0 w-full border-l ml-3 border-muted-foreground/10">
												{supportChannels.map((channel) => (
													<SidebarMenuItem key={channel.id}>
														{channel.isLink ? (
															<SidebarMenuButton
																asChild
																className="h-10 rounded-xl text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-foreground/5 "
															>
																<Link
																	href={channel.href ?? "/"}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="flex items-center w-full"
																>
																	<channel.icon
																		size={16}
																		weight="duotone"
																		className="mr-2 text-muted-foreground/70"
																	/>
																	<span className="font-medium text-sm truncate">
																		{channel.label}
																	</span>
																</Link>
															</SidebarMenuButton>
														) : (
															<SidebarMenuButton
																className="h-10 rounded-xl text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-foreground/5 w-full text-left"
																onClick={channel.action}
															>
																<div className="flex items-center w-full">
																	<channel.icon
																		size={16}
																		weight="duotone"
																		className="mr-4 text-muted-foreground/60"
																	/>
																	<span className="font-medium text-sm truncate">
																		{channel.label}
																	</span>
																</div>
															</SidebarMenuButton>
														)}
													</SidebarMenuItem>
												))}
											</ul>
										</CollapsibleContent>
									</SidebarMenuItem>
								</Collapsible>
							)}
						</SidebarMenu>
					</SidebarGroup>
				)}

				{/* ── Меню администратора ── */}
				{isAdmin && (
					<SidebarGroup className={cn("mt-4", isCollapsed && "mt-12")}>
						<SidebarGroupLabel className="opacity-0 h-0 mb-0 overflow-hidden">
							Menu
						</SidebarGroupLabel>
						<SidebarMenu>
							{ADMIN_NAV.map((item) => {
								const isActive =
									item.href === "/admin"
										? pathname === "/admin"
										: pathname.startsWith(item.href);

								const badge = getAdminNavBadge(item.href) || "";

								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											className={menuBtnClass(isActive, isCollapsed)}
											tooltip={!isCollapsed ? item.title : ""}
										>
											<Link
												href={item.href}
												className={cn(
													"flex active:scale-95 active:shadow-none group/btn w-full h-full",
													isCollapsed
														? "flex-col justify-center gap-1"
														: "items-center"
												)}
											>
												{/* Пилюля для меню администратора */}
												<div
													className={cn(
														"flex items-center justify-center shrink-0 transition-all duration-300",
														isCollapsed
															? "w-12 h-7 rounded-full group-hover/btn:bg-foreground/10 group-hover/btn:scale-110"
															: "w-6",
														isCollapsed && isActive
															? "bg-muted-foreground/10 text-foreground"
															: "text-muted-foreground"
													)}
												>
													<RenderIcon icon={item.icon} isActive={isActive} />
												</div>

												{!isCollapsed && (
													<>
														<span className="font-medium text-base truncate ml-3 flex-1 text-left">
															{item.title}
														</span>
														{badge && (
															<span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold bg-primary text-primary-foreground border border-primary/20 px-2">
																{badge}
															</span>
														)}
													</>
												)}

												{isCollapsed && <CollapseLabel text={item.title} />}

												{badge && isCollapsed && (
													<span className="absolute top-1.5 right-1.5 flex h-5 min-w-5 px-0.5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground animate-in zoom-in">
														{badge}
													</span>
												)}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}

							<ThemeIconButton
								isSidebar={true}
								isCollapsed={isCollapsed}
								CollapseLabel={CollapseLabel}
							/>
						</SidebarMenu>
					</SidebarGroup>
				)}
			</SidebarContent>

			{/* ── FOOTER ── */}
			<SidebarFooter className="p-4 bg-transparent!">
				<UserMenu isAdmin={isAdmin} variant="sidebar" />
			</SidebarFooter>
			<SupportModal
				open={isChatOpen}
				onOpenChange={setIsChatOpen}
				existingThread={null}
			/>
		</>
	);
}
