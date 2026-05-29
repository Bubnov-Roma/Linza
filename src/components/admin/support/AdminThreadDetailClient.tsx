"use client";

import {
	CaretLeftIcon,
	DoorOpenIcon,
	LockIcon,
	PaperPlaneTiltIcon,
	WarningIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	closeSupportThreadAction,
	type DbSupportThread,
	markSupportMessageAsReadAction,
	reopenSupportThreadAction,
	sendSupportMessageAction,
} from "@/actions/support-actions";
import { Button, Card, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
	OPEN: "Открыто",
	CLOSED: "Закрыто",
	WAITING_FOR_ADMIN: "Ждёт вашего ответа",
	WAITING_FOR_CLIENT: "Ждёт ответа клиента",
};

export default function AdminThreadDetailClient({
	initialThread,
}: {
	initialThread: DbSupportThread;
}) {
	const [thread, setThread] = useState(initialThread);
	const [message, setMessage] = useState("");
	const [isPending, startTransition] = useTransition();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const isClosed = thread.status === "CLOSED";

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		const unreadMessages = thread.messages.filter(
			(m) => !m.isAdmin && m.readBy.length === 0
		);

		if (unreadMessages.length > 0) {
			unreadMessages.forEach((msg) => {
				markSupportMessageAsReadAction(msg.id).catch(() => {
					// Игнорируем ошибки отметки как прочитанного
				});
			});
		}

		scrollToBottom();
	}, [thread.messages]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

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

			if (result.message) {
				const resultMsg = result.message;
				setThread((prev) => ({
					...prev,
					messages: [...prev.messages, resultMsg],
					status: "WAITING_FOR_CLIENT",
					lastMessageAt: new Date(),
				}));
				setMessage("");
				toast.success("Ответ отправлен");
			}
		});
	};

	const handleCloseThread = () => {
		if (!confirm("Закрыть это обращение?")) return;

		startTransition(async () => {
			const result = await closeSupportThreadAction(thread.id);

			if (!result.success) {
				toast.error(result.error || "Ошибка закрытия");
				return;
			}

			setThread((prev) => ({
				...prev,
				status: "CLOSED",
			}));
			toast.success("Обращение закрыто");
		});
	};

	const handleReopenThread = () => {
		if (!confirm("Переоткрыть это обращение?")) return;

		startTransition(async () => {
			const result = await reopenSupportThreadAction(thread.id);

			if (!result.success) {
				toast.error(result.error || "Ошибка");
				return;
			}

			setThread((prev) => ({
				...prev,
				status: "OPEN",
			}));
			toast.success("Обращение переоткрыто");
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

	const unreadCount = thread.messages.filter(
		(m) => !m.isAdmin && m.readBy.length === 0
	).length;

	return (
		<div className="container mx-auto max-w-4xl px-4 py-10 space-y-6 h-screen flex flex-col">
			{/* Заголовок и информация о клиенте */}
			<div className="space-y-4">
				{/* Кнопка назад */}
				<Link
					href="/admin/support"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<CaretLeftIcon size={16} weight="bold" />
					Вернуться к списку
				</Link>

				{/* Информация о потоке */}
				<div className="space-y-3">
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-2 flex-1">
							<h1 className="text-2xl font-bold">{thread.subject}</h1>
							<div className="space-y-1 text-sm text-muted-foreground">
								<p>
									<strong>Клиент:</strong> {thread.user.name || "Без имени"} (
									{thread.user.email})
								</p>
								<p>
									<strong>Платформа:</strong>{" "}
									{thread.platform === "WEBSITE" && "📱 Веб-сайт"}
									{thread.platform === "TELEGRAM" && "✈️ Telegram"}
									{thread.platform === "EMAIL" && "📧 Email"}
								</p>
								<p>
									<strong>Создано:</strong> {formatDate(thread.createdAt)} в{" "}
									{formatTime(thread.createdAt)}
								</p>
								<p>
									<strong>Сообщений:</strong> {thread.messages.length}
									{unreadCount > 0 && (
										<span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-600 rounded text-xs">
											{unreadCount} новых
										</span>
									)}
								</p>
							</div>
						</div>

						{/* Статус и статус кнопки */}
						<div className="flex flex-col items-end gap-2 shrink-0">
							<div
								className={cn(
									"px-4 py-2 rounded-lg font-medium text-sm",
									thread.status === "OPEN" && "bg-blue-500/20 text-blue-600",
									thread.status === "CLOSED" && "bg-gray-500/20 text-gray-600",
									thread.status === "WAITING_FOR_ADMIN" &&
										"bg-red-500/20 text-red-600",
									thread.status === "WAITING_FOR_CLIENT" &&
										"bg-green-500/20 text-green-600"
								)}
							>
								{STATUS_LABELS[thread.status] || thread.status}
							</div>

							{/* Кнопка закрыть/переоткрыть */}
							{!isClosed ? (
								<Button
									onClick={handleCloseThread}
									disabled={isPending}
									variant="outline"
									size="sm"
									className="text-red-600 hover:text-red-600 hover:bg-red-500/10 border-red-300/30"
								>
									<LockIcon size={14} weight="bold" />
									Закрыть
								</Button>
							) : (
								<Button
									onClick={handleReopenThread}
									disabled={isPending}
									variant="outline"
									size="sm"
									className="text-green-600 hover:text-green-600 hover:bg-green-500/10 border-green-300/30"
								>
									<DoorOpenIcon size={14} weight="bold" />
									Переоткрыть
								</Button>
							)}
						</div>
					</div>

					{/* Предупреждение если ждёт ответа */}
					{thread.status === "WAITING_FOR_ADMIN" && (
						<div className="bg-red-500/10 border border-red-300/30 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700/80">
							<WarningIcon size={16} weight="bold" className="shrink-0" />
							<span>
								<strong>Требует вашего ответа!</strong> Клиент ждёт ответ
								поддержки.
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Сообщения */}
			<div className="flex-1 overflow-y-auto space-y-3 border rounded-lg p-4 bg-background/50 min-h-64">
				{thread.messages.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<p>Сообщений нет</p>
					</div>
				) : (
					thread.messages.map((msg) => {
						return (
							<div
								key={msg.id}
								className={cn(
									"flex gap-3",
									msg.isAdmin ? "justify-end" : "justify-start"
								)}
							>
								{!msg.isAdmin && (
									<div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
										К
									</div>
								)}

								<div
									className={cn(
										"max-w-lg rounded-lg px-4 py-3 wrap-break-word space-y-1",
										msg.isAdmin
											? "bg-foreground/10 text-foreground"
											: "bg-blue-500/10 text-foreground"
									)}
								>
									<p className="text-sm whitespace-pre-wrap">{msg.content}</p>
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<span>{formatTime(msg.createdAt)}</span>
										{!msg.isAdmin && (
											<>
												<span>•</span>
												{msg.readBy.length > 0 ? (
													<span className="text-green-600">
														Прочитано {msg.readBy.length}
													</span>
												) : (
													<span className="text-muted-foreground">
														Не прочитано
													</span>
												)}
											</>
										)}
									</div>
								</div>

								{msg.isAdmin && (
									<div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold text-foreground shrink-0">
										А
									</div>
								)}
							</div>
						);
					})
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Статус закрытого потока */}
			{isClosed && (
				<div className="bg-gray-500/10 border border-gray-300/30 rounded-lg p-3 flex items-center gap-2 text-sm text-gray-700/80">
					<LockIcon size={16} weight="bold" />
					<span>
						Обращение закрыто. Переоткройте, если нужно продолжить общение.
					</span>
				</div>
			)}

			{/* Форма ответа */}
			{!isClosed ? (
				<div className="space-y-3">
					<div className="flex gap-3">
						<Textarea
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Напишите ответ клиенту..."
							rows={3}
							disabled={isPending}
							className="resize-none text-sm"
							onKeyDown={(e) => {
								if (e.key === "Enter" && e.ctrlKey && message.trim()) {
									handleSendMessage();
								}
							}}
						/>
						<Button
							onClick={handleSendMessage}
							disabled={!message.trim() || isPending}
							size="icon"
							title="Отправить (Ctrl+Enter)"
						>
							<PaperPlaneTiltIcon size={18} weight="bold" />
						</Button>
					</div>
					<p className="text-xs text-muted-foreground text-right">
						Ctrl + Enter для отправки
					</p>
				</div>
			) : (
				<Card className="p-4 bg-gray-500/5 border-gray-300/30">
					<p className="text-sm text-gray-700/80">
						Обращение закрыто. Переоткройте его, если нужно отправить ответ.
					</p>
				</Card>
			)}
		</div>
	);
}
