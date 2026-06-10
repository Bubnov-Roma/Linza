"use client";

import { Bell, HelpCircle, Search } from "lucide-react";
import Image from "next/image";
import { SignOutButton } from "@/components/shared";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Input,
} from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";

export function AdminHeader() {
	const { user } = useAuth();

	return (
		<header className="sticky top-0 z-40 border-b bg-white">
			<div className="flex h-16 items-center justify-between px-6">
				<div className="flex-1">
					<div className="relative max-w-md">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
						<Input placeholder="Поиск по панели..." className="pl-10" />
					</div>
				</div>

				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" className="relative">
						<Bell className="h-5 w-5" />
						<span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white">
							3
						</span>
					</Button>

					<Button variant="ghost" size="icon">
						<HelpCircle className="h-5 w-5" />
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="relative h-10 w-10 rounded-full"
							>
								{user?.image ? (
									<Image
										width={48}
										height={48}
										src={user.image}
										alt={user.name || "user name"}
										className="h-full w-full rounded-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-500 text-white">
										{user?.name?.charAt(0) || "A"}
									</div>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium">{user?.name}</p>
									<p className="text-xs text-gray-500">Администратор</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>Мой профиль</DropdownMenuItem>
							<DropdownMenuItem>Настройки</DropdownMenuItem>
							<DropdownMenuSeparator />
							<div className="p-1">
								<SignOutButton className="w-full h-8 px-2 text-sm text-red-600 focus:bg-red-50" />
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
