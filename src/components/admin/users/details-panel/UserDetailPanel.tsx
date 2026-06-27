"use client";

import {
	ChatIcon,
	ClockIcon,
	EnvelopeSimpleIcon,
	IdentificationCardIcon,
	NoteIcon,
	PhoneIcon,
	ProhibitIcon,
	UserIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	type ApplicationDataFull,
	adminAddUserCommentAction,
	adminAssignDiscountAction,
	adminDeleteUserCommentAction,
	adminGetUserApplicationAction,
	adminGetUserDiscountAction,
	adminUpdateApplicationFieldAction,
	getAdminUserCommentsAction,
} from "@/actions/admin-user-actions";
import {
	toggleUserBlockAction,
	updateApplicationStatusAction,
	updateUserRoleAction,
} from "@/actions/client-application-actions";
import { setStatusClarificationWithThreadAction } from "@/actions/support-actions";
import { AppStatusBadge } from "@/components/admin/users/details-panel/AppStatusBadge";
import { AuditTab } from "@/components/admin/users/details-panel/AuditTab";
import { ChatTab } from "@/components/admin/users/details-panel/ChatTab";
import type { UserComment } from "@/components/admin/users/details-panel/CommentsBlock";
import { DiscountField } from "@/components/admin/users/details-panel/DiscountField";
import {
	LabelsBlock,
	type UserLabel,
} from "@/components/admin/users/details-panel/LabelsBlock";
import { ProfileTab } from "@/components/admin/users/details-panel/ProfileTab";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import { LABEL_COLORS } from "@/constants";
import type {
	ApplicationStatus,
	UserProfile,
} from "@/core/domain/entities/User";
import { cn } from "@/lib/utils";

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
	const [tab, setTab] = useState<"profile" | "chat" | "labels" | "audit">(
		"profile"
	);
	const [appData, setAppData] = useState<ApplicationDataFull | null>(null);
	const [clientOriginalData, setClientOriginalData] =
		useState<ApplicationDataFull | null>(null);
	const [currentDiscount, setCurrentDiscount] = useState<{
		type: string;
		value: number;
		promoCode: string | null;
	} | null>(null);

	const [showReviewDialog, setShowReviewDialog] = useState(false);
	const [reviewStatusAction, setReviewStatusAction] =
		useState<ApplicationStatus | null>(null);
	const [reviewMessage, setReviewMessage] = useState("");

	const [discountType, setDiscountType] = useState<
		"PERCENT" | "FIXED" | "PROMO"
	>("PERCENT");
	const [discountValue, setDiscountValue] = useState("");
	const [discountDesc, setDiscountDesc] = useState("");
	const [promoCode, setPromoCode] = useState("");

	const [permissions, setPermissions] = useState<Record<string, boolean>>(
		user?.permissions ?? {}
	);
	const [comments, setComments] = useState<UserComment[]>([]);
	const [isPending, startTransition] = useTransition();
	const [currentAppStatus, setCurrentAppStatus] = useState(
		user?.application?.status ?? null
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <.>
	useEffect(() => {
		if (user && open) {
			setCurrentAppStatus(user.application?.status ?? null);
			setPermissions(user.permissions ?? {});

			const application = user.application;
			if (application?.status === "PENDING" && application.id) {
				updateApplicationStatusAction(application.id, "REVIEWING").then(
					(res) => {
						if (res.success) {
							onUpdate({
								application: { ...application, status: "REVIEWING" },
							});
							setCurrentAppStatus("REVIEWING");
						}
					}
				);
			}

			adminGetUserApplicationAction(user.id).then((res) => {
				if (res.success && res.data) {
					setAppData(res.data); // Исходные данные === данные на стороне администратора
					if (res.clientData) {
						setClientOriginalData(res.clientData); //  Оригинальные данные === данные на стороне клиента
					}
				}
			});
			adminGetUserDiscountAction(user.id).then((res) => {
				if (res.success && res.data) setCurrentDiscount(res.data);
			});
			getAdminUserCommentsAction(user.id).then((res) => {
				if (res.success && res.data) {
					setComments(
						res.data.map((c) => ({
							id: c.id,
							text: c.note,
							author: c.author?.name || "Админ",
							createdAt: c.createdAt.toISOString(),
						}))
					);
				}
			});
		}
	}, [user?.id, open]);

	if (!user) return null;

	// Перехват закрытия
	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen && currentAppStatus === "REVIEWING") {
			setShowReviewDialog(true);
		} else {
			onOpenChange(newOpen);
		}
	};

	// Обработка финального решения по ревью
	const handleReviewSubmit = () => {
		if (!reviewStatusAction || !user.application?.id) return;

		if (currentAppStatus !== "REVIEWING") {
			onOpenChange(false);
			return;
		}
		startTransition(async () => {
			const userApp = user.application;
			const userAppId = userApp?.id;
			if (userApp && userAppId) {
				if (reviewStatusAction === "CLARIFICATION") {
					if (!reviewMessage.trim()) {
						toast.error("Напишите уточняющий вопрос");
						return;
					}
					const res = await setStatusClarificationWithThreadAction({
						applicationId: userAppId,
						userId: user.id,
						question: reviewMessage,
					});
					if (!res.success) {
						toast.error(res.error);
						return;
					}
					toast.success("Статус изменён, вопрос отправлен клиенту");
					const newStatus: ApplicationStatus = "CLARIFICATION";
					setCurrentAppStatus(newStatus);
					onUpdate({
						application: { ...userApp, status: newStatus, id: userAppId },
					});
					setShowReviewDialog(false);
					onOpenChange(false);
					return;
				}
				const res = await updateApplicationStatusAction(
					userAppId,
					reviewStatusAction,
					reviewMessage
				);
				if (res.success) {
					toast.success("Статус анкеты обновлен");
					setCurrentAppStatus(reviewStatusAction);
					onUpdate({
						application: {
							...userApp,
							status: reviewStatusAction,
							id: userAppId,
						},
					});
					setShowReviewDialog(false);
					onOpenChange(false);
				} else {
					toast.error(res.error);
				}
			}
		});
	};

	const labels = appData?.labels || [];
	const fullName = [appData?.lastName, appData?.firstName, appData?.middleName]
		.filter(Boolean)
		.join(" ");
	const displayName = fullName || user.name || "Без имени";
	const currentPhone = appData?.contacts?.phone || user.phone;

	const handleFieldSave = async (fieldPath: string, value: unknown) => {
		const keys = fieldPath.split(".");
		const lastKey = keys.pop();
		if (!lastKey) return;

		const patch: Record<string, unknown> = {};
		let node = patch;
		for (const key of keys) {
			node[key] = {};
			node = node[key] as Record<string, unknown>;
		}
		node[lastKey] = value;

		const res = await adminUpdateApplicationFieldAction(
			user.id,
			patch as Partial<ApplicationDataFull>
		);
		if (!res.success) {
			toast.error(res.error ?? "Ошибка сохранения");
			throw new Error(res.error);
		}

		setAppData((prev) => {
			if (!prev) return prev;
			const updated = JSON.parse(JSON.stringify(prev));
			let current = updated;
			for (const key of keys) {
				if (!current[key] || typeof current[key] !== "object")
					current[key] = {};
				current = current[key];
			}
			current[lastKey] = value;
			return updated as ApplicationDataFull;
		});
	};

	const handleAddDiscount = () => {
		if (!discountValue) return;
		startTransition(async () => {
			const r = await adminAssignDiscountAction({
				userId: user.id,
				type: discountType,
				value: Number(discountValue),
				description: discountDesc ?? "",
				promoCode: promoCode ?? "",
			});
			if (!r.success) toast.error(r.error);
			else {
				toast.success("Скидка обновлена");
				setCurrentDiscount({
					type: discountType,
					value: Number(discountValue),
					promoCode: promoCode || null,
				});
				setDiscountValue("");
				setDiscountDesc("");
				setPromoCode("");
			}
		});
	};

	const TABS = [
		{ id: "profile" as const, label: "Профиль", icon: IdentificationCardIcon },
		{ id: "chat" as const, label: "Чат", icon: ChatIcon },
		{
			id: "labels" as const,
			label: labels.length ? `Заметки (${labels.length})` : "Метки",
			icon: NoteIcon,
		},
		{ id: "audit" as const, label: "История", icon: ClockIcon },
	] as const;

	return (
		<>
			<Sheet open={open} onOpenChange={handleOpenChange}>
				<SheetContent
					showCloseButton={false}
					side="right"
					className="w-full sm:max-w-175 flex flex-col p-0 gap-0 overflow-hidden backdrop-blur-xl"
				>
					{/* ── M3 COMPACT RESPONSIVE HEADER ── */}
					<SheetHeader className="p-6 pb-4 shrink-0">
						<div className="flex items-start gap-4">
							{/* Аватар */}
							<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm mt-1">
								{user.avatarUrl ? (
									<Image
										src={user.avatarUrl}
										alt={user.name || "User avatar"}
										width={64}
										height={64}
										className="object-cover rounded-full"
									/>
								) : (
									<UserIcon size={28} className="text-primary/70" />
								)}
							</div>

							{/* Инфо и Компактные Бейджи */}
							<div className="flex-1 flex flex-col gap-1.5 pt-0.5 min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<SheetTitle className="text-xl font-black truncate">
										{displayName}
									</SheetTitle>

									{/* Read-Only Бейджи (Управление перенесено в Досье) */}
									<AppStatusBadge
										status={currentAppStatus || "NO_APPLICATION"}
										onUpdate={(updated) => {
											if (updated.application?.status) {
												setCurrentAppStatus(updated.application.status);
											}
											onUpdate(updated);
										}}
										app={user.application}
										userId={user.id}
									/>
									{currentDiscount && (
										<DiscountField
											currentDiscount={currentDiscount}
											discountType={discountType}
											setDiscountType={setDiscountType}
											discountValue={discountValue}
											setDiscountValue={setDiscountValue}
											discountDesc={discountDesc}
											setDiscountDesc={setDiscountDesc}
											promoCode={promoCode}
											setPromoCode={setPromoCode}
											handleAddDiscount={handleAddDiscount}
											isPending={isPending}
										/>
									)}
								</div>

								{/* Кликабельные контакты */}
								<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
									{user.email && (
										<Link
											href={`mailto:${user.email}`}
											className="hover:text-primary transition-colors flex items-center gap-1.5 group"
										>
											<EnvelopeSimpleIcon
												size={14}
												className="group-hover:text-primary transition-colors"
											/>{" "}
											{user.email}
										</Link>
									)}
									{currentPhone && (
										<Link
											href={`tel:${currentPhone}`}
											className="hover:text-primary transition-colors flex items-center gap-1.5 group"
										>
											<PhoneIcon
												size={14}
												className="group-hover:text-primary transition-colors"
											/>{" "}
											{currentPhone}
										</Link>
									)}
									{labels.length > 0 && (
										<div className="flex flex-wrap gap-1.5">
											{labels.map((l) => (
												<Tooltip key={l.id}>
													<TooltipTrigger
														className={cn(
															"w-2.5 h-2.5 rounded-full border",
															LABEL_COLORS[
																l.color as keyof typeof LABEL_COLORS
															]?.split(" ")[0]
														)}
													></TooltipTrigger>
													<TooltipContent>{l.text}</TooltipContent>
												</Tooltip>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					</SheetHeader>

					{/* ── TABS ── */}
					<div className="flex border-b border-foreground/8 shrink-0 overflow-x-auto">
						{TABS.map(({ id, label, icon: Icon }) => (
							<button
								type="button"
								key={id}
								onClick={() => setTab(id)}
								className={cn(
									"cursor-pointer flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap px-4 outline-none",
									tab === id
										? "text-foreground border-foreground"
										: "text-muted-foreground border-transparent hover:text-foreground hover:bg-foreground/3"
								)}
							>
								<Icon
									size={14}
									weight={tab === id ? "duotone" : "bold"}
									className={cn(
										tab === id ? "text-foreground" : "text-muted-foreground"
									)}
								/>{" "}
								{label}
							</button>
						))}
					</div>

					{/* ── BODY ── */}
					<div className="flex-1 overflow-y-auto  mx-4 sm:mx-6">
						{tab === "profile" && (
							<ProfileTab
								user={user}
								appData={appData}
								permissions={permissions}
								onPermissionSave={(newPerms) => {
									startTransition(async () => {
										const r = await updateUserRoleAction(
											user.id,
											user.role ?? "USER",
											newPerms
										);
										if (!r.success) toast.error(r.error);
										else {
											toast.success("Права обновлены");
											setPermissions(newPerms);
											onUpdate({ permissions: newPerms });
										}
									});
								}}
								handleFieldSave={handleFieldSave}
								clientOriginalData={clientOriginalData}
							/>
						)}
						{tab === "chat" && (
							<ChatTab
								userId={user.id}
								userName={user.name}
								userEmail={user.email}
							/>
						)}
						{tab === "labels" && (
							<LabelsBlock
								labels={labels as unknown as UserLabel[]}
								onAdd={(l) =>
									handleFieldSave("labels", [
										...labels,
										{ ...l, id: crypto.randomUUID() },
									])
								}
								onRemove={(id) =>
									handleFieldSave(
										"labels",
										labels.filter((l) => l.id !== id)
									)
								}
								comments={comments}
								onAddComment={async (text) => {
									const r = await adminAddUserCommentAction(user.id, text);
									if (r.success && r.data) {
										setComments((p) => [
											{
												id: r.data.id,
												text: r.data.note,
												author: "Вы",
												createdAt: r.data.createdAt.toISOString(),
											},
											...p,
										]);
										toast.success("Комментарий добавлен");
									}
								}}
								onRemoveComment={async (id) => {
									const r = await adminDeleteUserCommentAction(user.id, id);
									if (r.success)
										setComments((p) => p.filter((c) => c.id !== id));
								}}
							/>
						)}
						{tab === "audit" && <AuditTab userId={user.id} />}
					</div>

					{/* ── FOOTER ── */}
					<div className="p-4 sm:p-6 border-t border-foreground/10 flex gap-3 shrink-0 bg-background">
						<Button className="flex-1" onClick={() => handleOpenChange(false)}>
							Закрыть
						</Button>
						<Button
							variant={user.isBlocked ? "default" : "destructive"}
							className="flex-none w-12 sm:w-auto sm:px-4"
							onClick={() => {
								const reason = user.isBlocked
									? undefined
									: (window.prompt("Причина блокировки:") ?? "");
								startTransition(async () => {
									const r = await toggleUserBlockAction(
										user.id,
										!user.isBlocked,
										reason
									);
									if (!r.success) toast.error(r.error);
									else {
										toast.success(
											user.isBlocked ? "Разблокирован" : "Заблокирован"
										);
										onUpdate({
											isBlocked: !user.isBlocked,
											blockedReason: reason ?? null,
										});
									}
								});
							}}
							disabled={isPending}
							title={user.isBlocked ? "Разблокировать" : "Заблокировать"}
						>
							<ProhibitIcon size={16} className="sm:mr-2" />
							<span className="hidden sm:inline">
								{user.isBlocked ? "Разблокировать аккаунт" : "Заблокировать"}
							</span>
						</Button>
					</div>
				</SheetContent>
			</Sheet>
			<Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
				<DialogContent className="sm:max-w-108 rounded-2xl z-100">
					<DialogHeader>
						<DialogTitle>Завершение проверки</DialogTitle>
						<DialogDescription>
							Анкета находится в статусе{" "}
							<strong className="font-black">«На проверке»</strong>. Выберите
							итоговое решение перед закрытием карточки клиента.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4 bg-secondary/30 px-2 rounded-2xl">
						<div className="flex flex-wrap gap-2">
							<Button
								variant={reviewStatusAction === "APPROVED" ? "outline" : "tab"}
								size="sm"
								onClick={() => setReviewStatusAction("APPROVED")}
								className="flex-1"
							>
								Успешно проверено
							</Button>
							<Button
								variant={reviewStatusAction === "STANDARD" ? "outline" : "tab"}
								size="sm"
								onClick={() => setReviewStatusAction("STANDARD")}
								className="flex-1"
							>
								Стандартные условия
							</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								variant={
									reviewStatusAction === "CLARIFICATION" ? "outline" : "tab"
								}
								size="sm"
								onClick={() => setReviewStatusAction("CLARIFICATION")}
								className="flex-1"
							>
								Уточненяющий вопрос
							</Button>
							<Button
								variant={
									reviewStatusAction === "REJECTED" ? "destructive" : "tab"
								}
								size="sm"
								onClick={() => setReviewStatusAction("REJECTED")}
								className="flex-1"
							>
								Отклонить анкету
							</Button>
						</div>

						{(reviewStatusAction === "CLARIFICATION" ||
							reviewStatusAction === "REJECTED") && (
							<Textarea
								placeholder={
									reviewStatusAction === "CLARIFICATION"
										? "Напишите вопрос клиенту..."
										: "Причина отклонения (необязательно)..."
								}
								value={reviewMessage}
								onChange={(e) => setReviewMessage(e.target.value)}
								className="mt-2 text-sm rounded-xl resize-none glass-input"
								rows={4}
							/>
						)}
					</div>

					<DialogFooter className="gap-2">
						<Button
							variant="ghost"
							onClick={() => {
								setShowReviewDialog(false);
								onOpenChange(false);
							}}
							className="flex-1"
						>
							Выйти без сохранения
						</Button>
						<Button
							disabled={
								!reviewStatusAction ||
								isPending ||
								(reviewStatusAction === "CLARIFICATION" &&
									!reviewMessage.trim())
							}
							onClick={handleReviewSubmit}
							className="flex-1"
						>
							{isPending ? "Сохранение..." : "Подтвердить статус"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
