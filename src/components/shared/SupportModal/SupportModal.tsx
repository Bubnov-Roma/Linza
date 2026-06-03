"use client";

import { useSession } from "next-auth/react";
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
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Textarea,
} from "@/components/ui";

// ─── component ───────────────────────────────────────────────────────────────

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
				resetForm();
				onOpenChange(false);
			} else {
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
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) resetForm();
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex align-start pb-4">
						{isNewThread
							? "Новый вопрос в поддержку"
							: `Ответ в теме: ${existingThread.subject}`}
					</DialogTitle>
					<DialogDescription className="hidden">
						{isNewThread
							? "Отправьте ваш вопрос."
							: "Продолжите диалог с поддержкой"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{isNewThread && (
						<>
							{/* Тема */}
							<Input
								placeholder="Тема вопроса*"
								value={newSubject}
								onChange={(e) => setNewSubject(e.target.value)}
								disabled={isPending}
								className="h-9 text-sm rounded-xl"
							/>

							{/* Сообщение */}
							<Textarea
								placeholder="Ваше сообщение*"
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								disabled={isPending}
								rows={5}
								className="resize-none text-sm rounded-xl"
							/>

							{/** Контакт */}
							<div className="flex-1">
								<Input
									type="text"
									placeholder="Контакт для обратной связи"
									value={contactInfo}
									onChange={(e) => setContactInfo(e.target.value)}
									disabled={isPending}
									className="h-9 rounded-xl text-sm"
								/>
								<p className="flex justify-end text-[10px] text-muted-foreground pt-2">
									{isContactRequired
										? "Обязательно — чтобы мы могли вам ответить"
										: "Опционально"}
								</p>
							</div>
						</>
					)}

					{!isNewThread && (
						<>
							<div className="space-y-2">
								<Label className="text-xs font-semibold">Тема</Label>
								<div className="px-3 py-2 rounded-lg bg-foreground/5 text-sm text-muted-foreground border border-input">
									{existingThread.subject}
								</div>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-semibold">Ваш ответ</Label>
								<Textarea
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

					<DialogFooter>
						<DialogClose
							onClick={() => handleOpenChange(false)}
							disabled={isPending}
							asChild
						>
							<Button size="md" variant="outline">
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
										isContactMissing)) ||
								(!isNewThread && !replyMessage.trim())
							}
						>
							{isPending ? "Отправляем..." : "Отправить"}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
