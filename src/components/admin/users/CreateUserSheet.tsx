"use client";

import {
	EnvelopeSimpleIcon,
	IdentificationCardIcon,
	LinkIcon,
	LockKeyIcon,
	PhoneIcon,
	UserIcon,
	UserPlusIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	adminCreateUserAction,
	adminFindDuplicatesAction,
	type DuplicateCandidate,
} from "@/actions/admin-user-actions";
import {
	Badge,
	Button,
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
} from "@/components/ui";
import type { UserProfile } from "@/core/domain/entities/User";
import { cn } from "@/lib/utils";

interface CreateUserSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated: (user: UserProfile) => void;
	// Позволяет открыть панель существующего профиля из этой шторки
	onOpenExisting?: (userId: string) => void;
}

type PasswordMode = "auto" | "manual" | "invite";

// ── Блок с предупреждением о найденных дублях ─────────────────────────────────
function DuplicateWarning({
	duplicates,
	onForce,
	onOpenExisting,
}: {
	duplicates: DuplicateCandidate[];
	onForce: () => void;
	onOpenExisting?: ((id: string) => void) | undefined;
}) {
	const matchLabel: Record<string, string> = {
		email: "email",
		phone: "телефон",
		name: "имя",
	};

	return (
		<div className="space-y-3">
			<div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2 text-amber-400 text-xs">
				<WarningCircleIcon size={14} className="shrink-0 mt-0.5" />
				<p>
					Найдены похожие профили. Проверьте перед созданием — возможно, клиент
					уже зарегистрирован.
				</p>
			</div>

			<div className="space-y-2">
				{duplicates.map((d) => (
					<div
						key={d.id}
						className="p-3 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center gap-3"
					>
						<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
							<UserIcon size={14} className="text-primary/70" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold truncate">
								{d.name || "Без имени"}
							</p>
							<p className="text-xs text-muted-foreground truncate">
								{[d.email, d.phone].filter(Boolean).join(" · ") || "—"}
							</p>
							<div className="flex flex-wrap gap-1 mt-1">
								{d.matchedBy.map((m) => (
									<Badge
										key={m}
										variant="outline"
										className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-400"
									>
										совпадение: {matchLabel[m] ?? m}
									</Badge>
								))}
								{d.isAdminCreated && (
									<Badge
										variant="outline"
										className="text-[10px] px-1.5 py-0 border-primary/30 text-primary"
									>
										создан администратором
									</Badge>
								)}
							</div>
						</div>
						{onOpenExisting && (
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs shrink-0"
								onClick={() => onOpenExisting(d.id)}
							>
								Открыть
							</Button>
						)}
					</div>
				))}
			</div>

			<div className="flex gap-2">
				<Button
					variant="outline"
					className="flex-1 text-xs h-8"
					onClick={onForce}
				>
					Всё равно создать нового
				</Button>
			</div>
		</div>
	);
}

// ── Основной компонент ────────────────────────────────────────────────────────
export function CreateUserSheet({
	open,
	onOpenChange,
	onCreated,
	onOpenExisting,
}: CreateUserSheetProps) {
	const [isPending, startTransition] = useTransition();

	// Form state
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [role, setRole] = useState<"USER" | "MANAGER" | "PARTNER">("USER");
	const [passwordMode, setPasswordMode] = useState<PasswordMode>("auto");
	const [manualPassword, setManualPassword] = useState("");
	const [note, setNote] = useState("");

	// Dedup state
	const [duplicates, setDuplicates] = useState<DuplicateCandidate[] | null>(
		null
	);
	const [isDupChecking, setIsDupChecking] = useState(false);
	const dupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Result state
	const [generatedPassword, setGeneratedPassword] = useState<string | null>(
		null
	);
	const [inviteUrl, setInviteUrl] = useState<string | null>(null);
	const [created, setCreated] = useState(false);

	const canSubmit = !!(email.trim() || phone.trim() || name.trim());

	const reset = () => {
		setName("");
		setEmail("");
		setPhone("");
		setRole("USER");
		setPasswordMode("auto");
		setManualPassword("");
		setNote("");
		setDuplicates(null);
		setGeneratedPassword(null);
		setInviteUrl(null);
		setCreated(false);
	};

	const handleClose = (v: boolean) => {
		onOpenChange(v);
		if (!v) setTimeout(reset, 300);
	};

	// ── Дедупликация с debounce ───────────────────────────────────────────────
	const triggerDupCheck = useCallback(
		(emailVal: string, phoneVal: string, nameVal: string) => {
			if (dupTimerRef.current) clearTimeout(dupTimerRef.current);

			// Не проверяем если ничего не введено
			if (!emailVal.trim() && !phoneVal.trim() && !nameVal.trim()) {
				setDuplicates(null);
				return;
			}

			dupTimerRef.current = setTimeout(async () => {
				setIsDupChecking(true);
				const res = await adminFindDuplicatesAction({
					email: emailVal || "",
					phone: phoneVal || "",
					name: nameVal || "",
				});
				setIsDupChecking(false);
				if (res.success) {
					setDuplicates(res.data && res.data.length > 0 ? res.data : null);
				}
			}, 600);
		},
		[]
	);

	// Сбрасываем дубли при закрытии
	useEffect(() => {
		if (!open) {
			if (dupTimerRef.current) clearTimeout(dupTimerRef.current);
		}
	}, [open]);

	// ── Сабмит ────────────────────────────────────────────────────────────────
	const doCreate = (force = false) => {
		startTransition(async () => {
			const r = await adminCreateUserAction(
				{
					name: name.trim() || "",
					email: email.trim() || "",
					phone: phone.trim() || "",
					role,
					passwordMode,
					manualPassword: passwordMode === "manual" ? manualPassword : "",
					note: note.trim() || "",
				},
				{ force }
			);

			// Сервер вернул найденные дубли (и force не был передан)
			if (!r.success && r.error === "duplicate_found" && r.duplicates) {
				setDuplicates(r.duplicates);
				return;
			}

			if (!r.success) {
				toast.error(r.error ?? "Ошибка создания");
				return;
			}

			if (r.generatedPassword) setGeneratedPassword(r.generatedPassword);
			if (r.inviteUrl) setInviteUrl(r.inviteUrl);
			setDuplicates(null);
			setCreated(true);
			onCreated(r.user as UserProfile);
			toast.success("Клиент создан");
		});
	};

	const handleSubmit = () => {
		if (!canSubmit) return;
		// Если дубли уже показаны — пользователь должен явно нажать "Всё равно создать"
		if (duplicates && duplicates.length > 0) return;
		doCreate(false);
	};

	return (
		<Sheet open={open} onOpenChange={handleClose}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-130 flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl"
				showCloseButton={false}
			>
				{/* Header */}
				<SheetHeader className="p-6 pb-4 border-b border-foreground/10 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
							<UserPlusIcon size={20} weight="duotone" />
						</div>
						<div>
							<SheetTitle className="text-lg font-black">
								Новый клиент
							</SheetTitle>
							<p className="text-xs text-muted-foreground mt-0.5">
								Создание профиля без авторизации клиента
							</p>
						</div>
					</div>
				</SheetHeader>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{created ? (
						// ── Success screen ────────────────────────────────────────────
						<div className="space-y-4">
							<div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 space-y-1">
								<p className="font-bold text-sm">Клиент успешно создан</p>
								{(generatedPassword || inviteUrl) && (
									<p className="text-xs opacity-70">
										Передайте клиенту данные для первого входа:
									</p>
								)}
							</div>

							{/* Авто-пароль */}
							{generatedPassword && (
								<div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/10 space-y-3">
									{email && (
										<div>
											<p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
												Email
											</p>
											<p className="text-sm font-mono font-bold">{email}</p>
										</div>
									)}
									<div>
										<p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
											Временный пароль
										</p>
										<div className="flex items-center gap-2">
											<p className="text-sm font-mono font-bold text-primary">
												{generatedPassword}
											</p>
											<Button
												variant="outline"
												size="sm"
												className="h-7 text-xs"
												onClick={() => {
													navigator.clipboard.writeText(generatedPassword);
													toast.success("Пароль скопирован");
												}}
											>
												Скопировать
											</Button>
										</div>
									</div>
								</div>
							)}

							{/* Invite-ссылка */}
							{inviteUrl && (
								<div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/10 space-y-3">
									<div>
										<p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
											Ссылка-приглашение
										</p>
										<p className="text-xs text-muted-foreground mb-2">
											Действительна 7 дней · одноразовая
										</p>
										<div className="flex items-center gap-2">
											<p className="text-xs font-mono text-primary break-all flex-1">
												{inviteUrl}
											</p>
											<Button
												variant="outline"
												size="sm"
												className="h-7 text-xs shrink-0"
												onClick={() => {
													navigator.clipboard.writeText(inviteUrl);
													toast.success("Ссылка скопирована");
												}}
											>
												<LinkIcon size={12} className="mr-1" />
												Скопировать
											</Button>
										</div>
									</div>
								</div>
							)}

							{/* Режим manual — пароль задан вручную, просто сообщаем */}
							{passwordMode === "manual" &&
								!generatedPassword &&
								!inviteUrl && (
									<div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10 text-xs text-muted-foreground">
										Пароль задан вручную — передайте его клиенту самостоятельно.
									</div>
								)}

							{(generatedPassword || inviteUrl) && (
								<div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2 text-amber-400 text-xs">
									<WarningCircleIcon size={14} className="shrink-0 mt-0.5" />
									<p>
										{generatedPassword
											? "Сохраните пароль — он показывается только один раз. Клиент сможет сменить его в личном кабинете."
											: "Ссылка одноразовая — после перехода она станет недействительной."}
									</p>
								</div>
							)}
						</div>
					) : (
						// ── Form ──────────────────────────────────────────────────────
						<>
							<div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10 text-xs text-muted-foreground flex gap-2">
								<IdentificationCardIcon
									size={14}
									className="shrink-0 mt-0.5 text-primary"
								/>
								<p>
									Заполните хотя бы одно поле: email, телефон или имя. Анкету
									клиент сможет заполнить самостоятельно после входа.
								</p>
							</div>

							{/* Personal info */}
							<section className="space-y-4">
								<p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
									Основные данные
								</p>

								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground">Имя</Label>
									<div className="relative">
										<UserIcon
											size={14}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											value={name}
											onChange={(e) => {
												setName(e.target.value);
												triggerDupCheck(email, phone, e.target.value);
											}}
											placeholder="Иван Петров"
											className="pl-8 h-9"
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<Label className="text-xs text-muted-foreground">
											Телефон
										</Label>
										<div className="relative">
											<PhoneIcon
												size={14}
												className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
											/>
											<Input
												value={phone}
												onChange={(e) => {
													setPhone(e.target.value);
													triggerDupCheck(email, e.target.value, name);
												}}
												placeholder="+7 (000) 000-00-00"
												type="tel"
												className="pl-8 h-9"
											/>
										</div>
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs text-muted-foreground">
											Email
										</Label>
										<div className="relative">
											<EnvelopeSimpleIcon
												size={14}
												className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
											/>
											<Input
												value={email}
												onChange={(e) => {
													setEmail(e.target.value);
													triggerDupCheck(e.target.value, phone, name);
												}}
												placeholder="client@example.com"
												type="email"
												className="pl-8 h-9"
											/>
										</div>
									</div>
								</div>

								{/* Блок дублей — показывается inline под полями */}
								{isDupChecking && (
									<p className="text-xs text-muted-foreground animate-pulse">
										Проверяем базу...
									</p>
								)}
								{!isDupChecking && duplicates && duplicates.length > 0 && (
									<DuplicateWarning
										duplicates={duplicates}
										onForce={() => doCreate(true)}
										onOpenExisting={
											onOpenExisting
												? (id) => {
														handleClose(false);
														onOpenExisting(id);
													}
												: undefined
										}
									/>
								)}
							</section>

							{/* Role */}
							<section className="space-y-3">
								<p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
									Роль
								</p>
								<Select
									value={role}
									onValueChange={(v) => setRole(v as typeof role)}
								>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="USER">Клиент</SelectItem>
										<SelectItem value="PARTNER">Партнёр</SelectItem>
										<SelectItem value="MANAGER">Менеджер</SelectItem>
									</SelectContent>
								</Select>
							</section>

							{/* Password mode */}
							<section className="space-y-3">
								<p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
									Доступ
								</p>

								<div className="flex rounded-xl border border-foreground/10 overflow-hidden text-xs font-medium">
									{(
										[
											{ id: "auto" as const, label: "Авто-пароль" },
											{ id: "manual" as const, label: "Задать вручную" },
											{ id: "invite" as const, label: "Ссылка-приглашение" },
										] as const
									).map(({ id, label }) => (
										<button
											type="button"
											key={id}
											onClick={() => setPasswordMode(id)}
											className={cn(
												"flex-1 py-2 transition-colors",
												passwordMode === id
													? "bg-primary text-primary-foreground"
													: "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
											)}
										>
											{label}
										</button>
									))}
								</div>

								{passwordMode === "auto" && (
									<p className="text-xs text-muted-foreground p-3 bg-foreground/5 rounded-xl">
										Система сгенерирует безопасный пароль и покажет его вам
										после создания клиента.
									</p>
								)}

								{passwordMode === "manual" && (
									<div className="space-y-1.5">
										<Label className="text-xs text-muted-foreground">
											Пароль
										</Label>
										<div className="relative">
											<LockKeyIcon
												size={14}
												className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
											/>
											<Input
												value={manualPassword}
												onChange={(e) => setManualPassword(e.target.value)}
												placeholder="Минимум 8 символов"
												type="text"
												className="pl-8 h-9 font-mono"
											/>
										</div>
									</div>
								)}

								{passwordMode === "invite" && (
									<div className="p-3 bg-foreground/5 rounded-xl space-y-1.5">
										<div className="flex items-center gap-2 text-primary">
											<LinkIcon size={13} />
											<p className="text-xs font-medium">
												Одноразовая ссылка-приглашение
											</p>
										</div>
										<p className="text-xs text-muted-foreground">
											После создания будет сгенерирована ссылка — клиент
											перейдёт по ней и сам установит пароль. Срок действия 7
											дней.
										</p>
									</div>
								)}
							</section>

							{/* Admin note */}
							<section className="space-y-2">
								<Label className="text-xs text-muted-foreground">
									Внутренняя заметка (необязательно)
								</Label>
								<Input
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder="Откуда клиент, особые условия..."
									className="h-9"
								/>
							</section>
						</>
					)}
				</div>

				{/* Footer */}
				<div className="p-4 sm:p-6 border-t border-foreground/10 flex gap-3 shrink-0 bg-background">
					{created ? (
						<>
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => handleClose(false)}
							>
								Закрыть
							</Button>
							<Button className="flex-1" onClick={reset}>
								Создать ещё
							</Button>
						</>
					) : (
						<>
							<Button
								variant="outline"
								className="flex-1"
								onClick={() => handleClose(false)}
								disabled={isPending}
							>
								Отмена
							</Button>
							<Button
								className="flex-1 gap-2 font-bold"
								onClick={handleSubmit}
								disabled={
									isPending ||
									!canSubmit ||
									// Блокируем пока показаны дубли — требуем явного выбора
									(!!duplicates && duplicates.length > 0)
								}
							>
								<UserPlusIcon size={15} />
								{isPending ? "Создаём..." : "Создать клиента"}
							</Button>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
