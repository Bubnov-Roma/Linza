"use client";

import {
	ArrowClockwiseIcon,
	ArrowLeftIcon,
	ArrowSquareOutIcon,
	EnvelopeIcon,
	EnvelopeOpenIcon,
	GlobeIcon,
	ImageIcon,
	LockIcon,
	MonitorIcon,
	PhoneIcon,
	PlusIcon,
	TelegramLogoIcon,
	TrashIcon,
	UserIcon,
	WarningIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteImageAction } from "@/actions/upload-actions";
import {
	scheduleAccountDeletionAction,
	updateClientSocialsAction,
	updateUserAvatarAction,
	updateUserFieldAction,
	updateUserPasswordAction,
} from "@/actions/user-actions";
import { ApplicationDataEditor } from "@/components/dashboard/profile/ApplicationDataEditor";
import { VerificationBadge } from "@/components/forms";
import { ThemeCard } from "@/components/layouts/ThemeToggle";
import {
	BasePhoneInput,
	ImageUploader,
	InlineEditField,
	SignOutButton,
} from "@/components/shared";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Input,
} from "@/components/ui";
import type { SupportInfo } from "@/constants";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";
import type { ClientFormValues } from "@/schemas";
import { useApplicationStore } from "@/store";
import { getClientDisplayData } from "@/utils/client-data.utils";

type ProfileTab = "profile" | "settings" | "update_data";

export function ProfileDetails({
	data,
	support,
}: {
	data: ClientFormValues | null;
	support: SupportInfo;
}) {
	const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
	const [showAvatarUploader, setShowAvatarUploader] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState("");

	const { user, refreshProfile } = useAuth();
	const status = useApplicationStore((s) => s.status);
	const displayData = getClientDisplayData(data);

	const nickname = user?.user_metadata?.nickname as string | undefined;
	const fullName =
		displayData?.name ??
		(user?.user_metadata?.name as string | undefined) ??
		null;
	const displayName = nickname ?? fullName ?? user?.email?.split("@")[0] ?? "—";
	const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

	const tabs: { id: ProfileTab; label: string }[] = [
		{ id: "profile", label: "Профиль" },
		{ id: "settings", label: "Настройки" },
	];

	// ── Avatar ────────────────────────────────────────────────────────────────
	const handleAvatarFile = async (file: File | null) => {
		if (!file || !user) return;
		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("folder", "avatars");

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) throw new Error("Upload failed");

			const { url } = await res.json();

			await updateUserAvatarAction(url);
			await refreshProfile({ image: url }); // Обновляем сессию NextAuth

			toast.success("Аватар обновлён");
			setShowAvatarUploader(false);
		} catch (error) {
			console.error("Avatar upload error:", error);
			toast.error("Не удалось загрузить аватар");
		} finally {
			setUploading(false);
		}
	};
	// ── Avatar delete ─────────────────────────────────────────────────────────
	const handleAvatarDelete = async () => {
		if (!user || !avatarUrl) return;
		setUploading(true);
		try {
			await deleteImageAction("avatar", avatarUrl);
			await updateUserAvatarAction(null);
			await refreshProfile({ image: null });

			toast.success("Аватар удалён");
			setShowAvatarUploader(false);
		} catch (error) {
			console.error("Avatar delete error:", error);
			toast.error("Не удалось удалить аватар");
		} finally {
			setUploading(false);
		}
	};

	// ── Delete (soft) ─────────────────────────────────────────────────────────
	const handleDeleteAccount = async () => {
		if (deleteConfirmText !== "УДАЛИТЬ" || !user) return;
		try {
			const res = await scheduleAccountDeletionAction();
			if (!res.success) throw new Error(res.error);

			toast.info("Аккаунт будет удалён через 3 дня. Войдите снова для отмены.");
			await signOut({ callbackUrl: "/auth" });
		} catch {
			toast.error("Ошибка при удалении аккаунта");
		}
	};

	return (
		<div className="max-w-xl mx-auto px-4 py-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
			{/* ── Hero ───────────────────────────────────────────────────────── */}
			<div className="card-hero">
				<div className="flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
					<div className="relative group shrink-0 w-full sm:w-auto">
						<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl avatar-container mx-auto">
							{avatarUrl ? (
								<Image
									key={avatarUrl}
									src={avatarUrl}
									alt={displayName}
									width={96}
									height={96}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="avatar-placeholder text-3xl">
									{displayName.charAt(0).toUpperCase()}
								</div>
							)}
						</div>
						{/* biome-ignore lint/a11y/useSemanticElements: Nested buttons are illegal in HTML, so we use a div with ARIA roles */}
						<div
							role="button"
							tabIndex={0}
							aria-disabled={uploading}
							onClick={
								!uploading ? () => setShowAvatarUploader((v) => !v) : undefined
							}
							onKeyDown={(e) => {
								if (uploading) return;
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setShowAvatarUploader((v) => !v);
								}
							}}
							className={`w-full avatar-edit-overlay rounded-2xl ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
						>
							{uploading ? (
								<div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-2xl animate-spin" />
							) : avatarUrl ? (
								<div className="w-full flex flex-row sm:flex-col gap-1 justify-between items-center my-auto">
									<Button
										variant="brand"
										className="flex text-foreground/70 hover:text-foreground flex-col w-20 h-20 sm:h-10 sm:items-center gap-1 group/btn sm:w-full bg-background/40 dark:bg-foreground/30 hover:bg-background/60 rounded-2xl"
									>
										<ImageIcon size={14} />
										<span className="text-[10px] font-bold uppercase tracking-wider">
											Изменить
										</span>
									</Button>
									<Button
										variant="brand"
										onClick={(e) => {
											e.stopPropagation();
											handleAvatarDelete();
										}}
										disabled={uploading}
										className="flex text-foreground/70 hover:text-foreground flex-col w-20 h-20 sm:h-10 sm:items-center gap-1 group/btn sm:w-full bg-background/40 dark:bg-foreground/30 hover:bg-background/50 rounded-2xl"
									>
										<TrashIcon size={14} />
										<span className="text-[10px] font-bold uppercase tracking-wider">
											Удалить
										</span>
									</Button>
								</div>
							) : (
								<div className="flex flex-col items-center gap-1">
									<ImageIcon size={16} className="text-foreground" />
									<span className="text-[9px] font-bold uppercase tracking-wider text-foreground">
										Загрузить
									</span>
								</div>
							)}
						</div>
					</div>
					<div className="flex-1 text-center sm:text-left min-w-0">
						<div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
							<span className="text-xl sm:text-2xl font-black tracking-tight">
								{displayName}
							</span>
						</div>
						{nickname && fullName && (
							<p className="text-xs text-muted-foreground/50 mt-0.5">
								{fullName}
							</p>
						)}
						<p className="text-sm text-muted-foreground mt-0.5 truncate">
							{user?.email}
						</p>
					</div>
				</div>

				{showAvatarUploader && (
					<div className="border-t border-foreground/5 p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
						<div className="flex items-center justify-between mb-1">
							<p className="card-section-label">
								{avatarUrl ? "Заменить аватар" : "Загрузить аватар"}
							</p>
							<button
								type="button"
								onClick={() => setShowAvatarUploader(false)}
								className="text-xs text-muted-foreground hover:text-foreground transition-colors"
							>
								Отмена
							</button>
						</div>
						<ImageUploader
							currentImageUrl={avatarUrl ?? ""}
							onFileSelect={handleAvatarFile}
							aspectRatio={1}
						/>
					</div>
				)}
			</div>

			{/* ── Tabs ───────────────────────────────────────────────────────── */}
			<div className="flex w-full items-center justify-between">
				<div className="tabs-group">
					{tabs.map(({ id, label }) => (
						<button
							key={id}
							type="button"
							onClick={() => setActiveTab(id)}
							className={cn(
								"px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
								activeTab === id
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							{label}
						</button>
					))}
				</div>
				<VerificationBadge isClientPartner={displayData?.isPartner ?? false} />
			</div>

			{/* ── Profile tab ────────────────────────────────────────────────── */}
			{activeTab === "profile" && (
				<div className="space-y-4 animate-in fade-in duration-200">
					<SectionCard title="Контакты">
						<DetailRow
							icon={<EnvelopeIcon size={14} />}
							label="Email"
							value={user?.email || ""}
						/>
						<DetailRow
							icon={<PhoneIcon size={14} />}
							label="Телефон"
							value={displayData?.phone || ""}
						/>
					</SectionCard>

					{displayData && (
						<SectionCard title="Личные данные">
							<DetailRow
								icon={<UserIcon size={14} />}
								label="ФИО"
								value={displayData.name}
							/>
							<DetailRow
								icon={<UserIcon size={14} />}
								label="Дата рождения"
								value={displayData.birth}
							/>
						</SectionCard>
					)}

					<ProfileSocialsCard
						data={data}
						onUpdated={async () => {
							await refreshProfile();
							return null;
						}}
					/>

					<SectionCard title="Поддержка">
						<a
							href={support.telegram}
							target="_blank"
							rel="noopener noreferrer"
							className="detail-row hover:bg-foreground/5 transition-colors group"
						>
							<div className="flex items-center gap-3">
								<TelegramLogoIcon
									size={14}
									className="text-muted-foreground/40"
								/>
								<span className="text-sm text-muted-foreground">Telegram</span>
							</div>
							<ArrowSquareOutIcon
								size={12}
								className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors"
							/>
						</a>
						<a
							href={`tel:${support.phone.replace(/\s/g, "")}`}
							className="detail-row hover:bg-foreground/5 transition-colors"
						>
							<div className="flex items-center gap-3">
								<PhoneIcon size={14} className="text-muted-foreground/40" />
								<span className="text-sm text-muted-foreground">
									{support.phone}
								</span>
							</div>
						</a>
					</SectionCard>
				</div>
			)}

			{/* ── Settings tab ───────────────────────────────────────────────── */}
			{activeTab === "settings" && (
				<div className="space-y-4 animate-in fade-in duration-200">
					<SectionCard icon={<MonitorIcon size={14} />} title="Тема интерфейса">
						<div className="p-5">
							<ThemeCard />
						</div>
					</SectionCard>
					{/* Nickname */}
					<SectionCard icon={<UserIcon size={14} />} title="Никнейм">
						<div className="px-5 py-4">
							<InlineEditField
								value={nickname ?? ""}
								placeholder="Super-User"
								onSave={async (val) => {
									await updateUserFieldAction("nickname", val);
									await refreshProfile({ nickname: val });
									toast.success(
										val.trim() ? "Никнейм сохранён" : "Никнейм удалён"
									);
								}}
								onCancel={() => {}}
							/>
						</div>
						<p className="px-5 pb-3 text-[11px] text-muted-foreground/40">
							Отображается вместо полного имени по всему сайту
						</p>
					</SectionCard>
					{/* Email change */}
					<SectionCard
						title="Email-адрес"
						icon={<EnvelopeOpenIcon size={14} />}
					>
						<div className="px-5 py-4">
							<InlineEditField
								value=""
								placeholder="Новый email"
								type="email"
								onSave={async (val) => {
									if (!val.includes("@")) throw new Error("Некорректный email");
									await updateUserFieldAction("email", val);
									await refreshProfile({ email: val });
									toast.success(
										"Email обновлен. Потребуется подтверждение при следующем входе."
									);
								}}
								onCancel={() => {}}
							/>
						</div>
						<p className="px-5 pb-3 text-[11px] text-muted-foreground/40">
							Запасной email для доступа к профилю
						</p>
					</SectionCard>
					{/* Extra phone */}
					<SectionCard icon={<PhoneIcon size={14} />} title="Доп. телефон">
						<div className="px-5 py-4">
							<InlineEditField
								value={(user?.user_metadata?.extra_phone as string) ?? ""}
								onSave={async (val) => {
									await updateUserFieldAction("extraPhone", val);
									await refreshProfile({ extraPhone: val });
									toast.success("Доп. телефон сохранён");
								}}
								renderInput={(value, onChange, onKeyDown) => (
									<BasePhoneInput
										value={value}
										onChange={onChange}
										onKeyDown={onKeyDown}
									/>
								)}
							/>
						</div>
						<p className="px-5 pb-3 text-[11px] text-muted-foreground/40">
							На случай, если основной номер будет недоступен.
						</p>
					</SectionCard>
					{/* Password Settings */}
					<SectionCard icon={<LockIcon size={14} />} title="Безопасность">
						<div className="px-5 py-4">
							<InlineEditField
								value=""
								type="password"
								placeholder="Постоянный пароль"
								onSave={async (val) => {
									// Валидация на фронте (минимум 8 символов)
									if (val.length < 8) throw new Error("Минимум 8 символов");

									// Вызов серверного действия для хеширования и сохранения
									const res = await updateUserPasswordAction("password", val);
									if (!res.success) throw new Error(res.error);

									toast.success("Пароль успешно установлен");
								}}
								onCancel={() => {}}
							/>
						</div>
						<p className="px-5 pb-3 text-[11px] text-muted-foreground/40">
							Для входа в систему без использования почтовой ссылки.
						</p>
					</SectionCard>
					{/* Logout */}
					<SignOutButton />
					{/* Update application data — only for verified clients */}
					{(status === "APPROVED" || status === "STANDARD") && (
						<button
							type="button"
							onClick={() => {
								setActiveTab("update_data");
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
							className="cursor-pointer w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-primary-accent/10 bg-primary/5 text-primary-accent/70 hover:text-primary-accent hover:bg-secondary/60 transition-colors"
						>
							<ArrowClockwiseIcon size={16} />
							<span className="text-md font-medium">Обновить данные</span>
						</button>
					)}
					{/* Delete */}
					<button
						type="button"
						onClick={() => setShowDeleteDialog(true)}
						className="cursor-pointer w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
					>
						<TrashIcon size={16} />
						<span className="text-md font-medium">Удалить аккаунт</span>
					</button>
				</div>
			)}

			{/* ── Update data tab ─────────────────────────────────────────────── */}
			{activeTab === "update_data" && (
				<div className="space-y-4 animate-in fade-in duration-200">
					<div className="card-surface">
						<div className="card-section-header">
							<p className="card-section-label">Данные анкеты</p>
						</div>
						<div className="p-5">
							<ApplicationDataEditor data={data} />
						</div>
					</div>
					<Button
						variant="ghost"
						onClick={() => setActiveTab("settings")}
						className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeftIcon size={14} /> Вернуться к общим настройкам
					</Button>
				</div>
			)}

			{/* ── Delete dialog ── */}
			<AlertDialog
				open={showDeleteDialog}
				onOpenChange={(o) => {
					setShowDeleteDialog(o);
					if (!o) setDeleteConfirmText("");
				}}
			>
				<AlertDialogContent className="border-destructive/20 bg-background/90 backdrop-blur-xl">
					<AlertDialogHeader>
						<div className="flex items-center gap-3 mb-2">
							<div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
								<WarningIcon
									size={18}
									weight="duotone"
									className="text-destructive"
								/>
							</div>
							<AlertDialogTitle className="text-destructive">
								Удалить аккаунт?
							</AlertDialogTitle>
						</div>
						<AlertDialogDescription className="space-y-2 text-left">
							<span className="block">Аккаунт будет помечен к удалению.</span>
							<span>
								У вас есть{" "}
								<strong className="font-black font-mono text-red-500 px-2">
									3 дня
								</strong>{" "}
								чтобы отменить удаление — просто войдите снова.
							</span>
							<span className="text-destructive block py-2">
								По истечении срока все данные уничтожаются безвозвратно.
								Повторная регистрация потребует нового анкетирования.
							</span>
							<span className="pt-3 block">
								<span className="text-xs text-muted-foreground pb-2 block">
									Введите <strong>УДАЛИТЬ</strong> для подтверждения:
								</span>
								<Input
									value={deleteConfirmText}
									onChange={(e) => setDeleteConfirmText(e.target.value)}
									placeholder="УДАЛИТЬ"
									className="glass-input"
								/>
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex">
						<AlertDialogCancel
							className="flex-1 bg-primary/90 hover:bg-primary disabled:opacity-40 rounded-xl p-2 text-sm cursor-pointer"
							onClick={() => setDeleteConfirmText("")}
						>
							Отмена
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteAccount}
							disabled={deleteConfirmText !== "УДАЛИТЬ"}
							className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-30 rounded-xl p-2 text-sm cursor-pointer"
						>
							Удалить аккаунт
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

type SocialEntry = { url: string };

interface ProfileSocialsCardProps {
	data: ClientFormValues | null;
	onUpdated: () => Promise<null>;
}

function ProfileSocialsCard({ data, onUpdated }: ProfileSocialsCardProps) {
	const { user } = useAuth();
	const displayData = getClientDisplayData(data);
	const [socials, setSocials] = useState<SocialEntry[]>(
		displayData?.socials ?? []
	);
	const [adding, setAdding] = useState(false);
	const [saving, setSaving] = useState(false);

	const persist = async (updated: SocialEntry[]) => {
		if (!data || !user) return;
		setSaving(true);
		try {
			const res = await updateClientSocialsAction(updated);
			if (!res.success) throw new Error(res.error);

			setSocials(updated);
			await onUpdated();
		} catch {
			toast.error("Ошибка сохранения");
		} finally {
			setSaving(false);
		}
	};

	const handleUpdate = async (index: number, url: string) => {
		await persist(socials.map((s, i) => (i === index ? { url } : s)));
	};

	const handleDelete = async (index: number) => {
		if (socials.length <= 1) {
			toast.info("Должна остаться хотя бы одна ссылка");
			return;
		}
		await persist(socials.filter((_, i) => i !== index));
	};

	const handleAdd = async (url: string) => {
		if (!url.trim()) return;
		await persist([...socials, { url: url.trim() }]);
		setAdding(false);
	};

	if (!data) return null; // no application yet — nothing to show

	return (
		<SectionCard title="Соцсети и мессенджеры">
			{socials.map((s, i) => {
				return (
					<div
						key={`social-${i}-${s.url}`}
						className="px-5 py-3 border-b border-foreground/5 last:border-b-0 space-y-2 gap-2 flex items-center"
					>
						<InlineEditField
							value={s.url}
							placeholder="@username или https://..."
							onSave={(val) => handleUpdate(i, val)}
							onCancel={() => {}}
						/>
						{socials.length > 1 && (
							<Button
								variant="ghost"
								onClick={() => handleDelete(i)}
								disabled={saving}
								className="ml-auto w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
							>
								<TrashIcon size={12} />
							</Button>
						)}
					</div>
				);
			})}

			{adding ? (
				<div className="px-5 py-3">
					<InlineEditField
						value=""
						placeholder="@username или https://..."
						icon={<GlobeIcon size={14} />}
						autoFocus
						onSave={handleAdd}
						onCancel={() => setAdding(false)}
					/>
				</div>
			) : (
				socials.length < 5 && (
					<button
						type="button"
						onClick={() => setAdding(true)}
						className="detail-row w-full text-left hover:bg-foreground/5 transition-colors"
					>
						<div className="flex items-center gap-3">
							<PlusIcon size={14} className="text-muted-foreground/40" />
							<span className="text-sm text-muted-foreground">
								Добавить ссылку
							</span>
						</div>
					</button>
				)
			)}
		</SectionCard>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({
	title,
	children,
	icon,
}: {
	title: string;
	children: React.ReactNode;
	icon?: React.ReactNode;
}) {
	return (
		<div className="card-surface">
			<div className="card-section-header">
				{icon}
				<p className="card-section-label">{title}</p>
			</div>
			<div className="divide-y divide-foreground/5">{children}</div>
		</div>
	);
}

function DetailRow({
	icon,
	label,
	value,
}: {
	icon: React.ReactElement;
	label: string;
	value?: string | null;
}) {
	return (
		<div className="detail-row">
			<div className="flex items-center gap-3 min-w-0 shrink-0">
				<span className="text-muted-foreground/40 shrink-0">{icon}</span>
				<span className="text-sm text-muted-foreground whitespace-nowrap">
					{label}
				</span>
			</div>
			<span className="text-sm font-medium truncate text-right">
				{value || "—"}
			</span>
		</div>
	);
}
