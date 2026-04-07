"use client";

import {
	CaretDownIcon,
	DotsThreeVerticalIcon,
	MagnifyingGlassIcon,
	PencilSimpleIcon,
	ProhibitIcon,
	UserIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import type { Role } from "@prisma/client";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	toggleUserBlockAction,
	updateUserRoleAction,
} from "@/actions/client-application-actions";
import { RoleBadge } from "@/components/admin/users/RoleBadge";
import { UserDetailPanel } from "@/components/admin/users/UserDetailPanel";
import {
	Badge,
	Button,
	Card,
	CardContent,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui";
import type { UserProfile } from "@/core/domain/entities/User";
import { cn } from "@/lib/utils";

const APP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
	LOADING: {
		label: "...",
		color: "bg-foreground/8 text-foreground/40 border-foreground/10",
	},
	NO_APPLICATION: {
		label: "Нет анкеты",
		color: "bg-foreground/8 text-foreground/40 border-foreground/10",
	},
	DRAFT: {
		label: "Черновик",
		color: "bg-foreground/8 text-foreground/50 border-foreground/10",
	},
	PENDING: {
		label: "На проверке",
		color: "bg-amber-500/15 text-amber-400 border-amber-500/20",
	},
	REVIEWING: {
		label: "Изучается",
		color: "bg-blue-500/15 text-blue-400 border-blue-500/20",
	},
	CLARIFICATION: {
		label: "Уточнение",
		color: "bg-orange-500/15 text-orange-400 border-orange-500/20",
	},
	STANDARD: {
		label: "Стандарт",
		color: "bg-teal-500/15 text-teal-400 border-teal-500/20",
	},
	APPROVED: {
		label: "Одобрено",
		color: "bg-green-500/15 text-green-400 border-green-500/20",
	},
	REJECTED: {
		label: "Отклонено",
		color: "bg-red-500/15 text-red-400 border-red-500/20",
	},
	BLOCKED: {
		label: "Заблокирован",
		color: "bg-red-500/15 text-red-400 border-red-500/20",
	},
};

function AppStatusBadge({ status }: { status?: string | undefined }) {
	const s = status ?? "NO_APPLICATION";
	const cfg = APP_STATUS_CONFIG[s] ?? APP_STATUS_CONFIG.NO_APPLICATION;
	return (
		<Badge
			variant="outline"
			className={cn("text-[10px] border font-semibold", cfg?.color)}
		>
			{cfg?.label}
		</Badge>
	);
}

export default function UsersTable({
	initialUsers,
	currentUserRole,
}: {
	initialUsers: UserProfile[];
	currentUserRole?: string | undefined;
}) {
	const [users, setUsers] = useState(initialUsers);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [appFilter, setAppFilter] = useState("all");
	const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [_isPending, startTransition] = useTransition();

	const openUser = (user: UserProfile) => {
		setActiveUser(user);
		setSheetOpen(true);
	};

	const handleRoleChange = (userId: string, newRole: Role) => {
		startTransition(async () => {
			const r = await updateUserRoleAction(userId, newRole);
			if (r.success) {
				setUsers((prev) =>
					prev.map((u) =>
						u.id === userId ? { ...u, role: newRole as UserProfile["role"] } : u
					)
				);
				toast.success(`Роль → ${newRole}`);
			} else toast.error(r.error);
		});
	};

	const handleUserUpdate = (userId: string, updated: Partial<UserProfile>) => {
		setUsers((prev) =>
			prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
		);
		if (activeUser?.id === userId) {
			setActiveUser((u) => (u ? { ...u, ...updated } : u));
		}
	};

	const pendingCount = users.filter(
		(u) => u.application?.status === "PENDING"
	).length;

	const filtered = users.filter((u) => {
		const q = search.toLowerCase();
		const matchSearch =
			!q ||
			u.name?.toLowerCase().includes(q) ||
			u.email?.toLowerCase().includes(q) ||
			u.phone?.toLowerCase().includes(q);
		const matchRole = roleFilter === "all" || u.role === roleFilter;
		const matchApp =
			appFilter === "all" ||
			(appFilter === "none" && !u.application) ||
			u.application?.status === appFilter;
		return matchSearch && matchRole && matchApp;
	});

	return (
		<div className="space-y-4">
			{/* Filters */}
			<CardContent className="flex flex-col sm:flex-row gap-3 flex-wrap justify-between">
				<div className="relative flex-1 min-w-48">
					<MagnifyingGlassIcon className="z-1 absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
					<Input
						placeholder="Поиск по имени, email, телефону..."
						className="pl-9 h-9"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<div className="flex justify-between gap-2">
					<Select value={roleFilter} onValueChange={setRoleFilter}>
						<SelectTrigger className="h-9 w-35">
							<SelectValue placeholder="Все роли" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Все роли</SelectItem>
							<SelectItem value="admin">Админы</SelectItem>
							<SelectItem value="manager">Менеджеры</SelectItem>
							<SelectItem value="partner">Партнёры</SelectItem>
							<SelectItem value="user">Клиенты</SelectItem>
						</SelectContent>
					</Select>
					<Select value={appFilter} onValueChange={setAppFilter}>
						<SelectTrigger className="h-9 w-35">
							<SelectValue placeholder="Статус анкеты" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Все анкеты</SelectItem>
							<SelectItem value="none">Без анкеты</SelectItem>
							<SelectItem value="pending">На проверке</SelectItem>
							<SelectItem value="approved">Одобрено</SelectItem>
							<SelectItem value="rejected">Отклонено</SelectItem>
							<SelectItem value="draft">Черновик</SelectItem>
							<SelectItem value="clarification">Уточнение</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</CardContent>

			{/* Stats strip */}
			<div className="flex gap-4 text-sm text-muted-foreground px-1 justify-center sm:justify-start">
				{pendingCount > 0 && (
					<span className="bg-secondary px-1 rounded-2xl font-black text-primary-accent">
						Ожидает проверки:{" "}
						<strong className="text-foreground">{pendingCount}</strong>
					</span>
				)}
				<span>
					Всего: <strong className="text-foreground">{users.length}</strong>
				</span>
				<span>
					Показано:{" "}
					<strong className="text-foreground">{filtered.length}</strong>
				</span>
			</div>

			{/* Table */}
			<Card>
				<Table>
					<TableHeader>
						<TableRow className="border-foreground/5">
							<TableHead>Пользователь</TableHead>
							<TableHead>Роль</TableHead>
							<TableHead>Анкета</TableHead>
							<TableHead>Статус</TableHead>
							<TableHead>Регистрация</TableHead>
							<TableHead className="text-right">Действия</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.map((user) => (
							<TableRow
								key={user.id}
								className={cn(
									"border-foreground/5 cursor-pointer hover:bg-foreground/3 transition-colors",
									user.isBlocked && "opacity-50",
									activeUser?.id === user.id && sheetOpen && "bg-foreground/5"
								)}
								onClick={() => openUser(user)}
							>
								<TableCell>
									<div className="flex items-center gap-3">
										<div className="h-9 w-9 rounded-full bg-foreground/8 flex items-center justify-center overflow-hidden shrink-0">
											{user.avatarUrl ? (
												<Image
													src={user.avatarUrl}
													alt=""
													width={36}
													height={36}
													className="object-cover"
												/>
											) : (
												<UserIcon className="h-4 w-4 text-muted-foreground" />
											)}
										</div>
										<div>
											<p className="font-medium text-sm">
												{user.name || "Без имени"}
											</p>
											<p className="text-xs text-muted-foreground">
												{user.email}
											</p>
										</div>
									</div>
								</TableCell>

								<TableCell onClick={(e) => e.stopPropagation()}>
									{currentUserRole === "ADMIN" ? (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<button
													type="button"
													className="flex items-center gap-1 hover:opacity-80"
												>
													<RoleBadge role={user.role ?? "user"} />
													<CaretDownIcon
														size={10}
														className="text-muted-foreground"
													/>
												</button>
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												{(
													["USER", "PARTNER", "MANAGER", "ADMIN"] as Role[]
												).map((r) => (
													<DropdownMenuItem
														key={r}
														onClick={() => handleRoleChange(user.id, r)}
														className={user.role === r ? "font-bold" : ""}
													>
														{r}
													</DropdownMenuItem>
												))}
											</DropdownMenuContent>
										</DropdownMenu>
									) : (
										<RoleBadge role={user.role ?? "user"} />
									)}
								</TableCell>

								<TableCell>
									<AppStatusBadge status={user.application?.status} />
								</TableCell>

								<TableCell>
									{user.isBlocked ? (
										<Badge
											variant="outline"
											className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20"
										>
											<ProhibitIcon size={10} className="mr-1" /> Заблокирован
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20"
										>
											Активен
										</Badge>
									)}
								</TableCell>

								<TableCell className="text-xs text-muted-foreground">
									{new Date(user.createdAt).toLocaleDateString("ru-RU")}
								</TableCell>

								<TableCell
									className="text-right"
									onClick={(e) => e.stopPropagation()}
								>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<DotsThreeVerticalIcon className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => openUser(user)}>
												<PencilSimpleIcon className="w-4 h-4 mr-2" />{" "}
												Редактировать
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className={
													user.isBlocked ? "text-green-500" : "text-red-500"
												}
												onClick={async () => {
													const reason = user.isBlocked
														? undefined
														: (window.prompt("Причина блокировки:") ?? "");
													const r = await toggleUserBlockAction(
														user.id,
														!user.isBlocked,
														reason
													);
													if (r.success) {
														handleUserUpdate(user.id, {
															isBlocked: !user.isBlocked,
															blockedReason: reason ?? null,
														});
														toast.success(
															user.isBlocked ? "Разблокирован" : "Заблокирован"
														);
													} else toast.error(r.error);
												}}
											>
												<ProhibitIcon className="w-4 h-4 mr-2" />
												{user.isBlocked ? "Разблокировать" : "Заблокировать"}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>

				{filtered.length === 0 && (
					<div className="py-16 text-center space-y-2">
						<UsersIcon size={32} className="mx-auto text-muted-foreground/20" />
						<p className="text-sm text-muted-foreground">
							{users.length === 0
								? "Нет пользователей в базе данных"
								: "Пользователи не найдены по фильтрам"}
						</p>
					</div>
				)}
			</Card>

			{/* Sheet — no backdrop button needed, Sheet handles it */}
			<UserDetailPanel
				user={activeUser}
				open={sheetOpen}
				onOpenChange={(open) => {
					setSheetOpen(open);
					if (!open) setActiveUser(null);
				}}
				onUpdate={(updated) =>
					activeUser && handleUserUpdate(activeUser.id, updated)
				}
			/>
		</div>
	);
}
