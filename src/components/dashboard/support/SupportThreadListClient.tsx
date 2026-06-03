"use client";

import {
	EnvelopeIcon,
	EnvelopeOpenIcon,
	GlobeIcon,
	HeadsetIcon,
	TelegramLogoIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
	type DbSupportThread,
	pollSupportThreadsAction,
} from "@/actions/support-actions";
import { SupportModalTrigger } from "@/components/shared";
import { Badge, Card } from "@/components/ui";
import { CHATS_STATUS_COLORS, CHATS_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";

export default function SupportThreadListClient({
	initialThreads,
}: {
	initialThreads: DbSupportThread[];
}) {
	const [threads, setThreads] = useState(initialThreads);

	const latestAt = threads[0]?.lastMessageAt ?? new Date(0);

	useEffect(() => {
		const interval = setInterval(async () => {
			const result = await pollSupportThreadsAction({
				role: "client",
				latestThreadAt: latestAt,
			});
			if (result.hasUpdates && result.threads) {
				setThreads(result.threads);
			}
		}, 15_000);

		return () => clearInterval(interval);
	}, [latestAt]);

	const getLastMessage = (thread: DbSupportThread) => {
		const lastMsg = thread.messages[thread.messages.length - 1];
		if (!lastMsg) return "Нет сообщений";
		return lastMsg.content.length > 60
			? `${lastMsg.content.substring(0, 60)}...`
			: lastMsg.content;
	};

	const formatDate = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 60) return `${minutes}м назад`;
		if (hours < 24) return `${hours}ч назад`;
		if (days < 7) return `${days}д назад`;

		return new Date(date).toLocaleDateString("ru-RU");
	};

	const hasUnreadFromAdmin = (thread: DbSupportThread) => {
		// Если последнее сообщение от админа - есть непрочитанные
		const lastMsg = thread.messages[thread.messages.length - 1];
		return lastMsg?.isAdmin ?? false;
	};

	return (
		<div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
			{/* Заголовок */}
			<div className="flex items-center justify-between">
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
				<SupportModalTrigger variant="button" label="Новый вопрос" />
			</div>

			{/* Список потоков */}
			<div className="space-y-2">
				{threads.map((thread) => {
					const unread = hasUnreadFromAdmin(thread);
					return (
						<Link
							key={thread.id}
							href={`/dashboard/support/${thread.id}`}
							className="block group"
						>
							<Card
								className={cn(
									"p-4 hover:bg-foreground/3 transition-all cursor-pointer",
									unread && " bg-green-500/5"
								)}
							>
								<div className="flex items-start justify-between gap-4">
									{/* Основная информация */}
									<div className="flex-1 min-w-0 space-y-2">
										<div className="flex items-center gap-2">
											<h3 className="font-semibold text-foreground truncate group-hover:underline">
												{thread.subject}
											</h3>
											{unread && (
												<EnvelopeOpenIcon
													size={16}
													weight="duotone"
													className="text-green-600 shrink-0"
												/>
											)}
										</div>

										{/* Последнее сообщение */}
										<p className="text-sm text-muted-foreground truncate">
											{getLastMessage(thread)}
										</p>

										{/* Мета информация */}
										<div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
											<span>
												{thread.messages.length}{" "}
												{thread.messages.length === 1
													? "сообщение"
													: "сообщений"}
											</span>
											<span>•</span>
											<span>{formatDate(thread.lastMessageAt)}</span>
										</div>
									</div>

									{/* Статус и платформа */}
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
										<span className="text-xs text-muted-foreground flex items-center gap-1">
											{thread.platform === "WEBSITE" && (
												<>
													<GlobeIcon
														weight="duotone"
														size={12}
														className="shrink-0 inline"
													/>{" "}
													Сайт
												</>
											)}
											{thread.platform === "TELEGRAM" && (
												<>
													<TelegramLogoIcon
														weight="duotone"
														size={12}
														className="shrink-0 inline"
													/>{" "}
													Telegram
												</>
											)}
											{thread.platform === "EMAIL" && (
												<>
													<EnvelopeIcon
														weight="duotone"
														size={12}
														className="shrink-0 inline"
													/>{" "}
													Email
												</>
											)}
										</span>
									</div>
								</div>
							</Card>
						</Link>
					);
				})}

				{/* Пустое состояние */}
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
								У вас еще нет обращений в поддержку
							</p>
							<SupportModalTrigger
								variant="button"
								label="Создать первое обращение"
							/>
						</div>
					</div>
				)}
			</div>

			{/* Совет */}
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
