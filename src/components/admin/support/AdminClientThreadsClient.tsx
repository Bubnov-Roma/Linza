"use client";

import { CaretLeftIcon, EnvelopeOpenIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import type { DbSupportThread } from "@/actions/support-actions";
import { ClientTime } from "@/components/shared";
import { Badge, Card } from "@/components/ui";
import { CHATS_STATUS_COLORS, CHATS_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";

export default function AdminClientThreadsClient({
	initialThreads,
}: {
	clientId: string;
	initialThreads: DbSupportThread[];
}) {
	const [threads] = useState(initialThreads);

	const clientName = threads[0]?.user.name || "Клиент";
	const clientEmail = threads[0]?.user.email || "";

	const getUnreadCount = (thread: DbSupportThread) => {
		return thread.messages.filter((m) => !m.isAdmin && m.readBy.length === 0)
			.length;
	};

	return (
		<div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
			{/* Навигация */}
			<Link
				href="/admin/support"
				className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				<CaretLeftIcon size={16} weight="bold" />
				Все потоки
			</Link>

			{/* Заголовок */}
			<div className="space-y-2">
				<h1 className="text-3xl font-black italic uppercase tracking-tight">
					{clientName}
				</h1>
				<p className="text-sm text-muted-foreground">{clientEmail}</p>
				<p className="text-sm text-muted-foreground">
					{threads.length} {threads.length === 1 ? "обращение" : "обращений"}
				</p>
			</div>

			{/* Список потоков */}
			<div className="space-y-2">
				{threads.map((thread) => {
					const unreadCount = getUnreadCount(thread);
					const lastMsg = thread.messages[thread.messages.length - 1];
					const isWaitingForAdmin = thread.status === "WAITING_FOR_ADMIN";

					return (
						<Link
							key={thread.id}
							href={`/admin/support/thread/${thread.id}`}
							className="block group"
						>
							<Card
								className={cn(
									"p-4 hover:bg-foreground/3 transition-all border",
									isWaitingForAdmin
										? "border-red-300/30 bg-red-500/5"
										: "border-foreground/10",
									unreadCount > 0 && "ring-2 ring-green-500/30"
								)}
							>
								<div className="flex items-start justify-between gap-4">
									{/* Основная информация */}
									<div className="flex-1 min-w-0 space-y-2">
										{/* Тема */}
										<div className="flex items-center gap-2">
											<h3 className="font-semibold text-foreground truncate group-hover:underline">
												{thread.subject}
											</h3>
											{unreadCount > 0 && (
												<EnvelopeOpenIcon
													size={16}
													weight="duotone"
													className="text-green-600 shrink-0"
												/>
											)}
										</div>

										{/* Последнее сообщение */}
										{lastMsg && (
											<p className="text-sm text-muted-foreground truncate">
												{lastMsg.isAdmin ? "Вы:" : "Клиент:"}{" "}
												{lastMsg.content.substring(0, 80)}
												{lastMsg.content.length > 80 ? "..." : ""}
											</p>
										)}

										{/* Мета */}
										<div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
											<span>{thread.messages.length} сообщений</span>
											<span>•</span>
											<ClientTime iso={thread.lastMessageAt} fmt="date" />
											<span>•</span>
											<span>
												{thread.platform === "WEBSITE" && "📱 Сайт"}
												{thread.platform === "TELEGRAM" && "✈️ Telegram"}
												{thread.platform === "EMAIL" && "📧 Email"}
											</span>
										</div>
									</div>

									{/* Статус */}
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
									</div>
								</div>
							</Card>
						</Link>
					);
				})}

				{/* Пустое состояние */}
				{threads.length === 0 && (
					<div className="text-center py-12 text-muted-foreground">
						<p>У этого клиента нет обращений</p>
					</div>
				)}
			</div>
		</div>
	);
}
