"use client";

import { ChevronsUpDown, LogIn, WifiOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UserMenuDropdown } from "@/components/shared/UserMenuDropdown";
import { Button } from "@/components/ui";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/auth-modal.store";

function useDisplayName() {
	const { user, profile } = useAuth();

	const name =
		profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0];
	return name;
}

export function UserMenu({ isAdmin = false }: { isAdmin: boolean }) {
	const { user, isLoading } = useAuth();
	const userBtnRef = useRef<HTMLButtonElement>(null);
	const { state, isMobile } = useSidebar();
	const router = useRouter();
	const { open } = useAuthModalStore();
	const [mounted, setMounted] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const isCollapsed = state === "collapsed" && !isMobile;
	const displayName = useDisplayName();

	useEffect(() => {
		setMounted(true);
		setIsOnline(navigator.onLine);
		const on = () => setIsOnline(true);
		const off = () => setIsOnline(false);
		window.addEventListener("online", on);
		window.addEventListener("offline", off);
		return () => {
			window.removeEventListener("online", on);
			window.removeEventListener("offline", off);
		};
	}, []);

	if (!mounted || isLoading)
		return (
			<div className="h-12 w-full animate-pulse bg-foreground/5 rounded-xl" />
		);

	if (!user) {
		if (isCollapsed) {
			return (
				<button
					type="button"
					onClick={() => open({ type: "auth" })}
					title="Войти"
					className="h-12 w-12 flex items-center justify-center rounded-xl mx-auto bg-muted-foreground/10 text-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all duration-200 active:scale-95"
				>
					<LogIn size={20} />
				</button>
			);
		}

		return (
			<button
				type="button"
				onClick={() => router.push("/auth?view=register")}
				className="h-14 w-full flex items-center gap-3 rounded-xl px-4 bg-muted-foreground/10 text-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all duration-200 active:scale-95 group/auth"
			>
				<LogIn
					size={22}
					className="shrink-0 transition-transform duration-200 group-hover/auth:translate-x-0.5"
				/>
				<span className="font-bold text-base">Войти</span>
			</button>
		);
	}

	// Используем user_metadata из SessionProvider
	const avatarUrl = user.user_metadata?.avatar_url || user.image;
	const isOffline = !isOnline;
	const initial = displayName?.charAt(0).toUpperCase();

	const Avatar = ({ size = 36 }: { size?: number }) => (
		<div className="relative shrink-0" style={{ width: size, height: size }}>
			<div className="rounded-lg overflow-hidden border border-foreground/10 bg-foreground/5 w-full h-full">
				{avatarUrl ? (
					<Image
						key={avatarUrl}
						src={avatarUrl}
						alt={initial || "user avatar"}
						width={size}
						height={size}
						className="object-cover w-full h-full"
					/>
				) : (
					<div
						className={cn(
							"flex h-full w-full items-center justify-center font-bold text-sm",
							isOffline
								? "bg-yellow-500 text-white"
								: "bg-primary text-primary-foreground"
						)}
					>
						{initial}
					</div>
				)}
			</div>
			<div
				className={cn(
					"absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background transition-colors",
					isOnline ? "bg-green-500" : "bg-yellow-500"
				)}
			/>
		</div>
	);

	return (
		<UserMenuDropdown align="end" isAdmin={isAdmin}>
			<Button
				ref={userBtnRef}
				variant="ghost"
				className={cn(
					"h-14 w-full justify-start gap-3 rounded-xl px-2 hover:bg-foreground/10 transition-all",
					isCollapsed && "h-12 w-12 justify-center px-0"
				)}
			>
				<Avatar size={36} />
				{!isCollapsed && (
					<>
						<div className="flex flex-col items-start flex-1 text-left min-w-0 leading-tight">
							<span className="text-sm font-semibold truncate w-full">
								{displayName}
							</span>
							<div className="flex items-center gap-1.5 mt-0.5">
								<div
									className={cn(
										"h-1.5 w-1.5 rounded-full",
										isOnline ? "bg-green-500" : "bg-yellow-500"
									)}
								/>
								<span className="text-xs text-muted-foreground">
									{isOnline ? "Онлайн" : "Офлайн"}
								</span>
								{!isOnline && <WifiOff size={9} className="text-yellow-500" />}
							</div>
						</div>
						<ChevronsUpDown className="ml-auto size-4 text-muted-foreground/50" />
					</>
				)}
			</Button>
		</UserMenuDropdown>
	);
}
