"use client";

import {
	ArrowClockwiseIcon,
	CheckIcon,
	LockIcon,
	PaperPlaneTiltIcon,
	PencilSimpleIcon,
	TrashIcon,
	WarningIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	closeSupportThreadAction,
	type DbSupportThread,
	deleteThreadByAdminAction,
	editSupportMessageAction,
	markSupportMessageAsReadAction,
	pollSupportThreadAction,
	reopenSupportThreadAction,
	sendSupportMessageAction,
} from "@/actions/support-actions";
import { BackButton, ClientTime } from "@/components/shared";
import { Badge, Button, Textarea } from "@/components/ui";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CHATS_STATUS_LABELS } from "@/constants";
import { cn } from "@/lib/utils";

export default function AdminThreadDetailClient({
	initialThread,
}: {
	initialThread: DbSupportThread;
}) {
	const router = useRouter();

	const [thread, setThread] = useState(initialThread);
	const [message, setMessage] = useState("");
	const [isPending, startTransition] = useTransition();

	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Редактирование
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editContent, setEditContent] = useState("");
	const [isEditPending, startEditTransition] = useTransition();

	const isClosed = thread.status === "CLOSED";

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		const unreadMessages = thread.messages.filter(
			(m) => !m.isAdmin && m.readBy.length === 0
		);
		if (unreadMessages.length > 0) {
			unreadMessages.forEach((msg) => {
				markSupportMessageAsReadAction(msg.id).catch(() => {});
			});
		}
		scrollToBottom();
	}, [thread.messages]);

	// Polling
	useEffect(() => {
		const interval = setInterval(async () => {
			const result = await pollSupportThreadAction(
				thread.id,
				thread.lastMessageAt
			);
			if (result.hasUpdates && result.thread) {
				setThread(result.thread);
			}
		}, 8_000);
		return () => clearInterval(interval);
	}, [thread.id, thread.lastMessageAt]);

	const scrollToBottom = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTo({
				top: scrollContainerRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
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
				const resultMessage = result.message;
				setThread((prev) => ({
					...prev,
					messages: [
						...prev.messages,
						{
							...resultMessage,
							isEdited: false,
							editedAt: null,
							deletedByClientAt: null,
							deletedByAdminAt: null,
						},
					],
					status: "WAITING_FOR_CLIENT",
					lastMessageAt: new Date(),
				}));
				setMessage("");
				toast.success("Ответ отправлен");
			}
		});
	};

	const handleStartEdit = (msgId: string, currentContent: string) => {
		setEditingId(msgId);
		setEditContent(currentContent);
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditContent("");
	};

	const handleSaveEdit = (msgId: string) => {
		if (!editContent.trim()) return;

		startEditTransition(async () => {
			const result = await editSupportMessageAction({
				messageId: msgId,
				content: editContent.trim(),
			});

			if (!result.success) {
				toast.error(result.error || "Ошибка editing");
				return;
			}

			setThread((prev) => ({
				...prev,
				messages: prev.messages.map((m) =>
					m.id === msgId
						? {
								...m,
								content: editContent.trim(),
								isEdited: true,
								editedAt: new Date(),
							}
						: m
				),
			}));
			setEditingId(null);
			setEditContent("");
			toast.success("Сообщение обновлено");
		});
	};

	const handleCloseThread = () => {
		startTransition(async () => {
			const result = await closeSupportThreadAction(thread.id);
			if (!result.success) {
				toast.error(result.error || "Ошибка закрытия");
				return;
			}
			setThread((prev) => ({ ...prev, status: "CLOSED" }));
			toast.success("Обращение закрыто");
		});
	};

	const handleReopenThread = () => {
		startTransition(async () => {
			const result = await reopenSupportThreadAction(thread.id);
			if (!result.success) {
				toast.error(result.error || "Ошибка");
				return;
			}
			setThread((prev) => ({ ...prev, status: "OPEN" }));
			toast.success("Обращение переоткрыто");
		});
	};

	const handleAdminDelete = async () => {
		const result = await deleteThreadByAdminAction(thread.id);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success("Чат удалён");
		router.push("/admin/support");
	};

	const unreadCount = thread.messages.filter(
		(m) => !m.isAdmin && m.readBy.length === 0
	).length;

	return (
		<div className="container mx-auto max-w-4xl px-4 pt-10 pb-28 space-y-6 flex flex-col">
			{/* Заголовок */}
			<div className="space-y-4 shrink-0">
				<div className="space-y-3 w-full">
					<div className="flex flex-col md:flex-row items-start justify-between gap-4">
						<div className="space-y-2 flex-1">
							<h1 className="text-2xl font-bold gap-4">
								<BackButton fallback="/admin/support" />
								{thread.subject}
							</h1>
							<div className="flex flex-1 justify-between flex-col md:flex-row space-y-2">
								<div className="space-y-1 text-sm text-muted-foreground">
									<p>
										<strong>Клиент:</strong> {thread.user.name || "Без имени"} (
										{thread.user.email})
									</p>
									{thread.contactInfo && (
										<p>
											<strong>Контакт:</strong> {thread.contactInfo}
										</p>
									)}
									<p>
										<strong>Создано:</strong>{" "}
										<ClientTime iso={thread.createdAt} fmt="date" /> в{" "}
										<ClientTime iso={thread.createdAt} fmt="time" />
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

								<div className="flex md:flex-col items-center shrink-0 justify-between gap-4">
									<Badge
										className={cn(
											"px-3 py-1 rounded-xl font-medium text-sm select-none",
											thread.status === "OPEN" &&
												"bg-blue-500/10 text-blue-600",
											thread.status === "CLOSED" &&
												"bg-gray-500/10 text-gray-600",
											thread.status === "WAITING_FOR_ADMIN" &&
												"bg-red-500/10 text-red-600",
											thread.status === "WAITING_FOR_CLIENT" &&
												"bg-green-500/10 text-green-600"
										)}
									>
										{CHATS_STATUS_LABELS[thread.status] || thread.status}
									</Badge>

									<div className="flex gap-2">
										{!isClosed ? (
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														disabled={isPending}
														variant="outline"
														size="sm"
														className="text-red-600 hover:text-red-600 hover:bg-red-500/10 border-red-300/30 shrink-0"
													>
														<CheckIcon size={14} weight="bold" />
														Завершить
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent className="glass-card">
													<AlertDialogHeader>
														<AlertDialogTitle>
															Закрыть это обращение?
														</AlertDialogTitle>
														<AlertDialogDescription>
															Диалог будет переведен в архив. Клиент больше не
															сможет отправлять новые сообщения, пока вы не
															возобновите тикет.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel asChild>
															<Button variant="outline">Отмена</Button>
														</AlertDialogCancel>
														<AlertDialogAction
															asChild
															onClick={handleCloseThread}
														>
															<Button variant="destructive">Закрыть</Button>
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										) : (
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														disabled={isPending}
														variant="outline"
														size="sm"
														className="text-green-600 hover:text-green-600 hover:bg-green-500/10 border-green-300/30"
													>
														<ArrowClockwiseIcon size={14} weight="bold" />
														Возобновить
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent className="glass-card">
													<AlertDialogHeader>
														<AlertDialogTitle>
															Переоткрыть это обращение?
														</AlertDialogTitle>
														<AlertDialogDescription>
															Чат снова станет активным, и клиент сможет
															продолжить общение с поддержкой.
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel asChild>
															<Button variant="outline">Отмена</Button>
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={handleReopenThread}
															asChild
														>
															<Button>Возобновить</Button>
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										)}
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant="outline"
													size="icon-sm"
													className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2"
													title="Удалить чат"
												>
													<TrashIcon size={16} weight="duotone" />
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent className="glass-card">
												<AlertDialogHeader>
													<AlertDialogTitle>
														Удалить это обращение?
													</AlertDialogTitle>
													<AlertDialogDescription>
														Чат будет удален на странице администратора.
														<br />
														Клиент увидит, что чат был закрыт администратором.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel asChild>
														<Button variant="outline">Отмена</Button>
													</AlertDialogCancel>
													<AlertDialogAction
														asChild
														onClick={handleAdminDelete}
													>
														<Button variant="destructive">Удалить</Button>
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</div>
							</div>
						</div>
					</div>

					{thread.status === "WAITING_FOR_ADMIN" && (
						<div className="bg-red-500/10 border border-red-300/30 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700/80">
							<WarningIcon size={16} weight="bold" className="shrink-0" />
							<span>
								<strong>Клиент ждёт ответ поддержки.</strong>
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Контейнер чата (Лента + Поле ввода) */}
			<div className="border border-muted-foreground/10 card-surface h-[calc(100vh-380px)] min-h-125 flex flex-col overflow-hidden rounded-2xl">
				{/* ЛЕНТА СООБЩЕНИЙ */}
				<div
					ref={scrollContainerRef}
					className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
				>
					{thread.messages.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<p>Сообщений нет</p>
						</div>
					) : (
						thread.messages.map((msg) => {
							const isEditing = editingId === msg.id;

							return (
								<div
									key={msg.id}
									className={cn(
										"flex gap-3 group",
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
										{isEditing ? (
											<div className="space-y-2 min-w-48">
												<Textarea
													value={editContent}
													onChange={(e) => setEditContent(e.target.value)}
													disabled={isEditPending}
													rows={3}
													className="resize-none text-sm glass-input"
													autoFocus
													onKeyDown={(e) => {
														if (e.key === "Enter" && e.ctrlKey)
															handleSaveEdit(msg.id);
														if (e.key === "Escape") handleCancelEdit();
													}}
												/>
												<div className="flex items-center gap-2 justify-end">
													<Button
														onClick={handleCancelEdit}
														disabled={isEditPending}
														variant="ghost"
														size="sm"
														className="h-6 px-2 text-xs"
													>
														<XIcon size={12} weight="bold" />
														Отмена
													</Button>
													<Button
														onClick={() => handleSaveEdit(msg.id)}
														disabled={!editContent.trim() || isEditPending}
														size="sm"
														className="h-6 px-2 text-xs"
													>
														<CheckIcon size={12} weight="bold" />
														{isEditPending ? "..." : "Сохранить"}
													</Button>
												</div>
											</div>
										) : (
											<p className="text-sm whitespace-pre-wrap">
												{msg.content}
											</p>
										)}

										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<ClientTime iso={msg.createdAt} fmt="time" />
											{msg.isEdited && (
												<span className="text-muted-foreground/60 italic">
													изменено
												</span>
											)}
											{!msg.isAdmin && (
												<>
													<span>•</span>
													{msg.readBy.length > 0 ? (
														<span className="text-green-600">
															Прочитано {msg.readBy.length}
														</span>
													) : (
														<span>Не прочитано</span>
													)}
												</>
											)}
											{msg.isAdmin && !isEditing && !isClosed && (
												<button
													type="button"
													onClick={() => handleStartEdit(msg.id, msg.content)}
													className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-foreground"
													title="Редактировать"
												>
													<PencilSimpleIcon size={12} weight="bold" />
												</button>
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
				</div>

				{/* ФИКСИРОВАННАЯ НИЖНЯЯ ПАНЕЛЬ ЧАТА */}
				<div className="p-4 border-t border-muted-foreground/10 bg-background/50 shrink-0">
					{isClosed && (
						<div className="bg-gray-500/10 border border-gray-300/30 rounded-lg p-3 flex items-center gap-2 text-sm text-gray-700/80 mb-3">
							<LockIcon size={16} weight="bold" />
							<span>
								Обращение закрыто. Переоткройте, если нужно продолжить общение.
							</span>
						</div>
					)}

					{!isClosed && (
						<div className="space-y-3">
							<div className="flex gap-3">
								<Textarea
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									placeholder="Напишите ответ клиенту..."
									rows={3}
									disabled={isPending}
									className="resize-none text-sm glass-input"
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
					)}
				</div>
			</div>
		</div>
	);
}
