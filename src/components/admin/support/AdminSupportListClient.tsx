"use client";

import { FunnelIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DbSupportThread } from "@/actions/support-actions";
import { Badge, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
	OPEN: "Открыто",
	CLOSED: "Закрыто",
	WAITING_FOR_ADMIN: "Ждёт ответа",
	WAITING_FOR_CLIENT: "Ждёт клиента",
};

const STATUS_COLORS: Record<string, string> = {
	OPEN: "bg-blue-500/20 text-blue-600 border-blue-300/30",
	CLOSED: "bg-gray-500/20 text-gray-600 border-gray-300/30",
	WAITING_FOR_ADMIN: "bg-red-500/20 text-red-600 border-red-300/30",
	WAITING_FOR_CLIENT: "bg-green-500/20 text-green-600 border-green-300/30",
};

type FilterStatus =
	| "all"
	| "open"
	| "waiting_admin"
	| "waiting_client"
	| "closed";

export default function AdminSupportListClient({
	initialThreads,
}: {
	initialThreads: DbSupportThread[];
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
	const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

	// Фильтрация и сортировка
	const filtered = useMemo(() => {
		let result = [...initialThreads];

		// Фильтр по статусу
		if (filterStatus !== "all") {
			const statusMap: Record<FilterStatus, string> = {
				all: "",
				open: "OPEN",
				waiting_admin: "WAITING_FOR_ADMIN",
				waiting_client: "WAITING_FOR_CLIENT",
				closed: "CLOSED",
			};
			result = result.filter((t) => t.status === statusMap[filterStatus]);
		}

		// Поиск по клиенту и теме
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(t) =>
					t.subject.toLowerCase().includes(q) ||
					t.user.name?.toLowerCase().includes(q) ||
					t.user.email?.toLowerCase().includes(q)
			);
		}

		// Сортировка
		if (sortBy === "newest") {
			result.sort(
				(a, b) =>
					new Date(b.lastMessageAt).getTime() -
					new Date(a.lastMessageAt).getTime()
			);
		} else {
			result.sort(
				(a, b) =>
					new Date(a.lastMessageAt).getTime() -
					new Date(b.lastMessageAt).getTime()
			);
		}

		return result;
	}, [initialThreads, searchQuery, filterStatus, sortBy]);

	const hasActiveFilters =
		searchQuery.trim() !== "" || filterStatus !== "all" || sortBy !== "newest";

	const getUnreadCount = (thread: DbSupportThread) => {
		return thread.messages.filter((m) => !m.isAdmin && m.readBy.length === 0)
			.length;
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

	return (
		<div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
			{/* Заголовок */}
			<div>
				<h1 className="text-3xl font-black italic uppercase tracking-tight">
					Поддержка клиентов
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Всего потоков: {initialThreads.length} • Результаты: {filtered.length}
				</p>
			</div>

			{/* Фильтры и поиск */}
			<div className="space-y-3">
				{/* Строка поиска */}
				<div className="relative">
					<MagnifyingGlassIcon
						size={18}
						className="absolute left-3 top-3 text-muted-foreground"
						weight="bold"
					/>
					<Input
						placeholder="Поиск по клиенту, email или теме..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 h-10"
					/>
					{searchQuery && (
						<Button
							onClick={() => setSearchQuery("")}
							className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
						>
							<XIcon size={18} weight="bold" />
						</Button>
					)}
				</div>

				{/* Фильтры по статусу и сортировка */}
				<div className="flex items-center gap-2 flex-wrap">
					<FunnelIcon
						size={16}
						className="text-muted-foreground"
						weight="bold"
					/>

					{/* Статусы */}
					<div className="flex gap-2 flex-wrap">
						{[
							{ key: "all", label: "Все" },
							{ key: "waiting_admin", label: "⚠️ Ждут ответа" },
							{ key: "open", label: "Открыто" },
							{ key: "waiting_client", label: "Ждут клиента" },
							{ key: "closed", label: "Закрыто" },
						].map((filter) => (
							<Button
								key={filter.key}
								onClick={() => setFilterStatus(filter.key as FilterStatus)}
								className={cn(
									"px-3 py-1 rounded-full text-xs font-medium transition-all border",
									filterStatus === filter.key
										? "bg-foreground text-background border-foreground"
										: "bg-foreground/5 text-foreground border-foreground/10 hover:border-foreground/30"
								)}
							>
								{filter.label}
							</Button>
						))}
					</div>

					{/* Сортировка */}
					<div className="flex gap-2 ml-auto">
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
							className="px-3 py-1 rounded-lg text-xs font-medium bg-foreground/5 border border-foreground/10 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
						>
							<option value="newest">Новые первыми</option>
							<option value="oldest">Старые первыми</option>
						</select>
					</div>

					{/* Кнопка очистки фильтров */}
					{hasActiveFilters && (
						<Button
							onClick={() => {
								setSearchQuery("");
								setFilterStatus("all");
								setSortBy("newest");
							}}
							className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
						>
							Очистить
						</Button>
					)}
				</div>
			</div>

			{/* Список потоков */}
			<div className="space-y-2">
				{filtered.map((thread) => {
					const unreadCount = getUnreadCount(thread);
					const lastMsg = thread.messages[thread.messages.length - 1];
					const isWaitingForAdmin = thread.status === "WAITING_FOR_ADMIN";

					return (
						<Link
							key={thread.id}
							href={`/admin/support/thread/${thread.id}`}
							className="block group"
						>
							<div
								className={cn(
									"p-4 rounded-xl border transition-all hover:bg-foreground/3 cursor-pointer",
									isWaitingForAdmin
										? "border-red-300/50 bg-red-500/5"
										: "border-foreground/10",
									unreadCount > 0 && "ring-2 ring-green-500/30"
								)}
							>
								<div className="flex items-start justify-between gap-4">
									{/* Основная информация */}
									<div className="flex-1 min-w-0 space-y-2">
										{/* Клиент и тема */}
										<div className="flex items-start gap-3 flex-wrap">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<Link
														href={`/admin/support/${thread.userId}`}
														onClick={(e) => e.stopPropagation()}
														className="font-semibold text-foreground hover:underline truncate"
													>
														{thread.user.name || "Без имени"}
													</Link>
													{unreadCount > 0 && (
														<Badge className="bg-green-600 text-white text-[10px] shrink-0">
															{unreadCount} новых
														</Badge>
													)}
												</div>
												<p className="text-sm text-muted-foreground truncate">
													{thread.user.email}
												</p>
											</div>
										</div>

										{/* Тема */}
										<p className="font-medium text-foreground group-hover:underline">
											{thread.subject}
										</p>

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
											<span>{formatDate(thread.lastMessageAt)}</span>
											<span>•</span>
											<span>
												{thread.platform === "WEBSITE" && "📱 Сайт"}
												{thread.platform === "TELEGRAM" && "✈️ Telegram"}
												{thread.platform === "EMAIL" && "📧 Email"}
											</span>
										</div>
									</div>

									{/* Статус и действия */}
									<div className="flex flex-col items-end gap-2 shrink-0">
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] font-medium",
												STATUS_COLORS[thread.status] ||
													"bg-foreground/10 text-foreground/60"
											)}
										>
											{STATUS_LABELS[thread.status] || thread.status}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{thread.messages.length}
										</span>
									</div>
								</div>
							</div>
						</Link>
					);
				})}

				{/* Пустое состояние */}
				{filtered.length === 0 && (
					<div className="text-center py-12 text-muted-foreground">
						{initialThreads.length === 0 ? (
							<>
								<p className="text-lg font-semibold mb-2">
									Потоков поддержки нет
								</p>
								<p className="text-sm">
									Когда клиенты начнут писать, они появятся здесь
								</p>
							</>
						) : (
							<>
								<p className="text-lg font-semibold mb-2">Ничего не найдено</p>
								<p className="text-sm">
									Попробуйте изменить параметры поиска или фильтра
								</p>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
