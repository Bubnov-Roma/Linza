"use client";

import {
	EnvelopeOpenIcon,
	HeadsetIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type DbSupportThread,
	deleteThreadByClientAction,
	pollSupportThreadsAction,
} from "@/actions/support-actions";
import { ClientTime, SupportModalTrigger } from "@/components/shared";
import { Badge, Button, Card } from "@/components/ui";
import { CHATS_STATUS_COLORS, CHATS_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import { useClientNotificationsStore } from "@/store/use-client-notifications.store";

// Выносим хелпер наверх для переиспользования в компоненте
const hasUnreadFromAdmin = (thread: DbSupportThread) => {
	if (thread.status === "CLOSED" || thread.status === "WAITING_FOR_ADMIN") {
		return false;
	}

	const lastAdminMessage = [...thread.messages]
		.reverse()
		.find((m) => m.isAdmin);

	if (!lastAdminMessage) return false;
	if (!thread.clientReadAt) return true;

	return new Date(lastAdminMessage.createdAt) > new Date(thread.clientReadAt);
};

export default function SupportThreadListClient({
	initialThreads,
}: {
	initialThreads: DbSupportThread[];
}) {
	const setUnreadChats = useClientNotificationsStore((s) => s.setUnreadChats);
	const [threads, setThreads] = useState(initialThreads);

	const latestAt = threads[0]?.lastMessageAt ?? new Date(0);

	useEffect(() => {
		const unreadCount = initialThreads.filter(hasUnreadFromAdmin).length;
		setUnreadChats(unreadCount);
	}, [initialThreads, setUnreadChats]);

	useEffect(() => {
		const interval = setInterval(async () => {
			const result = await pollSupportThreadsAction({
				role: "client",
				latestThreadAt: latestAt,
			});
			if (result.hasUpdates && result.threads) {
				setThreads(result.threads);
				// Обновляем счетчик в глобальном сторе на основе свежих данных
				const newUnread = result.threads.filter(hasUnreadFromAdmin).length;
				setUnreadChats(newUnread);
			}
		}, 15_000);

		return () => clearInterval(interval);
	}, [latestAt, setUnreadChats]);

	// Оптимистичное обновление при клике на тред
	const markThreadRead = useCallback(
		(threadId: string) => {
			setThreads((prev) => {
				const next = prev.map((t) => {
					if (t.id !== threadId) return t;
					// Вместо изменения автора сообщения, обновляем дату прочтения клиентом
					return { ...t, clientReadAt: new Date() };
				});

				// Пересчитываем общий счетчик для сайдбара
				const newUnread = next.filter(hasUnreadFromAdmin).length;
				setTimeout(() => setUnreadChats(newUnread), 0);
				return next;
			});
		},
		[setUnreadChats]
	);

	const getLastMessage = (thread: DbSupportThread) => {
		const lastMsg = thread.messages[thread.messages.length - 1];
		if (!lastMsg) return "Нет сообщений";
		return lastMsg.content.length > 60
			? `${lastMsg.content.substring(0, 60)}...`
			: lastMsg.content;
	};

	const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
		e.preventDefault();
		e.stopPropagation();
		const result = await deleteThreadByClientAction(threadId);
		if (!result.success) {
			toast.error(result.error ?? "Ошибка удаления");
			return;
		}
		setThreads((prev) => prev.filter((t) => t.id !== threadId));
		toast.success("Чат удалён");
	};

	return (
		<div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
			<div>
				<h1 className="text-3xl font-black italic uppercase tracking-tight">
					Моя поддержка
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					{threads.length === 0
						? "У вас нет активных обращений"
						: `${threads.length} ${threads.length === 1 ? "обращение" : "обращений"}`}
				</p>
			</div>

			<div className="space-y-2">
				{threads.map((thread) => {
					const unread = hasUnreadFromAdmin(thread);
					return (
						<Link
							key={thread.id}
							href={`/dashboard/support/${thread.id}`}
							className="block group"
							onClick={() => markThreadRead(thread.id)}
						>
							<Card
								className={cn(
									"p-4 hover:bg-foreground/3 transition-all cursor-pointer",
									unread && "bg-green-500/5 border-green-500/20"
								)}
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0 space-y-2">
										<div className="flex items-center gap-2">
											<h3 className="font-semibold text-foreground truncate group-hover:underline">
												{thread.subject}
											</h3>
											{unread && (
												<EnvelopeOpenIcon
													size={16}
													weight="duotone"
													className="text-green-600 shrink-0 animation-pulse"
												/>
											)}
										</div>

										<p className="text-sm text-muted-foreground truncate">
											{getLastMessage(thread)}
										</p>

										<div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
											<span>
												{thread.messages.length}{" "}
												{thread.messages.length === 1
													? "сообщение"
													: "сообщений"}
											</span>
											<span>•</span>
											<ClientTime iso={thread.lastMessageAt} fmt="relative" />
										</div>
									</div>

									<div className="flex flex-col items-end gap-2 shrink-0">
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] font-medium",
												CHATS_STATUS_COLORS[thread.status] ||
													"bg-foreground/10 text-foreground/60"
											)}
										>
											{CHATS_STATUS_LABELS[thread.status] || thread.status}
										</Badge>

										<Button
											size="icon"
											variant="ghost"
											onClick={(e) => handleDeleteThread(e, thread.id)}
											className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-2xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
											title="Удалить обращение"
										>
											<TrashIcon size={13} weight="duotone" />
										</Button>
									</div>
								</div>
							</Card>
						</Link>
					);
				})}

				{threads.length === 0 && (
					<div className="text-center py-16 space-y-4">
						<div className="flex justify-center">
							<HeadsetIcon
								size={48}
								className="opacity-40 p-4 rounded-full bg-foreground/5 w-16 h-16"
								weight="duotone"
							/>
						</div>
						<div>
							<p className="text-muted-foreground mb-4">
								У вас нет обращений в поддержку
							</p>
							<SupportModalTrigger
								variant="button"
								label="Создать первое обращение"
							/>
						</div>
					</div>
				)}
			</div>

			{threads.length > 0 && (
				<div className="bg-blue-500/10 border border-blue-300/30 rounded-lg p-3 text-sm text-blue-700/80">
					<p>
						💡 <strong>Совет:</strong> Чем подробнее вы опишете проблему, тем
						быстрее мы вам поможем.
					</p>
				</div>
			)}
		</div>
	);
}
