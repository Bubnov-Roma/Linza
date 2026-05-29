"use client";

import {
	CaretLeftIcon,
	CheckIcon,
	LockIcon,
	PaperPlaneTiltIcon,
	XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	closeSupportThreadAction,
	type DbSupportThread,
	sendSupportMessageAction,
} from "@/actions/support-actions";
import { SupportModalTrigger } from "@/components/shared";
import { Button, Card, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
	OPEN: "Открыто",
	CLOSED: "Закрыто",
	WAITING_FOR_ADMIN: "Ожидание ответа",
	WAITING_FOR_CLIENT: "Требует вашего ответа",
};

const STATUS_COLORS: Record<string, string> = {
	OPEN: "bg-blue-500/20 text-blue-600",
	CLOSED: "bg-gray-500/20 text-gray-600",
	WAITING_FOR_ADMIN: "bg-yellow-500/20 text-yellow-600",
	WAITING_FOR_CLIENT: "bg-green-500/20 text-green-600",
};

export default function SupportThreadDetailClient({
	initialThread,
}: {
	initialThread: DbSupportThread;
}) {
	const [thread, setThread] = useState(initialThread);
	const [message, setMessage] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isClosing, setIsClosing] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const isClosed = thread.status === "CLOSED";

	// Авто-скролл к новым сообщениям
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		scrollToBottom();
	}, [thread.messages]);

	const handleSendMessage = () => {
		if (!message.trim()) return;

		startTransition(async () => {
			const result = await sendSupportMessageAction({
				threadId: thread.id,
				content: message.trim(),
			});

			if (!result.success) {
				toast.error(result.error || "Ошибка отправки");
				return;
			}

			// Обновляем локальное состояние
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
		});
	};

	const handleCloseThread = () => {
		if (!confirm("Закрыть обращение? Вы сможете его переоткрыть позже."))
			return;

		setIsClosing(true);
		startTransition(async () => {
			const result = await closeSupportThreadAction(thread.id);

			if (!result.success) {
				toast.error(result.error || "Ошибка закрытия");
				setIsClosing(false);
				return;
			}

			setThread((prev) => ({
				...prev,
				status: "CLOSED",
			}));
			toast.success("Обращение закрыто");
			setIsClosing(false);
		});
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
		<div className="container mx-auto max-w-3xl px-4 py-10 space-y-6 h-screen flex flex-col">
			{/* Заголовок и информация */}
			<div className="space-y-4">
				{/* Кнопка назад */}
				<Link
					href="/support"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<CaretLeftIcon size={16} weight="bold" />
					Вернуться к списку
				</Link>

				{/* Тема и статус */}
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-2 flex-1">
						<h1 className="text-2xl font-bold">{thread.subject}</h1>
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
								{thread.platform === "WEBSITE" && "📱 Веб-сайт"}
								{thread.platform === "TELEGRAM" && "✈️ Telegram"}
								{thread.platform === "EMAIL" && "📧 Email"}
							</span>
						</div>
					</div>

					{/* Статус */}
					<div
						className={cn(
							"px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap shrink-0",
							STATUS_COLORS[thread.status] ||
								"bg-foreground/10 text-foreground/60"
						)}
					>
						{STATUS_LABELS[thread.status] || thread.status}
					</div>
				</div>
			</div>

			{/* Сообщения */}
			<div className="flex-1 overflow-y-auto space-y-3 border rounded-lg p-4 bg-background/50 min-h-64">
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
				<div ref={messagesEndRef} />
			</div>

			{/* Статус закрытого обращения */}
			{isClosed && (
				<div className="bg-gray-500/10 border border-gray-300/30 rounded-lg p-3 flex items-center gap-2 text-sm text-gray-700/80">
					<LockIcon size={16} weight="bold" />
					<span>Это обращение закрыто. Вы можете отправить новое.</span>
				</div>
			)}

			{/* Форма отправки */}
			{!isClosed ? (
				<div className="space-y-3">
					<div className="flex gap-3">
						<Textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Напишите ваше сообщение..."
							rows={3}
							disabled={isPending}
							className="resize-none text-sm"
							onKeyDown={(e) => {
								if (e.key === "Enter" && e.ctrlKey && message.trim()) {
									handleSendMessage();
								}
							}}
						/>
						<div className="flex flex-col gap-2 justify-end">
							<Button
								onClick={handleSendMessage}
								disabled={!message.trim() || isPending}
								size="icon"
								title="Отправить (Ctrl+Enter)"
							>
								<PaperPlaneTiltIcon size={18} weight="bold" />
							</Button>
							<Button
								onClick={handleCloseThread}
								disabled={isClosing}
								variant="outline"
								size="icon"
								title="Закрыть обращение"
							>
								<XIcon size={18} weight="bold" />
							</Button>
						</div>
					</div>
					<p className="text-xs text-muted-foreground text-right">
						Ctrl + Enter для отправки
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
	);
}
