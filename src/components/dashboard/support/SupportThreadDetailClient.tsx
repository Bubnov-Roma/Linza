"use client";

import {
	CaretLeftIcon,
	CheckIcon,
	LockIcon,
	PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	type DbSupportThread,
	pollSupportThreadAction,
	sendSupportMessageAction,
} from "@/actions/support-actions";
import { InlineEditField, SupportModalTrigger } from "@/components/shared";
import { Badge, Card } from "@/components/ui";
import { CHATS_STATUS_COLORS, CHATS_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";

interface SupportThreadDetailClientProps {
	initialThread: DbSupportThread;
}

export default function SupportThreadDetailClient({
	initialThread,
}: SupportThreadDetailClientProps) {
	const [thread, setThread] = useState(initialThread);
	const [message, setMessage] = useState("");

	// ИЗМЕНЕНО: Ссылка теперь указывает на сам контейнер со скроллом, а не на пустой div
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const isClosed = thread.status === "CLOSED";

	// ИЗМЕНЕНО: Точечный скролл контейнера без влияния на внешнее окно (window)
	const scrollToBottom = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				top: scrollContainerRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		scrollToBottom();
	}, [thread.messages]);

	useEffect(() => {
		const interval = setInterval(async () => {
			const result = await pollSupportThreadAction(
				thread.id,
				thread.lastMessageAt
			);
			if (result.hasUpdates && result.thread) {
				setThread(result.thread);
			}
		}, 10_000);

		return () => clearInterval(interval);
	}, [thread.id, thread.lastMessageAt]);

	const handleSendMessage = async (text: string) => {
		if (!text.trim()) return;

		const result = await sendSupportMessageAction({
			threadId: thread.id,
			content: text.trim(),
		});

		if (!result.success) {
			toast.error(result.error || "Ошибка отправки");
			return;
		}

		if (result.message) {
			const newMessage = result.message;
			setThread((prev) => ({
				...prev,
				messages: [...prev.messages, newMessage],
				status: "WAITING_FOR_ADMIN",
				lastMessageAt: new Date(),
			}));
			setMessage("");
			toast.success("Сообщение отправлено");
		}
	};

	const formatTime = (date: Date) => {
		return new Date(date).toLocaleTimeString("ru-RU", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("ru-RU", {
			weekday: "short",
			day: "numeric",
			month: "short",
		});
	};

	return (
		<div className="container mx-auto max-w-3xl px-4 pt-10 pb-28 space-y-6 flex flex-col">
			{/* Заголовок и информация */}
			<div className="space-y-4 shrink-0">
				<Link
					href="/dashboard/support"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<CaretLeftIcon size={16} weight="bold" />
					Вернуться к списку
				</Link>

				<div className="flex items-start justify-between gap-4 w-full flex-wrap">
					<div className="space-y-2 flex-1">
						<div className="flex flex-col md:flex-row items-start gap-4 w-full flex-wrap justify-between flex-1">
							<h1 className="text-2xl font-bold">{thread.subject}</h1>
							<Badge
								className={cn(
									"px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap shrink-0",
									CHATS_STATUS_COLORS[thread.status] ||
										"bg-foreground/10 text-foreground/60"
								)}
							>
								{CHATS_STATUS_LABELS[thread.status] || thread.status}
							</Badge>
						</div>

						<div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
							<span>
								{thread.messages.length}{" "}
								{thread.messages.length === 1 ? "сообщение" : "сообщений"}
							</span>
							<span>•</span>
							<span>
								{formatDate(thread.createdAt)} в {formatTime(thread.createdAt)}
							</span>
							<span>•</span>
							<span>
								{thread.platform === "WEBSITE" && "Сайт"}
								{thread.platform === "TELEGRAM" && "Telegram"}
								{thread.platform === "EMAIL" && "Email"}
							</span>
						</div>
					</div>
				</div>
			</div>
			<div className="border border-muted-foreground/10 card-surface h-[calc(100vh-400px)] min-h-125 flex flex-col overflow-hidden rounded-2xl">
				{/* 1. ЛЕНТА СООБЩЕНИЙ */}
				<div
					ref={scrollContainerRef}
					className="flex-1 overflow-y-auto p-4 flex flex-col gap-2"
				>
					{thread.messages.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<p>Сообщений еще нет</p>
						</div>
					) : (
						thread.messages.map((msg) => (
							<div
								key={msg.id}
								className={cn(
									"flex gap-3",
									msg.isAdmin ? "justify-start" : "justify-end"
								)}
							>
								{msg.isAdmin && (
									<div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
										A
									</div>
								)}

								<div
									className={cn(
										"max-w-lg rounded-lg px-4 py-3 wrap-break-word space-y-1",
										msg.isAdmin
											? "bg-blue-500/10 text-foreground"
											: "bg-foreground/10 text-foreground"
									)}
								>
									<p className="text-sm whitespace-pre-wrap">{msg.content}</p>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<span>{formatTime(msg.createdAt)}</span>
										{!msg.isAdmin && (
											<CheckIcon
												size={12}
												weight="bold"
												className="text-green-600"
											/>
										)}
									</div>
								</div>

								{!msg.isAdmin && (
									<div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold text-foreground shrink-0">
										Я
									</div>
								)}
							</div>
						))
					)}
				</div>

				{/* 2. ФИКСИРОВАННАЯ НИЖНЯЯ ПАНЕЛЬ С ПОЛЕМ ВВОДА */}
				<div className="p-4 border-t border-muted-foreground/10 bg-background/50 shrink-0">
					{isClosed && (
						<div className="bg-gray-500/10 border border-gray-300/30 rounded-lg p-3 flex items-center gap-2 text-sm text-gray-700/80 mb-3">
							<LockIcon size={16} weight="bold" />
							<span>Это обращение закрыто. Вы можете отправить новое.</span>
						</div>
					)}

					{!isClosed ? (
						<div className="space-y-1.5">
							<InlineEditField
								value={message}
								onChange={setMessage}
								onAdd={handleSendMessage}
								mode="create"
								autoFocus
								actionIcon={<PaperPlaneTiltIcon size={14} weight="duotone" />}
								placeholder="Напишите ваше сообщение..."
								className="flex-1 h-26"
							/>
							<p className="text-[11px] text-muted-foreground/60 text-right pr-2">
								Нажмите Enter для отправки
							</p>
						</div>
					) : (
						<div className="space-y-3">
							<Card className="p-4 bg-gray-500/5 border-gray-300/30">
								<p className="text-sm text-gray-700/80 mb-3">
									Обращение закрыто. Создайте новое, если вам нужна дальнейшая
									помощь.
								</p>
								<SupportModalTrigger
									variant="button"
									label="Создать новое обращение"
								/>
							</Card>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
