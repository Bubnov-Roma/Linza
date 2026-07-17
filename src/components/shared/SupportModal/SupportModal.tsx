"use client";

import { Turnstile } from "@marsidev/react-turnstile"; // Добавляем импорт капчи
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendSupportEmailAction } from "@/actions/auth-actions";
import {
	createSupportThreadAction,
	type DbSupportThread,
	sendSupportMessageAction,
} from "@/actions/support-actions";
import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Textarea,
} from "@/components/ui";

export interface SupportModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingThread?: DbSupportThread | null;
}

export function SupportModal({
	open,
	onOpenChange,
	existingThread,
}: SupportModalProps) {
	const { data: session } = useSession();
	const user = session?.user;
	const isAuthed = !!user?.id;

	const [isPending, startTransition] = useTransition();

	// Новый поток
	const [contactInfo, setContactInfo] = useState("");
	const [newSubject, setNewSubject] = useState("");
	const [newMessage, setNewMessage] = useState("");
	const [turnstileToken, setTurnstileToken] = useState(""); // Стейт для капчи гостя

	// Ответ в существующий поток
	const [replyMessage, setReplyMessage] = useState("");

	const isNewThread = !existingThread;
	const isContactRequired = !isAuthed;
	const isContactMissing = isContactRequired && !contactInfo.trim();

	const handleSubmit = () => {
		startTransition(async () => {
			if (isNewThread) {
				if (!newSubject.trim()) {
					toast.error("Укажите тему вопроса");
					return;
				}
				if (!newMessage.trim()) {
					toast.error("Напишите сообщение");
					return;
				}
				if (isContactMissing) {
					toast.error("Укажите контакт для ответа");
					return;
				}
				if (!isAuthed && !turnstileToken) {
					toast.error("Пожалуйста, дождитесь завершения проверки безопасности");
					return;
				}

				if (isAuthed) {
					// 1. Клиент АВТОРИЗОВАН — создаем привычный тред в БД через Prisma
					const result = await createSupportThreadAction({
						subject: newSubject.trim(),
						platform: "WEBSITE",
						initialMessage: newMessage.trim(),
						contactInfo: contactInfo.trim() || "",
					});

					if (!result.success) {
						toast.error(result.error || "Ошибка отправки");
						return;
					}
					toast.success("Вопрос отправлен! Ожидайте ответа поддержки");
				} else {
					// 2. Клиент НЕ авторизован — отправляем email напрямую, минуя БД
					const result = await sendSupportEmailAction({
						name: "Гость (Модальное окно)",
						email: contactInfo.trim(),
						message: `Тема: ${newSubject.trim()}\n\n${newMessage.trim()}`,
						turnstileToken,
					});

					if (!result.success) {
						toast.error(result.error || "Ошибка отправки");
						return;
					}
					toast.success(
						"Сообщение успешно отправлено! Мы ответим вам на указанный Email."
					);
				}

				resetForm();
				onOpenChange(false);
			} else {
				// Логика отправки ответа в существующий тред (доступно только авторизованным)
				if (!replyMessage.trim()) {
					toast.error("Напишите сообщение");
					return;
				}

				const result = await sendSupportMessageAction({
					threadId: existingThread.id,
					content: replyMessage.trim(),
				});

				if (!result.success) {
					toast.error(result.error || "Ошибка отправки");
					return;
				}

				toast.success("Сообщение отправлено");
				setReplyMessage("");
				onOpenChange(false);
			}
		});
	};

	const resetForm = () => {
		setNewSubject("");
		setNewMessage("");
		setContactInfo("");
		setReplyMessage("");
		setTurnstileToken(""); // Сбрасываем токен капчи
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) resetForm();
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md bg-card/80" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle className="flex align-start pb-4">
						{isNewThread
							? "Новое сообщение в поддержку"
							: `Ответ в теме: ${existingThread.subject}`}
					</DialogTitle>
					<DialogDescription className="hidden">
						{isNewThread
							? "Отправьте ваше сообщение."
							: "Продолжите диалог с поддержкой"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{isNewThread && (
						<>
							{/* Тема */}
							<Input
								placeholder="Тема сообщения*"
								value={newSubject}
								onChange={(e) => setNewSubject(e.target.value)}
								disabled={isPending}
								className="h-9 text-sm rounded-xl glass-input"
							/>

							{/* Сообщение */}
							<Textarea
								placeholder="Текст сообщения*"
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								disabled={isPending}
								rows={5}
								className="resize-none text-sm rounded-xl glass-input"
							/>

							{/** Контакт */}
							<div className="flex-1">
								<Input
									type="text"
									placeholder="Контакт для обратной связи"
									value={contactInfo}
									onChange={(e) => setContactInfo(e.target.value)}
									disabled={isPending}
									className="h-9 rounded-xl text-sm glass-input"
								/>
								<p className="flex justify-end text-[10px] text-muted-foreground pt-2">
									{isContactRequired
										? "Обязательно — чтобы мы могли вам ответить"
										: "Опционально"}
								</p>
							</div>

							{/* Отрендерим компактный Turnstile только для неавторизованных пользователей */}
							{!isAuthed && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
								<div className="flex justify-center min-h-17.5 pt-1">
									<Turnstile
										siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
										onSuccess={(token) => setTurnstileToken(token)}
										options={{
											theme: "auto",
										}}
									/>
								</div>
							)}
						</>
					)}

					{!isNewThread && (
						<>
							<div className="px-3 py-2 rounded-lg bg-foreground/5 text-sm text-muted-foreground border border-input">
								{existingThread.subject}
							</div>
							<Textarea
								placeholder="Ваш ответ"
								value={replyMessage}
								onChange={(e) => setReplyMessage(e.target.value)}
								disabled={isPending}
								rows={3}
								className="resize-none text-sm glass-input"
							/>
						</>
					)}

					<DialogFooter>
						<DialogClose
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
							asChild
						>
							<Button size="md" variant="outline" className="flex-1 py-2">
								Отменить
							</Button>
						</DialogClose>
						<Button
							size="md"
							onClick={handleSubmit}
							disabled={
								isPending ||
								(isNewThread &&
									(!newSubject.trim() ||
										!newMessage.trim() ||
										isContactMissing ||
										(!isAuthed && !turnstileToken))) ||
								(!isNewThread && !replyMessage.trim())
							}
							className="flex-1 py-2"
						>
							{isPending ? "Отправляем..." : "Отправить"}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
