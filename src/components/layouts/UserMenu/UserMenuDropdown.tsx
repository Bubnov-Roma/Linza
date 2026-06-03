"use client";

import {
	FileTextIcon,
	GearIcon,
	HeadsetIcon,
	HeartIcon,
	LayoutIcon,
	PackageIcon,
	UserCircleIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layouts/ThemeToggle";
import { SignOutButton } from "@/components/shared/SignOutButton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui";

interface UserMenuDropdownProps {
	isAdmin: boolean;
	children: React.ReactNode;
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
	sideOffset?: number;
}

export function UserMenuDropdown({
	isAdmin = false,
	children,
	align = "end",
	side = "top",
}: UserMenuDropdownProps) {
	const router = useRouter();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

			<DropdownMenuContent
				className="w-[calc(100vw-2rem)] md:w-72 rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-3xl border-foreground/10 shadow-2xl shadow-muted-foreground/50 p-2 z-50 ml-2 mb-1"
				align={align}
				side={side}
				sideOffset={8}
			>
				<div className="flex flex-col gap-1">
					{isAdmin ? (
						<>
							<DropdownMenuItem
								onClick={() => router.push("/admin")}
								className="rounded-xl p-3 cursor-pointer"
							>
								<LayoutIcon className="mr-3 h-5 w-5 text-muted-foreground" />
								<span>Админ-панель</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => router.push("/admin/documents")}
								className="rounded-xl p-3 cursor-pointer"
							>
								<FileTextIcon className="mr-3 h-5 w-5 text-muted-foreground" />
								<span>Документы</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => router.push("/admin/settings")}
								className="rounded-xl p-3 cursor-pointer"
							>
								<GearIcon className="mr-3 h-5 w-5 text-muted-foreground" />
								<span>Настройки</span>
							</DropdownMenuItem>
						</>
					) : (
						<>
							<DropdownMenuItem
								onClick={() => router.push("/dashboard")}
								className="rounded-xl p-3 cursor-pointer"
							>
								<LayoutIcon className="mr-3 h-5 w-5 text-muted-foreground" />
								<span className="font-medium">Личный кабинет</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => router.push("/dashboard/bookings")}
								className="rounded-xl p-3 cursor-pointer"
							>
								<PackageIcon className="mr-3 h-5 w-5 text-muted-foreground" />
								<span className="font-medium">Бронирования</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => router.push("/favorites")}
								className="rounded-xl p-3 cursor-pointer"
							>
								<HeartIcon className="mr-3 h-5 w-5 text-muted-foreground" />
								<span className="font-medium">Избранное</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => router.push("/dashboard/support")}
								className="rounded-xl p-3 cursor-pointer"
							>
								<HeadsetIcon className="mr-3 h-5 w-5 text-muted-foreground" />
								<span className="font-medium">Поддержка</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => router.push("/dashboard/profile")}
								className="rounded-xl p-3 cursor-pointer"
							>
								<UserCircleIcon className="mr-3 h-5 w-5 text-muted-foreground" />
								<span className="font-medium">Профиль</span>
							</DropdownMenuItem>
						</>
					)}
				</div>

				<div className="px-3 py-3 mt-1 hover:bg-foreground/10 rounded-xl">
					<ThemeToggle className="w-full" />
				</div>

				<DropdownMenuSeparator className="my-2 bg-foreground/10" />

				<div className="px-1 pb-1">
					<SignOutButton className="w-full h-10 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20" />
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
