"use client";

import { MagnifyingGlassIcon, UserIcon, XIcon } from "@phosphor-icons/react";
import type { SupportPlatform } from "@prisma/client";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createSupportThreadByAdminAction,
	searchUsersForSupportAction,
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

interface User {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
}

interface AdminNewThreadModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	preselectedUser?: { id: string; name: string | null; email: string | null };
}

export function AdminNewThreadModal({
	open,
	onOpenChange,
	preselectedUser,
}: AdminNewThreadModalProps) {
	const [isPending, startTransition] = useTransition();

	// Шаг 1 — выбор клиента
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(
		preselectedUser ? { ...preselectedUser, phone: null } : null
	);

	// Шаг 2 — составление сообщения
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");
	const [platform, setPlatform] = useState<SupportPlatform>("WEBSITE");
	const [contactInfo, setContactInfo] = useState("");

	const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Сброс при закрытии
	useEffect(() => {
		if (!open) {
			setSearchQuery("");
			setSearchResults([]);
			setSelectedUser(
				preselectedUser ? { ...preselectedUser, phone: null } : null
			);
			setSubject("");
			setMessage("");
			setPlatform("WEBSITE");
			setContactInfo("");
		}
	}, [open, preselectedUser]);

	// Автозаполнение контакта при выборе пользователя
	useEffect(() => {
		if (!selectedUser) return;
		if (platform === "EMAIL") setContactInfo(selectedUser.email ?? "");
		else if (platform === "WEBSITE") setContactInfo(selectedUser.phone ?? "");
		else setContactInfo("");
	}, [selectedUser, platform]);

	// Debounced поиск
	const handleSearchChange = (val: string) => {
		setSearchQuery(val);
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		if (!val.trim() || val.trim().length < 2) {
			setSearchResults([]);
			return;
		}
		setIsSearching(true);
		searchTimerRef.current = setTimeout(async () => {
			const result = await searchUsersForSupportAction(val);
			setSearchResults(result.users ?? []);
			setIsSearching(false);
		}, 350);
	};

	const handleSelectUser = (user: User) => {
		setSelectedUser(user);
		setSearchQuery("");
		setSearchResults([]);
	};

	const handleSubmit = () => {
		if (!selectedUser) {
			toast.error("Выберите клиента");
			return;
		}
		if (!subject.trim()) {
			toast.error("Укажите тему");
			return;
		}
		if (!message.trim()) {
			toast.error("Напишите сообщение");
			return;
		}

		startTransition(async () => {
			const result = await createSupportThreadByAdminAction({
				userId: selectedUser.id,
				subject: subject.trim(),
				initialMessage: message.trim(),
				platform,
				contactInfo: contactInfo.trim() || "",
			});

			if (!result.success) {
				toast.error(result.error || "Ошибка создания");
				return;
			}

			toast.success(
				`Обращение создано для ${selectedUser.name || selectedUser.email}`
			);
			onOpenChange(false);
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Новый чат с клиентом</DialogTitle>
					<DialogDescription>
						Выберите клиента и напишите первое сообщение
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Выбор клиента */}
					<div className="space-y-2">
						<Label className="text-xs font-semibold">Клиент</Label>

						{selectedUser ? (
							<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-foreground/5 border border-input">
								<div className="flex items-center gap-2">
									<div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
										<UserIcon size={14} className="text-blue-600" />
									</div>
									<div>
										<p className="text-sm font-medium">
											{selectedUser.name || "Без имени"}
										</p>
										<p className="text-xs text-muted-foreground">
											{selectedUser.email}
										</p>
									</div>
								</div>
								{!preselectedUser && (
									<Button
										onClick={() => setSelectedUser(null)}
										className="text-muted-foreground hover:text-foreground"
									>
										<XIcon size={14} weight="bold" />
									</Button>
								)}
							</div>
						) : (
							<div className="relative">
								<MagnifyingGlassIcon
									size={16}
									className="z-1 absolute left-3 top-2.5 text-muted-foreground"
									weight="bold"
								/>
								<Input
									placeholder="Поиск по имени или email..."
									value={searchQuery}
									onChange={(e) => handleSearchChange(e.target.value)}
									className="pl-9 h-9 glass-input"
									autoFocus
								/>

								{/* Выпадающий список */}
								{(searchResults.length > 0 || isSearching) && (
									<div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-foreground/10 bg-background shadow-lg overflow-hidden">
										{isSearching ? (
											<div className="px-3 py-2 text-sm text-muted-foreground">
												Поиск...
											</div>
										) : (
											searchResults.map((user) => (
												<button
													key={user.id}
													type="button"
													onClick={() => handleSelectUser(user)}
													className="w-full flex items-center gap-3 px-3 py-2 hover:bg-foreground/5 transition-colors text-left"
												>
													<div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
														<UserIcon size={12} className="text-blue-600" />
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium truncate">
															{user.name || "Без имени"}
														</p>
														<p className="text-xs text-muted-foreground truncate">
															{user.email}
															{user.phone && ` • ${user.phone}`}
														</p>
													</div>
												</button>
											))
										)}
										{!isSearching && searchResults.length === 0 && (
											<div className="px-3 py-2 text-sm text-muted-foreground">
												Ничего не найдено
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Тема */}
					<div className="space-y-2">
						<Label className="text-xs font-semibold">Тема</Label>
						<Input
							placeholder="Тема сообщения"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							disabled={isPending}
							className="h-9 glass-input"
						/>
					</div>

					{/* Сообщение */}
					<div className="space-y-2">
						<Label className="text-xs font-semibold">Сообщение</Label>
						<Textarea
							placeholder="Текст первого сообщения..."
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							disabled={isPending}
							rows={4}
							className="resize-none text-sm glass-input"
							onKeyDown={(e) => {
								if (e.key === "Enter" && e.ctrlKey) handleSubmit();
							}}
						/>
						<p className="text-[10px] text-muted-foreground text-right">
							Ctrl + Enter для отправки
						</p>
					</div>

					<DialogFooter>
						<DialogClose asChild disabled={isPending}>
							<Button variant="outline" size="md">
								Отменить
							</Button>
						</DialogClose>
						<Button
							onClick={handleSubmit}
							disabled={
								isPending || !selectedUser || !subject.trim() || !message.trim()
							}
							size="md"
							className="gap-2"
						>
							{isPending ? "Отправка" : "Отправить"}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
