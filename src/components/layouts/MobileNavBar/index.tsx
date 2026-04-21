"use client";

import { ShoppingCartSimpleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { UserMenuDropdown } from "@/components/shared";
import { MOBILE_NAV } from "@/constants/navigation";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/auth-modal.store";
import { useCartStore } from "@/store/use-cart.store";
import { MobileSearch, type MobileSearchHandle } from "./MobileSearch";

// ─── TabBtn — базовая кнопка таба ────────────────────────────────────────────

function TabBtn({
	isActive,
	onClick,
	icon: Icon,
	label,
	children,
	className,
}: {
	isActive: boolean;
	onClick?: () => void;
	icon?: React.ElementType;
	label: string;
	children?: React.ReactNode;
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
				{children ??
					(Icon && (
						<Icon
							size={24}
							strokeWidth={isActive ? 2.5 : 2}
							className={cn(
								"transition-all duration-200",
								isActive
									? "text-primary scale-105"
									: "text-muted-foreground group-active:scale-90"
							)}
						/>
					))}
			</div>
			<span
				className={cn(
					"relative z-10 text-[9px] font-semibold tracking-wide transition-colors leading-none",
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
}

export function MobileNavBar({ categories }: MobileNavBarProps) {
	const cartCount = useCartStore((s) =>
		s.items.reduce((sum, i) => sum + i.quantity, 0)
	);

	const pathname = usePathname();
	const router = useRouter();
	const { open } = useAuthModalStore();
	const [searchOpen, setSearchOpen] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);

	const searchRef = useRef<MobileSearchHandle>(null);
	const { user, profile } = useAuth();
	const userBtnRef = useRef<HTMLButtonElement>(null);

	const avatarUrl = user?.user_metadata?.avatar_url;
	const name =
		profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0];

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
					{/* ── Закреплённый левый элемент: User / Войти / Loading ── */}
					<div className="shrink-0 w-14 flex items-center justify-center border-r border-foreground/5">
						{user ? (
							<UserMenuDropdown align="start" side="top" sideOffset={16}>
								<button
									ref={userBtnRef}
									type="button"
									onClick={() => setUserMenuOpen((v) => !v)}
									className="relative w-9 h-9 rounded-xl overflow-hidden border transition-all active:scale-90"
									style={{
										borderColor: userMenuOpen
											? "hsl(var(--primary) / 0.7)"
											: "hsl(var(--foreground) / 0.12)",
									}}
								>
									{avatarUrl ? (
										<Image
											src={avatarUrl}
											alt={name ?? ""}
											width={36}
											height={36}
											className="object-cover w-full h-full"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-primary/30 text-foreground text-sm font-bold">
											{name?.charAt(0).toUpperCase()}
										</div>
									)}
									{/* Online dot */}
									<span className="absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full bg-green-500 border border-background" />
								</button>
							</UserMenuDropdown>
						) : (
							<button
								type="button"
								onClick={() => open({ type: "auth" })}
								className="flex flex-col items-center gap-1 group"
							>
								<LogIn
									size={22}
									strokeWidth={2}
									className="text-muted-foreground group-active:scale-90 transition-transform"
								/>
								<span className="text-[9px] font-semibold text-muted-foreground leading-none">
									Войти
								</span>
							</button>
						)}
					</div>

					{/* ── Прокручиваемые пункты навигации ── */}
					<div className="flex-1 flex items-center h-14 overflow-x-auto no-scrollbar snap-x snap-mandatory">
						<div className="flex items-stretch h-full px-1 gap-1 min-w-full">
							{MOBILE_NAV.map((item) => {
								const { href, title, icon: Icon } = item;
								const isActive =
									href === "/" ? pathname === "/" : pathname.startsWith(href);
								return (
									<TabBtn
										key={href}
										isActive={isActive}
										icon={Icon}
										label={title}
										onClick={() => router.push(href)}
										className="min-w-15 h-full snap-center px-1"
									/>
								);
							})}
						</div>
					</div>
					<div className="shrink-0 w-14 flex items-center justify-center border-l border-foreground/5">
						<Link
							href="/checkout"
							data-cart-icon
							className="relative flex flex-col items-center justify-center gap-1"
						>
							<div className="relative">
								<ShoppingCartSimpleIcon
									size={22}
									className={cn(
										"transition-colors",
										pathname === "/checkout"
											? "text-primary"
											: "text-muted-foreground"
									)}
								/>
								{cartCount > 0 && (
									<span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-0.5 animate-in zoom-in">
										{cartCount > 99 ? "99+" : cartCount}
									</span>
								)}
							</div>
							<span
								className={cn(
									"text-[9px] font-semibold leading-none",
									pathname === "/checkout"
										? "text-primary"
										: "text-muted-foreground"
								)}
							>
								Корзина
							</span>
						</Link>
					</div>

					<div className="shrink-0 w-14 flex items-center justify-center border-l border-foreground/5">
						<button
							type="button"
							onClick={() => {
								const nextState = !searchOpen;
								setSearchOpen(nextState);

								if (nextState) {
									searchRef.current?.focus();
								}
							}}
							className="flex flex-col h-full items-center justify-center gap-1 group active:scale-90 transition-transform"
							aria-label={searchOpen ? "Закрыть поиск" : "Открыть поиск"}
						>
							{/* Анимация: Search ↔ X через AnimatePresence */}
							<div className="relative w-5.5 h-5.5">
								<AnimatePresence mode="wait" initial={false}>
									{searchOpen ? (
										<motion.div
											key="close"
											initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
											animate={{ opacity: 1, rotate: 0, scale: 1 }}
											exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
											transition={{ duration: 0.15, ease: "easeOut" }}
											className="absolute inset-0 flex items-center justify-center"
										>
											<X size={24} strokeWidth={2.5} className="text-primary" />
										</motion.div>
									) : (
										<motion.div
											key="search"
											initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
											animate={{ opacity: 1, rotate: 0, scale: 1 }}
											exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
											transition={{ duration: 0.15, ease: "easeOut" }}
											className="absolute inset-0 flex items-center justify-center"
										>
											<Search
												size={24}
												strokeWidth={2}
												className="text-muted-foreground"
											/>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
							<span
								className={cn(
									"text-[9px] font-semibold leading-none transition-colors",
									searchOpen ? "text-primary" : "text-muted-foreground"
								)}
							>
								{searchOpen ? "Закрыть" : "Поиск"}
							</span>
						</button>
					</div>
				</div>
			</nav>
		</>
	);
}
