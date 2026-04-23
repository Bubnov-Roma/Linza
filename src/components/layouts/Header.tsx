"use client";

import {
	MagnifyingGlassIcon,
	ShoppingCartSimpleIcon,
	SidebarSimpleIcon,
	XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { SearchPanel } from "@/components/core/search/SearchPanel";
import { Logo } from "@/components/icons/Logo";
import { Button, useSidebar } from "@/components/ui";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { useSearchState } from "@/hooks";
import { useSearchHistory } from "@/hooks/use-search-history";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart.store";

interface HeaderProps {
	categories: DbCategory[];
}

export function Header({ categories }: HeaderProps) {
	const [isFocused, setIsFocused] = useState(false);
	const { state: searchState } = useSearchState();
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

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-5",
				!isCollapsed && "md:left-(--sidebar-width)",
				"transition-[left] duration-300 ease-in-out",
				"flex h-16 items-center justify-between gap-4 border-b border-foreground/5 bg-background/60 px-4 md:px-6 backdrop-blur-xl group"
			)}
		>
			{/* ── Mobile: логотип слева (sidebar trigger убран — он в MobileNavBar) ── */}
			<div className="md:hidden flex items-center">
				<Link href="/" className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
						<Logo className="h-5 w-auto text-primary-foreground pl-0.5" />
					</div>
					<span className="font-black tracking-tighter text-base">LINZA</span>
				</Link>
			</div>

			{/* ── Desktop: toggle кнопка когда sidebar свёрнут ── */}
			{isCollapsed && !isMobile && (
				<Button
					variant="ghost"
					onClick={toggleSidebar}
					className="items-center justify-center h-8 w-8 rounded-lg text-foreground transition-all duration-300 hover:scale-110 ml-2"
				>
					<SidebarSimpleIcon size={16} />
				</Button>
			)}

			{/* ── Desktop: поле поиска ── */}
			<div
				ref={containerRef}
				className="relative w-full max-w-xl h-11 hidden md:block"
			>
				<div
					className={cn(
						"absolute inset-x-0 transition-all duration-300 ease-in-out rounded-2xl pointer-events-none",
						isFocused
							? "-top-2 bg-background shadow-2xl ring-1 ring-white/10 z-0"
							: "top-0 h-11 bg-foreground/5 z-0",
						isFocused && "h-120"
					)}
				/>

				<div className="relative z-10 flex flex-col">
					<div className="flex items-center h-11 px-4">
						<MagnifyingGlassIcon
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
								className="p-1 hover:bg-foreground/10 rounded-full transition-colors"
							>
								<XIcon size={14} className="text-muted-foreground" />
							</button>
						)}
					</div>

					{isFocused && (
						<div className="animate-in fade-in slide-in-from-top-1 duration-200">
							<div className="h-px bg-foreground/5 mx-4 mb-1" />
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
			</div>

			{/* ── Desktop: корзина ── */}
			<div className="hidden md:flex items-center gap-2">
				<Link
					href="/checkout"
					data-cart-icon
					className="relative group/cart p-2 hover:bg-foreground/5 rounded-lg transition-colors"
				>
					<ShoppingCartSimpleIcon
						size={20}
						className="text-muted-foreground group-hover/cart:text-foreground transition-colors"
					/>
					{cartCount > 0 && (
						<span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
							{cartCount}
						</span>
					)}
				</Link>
			</div>
		</header>
	);
}
