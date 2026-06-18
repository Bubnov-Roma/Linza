"use client";

import {
	BellIcon,
	BellRingingIcon,
	CheckIcon,
	CircleIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
	getAdminNotificationsAction,
	markAllNotificationsReadAction,
	markNotificationsReadAction,
} from "@/actions/notification-actions";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	ADMIN_NOTIFICATION_TYPE_ICONS,
	getNotificationHref,
	NOTIFICATION_LABELS,
} from "@/constants";
import { cn } from "@/lib/utils";
import { useAdminNotificationsStore } from "@/store/use-admin-notifications.store";
import type { AdminNotificationType } from "@/types";

// ─── Форматирование даты ──────────────────────────────────────────────────────

function formatRelative(date: Date): string {
	const diff = Date.now() - new Date(date).getTime();
	const m = Math.floor(diff / 60_000);
	const h = Math.floor(diff / 3_600_000);
	const d = Math.floor(diff / 86_400_000);
	if (m < 1) return "только что";
	if (m < 60) return `${m}м назад`;
	if (h < 24) return `${h}ч назад`;
	if (d < 7) return `${d}д назад`;
	return new Date(date).toLocaleDateString("ru-RU");
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export function AdminNotificationsPanel() {
	const {
		unreadCount,
		notifications,
		markRead,
		markAllRead,
		prependNotifications,
	} = useAdminNotificationsStore();

	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	// При открытии — догружаем список с сервера если локально пусто
	const handleOpen = async (isOpen: boolean) => {
		setOpen(isOpen);
		if (!isOpen || notifications.length > 0) return;

		setLoading(true);
		try {
			const items = await getAdminNotificationsAction({ limit: 50 });
			prependNotifications(items);
		} catch {
			// игнорируем
		} finally {
			setLoading(false);
		}
	};

	// Пометить все прочитанными
	const handleMarkAll = async () => {
		markAllRead();
		await markAllNotificationsReadAction();
		toast.success("Все уведомления прочитаны");
	};

	// Пометить одно прочитанным при клике
	const handleClickItem = async (id: string, isRead: boolean) => {
		if (!isRead) {
			markRead([id]);
			await markNotificationsReadAction([id]);
		}
		setOpen(false);
	};

	const hasUnread = unreadCount > 0;

	return (
		<Popover open={open} onOpenChange={handleOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="relative group/cart p-2.5 rounded-xl transition-all duration-300 backdrop-invert-10 backdrop-blur-xs backdrop-brightness-120"
					aria-label="Уведомления"
				>
					{hasUnread ? (
						<BellRingingIcon
							size={22}
							weight="fill"
							className="text-foreground/80 scale-100 group-hover/cart:scale-120 transition-all duration-200 drop-shadow-xl drop-shadow-background"
						/>
					) : (
						<BellIcon
							size={22}
							weight="duotone"
							className="text-muted-foreground"
						/>
					)}
					{hasUnread && (
						<span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
							{unreadCount > 99 ? "99+" : unreadCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>

			<PopoverContent
				align="end"
				sideOffset={8}
				className="w-95 p-0 rounded-2xl shadow-xl border border-foreground/10 overflow-hidden backdrop-blur-2xl"
			>
				{/* Шапка */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
					<div className="flex items-center gap-2">
						<BellIcon
							size={16}
							weight="duotone"
							className="text-muted-foreground"
						/>
						<span className="font-semibold text-sm">Уведомления</span>
						{hasUnread && (
							<span className="text-xs text-muted-foreground">
								({unreadCount} новых)
							</span>
						)}
					</div>
					{hasUnread && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleMarkAll}
							className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7 px-2 rounded-lg"
						>
							<CheckIcon size={12} weight="bold" />
							Прочитать все
						</Button>
					)}
				</div>

				{/* Список */}
				<div className="max-h-105 overflow-y-auto">
					{loading && (
						<div className="py-8 text-center text-sm text-muted-foreground">
							Загрузка...
						</div>
					)}

					{!loading && notifications.length === 0 && (
						<div className="py-12 text-center space-y-2">
							<BellIcon
								size={32}
								className="mx-auto text-muted-foreground/20"
								weight="duotone"
							/>
							<p className="text-sm text-muted-foreground">
								Уведомлений пока нет
							</p>
						</div>
					)}

					{!loading &&
						notifications.map((n) => {
							const type = n.type as AdminNotificationType;
							const href = getNotificationHref(n);
							const label = NOTIFICATION_LABELS[type] ?? n.type;
							const icon = ADMIN_NOTIFICATION_TYPE_ICONS[type] ?? "🔔";
							const userName = n.user?.name ?? n.user?.email ?? null;

							const inner = (
								// biome-ignore lint/a11y/useSemanticElements: <>
								<div
									className={cn(
										"flex items-start gap-3 px-4 py-3 transition-colors hover:bg-foreground/5 cursor-pointer border-b border-foreground/5 last:border-0",
										!n.isRead && "bg-blue-500/5"
									)}
									onClick={() => handleClickItem(n.id, n.isRead)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleClickItem(n.id, n.isRead);
									}}
									role="button"
									tabIndex={0}
								>
									{/* Иконка типа */}
									<div className="shrink-0 w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center text-base">
										{icon}
									</div>

									{/* Текст */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-1.5">
											<p className="text-sm font-medium leading-tight truncate">
												{label}
											</p>
											{!n.isRead && (
												<CircleIcon
													size={6}
													weight="fill"
													className="text-blue-500 shrink-0"
												/>
											)}
										</div>
										{userName && (
											<p className="text-xs text-muted-foreground mt-0.5 truncate">
												{userName}
											</p>
										)}
										<p className="text-[11px] text-muted-foreground/50 mt-1">
											{formatRelative(n.createdAt)}
										</p>
									</div>
								</div>
							);

							return href ? (
								<Link
									key={n.id}
									href={href}
									onClick={() => handleClickItem(n.id, n.isRead)}
								>
									{inner}
								</Link>
							) : (
								<div key={n.id}>{inner}</div>
							);
						})}
				</div>

				{/* Футер */}
				{notifications.length > 0 && (
					<div className="px-4 py-2 border-t border-foreground/5 text-center">
						<span className="text-xs text-muted-foreground/50">
							Показаны последние {notifications.length} уведомлений
						</span>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
