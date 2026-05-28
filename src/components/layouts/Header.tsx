"use client";

import {
	AddressBookIcon,
	EnvelopeSimpleIcon,
	InfoIcon,
	MagnifyingGlassIcon,
	MapPinIcon,
	PhoneIcon,
	QuestionIcon,
	ShoppingCartSimpleIcon,
	SidebarSimpleIcon,
	TelegramLogoIcon,
	XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { SearchPanel } from "@/components/core/search/SearchPanel";
import { Logo } from "@/components/icons/Logo";
import { ThemeIconButton } from "@/components/layouts/ThemeToggle";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
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
	support: SupportInfo;
}

const STATIC_LINKS = [
	{ href: "/about", label: "О нас", icon: InfoIcon },
	{ href: "/faq", label: "FAQ", icon: QuestionIcon },
	{ href: "/contacts", label: "Контакты", icon: AddressBookIcon },
];

export function Header({ categories, support }: HeaderProps) {
	const [isFocused, setIsFocused] = useState(false);
	const [isMapMenuOpen, setIsMapMenuOpen] = useState(false);
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
				"fixed top-0 left-0 right-0 z-5",
				!isCollapsed && "md:left-(--sidebar-width)",
				"transition-[left] duration-300 ease-in-out border-b border-foreground/5 bg-background/60",
				"flex h-16 items-center justify-between gap-4 px-4 md:px-6 md:backdrop-blur-lg group "
			)}
		>
			{/* ── Mobile: Лого + Гамбургер меню ── */}
			<div className="md:hidden flex items-center justify-between gap-3 w-full">
				<Sheet>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-10 w-10 scale-100 shrink-0 backdrop-blur-xs drop-shadow-xl rounded-xl backdrop-invert-10 backdrop-brightness-120"
						>
							<SidebarSimpleIcon
								weight="fill"
								size={24}
								className="text-foreground drop-shadow-xl drop-shadow-background"
							/>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="flex flex-col w-75 p-0">
						<SheetHeader className="p-6 border-b border-foreground/5 text-left">
							<SheetTitle className="flex items-center gap-2">
								<Link href="/" className="flex items-center gap-3 group">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-primary-foreground transition-transform group-hover:scale-105">
										<Logo className="text-background p-1" />
									</div>
									<span className="text-2xl font-black tracking-tighter">
										LINZA
									</span>
								</Link>
							</SheetTitle>
						</SheetHeader>

						<div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
							{/* Меню ссылок */}
							<nav className="flex flex-col space-y-2">
								{STATIC_LINKS.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted-foreground/10 transition-colors font-medium"
									>
										<link.icon size={20} className="text-muted-foreground" />
										{link.label}
									</Link>
								))}
							</nav>

							{/* Контакты */}
							<div className="space-y-2 px-0">
								<h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
									Связь с нами
								</h4>
								<div className="flex flex-col space-y-4 text-sm font-medium">
									<Link
										href={support.telegram}
										target="_blank"
										rel="noreferrer"
										className="flex items-center gap-3 text-foreground/70 hover:text-foreground hover:bg-muted-foreground/10 p-2 rounded-2xl transition-colors"
									>
										<TelegramLogoIcon
											size={18}
											weight="fill"
											className="text-[#2AABEE]"
										/>
										Telegram
									</Link>{" "}
									<Link
										href={`tel:${support.phone}`}
										className="flex items-center gap-3 text-foreground/70 hover:text-foreground hover:bg-muted-foreground/10 p-2 rounded-2xl transition-colors"
									>
										<PhoneIcon
											size={18}
											weight="fill"
											className="text-primary"
										/>
										{support.phone}
									</Link>
									<Link
										href={`mailto:${support.email}`}
										className="flex items-center gap-3 text-foreground/70 hover:text-foreground hover:bg-muted-foreground/10 p-2 rounded-2xl transition-colors"
									>
										<EnvelopeSimpleIcon
											size={18}
											weight="fill"
											className="text-muted-foreground"
										/>
										{support.email}
									</Link>
									{/* Интерактивный адрес */}
									<Collapsible
										open={isMapMenuOpen}
										onOpenChange={setIsMapMenuOpen}
									>
										<CollapsibleTrigger className="flex items-start w-full gap-3 transition-colors text-left text-foreground/70 hover:text-foreground hover:bg-muted-foreground/10 p-2 rounded-2xl">
											<MapPinIcon
												size={18}
												weight="fill"
												className="text-red-500 shrink-0 mt-0.5"
											/>
											<span>{support.address}</span>
										</CollapsibleTrigger>
										<CollapsibleContent className="pt-3 pl-7 space-y-2">
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
												href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
												target="_blank"
												rel="noreferrer"
												className="block text-xs py-2 px-3 bg-muted-foreground/5 hover:bg-muted-foreground/10 rounded-lg transition-colors"
											>
												🗺 Открыть в Google Maps
											</Link>
										</CollapsibleContent>
									</Collapsible>
								</div>
							</div>
						</div>
					</SheetContent>
				</Sheet>

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
			</div>

			{/* ── Desktop: toggle кнопка когда sidebar свёрнут ── */}
			{isCollapsed && !isMobile && (
				<Button
					variant="ghost"
					onClick={toggleSidebar}
					className="items-center justify-center h-8 w-8 rounded-lg text-foreground transition-all duration-300 hover:scale-110 ml-20"
				>
					<SidebarSimpleIcon size={16} />
				</Button>
			)}

			{/* ── Desktop: поле поиска (гибкое, занимает всё доступное место) ── */}
			<div
				ref={containerRef}
				className="relative md:flex-1 max-w-2xl hidden md:block ml-4 min-w-0"
			>
				<div
					className={cn(
						"absolute backdrop-blur-3xl inset-x-0 top-0 transition-all duration-300 ease-in-out rounded-2xl pointer-events-none z-0",
						isFocused
							? "bg-white dark:bg-black shadow-2xl ring-1 ring-white/10"
							: "h-11 bg-muted-foreground/15 shadow-md",
						isFocused && "h-125"
					)}
				/>
				<div className="relative z-5 flex items-center h-11 px-4">
					<MagnifyingGlassIcon
						weight={isFocused ? "duotone" : "regular"}
						className={cn(
							"transition-colors shrink-0",
							isFocused ? "text-primary" : "text-muted-foreground"
						)}
						size={18}
					/>
					<input
						className="w-full bg-transparent border-none px-3 focus:outline-none text-sm placeholder:text-muted-foreground"
						placeholder="Поиск техники..."
						onFocus={() => setIsFocused(true)}
						value={searchState.query}
						onChange={(e) => searchState.setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Escape") handleClose();
							if (e.key === "Enter" && searchState.query.trim().length > 1)
								addToHistory(searchState.query.trim());
						}}
					/>
					{searchState.query && (
						<button
							type="button"
							onClick={() => searchState.setQuery("")}
							className="cursor-pointer p-1 hover:bg-foreground/20 rounded-full transition-colors"
						>
							<XIcon size={14} className="text-muted-foreground" />
						</button>
					)}
				</div>

				{/* выпадающая панель — ABSOLUTE, не влияет на ширину родителя */}
				{isFocused && (
					<div className="absolute inset-x-0 top-11 z-5 animate-in fade-in slide-in-from-top-1 duration-200">
						<div className="h-px bg-transparent shadow-xs shadow-foreground/10 mt-2" />
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

			{/* ── Desktop: Ссылки и Корзина ── */}
			<div className="relative hidden md:flex lg:flex-1 items-center justify-end-safe gap-1 z-50">
				<ThemeIconButton weight="fill" />
				<div className="w-px h-6 bg-foreground/10 mx-2" />
				<TooltipProvider delayDuration={150}>
					{STATIC_LINKS.map((link) => (
						<Tooltip key={link.href}>
							<TooltipTrigger asChild>
								<Link
									key={link.href}
									href={link.href}
									className="p-2.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex gap-2"
								>
									{/* <link.icon size={15} weight="duotone" /> */}
									<span className="hidden lg:flex text-xs font-bold whitespace-nowrap shrink-0">
										{link.label}
									</span>
								</Link>
							</TooltipTrigger>
							<TooltipContent
								side="bottom"
								className="text-xs font-bold lg:hidden"
							>
								{link.label}
							</TooltipContent>
						</Tooltip>
					))}
				</TooltipProvider>

				<div className="w-px h-6 bg-foreground/10 mx-2" />

				<Link
					href="/checkout"
					data-cart-icon
					className="relative group/cart p-2.5 hover:bg-foreground/10 rounded-xl transition-all duration-300"
				>
					<ShoppingCartSimpleIcon
						size={22}
						weight="fill"
						className="text-muted-foreground scale-100 group-hover/cart:scale-120 group-hover/cart:text-foreground duration-300"
					/>
					{cartCount > 0 && (
						<span className="absolute -top-1 right-0 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background animate-in zoom-in">
							{cartCount}
						</span>
					)}
				</Link>
			</div>
		</header>
	);
}
