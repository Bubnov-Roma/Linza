"use client";

import {
	AddressBookIcon,
	CameraIcon,
	CaretRightIcon,
	InfoIcon,
	ListIcon,
	MapPinIcon,
	QuestionIcon,
	ShoppingCartSimpleIcon,
	SidebarSimpleIcon,
	SquaresFourIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { clientAutocompleteEquipmentAction } from "@/actions/autocomplete-actions";
import { SearchPanel } from "@/components/core/search/SearchPanel";
import { Logo } from "@/components/icons/Logo";
import { ThemeIconButton } from "@/components/layouts/ThemeToggle";
import { AdminNotificationsPanel } from "@/components/shared/notification";
import { SupportModal } from "@/components/shared/SupportModal/SupportModal";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	InlineSearchInput,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useSidebar,
} from "@/components/ui";
import type { SupportInfo } from "@/constants";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { useSearchState } from "@/hooks";
import { useSearchHistory } from "@/hooks/use-search-history";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart.store";

interface HeaderProps {
	categories: DbCategory[];
	isAdmin: boolean;
	support: SupportInfo & { vk?: string };
}

const STATIC_LINKS = [
	{ href: "/about", label: "О нас", icon: InfoIcon },
	{ href: "/faq", label: "FAQ", icon: QuestionIcon },
	{ href: "/contacts", label: "Контакты", icon: AddressBookIcon },
];

export function Header({ categories, support, isAdmin }: HeaderProps) {
	const [isFocused, setIsFocused] = useState(false);
	const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
	const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

	const { state: searchState } = useSearchState(categories);
	const { addToHistory } = useSearchHistory();

	const cartCount = useCartStore((s) =>
		s.items.reduce((sum, i) => sum + i.quantity, 0)
	);

	const { state: sidebarState, toggleSidebar, isMobile } = useSidebar();
	const isCollapsed = sidebarState === "collapsed" && !isMobile;
	const containerRef = useRef<HTMLDivElement>(null);

	useOnClickOutside(containerRef as React.RefObject<HTMLDivElement>, () => {
		if (searchState.query.trim().length > 1)
			addToHistory(searchState.query.trim());
		setIsFocused(false);
	});

	const handleClose = () => {
		if (searchState.query.trim().length > 1)
			addToHistory(searchState.query.trim());
		setIsFocused(false);
	};

	const encodedAddress = encodeURIComponent(support.address);

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-7",
				!isCollapsed && "md:left-(--sidebar-width)",
				"transition-[left] duration-300 ease-in-out bg-background/60",
				"flex h-16 items-center justify-between gap-4 px-4 md:px-6 md:backdrop-blur-lg group"
			)}
		>
			{/* ── Mobile: Лого + Гамбургер меню ── */}
			<div className="md:hidden flex items-center justify-between gap-3 w-full">
				<Sheet>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-10 w-10 scale-100 shrink-0 backdrop-blur-xs rounded-xl backdrop-invert-10 backdrop-brightness-120"
						>
							<ListIcon
								weight="bold"
								size={24}
								className="text-foreground drop-shadow-xl drop-shadow-background"
							/>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="flex flex-col w-80 p-0">
						<SheetHeader className="p-6 text-left">
							<SheetTitle className="flex items-center gap-2">
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
							</SheetTitle>
						</SheetHeader>

						<div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
							{/* Группа 1: Навигация и Каталог */}
							<div className="space-y-1">
								<h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 px-3 mb-2">
									Навигация
								</h4>

								{/* Выпадающий каталог оборудования */}
								<Collapsible className="group/catalog w-full">
									<CollapsibleTrigger asChild>
										<button
											type="button"
											className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted-foreground/10 transition-colors font-medium text-foreground/80 text-left"
										>
											<div className="flex items-center gap-4">
												<SquaresFourIcon
													size={20}
													className="text-muted-foreground"
													weight="duotone"
												/>
												<span>Каталог техники</span>
											</div>
											<CaretRightIcon
												size={16}
												className="transition-transform duration-300 group-data-[state=open]/catalog:rotate-90 text-muted-foreground/70"
											/>
										</button>
									</CollapsibleTrigger>
									<CollapsibleContent className="pl-11 pt-1 space-y-1 border-l ml-5 border-muted-foreground/10">
										<Link
											href="/equipment"
											className="block p-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
										>
											Все позиции
										</Link>
										{categories.map((cat) => (
											<Link
												key={cat.id}
												href={`/equipment?category=${cat.slug}`}
												className="block p-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
											>
												{cat.name}
											</Link>
										))}
									</CollapsibleContent>
								</Collapsible>

								{/* Ссылка на Студию */}
								<Link
									href="/studio"
									className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted-foreground/10 transition-colors font-medium text-foreground/80"
								>
									<CameraIcon
										size={20}
										className="text-muted-foreground"
										weight="duotone"
									/>
									Студия
								</Link>

								{STATIC_LINKS.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted-foreground/10 transition-colors font-medium text-foreground/80"
									>
										<link.icon
											size={20}
											className="text-muted-foreground"
											weight="duotone"
										/>
										{link.label}
									</Link>
								))}
								{/* Адрес с подкатегориями карт */}
								<Collapsible
									open={isMapMenuOpen}
									onOpenChange={setIsMapMenuOpen}
									className="group/map w-full"
								>
									<CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted-foreground/10 transition-colors text-left text-foreground/80 font-medium">
										<div className="flex items-start gap-4 min-w-0">
											<MapPinIcon
												size={20}
												className="text-muted-foreground shrink-0"
												weight="duotone"
											/>
											<span>{support.address}</span>
										</div>
										<CaretRightIcon
											size={16}
											className="transition-transform duration-300 group-data-[state=open]/map:rotate-90 text-muted-foreground/70 shrink-0 ml-2"
										/>
									</CollapsibleTrigger>
									<CollapsibleContent className="pl-11 pt-1 space-y-1 border-l ml-5 border-muted-foreground/10">
										<Link
											href={`https://yandex.ru/maps/?text=${encodedAddress}`}
											target="_blank"
											rel="noreferrer"
											className="block text-xs py-2 px-3 bg-muted-foreground/5 hover:bg-muted-foreground/10 rounded-lg transition-colors"
										>
											📍 Открыть в Яндекс Картах
										</Link>
										<Link
											href={`https://2gis.ru/search/${encodedAddress}`}
											target="_blank"
											rel="noreferrer"
											className="block text-xs py-2 px-3 bg-muted-foreground/5 hover:bg-muted-foreground/10 rounded-lg transition-colors"
										>
											🏢 Открыть в 2GIS
										</Link>
										<Link
											href={`https://maps.google.com/?q=${encodedAddress}`}
											target="_blank"
											rel="noreferrer"
											className="block text-xs py-2 px-3 bg-muted-foreground/5 hover:bg-muted-foreground/10 rounded-lg transition-colors"
										>
											🗺 Открыть в Google Maps
										</Link>
									</CollapsibleContent>
								</Collapsible>
							</div>
							{/* Группа 3: Оформление / Переключатель Темы */}
							<div className="pt-2 border-t border-foreground/5">
								<ThemeIconButton weight="fill" isSidebar />
							</div>
						</div>
					</SheetContent>
				</Sheet>
			</div>
			{/* ── Desktop: toggle кнопка когда sidebar свёрнут ── */}
			{isCollapsed && !isMobile && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							onClick={toggleSidebar}
							className="items-center justify-center h-8 w-8 rounded-lg text-foreground transition-all duration-300 hover:scale-110 ml-20"
						>
							<SidebarSimpleIcon size={16} weight="duotone" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Развернуть боковую панель</TooltipContent>
				</Tooltip>
			)}
			{/* ── Desktop: поле поиска (гибкое, занимает всё доступное место) ── */}
			<div
				ref={containerRef}
				className="relative md:flex-1 max-w-2xl hidden md:block ml-4 mr-auto min-w-0"
			>
				<div
					className={cn(
						"absolute backdrop-blur-3xl inset-x-0 top-0 transition-all duration-300 ease-in-out rounded-2xl pointer-events-none z-0",
						isFocused
							? "bg-white dark:bg-mist-800 shadow-xl ring-1 ring-white/10 backdrop-blur-3xl"
							: "h-11 bg-muted-foreground/15",
						isFocused && "h-125"
					)}
				/>
				<div
					className={cn(
						"relative z-5 flex items-center h-11 hover:bg-white dark:dark:bg-mist-800 shadow-muted-foreground/20 transition-all duration-300 rounded-2xl active:shadow-none hover:focus:shadow-none hover:focus-within:shadow-none",
						isFocused && "bg-white dark:bg-mist-800"
					)}
				>
					<InlineSearchInput
						value={searchState.query}
						onChange={searchState.setQuery}
						fetchSuggestion={clientAutocompleteEquipmentAction}
						placeholder="Поиск техники..."
						onFocus={() => setIsFocused(true)}
						onKeyDown={(e) => {
							if (e.key === "Escape") handleClose();
							if (e.key === "Enter" && searchState.query.trim().length > 1) {
								addToHistory(searchState.query.trim());
							}
						}}
						className="bg-transparent! ring-0! border-0! shadow-none! focus-within:border-0! p-0 min-h-full"
					/>
				</div>

				{isFocused && (
					<div className="absolute inset-x-0 top-11 z-25 animate-in fade-in slide-in-from-top-1 duration-200 ">
						<div className="h-px bg-transparent shadow-xs shadow-foreground/10" />
						<SearchPanel
							categories={categories}
							state={searchState}
							variant="desktop"
							onClose={handleClose}
							className="pb-2"
						/>
					</div>
				)}
			</div>
			{isAdmin ? (
				<AdminNotificationsPanel />
			) : (
				<Link
					href="/checkout"
					data-cart-icon
					className="relative group/cart p-2.5 rounded-xl transition-all duration-300 backdrop-invert-10 backdrop-blur-xs backdrop-brightness-120 "
				>
					<ShoppingCartSimpleIcon
						size={22}
						weight="fill"
						className="text-foreground/80 scale-100 group-hover/cart:scale-120 transition-all duration-200 drop-shadow-xl drop-shadow-background"
					/>
					{cartCount > 0 && (
						<span className="absolute -top-1 right-0 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background animate-in zoom-in">
							{cartCount}
						</span>
					)}
				</Link>
			)}
			{/* Модальное окно чата для мобильной версии */}
			<SupportModal
				open={isMobileChatOpen}
				onOpenChange={setIsMobileChatOpen}
				existingThread={null}
			/>
		</header>
	);
}
