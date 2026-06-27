"use client";

import { CaretUpDownIcon, SignInIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserMenuDropdown } from "@/components/layouts/UserMenu/UserMenuDropdown";
import {
	Button,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useApplicationStore } from "@/store/use-application.store";
import { useClientNotificationsStore } from "@/store/use-client-notifications.store";

interface UserMenuProps {
	isAdmin: boolean;
	variant?: "sidebar" | "mobile";
}

export function UserMenu({ isAdmin, variant = "sidebar" }: UserMenuProps) {
	const { user } = useAuth();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const { state, isMobile } = useSidebar();
	const isCollapsed = state === "collapsed" && !isMobile;

	const hasClientNotifs = useClientNotificationsStore(
		(s) =>
			!isAdmin &&
			(s.unreadChats > 0 ||
				s.hasNewApplicationStatus ||
				s.unseenBookingChanges.length > 0 ||
				s.availableAutoPromo !== null)
	);

	const storedDisplayName = useApplicationStore((s) => s.displayName);
	const avatarUrl = user?.image;
	const name =
		storedDisplayName ||
		user?.nickname ||
		user?.name ||
		user?.email?.split("@")[0] ||
		"—";

	const nameInitial =
		name !== "—" ? name : user?.email?.charAt(0).toUpperCase() || "?";

	// ─── МОБИЛЬНЫЙ ВАРИАНТ (Нижний Nav Bar) ───
	if (variant === "mobile") {
		if (!user) {
			return (
				<button
					type="button"
					onClick={() => router.push("/auth?view=register")}
					className="cursor-pointer flex flex-col items-center gap-1 group"
				>
					<SignInIcon
						size={22}
						strokeWidth={2}
						className="text-muted-foreground group-active:scale-90 transition-transform"
					/>
					<span className="text-[9px] font-semibold text-muted-foreground leading-none">
						Войти
					</span>
				</button>
			);
		}

		return (
			<UserMenuDropdown
				align="start"
				side="top"
				sideOffset={16}
				isAdmin={isAdmin}
			>
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="relative w-12 h-12 rounded-xl overflow-hidden border border-muted-foreground/20! transition-all active:scale-90"
					style={{
						borderColor: isOpen
							? "hsl(var(--primary) / 0.7)"
							: "hsl(var(--foreground) / 0.12)",
					}}
				>
					{avatarUrl ? (
						<Image
							src={avatarUrl}
							alt={nameInitial}
							width={36}
							height={36}
							className="object-cover w-full h-full"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-primary/30 text-foreground text-sm font-bold">
							{nameInitial.charAt(0).toUpperCase()}
						</div>
					)}
					{hasClientNotifs && !isAdmin && (
						<span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-muted-foreground animate-pulse" />
					)}
				</button>
			</UserMenuDropdown>
		);
	}

	// ─── ДЕСКТОПНЫЙ ВАРИАНТ (AppSidebarClient) ───
	if (!user) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						asChild
						tooltip="Войти"
						size="lg"
						className="w-full cursor-pointer bg-primary dark:text-primary-foreground dark:hover:text-foreground  shadow-md shadow-insert-primary"
					>
						<Button
							onClick={() => router.push("/auth?view=register")}
							variant="brand"
							className={cn(
								"transition-all w-90% duration-300 flex gap-5",
								!isCollapsed && "justify-start"
							)}
						>
							<SignInIcon size={24} className="mx-1 scale-125" />
							{!isCollapsed && <span>Войти</span>}
						</Button>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<UserMenuDropdown
					align="end"
					side={isCollapsed ? "right" : "bottom"}
					sideOffset={6}
					isAdmin={isAdmin}
				>
					<SidebarMenuButton
						tooltip="Личный кабинет"
						size="lg"
						className="relative cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 mx-auto">
							{avatarUrl ? (
								<Image
									src={avatarUrl}
									alt={nameInitial}
									width={32}
									height={32}
									className="object-cover w-full h-full"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-primary/30 text-foreground text-sm font-bold">
									{nameInitial.charAt(0).toUpperCase()}
								</div>
							)}
							{hasClientNotifs && !isAdmin && (
								<span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-muted-foreground animate-pulse" />
							)}
						</div>
						{!isCollapsed && (
							<>
								<div className="grid flex-1 text-left text-sm leading-tight ml-2">
									<span className="truncate font-semibold">{nameInitial}</span>
									<span className="truncate text-xs text-muted-foreground">
										{user.email}
									</span>
								</div>
								<CaretUpDownIcon className="ml-auto size-4" />
							</>
						)}
					</SidebarMenuButton>
				</UserMenuDropdown>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
