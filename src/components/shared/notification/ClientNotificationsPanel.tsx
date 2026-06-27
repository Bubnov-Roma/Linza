"use client";

import {
	BellIcon,
	BellRingingIcon,
	CheckIcon,
	FileTextIcon,
	PackageIcon,
	PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendSupportMessageAction } from "@/actions/support-actions";
import { ClientTime } from "@/components/shared/ClientTime";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { BOOKING_STATUS_LABELS, VERIFICATION_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";
import { useClientNotificationsStore } from "@/store/use-client-notifications.store";

interface Props {
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
}

export function ClientNotificationsPanel({
	align = "end",
	side = "bottom",
}: Props) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [_clarificationThreadId, setClarificationThreadId] = useState<
		string | null
	>(null);
	const [clarificationText, setClarificationText] = useState("");
	const [isPending, startTransition] = useTransition();

	const {
		hasNewApplicationStatus,
		applicationStatusNotification,
		unseenBookingChanges,
		availableAutoPromo,
		setHasNewApplicationStatus,
		setApplicationStatusNotification,
		clearBookingChange,
		clearAllBookingChanges,
	} = useClientNotificationsStore();

	const totalCount =
		(hasNewApplicationStatus ? 1 : 0) +
		unseenBookingChanges.length +
		(availableAutoPromo ? 1 : 0);
	const hasAny = totalCount > 0;

	const clarificationThreadId =
		applicationStatusNotification?.clarificationThreadId ?? null;

	const handleMarkAll = () => {
		setHasNewApplicationStatus(false);
		setApplicationStatusNotification(null);
		clearAllBookingChanges();
		setOpen(false);
	};

	const isClarification =
		applicationStatusNotification?.newStatus === "CLARIFICATION";

	const handleApplicationClick = () => {
		if (!isClarification) {
			setHasNewApplicationStatus(false);
			setApplicationStatusNotification(null);
			router.push("/dashboard/profile");
			setOpen(false);
		}
	};

	const handleClarificationSubmit = (threadId: string) => {
		if (!clarificationText.trim()) return;
		startTransition(async () => {
			const result = await sendSupportMessageAction({
				threadId,
				content: clarificationText.trim(),
			});
			if (!result.success) {
				toast.error(result.error ?? "Ошибка отправки");
				return;
			}
			toast.success("Ответ отправлен");
			setClarificationText("");
			setClarificationThreadId(null);
			setHasNewApplicationStatus(false);
			setApplicationStatusNotification(null);
			setOpen(false);
		});
	};

	const handleBookingClick = (
		bookingId: string,
		type: "equipment" | "studio"
	) => {
		clearBookingChange(bookingId);
		router.push(
			type === "studio"
				? `/dashboard/studio-bookings/${bookingId}`
				: `/dashboard/bookings/${bookingId}`
		);
		setOpen(false);
	};

	const appStatusConfig = applicationStatusNotification?.newStatus
		? VERIFICATION_CONFIG[
				applicationStatusNotification.newStatus as keyof typeof VERIFICATION_CONFIG
			]
		: null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="relative w-full justify-start rounded-xl px-3 h-10 gap-3 text-sm font-medium text-foreground/80 hover:bg-foreground/5"
				>
					{hasAny ? (
						<BellRingingIcon
							size={18}
							weight="fill"
							className="text-foreground/80"
						/>
					) : (
						<BellIcon
							size={18}
							weight="duotone"
							className="text-muted-foreground"
						/>
					)}
					<span>Уведомления</span>
					{hasAny && (
						<span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
							{totalCount > 99 ? "99+" : totalCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent
				align={align}
				side={side}
				sideOffset={2}
				className="w-82 p-0 rounded-2xl shadow-xl border border-foreground/10 overflow-hidden backdrop-blur-2xl z-100"
			>
				{/* Шапка */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
					<div className="flex items-center gap-2">
						<BellIcon
							size={15}
							weight="duotone"
							className="text-muted-foreground"
						/>
						<span className="font-semibold text-sm">Уведомления</span>
						{hasAny && (
							<span className="text-xs text-muted-foreground">
								({totalCount})
							</span>
						)}
					</div>
					{hasAny && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleMarkAll}
							className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7 px-2 rounded-lg"
						>
							<CheckIcon size={11} weight="bold" />
							Очистить
						</Button>
					)}
				</div>

				{/* Список */}
				<div className="max-h-[70vh] overflow-y-auto">
					{!hasAny && (
						<div className="py-10 text-center space-y-2">
							<BellIcon
								size={28}
								className="mx-auto text-muted-foreground/20"
								weight="duotone"
							/>
							<p className="text-sm text-muted-foreground">
								Нет новых уведомлений
							</p>
						</div>
					)}

					{/* Уведомление об анкете */}
					{hasNewApplicationStatus && applicationStatusNotification && (
						<div className="border-b border-foreground/5 last:border-0">
							<button
								type="button"
								onClick={handleApplicationClick}
								className={cn(
									"w-full flex items-start gap-3 px-4 py-3 transition-colors hover:bg-foreground/5 text-left",
									isClarification && "cursor-default hover:bg-transparent"
								)}
							>
								<div
									className={cn(
										"shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5",
										appStatusConfig?.bgColor ?? "bg-foreground/5"
									)}
								>
									{appStatusConfig?.Icon ? (
										<appStatusConfig.Icon
											size={15}
											weight="duotone"
											className={appStatusConfig.color}
										/>
									) : (
										<FileTextIcon
											size={15}
											weight="duotone"
											className="text-blue-500"
										/>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium leading-tight">
										{appStatusConfig?.label ?? "Статус анкеты изменён"}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
										{isClarification
											? "Администратор запросил уточнение. Ответьте ниже."
											: (appStatusConfig?.description ??
												"Нажмите для просмотра")}
									</p>
									<p className="text-[11px] text-muted-foreground/50 mt-1">
										<ClientTime
											iso={applicationStatusNotification.changedAt}
											fmt="relative"
										/>
									</p>
								</div>
								{!isClarification && (
									<span className="text-[10px] text-primary font-semibold shrink-0 mt-1">
										Открыть →
									</span>
								)}
							</button>

							{/* Форма уточнения — только для CLARIFICATION */}
							{isClarification && (
								<div className="px-4 pb-3 space-y-2">
									<Textarea
										placeholder="Ваш ответ на уточнение..."
										value={clarificationText}
										onChange={(e) => setClarificationText(e.target.value)}
										disabled={isPending}
										rows={3}
										className="resize-none rounded-xl glass-input text-xs"
									/>
									<div className="flex gap-2">
										<Button
											size="sm"
											onClick={() => {
												if (clarificationThreadId) {
													handleClarificationSubmit(clarificationThreadId);
												} else {
													// Запасной вариант — открываем список чатов
													router.push("/dashboard/support");
													setOpen(false);
												}
											}}
											variant="ghost"
											className="flex-1 text-xs h-8 rounded-lg"
											disabled={isPending}
										>
											Открыть чат
										</Button>
										<Button
											size="sm"
											onClick={() => {
												// Отправляем ответ в последний тред — лучше всего вести на страницу
												router.push("/dashboard/support");
												setOpen(false);
											}}
											className="flex-1 text-xs h-8 rounded-lg gap-1"
											disabled={isPending || !clarificationText.trim()}
										>
											<PaperPlaneTiltIcon size={12} weight="duotone" />
											Ответить
										</Button>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Авто-промокод */}
					{availableAutoPromo && (
						<div className="border-b border-foreground/5 last:border-0">
							<div className="flex items-start gap-3 px-4 py-3">
								<div className="shrink-0 w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center mt-0.5">
									<span className="text-sm">🎁</span>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium leading-tight">
										Промокод активирован
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										<span className="font-mono font-bold text-foreground">
											{availableAutoPromo.code}
										</span>
										{" — "}
										{availableAutoPromo.type === "PERCENT"
											? `скидка ${availableAutoPromo.value}%`
											: `скидка ${availableAutoPromo.value.toLocaleString("ru-RU")} ₽`}
										{availableAutoPromo.minOrderAmount
											? ` при заказе от ${availableAutoPromo.minOrderAmount.toLocaleString("ru-RU")} ₽`
											: ""}
									</p>
									<p className="text-[11px] text-muted-foreground/50 mt-1">
										Применится автоматически при первом заказе
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Уведомления о заказах */}
					{unseenBookingChanges.map((change) => {
						const isStudio = change.type === "studio";
						const label =
							BOOKING_STATUS_LABELS[change.newStatus] ?? change.newStatus;

						return (
							<button
								key={change.bookingId}
								type="button"
								onClick={() =>
									handleBookingClick(change.bookingId, change.type)
								}
								className="w-full flex items-start gap-3 px-4 py-3 transition-colors hover:bg-foreground/5 border-b border-foreground/5 last:border-0 text-left"
							>
								<div className="shrink-0 w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center mt-0.5">
									<PackageIcon
										size={15}
										weight="duotone"
										className="text-foreground"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium leading-tight">
										{isStudio ? "Студия" : "Аренда техники"}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{label}
									</p>
									{change.changedAt && (
										<p className="text-[11px] text-muted-foreground/50 mt-1">
											<ClientTime iso={change.changedAt} fmt="relative" />
										</p>
									)}
								</div>
								<span className="text-[10px] text-muted-foreground font-semibold shrink-0 mt-1">
									Открыть →
								</span>
							</button>
						);
					})}
				</div>
			</PopoverContent>
		</Popover>
	);
}
