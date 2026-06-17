"use client";

import {
	ArrowRightIcon,
	ChatIcon,
	ChatTeardropDotsIcon,
	ClockIcon,
	EnvelopeOpenIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
	type DbSupportThread,
	getClientSupportThreadsAction,
} from "@/actions/support-actions";
import { AdminNewThreadModal } from "@/components/admin/support/AdminNewThreadModal";
import { Badge, Button } from "@/components/ui";
import { CHATS_STATUS_COLORS, CHATS_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";

interface ChatTabProps {
	userId: string;
	userName: string | null;
	userEmail: string | null;
}

function formatDate(date: Date) {
	const now = new Date();
	const diff = now.getTime() - new Date(date).getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 60) return `${minutes}м назад`;
	if (hours < 24) return `${hours}ч назад`;
	if (days < 7) return `${days}д назад`;
	return new Date(date).toLocaleDateString("ru-RU");
}

export function ChatTab({ userId, userName, userEmail }: ChatTabProps) {
	const [threads, setThreads] = useState<DbSupportThread[]>([]);
	const [loading, setLoading] = useState(true);
	const [newThreadOpen, setNewThreadOpen] = useState(false);

	useEffect(() => {
		setLoading(true);
		getClientSupportThreadsAction(userId).then((res) => {
			if (res.success && res.threads) setThreads(res.threads);
			setLoading(false);
		});
	}, [userId]);

	const getUnreadCount = (thread: DbSupportThread) =>
		thread.messages.filter((m) => !m.isAdmin && m.readBy.length === 0).length;

	const totalUnread = threads.reduce((acc, t) => acc + getUnreadCount(t), 0);
	const waitingCount = threads.filter(
		(t) => t.status === "WAITING_FOR_ADMIN"
	).length;

	if (loading) {
		return (
			<div className="py-16 flex items-center justify-center">
				<div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<div className="py-4 space-y-4">
			{/* Заголовок с кнопками */}
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						Обращения
					</p>
					{waitingCount > 0 && (
						<Badge className="h-4 px-1.5 text-[10px] font-bold bg-red-500 text-white">
							{waitingCount} ждут
						</Badge>
					)}
					{totalUnread > 0 && waitingCount === 0 && (
						<Badge className="h-4 px-1.5 text-[10px] font-bold bg-green-600 text-white">
							{totalUnread} новых
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2">
					{threads.length > 0 && (
						<Link href={`/admin/support/${userId}`}>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
							>
								Все
								<ArrowRightIcon size={12} weight="bold" />
							</Button>
						</Link>
					)}
					<Button
						size="sm"
						className="h-7 text-xs gap-1.5 font-bold"
						onClick={() => setNewThreadOpen(true)}
					>
						<PlusIcon size={12} weight="bold" />
						Написать
					</Button>
				</div>
			</div>

			{/* Список тредов */}
			{threads.length === 0 ? (
				<div className="py-12 text-center space-y-2">
					<div className="w-22 h-22 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto">
						<ChatIcon size={44} className="text-muted-foreground/40" />
					</div>
					<div>
						<p className="text-md font-semibold text-foreground">
							Чатов пока нет
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Начните переписку с клиентом
						</p>
					</div>
					<Button
						size="md"
						variant="ghost"
						onClick={() => setNewThreadOpen(true)}
					>
						Написать клиенту
					</Button>
				</div>
			) : (
				<div className="space-y-2">
					{threads.map((thread) => {
						const unreadCount = getUnreadCount(thread);
						const lastMsg = thread.messages[thread.messages.length - 1];
						const isWaiting = thread.status === "WAITING_FOR_ADMIN";

						return (
							<Link
								key={thread.id}
								href={`/admin/support/thread/${thread.id}`}
								className="block group"
							>
								<div
									className={cn(
										"p-3 rounded-xl border transition-all hover:bg-foreground/3",
										isWaiting
											? "border-red-300/30 bg-red-500/5"
											: "border-foreground/8 bg-foreground/2",
										unreadCount > 0 && "ring-1 ring-green-500/40"
									)}
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0 space-y-1">
											{/* Тема */}
											<div className="flex items-center gap-2">
												<p className="text-xs font-semibold text-foreground truncate group-hover:underline">
													{thread.subject}
												</p>
												{unreadCount > 0 && (
													<EnvelopeOpenIcon
														size={12}
														weight="duotone"
														className="text-green-600 shrink-0"
													/>
												)}
											</div>

											{/* Последнее сообщение */}
											{lastMsg && (
												<p className="text-[11px] text-muted-foreground truncate leading-relaxed">
													{lastMsg.isAdmin ? "Вы: " : "Клиент: "}
													{lastMsg.content.substring(0, 60)}
													{lastMsg.content.length > 60 ? "…" : ""}
												</p>
											)}

											{/* Мета */}
											<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
												<ClockIcon size={10} />
												<span>{formatDate(thread.lastMessageAt)}</span>
												<span>·</span>
												<ChatTeardropDotsIcon size={10} />
												<span>{thread.messages.length}</span>
											</div>
										</div>

										{/* Статус */}
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] font-medium shrink-0",
												CHATS_STATUS_COLORS[thread.status] ||
													"bg-foreground/10 text-foreground/60"
											)}
										>
											{CHATS_STATUS_LABELS[thread.status] || thread.status}
										</Badge>
									</div>
								</div>
							</Link>
						);
					})}

					{/* Ссылка на полную страницу если тредов много */}
					{threads.length >= 3 && (
						<Link
							href={`/admin/support/${userId}`}
							className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Все обращения клиента
							<ArrowRightIcon size={12} weight="bold" />
						</Link>
					)}
				</div>
			)}

			<AdminNewThreadModal
				open={newThreadOpen}
				onOpenChange={(open) => {
					setNewThreadOpen(open);
					// Перезагружаем треды после создания
					if (!open) {
						getClientSupportThreadsAction(userId).then((res) => {
							if (res.success && res.threads) setThreads(res.threads);
						});
					}
				}}
				preselectedUser={{ id: userId, name: userName, email: userEmail }}
			/>
		</div>
	);
}
