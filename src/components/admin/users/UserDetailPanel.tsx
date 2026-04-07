"use client";

import {
	BellIcon,
	ChatIcon,
	ClipboardIcon,
	ClipboardTextIcon,
	NoteBlankIcon,
	PlusIcon,
	ProhibitIcon,
	SealPercentIcon,
	ShieldCheckIcon,
	ShieldIcon,
	Tag,
	UserIcon,
	X,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	addUserAdminNoteAction,
	createUserDiscountAction,
	toggleUserBlockAction,
	updateUserRoleAction,
} from "@/actions/client-application-actions";
import { RoleBadge } from "@/components/admin/users/RoleBadge";
import { StatusChanger } from "@/components/admin/users/StatusChanger";
import { VerificationBadge } from "@/components/forms";
import {
	Button,
	Checkbox,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Textarea,
} from "@/components/ui";
import type {
	ApplicationStatus,
	UserProfile,
} from "@/core/domain/entities/User";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

const PERMISSIONS = [
	{ key: "bookings_approve", label: "Подтверждать брони" },
	{ key: "equipment_edit", label: "Редактировать технику" },
	{ key: "users_view", label: "Просматривать клиентов" },
	{ key: "finance_view", label: "Просматривать финансы" },
] as const;

const LABEL_COLORS = {
	amber:
		"bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
	blue: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
	red: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400",
	green:
		"bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400",
	purple:
		"bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
	gray: "bg-foreground/8 text-foreground/60 border-foreground/15",
} as const;

interface UserLabel {
	id: string;
	text: string;
	color: keyof typeof LABEL_COLORS;
	dueDate?: string;
	shift?: string;
}

interface UserComment {
	id: string;
	text: string;
	author: string;
	createdAt: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({
	icon: Icon,
	children,
}: {
	icon: React.ElementType;
	children: React.ReactNode;
}) {
	return (
		<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
			<Icon size={11} />
			{children}
		</p>
	);
}

function LabelsBlock({
	labels,
	onAdd,
	onRemove,
}: {
	labels: UserLabel[];
	onAdd: (l: Omit<UserLabel, "id">) => void;
	onRemove: (id: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("");
	const [color, setColor] = useState<keyof typeof LABEL_COLORS>("amber");
	const [dueDate, setDueDate] = useState("");
	const [shift, setShift] = useState("");

	const handleAdd = () => {
		if (!text.trim()) return;
		onAdd({
			text: text.trim(),
			color,
			dueDate: dueDate || "",
			shift: shift || "",
		});
		setText("");
		setDueDate("");
		setShift("");
		setOpen(false);
	};

	return (
		<div className="space-y-2">
			{labels.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{labels.map((label) => (
						<div
							key={label.id}
							className={cn(
								"group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
								LABEL_COLORS[label.color]
							)}
						>
							<Tag size={9} />
							<span>{label.text}</span>
							{label.dueDate && (
								<span className="opacity-60 text-[10px]">
									·{" "}
									{new Date(label.dueDate).toLocaleDateString("ru-RU", {
										day: "numeric",
										month: "short",
									})}
								</span>
							)}
							{label.shift && (
								<span className="opacity-60 text-[10px]">· {label.shift}</span>
							)}
							<button
								type="button"
								onClick={() => onRemove(label.id)}
								className="opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity ml-0.5"
							>
								<X size={10} />
							</button>
						</div>
					))}
				</div>
			)}

			{open ? (
				<div className="p-3 rounded-xl bg-foreground/4 border border-foreground/8 space-y-2.5">
					<Input
						autoFocus
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Текст метки..."
						className="h-8 text-xs"
						onKeyDown={(e) => e.key === "Enter" && handleAdd()}
					/>
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1">
							<Label className="text-[10px] text-muted-foreground">Цвет</Label>
							<Select
								value={color}
								onValueChange={(v) => setColor(v as typeof color)}
							>
								<SelectTrigger className="h-7 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.keys(LABEL_COLORS) as Array<
											keyof typeof LABEL_COLORS
										>
									).map((c) => (
										<SelectItem
											key={c}
											value={c}
											className="text-xs capitalize"
										>
											{c}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<Label className="text-[10px] text-muted-foreground">
								Смена (опц.)
							</Label>
							<Input
								value={shift}
								onChange={(e) => setShift(e.target.value)}
								placeholder="Утренняя..."
								className="h-7 text-xs"
							/>
						</div>
					</div>
					<div className="space-y-1">
						<Label className="text-[10px] text-muted-foreground">
							Дата напоминания
						</Label>
						<Input
							type="date"
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							className="h-7 text-xs"
						/>
					</div>
					<div className="flex gap-1.5">
						<Button
							size="sm"
							className="h-7 text-xs flex-1"
							onClick={handleAdd}
							disabled={!text.trim()}
						>
							Добавить
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-7 text-xs"
							onClick={() => setOpen(false)}
						>
							<X size={11} />
						</Button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
				>
					<Tag size={10} /> Добавить метку
				</button>
			)}
		</div>
	);
}

function CommentsBlock({
	comments,
	onAdd,
}: {
	comments: UserComment[];
	onAdd: (text: string) => void;
}) {
	const [text, setText] = useState("");
	const handleAdd = () => {
		if (!text.trim()) return;
		onAdd(text.trim());
		setText("");
	};

	return (
		<div className="space-y-3">
			{comments.length > 0 && (
				<div className="space-y-2">
					{comments.map((c) => (
						<div key={c.id} className="flex gap-2.5">
							<div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
								<UserIcon size={11} className="text-muted-foreground" />
							</div>
							<div className="flex-1">
								<div className="flex items-baseline gap-2 mb-0.5">
									<span className="text-xs font-semibold">{c.author}</span>
									<span className="text-[10px] text-muted-foreground">
										{new Date(c.createdAt).toLocaleString("ru-RU", {
											day: "numeric",
											month: "short",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
								<p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
									{c.text}
								</p>
							</div>
						</div>
					))}
				</div>
			)}
			<div className="space-y-1.5">
				<Textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Внутренний комментарий по клиенту..."
					rows={2}
					className="text-xs resize-none"
					onKeyDown={(e) => {
						if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
					}}
				/>
				<div className="flex items-center justify-between">
					<span className="text-[10px] text-muted-foreground">Ctrl+Enter</span>
					<Button
						size="sm"
						variant="outline"
						className="h-7 text-xs"
						onClick={handleAdd}
						disabled={!text.trim()}
					>
						Отправить
					</Button>
				</div>
			</div>
		</div>
	);
}

// ─── UserDetailPanel ──────────────────────────────────────────────────────────

export function UserDetailPanel({
	user,
	open,
	onOpenChange,
	onUpdate,
}: {
	user: UserProfile | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUpdate: (updated: Partial<UserProfile>) => void;
}) {
	const [tab, setTab] = useState<
		"details" | "application" | "comments" | "labels"
	>("details");
	const [note, setNote] = useState("");
	const [discountType, setDiscountType] = useState<
		"percent" | "fixed" | "promo"
	>("percent");
	const [discountValue, setDiscountValue] = useState("");
	const [discountDesc, setDiscountDesc] = useState("");
	const [promoCode, setPromoCode] = useState("");
	const [permissions, setPermissions] = useState<Record<string, boolean>>(
		user?.permissions ?? {}
	);
	const [labels, setLabels] = useState<UserLabel[]>([]);
	const [comments, setComments] = useState<UserComment[]>([]);
	const [isPending, startTransition] = useTransition();

	if (!user) return null;

	const app = user.application;

	const handleAddNote = () => {
		if (!note.trim()) return;
		startTransition(async () => {
			const r = await addUserAdminNoteAction(user.id, note.trim());
			if (!r.success) toast.error(r.error);
			else {
				toast.success("Заметка добавлена");
				setNote("");
			}
		});
	};

	const handleAddDiscount = () => {
		if (!discountValue) return;
		if (discountType === "promo" && !promoCode.trim()) {
			toast.error("Введите промокод");
			return;
		}
		startTransition(async () => {
			const r = await createUserDiscountAction({
				userId: user.id,
				type: discountType,
				value: Number(discountValue),
				description: discountDesc ?? "",
				promoCode: promoCode ?? "",
			});
			if (!r.success) toast.error(r.error);
			else {
				toast.success("Скидка назначена");
				setDiscountValue("");
				setDiscountDesc("");
				setPromoCode("");
			}
		});
	};

	const handlePermissionSave = () => {
		startTransition(async () => {
			const r = await updateUserRoleAction(
				user.id,
				user.role ?? "USER",
				permissions
			);
			if (!r.success) toast.error(r.error);
			else {
				toast.success("Права обновлены");
				onUpdate({ permissions });
			}
		});
	};

	const handleBlock = () => {
		const reason = user.isBlocked
			? undefined
			: (window.prompt("Причина блокировки:") ?? "");
		startTransition(async () => {
			const r = await toggleUserBlockAction(user.id, !user.isBlocked, reason);
			if (!r.success) toast.error(r.error);
			else {
				toast.success(user.isBlocked ? "Разблокирован" : "Заблокирован");
				onUpdate({ isBlocked: !user.isBlocked, blockedReason: reason ?? null });
			}
		});
	};

	const TABS = [
		{ id: "details" as const, label: "Профиль", icon: UserIcon },
		{ id: "application" as const, label: "Анкета", icon: ClipboardTextIcon },
		{
			id: "comments" as const,
			label: comments.length ? `Комм. (${comments.length})` : "Комм.",
			icon: ChatIcon,
		},
		{
			id: "labels" as const,
			label: labels.length ? `Метки (${labels.length})` : "Метки",
			icon: BellIcon,
		},
	] as const;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-2xl flex flex-col p-0 gap-0 overflow-hidden"
			>
				{/* Header */}
				<SheetHeader className="px-6 py-4 border-b border-foreground/8 shrink-0">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="w-11 h-11 rounded-full bg-foreground/8 overflow-hidden flex items-center justify-center shrink-0">
								{user.avatarUrl ? (
									<Image
										src={user.avatarUrl}
										alt=""
										width={44}
										height={44}
										className="object-cover"
									/>
								) : (
									<UserIcon size={20} className="text-muted-foreground" />
								)}
							</div>
							<div>
								<SheetTitle className="text-sm font-bold">
									{user.name || "Без имени"}
								</SheetTitle>
								<p className="text-xs text-muted-foreground">{user.email}</p>
							</div>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							{labels.length > 0 && (
								<div className="flex gap-1">
									{labels.slice(0, 3).map((l) => (
										<span
											key={l.id}
											className={cn(
												"w-2 h-2 rounded-full border",
												LABEL_COLORS[l.color].split(" ")[0]
											)}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				</SheetHeader>

				{/* Tabs */}
				<div className="flex border-b border-foreground/8 shrink-0 bg-background overflow-x-auto">
					{TABS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => setTab(id)}
							className={cn(
								"flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-px whitespace-nowrap px-3",
								tab === id
									? "text-primary border-primary"
									: "text-muted-foreground border-transparent hover:text-foreground"
							)}
						>
							<Icon size={12} /> {label}
						</button>
					))}
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto divide-y divide-foreground/5">
					{/* ── ПРОФИЛЬ ── */}
					{tab === "details" && (
						<>
							<div className="px-6 py-4 grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
								<div>
									<p className="text-muted-foreground mb-1">Роль</p>
									<RoleBadge role={user.role ?? "USER"} />
								</div>
								<div>
									<p className="text-muted-foreground mb-1">Тип лица</p>
									<p className="font-medium">
										{user.entityType === "LEGAL" ? "Юр. лицо" : "Физ. лицо"}
									</p>
								</div>
								{user.phone && (
									<div className="col-span-2">
										<p className="text-muted-foreground mb-1">Телефон</p>
										<p className="font-medium">{user.phone}</p>
									</div>
								)}
								<div className="col-span-2">
									<p className="text-muted-foreground mb-1">Зарегистрирован</p>
									<p className="font-medium">
										{new Date(user.createdAt).toLocaleDateString("ru-RU", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</p>
								</div>
								{user.isBlocked && user.blockedReason && (
									<div className="col-span-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-[11px]">
										<span className="font-bold">Причина блокировки: </span>
										{user.blockedReason}
									</div>
								)}
							</div>

							{/* Admin note */}
							<div className="px-6 py-4 space-y-2">
								<SectionTitle icon={NoteBlankIcon}>Заметка</SectionTitle>
								<Textarea
									value={note}
									onChange={(e) => setNote(e.target.value)}
									rows={2}
									placeholder="Внутренняя заметка..."
									className="text-xs resize-none"
								/>
								<Button
									size="sm"
									variant="outline"
									className="w-full"
									onClick={handleAddNote}
									disabled={!note.trim() || isPending}
								>
									<PlusIcon size={12} className="mr-1" /> Добавить
								</Button>
							</div>

							{/* Discount */}
							<div className="px-6 py-4 space-y-2">
								<SectionTitle icon={SealPercentIcon}>
									Скидка / Промокод
								</SectionTitle>
								<div className="grid grid-cols-2 gap-2">
									<Select
										value={discountType}
										onValueChange={(v) =>
											setDiscountType(v as typeof discountType)
										}
									>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="percent">% от суммы</SelectItem>
											<SelectItem value="fixed">Фикс. ₽</SelectItem>
											<SelectItem value="promo">Промокод</SelectItem>
										</SelectContent>
									</Select>
									<Input
										value={discountValue}
										onChange={(e) => setDiscountValue(e.target.value)}
										placeholder={discountType === "percent" ? "10" : "500"}
										type="number"
										className="h-8 text-xs"
									/>
								</div>
								{discountType === "promo" && (
									<Input
										value={promoCode}
										onChange={(e) => setPromoCode(e.target.value)}
										placeholder="КОД ПРОМО..."
										className="h-8 text-xs uppercase"
									/>
								)}
								<Input
									value={discountDesc}
									onChange={(e) => setDiscountDesc(e.target.value)}
									placeholder="Описание (опционально)"
									className="h-8 text-xs"
								/>
								<Button
									size="sm"
									variant="outline"
									className="w-full"
									onClick={handleAddDiscount}
									disabled={!discountValue || isPending}
								>
									<PlusIcon size={12} className="mr-1" /> Назначить
								</Button>
							</div>

							{/* Manager permissions */}
							{user.role === "MANAGER" && (
								<div className="px-6 py-4 space-y-2">
									<SectionTitle icon={ShieldCheckIcon}>
										Права менеджера
									</SectionTitle>
									<div className="space-y-2">
										{PERMISSIONS.map((perm) => (
											<Label
												key={perm.key}
												className="flex items-center gap-2 cursor-pointer"
											>
												<Checkbox
													checked={!!permissions[perm.key]}
													onCheckedChange={(v) =>
														setPermissions((prev) => ({
															...prev,
															[perm.key]: !!v,
														}))
													}
												/>
												<span className="text-sm">{perm.label}</span>
											</Label>
										))}
									</div>
									<Button
										size="sm"
										variant="outline"
										className="w-full"
										onClick={handlePermissionSave}
										disabled={isPending}
									>
										<ShieldIcon size={12} className="mr-1" /> Сохранить права
									</Button>
								</div>
							)}
						</>
					)}

					{/* ── АНКЕТА ── */}
					{tab === "application" && (
						<div className="px-6 py-4 space-y-4">
							{!app ? (
								<div className="py-10 text-center">
									<ClipboardIcon
										size={32}
										className="mx-auto text-muted-foreground/20 mb-3"
									/>
									<p className="text-sm text-muted-foreground">
										Анкета не заполнена
									</p>
								</div>
							) : (
								<>
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<SectionTitle icon={ClipboardTextIcon}>
												Статус анкеты
											</SectionTitle>
											<VerificationBadge />
										</div>
										<div className="text-xs text-muted-foreground space-y-1">
											<p>
												Тип:{" "}
												<span className="font-medium text-foreground">
													{app.clientType}
												</span>
											</p>
											<p>
												Создана:{" "}
												<span className="font-medium text-foreground">
													{new Date(app.createdAt).toLocaleDateString("ru-RU")}
												</span>
											</p>
											<p>
												Обновлена:{" "}
												<span className="font-medium text-foreground">
													{new Date(app.updatedAt).toLocaleDateString("ru-RU")}
												</span>
											</p>
										</div>
									</div>
									{app.rejectionReason && (
										<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
											<p className="text-xs font-bold text-red-400 mb-1">
												Причина отклонения
											</p>
											<p className="text-xs text-foreground/70">
												{app.rejectionReason}
											</p>
										</div>
									)}
									<StatusChanger
										applicationId={app.id}
										currentStatus={app.status}
										onUpdate={(newStatus) =>
											onUpdate({
												application: {
													...app,
													status: newStatus as ApplicationStatus,
												},
											})
										}
									/>
								</>
							)}
						</div>
					)}

					{/* ── КОММЕНТАРИИ ── */}
					{tab === "comments" && (
						<div className="px-6 py-4">
							<CommentsBlock
								comments={comments}
								onAdd={(text) => {
									setComments((prev) => [
										...prev,
										{
											id: crypto.randomUUID(),
											text,
											author: "Администратор",
											createdAt: new Date().toISOString(),
										},
									]);
									toast.success("Комментарий добавлен");
								}}
							/>
						</div>
					)}

					{/* ── МЕТКИ ── */}
					{tab === "labels" && (
						<div className="px-6 py-4">
							<p className="text-xs text-muted-foreground mb-3 leading-relaxed">
								Метки видны только команде. Можно добавить напоминание к дате
								или привязать к смене.
							</p>
							<LabelsBlock
								labels={labels}
								onAdd={(l) =>
									setLabels((prev) => [
										...prev,
										{ ...l, id: crypto.randomUUID() },
									])
								}
								onRemove={(id) =>
									setLabels((prev) => prev.filter((l) => l.id !== id))
								}
							/>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-foreground/8 flex gap-2 shrink-0 bg-background">
					<Button
						variant="outline"
						size="sm"
						className={cn(
							"flex-1 text-xs gap-1",
							user.isBlocked
								? "text-green-500 border-green-500/30 hover:bg-green-500/10"
								: "text-red-500 border-red-500/30 hover:bg-red-500/10"
						)}
						onClick={handleBlock}
						disabled={isPending}
					>
						<ProhibitIcon size={12} />
						{user.isBlocked ? "Разблокировать" : "Заблокировать"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="text-xs"
						onClick={() => onOpenChange(false)}
					>
						Закрыть
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
