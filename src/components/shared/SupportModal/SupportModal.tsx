"use client";

import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import type { SupportPlatform } from "@prisma/client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createSupportThreadAction,
	type DbSupportThread,
	sendSupportMessageAction,
} from "@/actions/support-actions";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@/components/ui";

export interface SupportModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Если передан - будет ответ в существующий поток */
	existingThread?: DbSupportThread | null;
}

export function SupportModal({
	open,
	onOpenChange,
	existingThread,
}: SupportModalProps) {
	const [isPending, startTransition] = useTransition();

	// Новый поток
	const [newSubject, setNewSubject] = useState("");
	const [newMessage, setNewMessage] = useState("");
	const [platform, setPlatform] = useState<SupportPlatform>("WEBSITE");

	// Ответ в существующий поток
	const [replyMessage, setReplyMessage] = useState("");

	const isNewThread = !existingThread;

	const handleSubmit = () => {
		startTransition(async () => {
			if (isNewThread) {
				// Создание нового потока
				if (!newSubject.trim()) {
					toast.error("Укажите тему вопроса");
					return;
				}
				if (!newMessage.trim()) {
					toast.error("Напишите сообщение");
					return;
				}

				const result = await createSupportThreadAction({
					subject: newSubject.trim(),
					platform,
					initialMessage: newMessage.trim(),
				});

				if (!result.success) {
					toast.error(result.error || "Ошибка отправки");
					return;
				}

				toast.success("Вопрос отправлен! Ожидайте ответа поддержки");
				setNewSubject("");
				setNewMessage("");
				setPlatform("WEBSITE");
				onOpenChange(false);
			} else {
				// Ответ в существующий поток
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

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			// Очищаем форму при закрытии
			setNewSubject("");
			setNewMessage("");
			setReplyMessage("");
			setPlatform("WEBSITE");
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<span>
							{isNewThread
								? "Новый вопрос в поддержку"
								: `Ответ в теме: ${existingThread.subject}`}
						</span>
					</DialogTitle>
					<DialogDescription>
						{isNewThread
							? "Опишите вашу проблему или вопрос. Наша команда ответит вам в ближайшее время."
							: "Продолжите диалог с поддержкой"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{isNewThread && (
						<>
							{/* Выбор платформы */}
							<div className="space-y-2">
								<Label htmlFor="platform" className="text-xs font-semibold">
									Платформа
								</Label>
								<Select
									value={platform}
									onValueChange={(val) => setPlatform(val as SupportPlatform)}
								>
									<SelectTrigger id="platform" className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="WEBSITE">📱 Сайт</SelectItem>
										<SelectItem value="TELEGRAM">✈️ Telegram</SelectItem>
										<SelectItem value="EMAIL">📧 Email</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-[10px] text-muted-foreground">
									{platform === "WEBSITE" &&
										"Мы ответим вам на этом сайте в личном кабинете"}
									{platform === "TELEGRAM" &&
										"Мы ответим вам через Telegram (нужно указать контакт)"}
									{platform === "EMAIL" && "Мы ответим на указанный email"}
								</p>
							</div>

							{/* Тема */}
							<div className="space-y-2">
								<Label htmlFor="subject" className="text-xs font-semibold">
									Тема вопроса
								</Label>
								<Input
									id="subject"
									placeholder="Например: Проблема с доставкой"
									value={newSubject}
									onChange={(e) => setNewSubject(e.target.value)}
									disabled={isPending}
									className="h-9"
								/>
							</div>

							{/* Сообщение */}
							<div className="space-y-2">
								<Label htmlFor="message" className="text-xs font-semibold">
									Ваше сообщение
								</Label>
								<Textarea
									id="message"
									placeholder="Подробно опишите вашу проблему..."
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									disabled={isPending}
									rows={4}
									className="resize-none text-sm"
								/>
								<p className="text-[10px] text-muted-foreground">
									Чем подробнее опишете — тем быстрее поможем
								</p>
							</div>
						</>
					)}

					{!isNewThread && (
						<>
							{/* Тема потока (читабельная, не редактируется) */}
							<div className="space-y-2">
								<Label className="text-xs font-semibold">Тема</Label>
								<div className="px-3 py-2 rounded-lg bg-foreground/5 text-sm text-muted-foreground border border-input">
									{existingThread.subject}
								</div>
							</div>

							{/* Сообщение ответа */}
							<div className="space-y-2">
								<Label htmlFor="reply" className="text-xs font-semibold">
									Ваш ответ
								</Label>
								<Textarea
									id="reply"
									placeholder="Напишите сообщение..."
									value={replyMessage}
									onChange={(e) => setReplyMessage(e.target.value)}
									disabled={isPending}
									rows={3}
									className="resize-none text-sm"
								/>
							</div>
						</>
					)}

					{/* Кнопки */}
					<div className="flex gap-2 justify-end pt-2">
						<Button
							variant="outline"
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
							size="sm"
						>
							Отменить
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={
								isPending ||
								(isNewThread && (!newSubject.trim() || !newMessage.trim())) ||
								(!isNewThread && !replyMessage.trim())
							}
							size="sm"
							className="gap-2"
						>
							<PaperPlaneTiltIcon size={14} weight="bold" />
							{isPending ? "Отправляем..." : "Отправить"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
