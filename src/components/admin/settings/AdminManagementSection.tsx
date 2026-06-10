"use client";

import {
	CheckIcon,
	MagnifyingGlassIcon,
	PencilSimpleIcon,
	ShieldCheckIcon,
	ShieldSlashIcon,
	UserPlusIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
	type AdminListItem,
	type AdminPermissions,
	findUserByEmailAction,
	getAdminsListAction,
	grantAdminAction,
	revokeAdminAction,
	updateAdminPermissionsAction,
} from "@/actions/admin-permissions-actions";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Input,
	Label,
	Separator,
} from "@/components/ui";
import {
	ALL_PERMISSIONS,
	EMPTY_PERMISSIONS,
	PERMISSION_GROUPS,
} from "@/constants";

// ─── PermissionsEditor ────────────────────────────────────────────────────────

function PermissionsEditor({
	value,
	onChange,
	disabled,
}: {
	value: AdminPermissions;
	onChange: (v: AdminPermissions) => void;
	disabled?: boolean;
}) {
	const toggle = (key: keyof AdminPermissions) =>
		onChange({ ...value, [key]: !value[key] });

	const allOn = Object.values(value).every(Boolean);
	const toggleAll = () =>
		onChange(allOn ? { ...EMPTY_PERMISSIONS } : { ...ALL_PERMISSIONS });

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Checkbox
					id="perm-all"
					checked={allOn}
					onCheckedChange={toggleAll}
					disabled={disabled}
				/>
				<Label
					htmlFor="perm-all"
					className="text-sm font-semibold cursor-pointer"
				>
					Все права
				</Label>
			</div>

			<Separator />

			{PERMISSION_GROUPS.map((group) => (
				<div key={group.group} className="space-y-2">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						{group.group}
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 pl-1">
						{group.keys.map((key) => (
							<Label
								key={key}
								className="flex items-center gap-2 cursor-pointer text-sm font-normal"
							>
								<Checkbox
									checked={!!value[key]}
									onCheckedChange={() => toggle(key)}
									disabled={disabled}
								/>
								{group.labels[key]}
							</Label>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

// ─── GrantAdminForm ────────────────────────────────────────────────────────────

function GrantAdminForm({ onGranted }: { onGranted: () => void }) {
	const [email, setEmail] = useState("");
	const [foundUser, setFoundUser] = useState<{
		id: string;
		name: string | null;
		email: string | null;
		role: string;
	} | null>(null);
	const [perms, setPerms] = useState<AdminPermissions>({
		...EMPTY_PERMISSIONS,
	});
	const [isPending, startTransition] = useTransition();

	const handleSearch = () => {
		if (!email.trim()) return;
		startTransition(async () => {
			const res = await findUserByEmailAction(email.trim());
			if (res.success && res.user) {
				setFoundUser(res.user);
				if (res.user.role === "ADMIN") {
					toast.info("Пользователь уже является администратором");
				}
			} else {
				toast.error(res.error ?? "Пользователь не найден");
				setFoundUser(null);
			}
		});
	};

	const handleGrant = () => {
		if (!foundUser) return;
		startTransition(async () => {
			const res = await grantAdminAction(foundUser.id, perms);
			if (res.success) {
				toast.success(
					`${foundUser.name ?? foundUser.email} назначен администратором`
				);
				setEmail("");
				setFoundUser(null);
				setPerms({ ...EMPTY_PERMISSIONS });
				onGranted();
			} else {
				toast.error(res.error ?? "Ошибка");
			}
		});
	};

	return (
		<div className="space-y-4 rounded-xl border border-dashed border-foreground/20 p-4">
			<p className="text-sm font-semibold">Назначить нового администратора</p>

			{/* Email поиск */}
			<div className="flex gap-2">
				<Input
					placeholder="Email пользователя"
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						setFoundUser(null);
					}}
					onKeyDown={(e) => e.key === "Enter" && handleSearch()}
					className="flex-1"
				/>
				<Button
					type="button"
					variant="outline"
					size="icon-xl"
					className="rounded-xl"
					onClick={handleSearch}
					disabled={isPending || !email.trim()}
				>
					<MagnifyingGlassIcon size={33} />
				</Button>
			</div>

			{/* Найденный пользователь */}
			{foundUser && foundUser.role !== "ADMIN" && (
				<>
					<div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
						<UserPlusIcon
							size={14}
							className="text-muted-foreground shrink-0"
						/>
						<span className="font-medium">{foundUser.name ?? "—"}</span>
						<span className="text-muted-foreground">{foundUser.email}</span>
						<Badge variant="outline" className="ml-auto text-xs">
							{foundUser.role}
						</Badge>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							Права нового администратора
						</p>
						<PermissionsEditor
							value={perms}
							onChange={setPerms}
							disabled={isPending}
						/>
					</div>

					<Button
						size="xl"
						onClick={handleGrant}
						disabled={isPending}
						className="w-full"
					>
						<ShieldCheckIcon size={14} weight="duotone" />
						Назначить администратором
					</Button>
				</>
			)}
		</div>
	);
}

// ─── AdminRow ──────────────────────────────────────────────────────────────────

function AdminRow({
	admin,
	onRevoked,
	onUpdated,
}: {
	admin: AdminListItem;
	onRevoked: () => void;
	onUpdated: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [perms, setPerms] = useState<AdminPermissions>(admin.permissions);
	const [isPending, startTransition] = useTransition();

	const handleRevoke = () => {
		startTransition(async () => {
			const res = await revokeAdminAction(admin.id);
			if (res.success) {
				toast.success(`Права сняты: ${admin.name ?? admin.email}`);
				onRevoked();
			} else {
				toast.error(res.error ?? "Ошибка");
			}
		});
	};

	const handleSave = () => {
		startTransition(async () => {
			const res = await updateAdminPermissionsAction(admin.id, perms);
			if (res.success) {
				toast.success("Права обновлены");
				setEditing(false);
				onUpdated();
			} else {
				toast.error(res.error ?? "Ошибка");
			}
		});
	};

	return (
		<div className="rounded-xl border border-foreground/10 p-4 space-y-3">
			{/* Шапка */}
			<div className="flex items-start justify-between gap-2">
				<div className="space-y-0.5 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="font-semibold text-sm truncate">
							{admin.name ?? "—"}
						</span>
						{admin.isOriginal ? (
							<Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">
								Изначальный
							</Badge>
						) : (
							<Badge variant="outline" className="text-xs">
								Назначен
							</Badge>
						)}
					</div>
					<p className="text-xs text-muted-foreground truncate">
						{admin.email}
					</p>
				</div>

				{/* Кнопки — только для назначенных */}
				{!admin.isOriginal && (
					<div className="flex items-center gap-1.5 shrink-0">
						{editing ? (
							<>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									className="h-7 w-7 text-green-600"
									onClick={handleSave}
									disabled={isPending}
									title="Сохранить"
								>
									<CheckIcon size={13} />
								</Button>
								<Button
									type="button"
									size="icon"
									variant="ghost"
									className="h-7 w-7"
									onClick={() => {
										setEditing(false);
										setPerms(admin.permissions);
									}}
									disabled={isPending}
									title="Отмена"
								>
									<XIcon size={13} />
								</Button>
							</>
						) : (
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="h-7 w-7"
								onClick={() => setEditing(true)}
								title="Редактировать права"
							>
								<PencilSimpleIcon size={13} />
							</Button>
						)}
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="h-7 w-7 text-destructive hover:text-destructive"
							onClick={handleRevoke}
							disabled={isPending}
							title="Снять права администратора"
						>
							<ShieldSlashIcon size={13} />
						</Button>
					</div>
				)}
			</div>

			{/* Права */}
			{admin.isOriginal ? (
				<p className="text-xs text-muted-foreground italic">
					Полный доступ — права не ограничены
				</p>
			) : editing ? (
				<PermissionsEditor
					value={perms}
					onChange={setPerms}
					disabled={isPending}
				/>
			) : (
				<div className="flex flex-wrap gap-1.5">
					{(
						Object.entries(admin.permissions) as [
							keyof AdminPermissions,
							boolean,
						][]
					)
						.filter(([, v]) => v)
						.map(([key]) => {
							const label =
								PERMISSION_GROUPS.flatMap((g) => Object.entries(g.labels)).find(
									([k]) => k === key
								)?.[1] ?? key;
							return (
								<Badge
									key={key}
									variant="outline"
									className="text-xs font-normal"
								>
									{label}
								</Badge>
							);
						})}
					{Object.values(admin.permissions).every((v) => !v) && (
						<span className="text-xs text-muted-foreground italic">
							Нет активных прав
						</span>
					)}
				</div>
			)}
		</div>
	);
}

// ─── AdminManagementSection ───────────────────────────────────────────────────

export function AdminManagementSection() {
	const [admins, setAdmins] = useState<AdminListItem[]>([]);
	const [loading, setLoading] = useState(true);

	const reload = async () => {
		setLoading(true);
		const res = await getAdminsListAction();
		if (res.success && res.data) setAdmins(res.data);
		setLoading(false);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		reload();
	}, []);

	return (
		<Card className="py-6 lg:col-span-2">
			<CardHeader>
				<CardTitle className="flex items-start gap-2">
					Управление администраторами
				</CardTitle>
				<CardDescription>
					Назначайте новых администраторов и гибко настраивайте их права.
					Изначальные администраторы неприкосновенны.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Список существующих */}
				{loading ? (
					<p className="text-sm text-muted-foreground">Загрузка...</p>
				) : (
					<div className="space-y-3">
						{admins.map((a) => (
							<AdminRow
								key={a.id}
								admin={a}
								onRevoked={reload}
								onUpdated={reload}
							/>
						))}
					</div>
				)}

				<Separator />

				{/* Форма назначения */}
				<GrantAdminForm onGranted={reload} />
			</CardContent>
		</Card>
	);
}
