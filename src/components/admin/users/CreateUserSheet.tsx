"use client";

import {
	EnvelopeSimpleIcon,
	IdentificationCardIcon,
	LockKeyIcon,
	PhoneIcon,
	UserIcon,
	UserPlusIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adminCreateUserAction } from "@/actions/admin-user-actions";
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
}

type PasswordMode = "auto" | "manual" | "invite";

export function CreateUserSheet({
	open,
	onOpenChange,
	onCreated,
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

	// Result state
	const [generatedPassword, setGeneratedPassword] = useState<string | null>(
		null
	);
	const [created, setCreated] = useState(false);

	const reset = () => {
		setName("");
		setEmail("");
		setPhone("");
		setRole("USER");
		setPasswordMode("auto");
		setManualPassword("");
		setNote("");
		setGeneratedPassword(null);
		setCreated(false);
	};

	const handleClose = (v: boolean) => {
		onOpenChange(v);
		if (!v) setTimeout(reset, 300);
	};

	const handleSubmit = () => {
		if (!email.trim()) {
			toast.error("Email обязателен");
			return;
		}
		startTransition(async () => {
			const r = await adminCreateUserAction({
				name: name.trim() || "",
				email: email.trim(),
				phone: phone.trim() || "",
				role,
				passwordMode,
				manualPassword: passwordMode === "manual" ? manualPassword : "",
				note: note.trim() || "",
			});

			if (!r.success) {
				toast.error(r.error ?? "Ошибка создания");
				return;
			}

			if (r.generatedPassword) {
				setGeneratedPassword(r.generatedPassword);
			}
			setCreated(true);
			onCreated(r.user as UserProfile);
			toast.success("Клиент создан");
		});
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
					{created && generatedPassword ? (
						// ── Success screen with password ──────────────────────────────
						<div className="space-y-4">
							<div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 space-y-1">
								<p className="font-bold text-sm">Клиент успешно создан</p>
								<p className="text-xs opacity-70">
									Передайте клиенту данные для первого входа:
								</p>
							</div>
							<div className="p-4 rounded-2xl bg-foreground/5 border border-foreground/10 space-y-3">
								<div>
									<p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
										Email
									</p>
									<p className="text-sm font-mono font-bold">{email}</p>
								</div>
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
							<div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2 text-amber-400 text-xs">
								<WarningCircleIcon size={14} className="shrink-0 mt-0.5" />
								<p>
									Сохраните пароль — он показывается только один раз. Клиент
									сможет сменить его в личном кабинете.
								</p>
							</div>
						</div>
					) : (
						// ── Form ──────────────────────────────────────────────────────
						<>
							{/* Уведомление о подходе */}
							<div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10 text-xs text-muted-foreground flex gap-2">
								<IdentificationCardIcon
									size={14}
									className="shrink-0 mt-0.5 text-primary"
								/>
								<p>
									Аккаунт создаётся напрямую администратором. Клиент получит
									доступ через переданные данные для входа. Анкету он сможет
									заполнить самостоятельно после авторизации.
								</p>
							</div>

							{/* Personal info */}
							<section className="space-y-4">
								<p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
									Основные данные
								</p>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<Label className="text-xs text-muted-foreground">Имя</Label>
										<div className="relative">
											<UserIcon
												size={14}
												className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
											/>
											<Input
												value={name}
												onChange={(e) => setName(e.target.value)}
												placeholder="Иван Петров"
												className="pl-8 h-9"
											/>
										</div>
									</div>
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
												onChange={(e) => setPhone(e.target.value)}
												placeholder="+7 (000) 000-00-00"
												type="tel"
												className="pl-8 h-9"
											/>
										</div>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground">
										Email <span className="text-red-400">*</span>
									</Label>
									<div className="relative">
										<EnvelopeSimpleIcon
											size={14}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="client@example.com"
											type="email"
											className="pl-8 h-9"
										/>
									</div>
								</div>
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

							{/* Password */}
							<section className="space-y-3">
								<p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
									Доступ
								</p>

								{/* Mode tabs */}
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
										после создания клиента. Вы передадите его клиенту лично или
										по email.
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
									<p className="text-xs text-muted-foreground p-3 bg-foreground/5 rounded-xl">
										После создания будет сгенерирована одноразовая ссылка для
										входа. Клиент сам установит пароль при первом входе.{" "}
										<Badge variant="outline" className="text-[10px] ml-1">
											Скоро
										</Badge>
									</p>
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
							<Button
								className="flex-1"
								onClick={() => {
									reset();
								}}
							>
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
								disabled={isPending || !email.trim()}
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
