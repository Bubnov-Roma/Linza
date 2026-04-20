"use client";

import {
	// ArrowUpRightFromSquare,
	Heart,
	LayoutDashboard,
	Package,
	User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layouts/ThemeToggle";
import { SignOutButton } from "@/components/shared/SignOutButton";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
// import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface UserMenuDropdownProps {
	children: React.ReactNode;
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
	sideOffset?: number;
}

export function UserMenuDropdown({
	children,
	align = "end",
	side = "top",
	sideOffset = 8,
}: UserMenuDropdownProps) {
	// const { profile } = useAuth();
	const router = useRouter();

	// const isAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER";

	const MenuItem = ({
		icon: Icon,
		label,
		onClick,
		destructive,
	}: {
		icon: React.ComponentType<{ className?: string }>;
		label: string;
		onClick: () => void;
		destructive?: boolean;
	}) => (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"w-full flex items-center p-3 cursor-pointer rounded-xl transition-colors outline-none",
				destructive
					? "text-destructive hover:bg-destructive/10"
					: "text-foreground hover:bg-foreground/5"
			)}
		>
			<Icon
				className={cn(
					"mr-3 h-5 w-5",
					destructive ? "text-destructive" : "text-muted-foreground"
				)}
			/>
			<span className="font-medium text-sm">{label}</span>
		</button>
	);

	return (
		<HoverCard openDelay={100} closeDelay={250}>
			<HoverCardTrigger asChild>{children}</HoverCardTrigger>

			<HoverCardContent
				className="w-72 rounded-2xl bg-background/30 backdrop-blur-xl border-foreground/10 shadow-2xl shadow-muted-foreground/40 p-2 z-50 ml-4"
				align={align}
				side={side}
				sideOffset={sideOffset}
			>
				<div className="flex flex-col">
					<MenuItem
						icon={LayoutDashboard}
						label="Личный кабинет"
						onClick={() => router.push("/dashboard")}
					/>
					<MenuItem
						icon={Package}
						label="Бронирования"
						onClick={() => router.push("/dashboard/bookings")}
					/>
					<MenuItem
						icon={Heart}
						label="Избранное"
						onClick={() => router.push("/favorites")}
					/>
					<MenuItem
						icon={UserIcon}
						label="Профиль"
						onClick={() => router.push("/dashboard/profile")}
					/>
				</div>

				<div className="px-2 py-2 mt-1 bg-foreground/5 rounded-xl">
					<ThemeToggle className="w-full" />
				</div>

				{/* {isAdmin && (
					<>
						<Separator className="my-2 bg-foreground/10" />
						<MenuItem
							icon={ArrowUpRightFromSquare}
							label="Открыть сайт"
							onClick={() => window.open("/?client=true", "_blank")}
						/>
					</>
				)} */}

				<Separator className="my-2 bg-foreground/10" />
				<div className="px-1 pb-1">
					<SignOutButton className="w-full h-10 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20" />
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
