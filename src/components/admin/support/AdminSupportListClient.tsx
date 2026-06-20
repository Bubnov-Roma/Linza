"use client";

import {
	ChatIcon,
	ChatsIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
	PlusIcon,
	XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	type DbSupportThread,
	pollSupportThreadsAction,
} from "@/actions/support-actions";
import { AdminNewThreadModal } from "@/components/admin/support/AdminNewThreadModal";
import { ClientTime } from "@/components/shared";
import { Badge, Button, Card, Input } from "@/components/ui";
import {
	CHATS_STATUS_COLORS,
	CHATS_STATUS_LABELS,
} from "@/constants/support-chats.constants";
import { cn } from "@/lib/utils";
import { formatPlural } from "@/utils";

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
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
	const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
	const [threads, setThreads] = useState(initialThreads);
	const [newThreadOpen, setNewThreadOpen] = useState(false);

	const latestAt = threads[0]?.lastMessageAt ?? new Date(0);

	useEffect(() => {
		const interval = setInterval(async () => {
			const result = await pollSupportThreadsAction({
				role: "admin",
				latestThreadAt: latestAt,
			});
			if (result.hasUpdates && result.threads) {
				setThreads(result.threads);
			}
		}, 20_000);

		return () => clearInterval(interval);
	}, [latestAt]);

	const pendingCount = initialThreads.filter(
		(t) => t.status === "WAITING_FOR_ADMIN"
	).length;
	// Фильтрация и сортировка
	const filtered = useMemo(() => {
		let result = [...threads];

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
	}, [threads, searchQuery, filterStatus, sortBy]);

	const hasActiveFilters =
		searchQuery.trim() !== "" || filterStatus !== "all" || sortBy !== "newest";

	const getUnreadCount = (thread: DbSupportThread) => {
		return thread.messages.filter((m) => !m.isAdmin && m.readBy.length === 0)
			.length;
	};

	return (
		<div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
			{/* Заголовок */}
			<div className="px-3 py-4 flex items-start justify-between gap-4">
				<div className="flex items-center gap-2.5">
					<ChatsIcon size={20} weight="duotone" />
					<h1 className="text-2xl font-black italic uppercase tracking-tighter">
						Чаты
					</h1>
					{pendingCount > 0 ? (
						<Badge className="h-5 px-2 text-[10px] font-bold bg-primary text-primary-foreground">
							{formatPlural(pendingCount, "new")}
						</Badge>
					) : (
						<p className="text-sm text-muted-foreground mt-1">
							Найдено • {filtered.length}
						</p>
					)}
				</div>

				<Button
					size="sm"
					aria-label="Добавить нового клиента"
					className="h-9 gap-2 font-bold"
					onClick={() => setNewThreadOpen(true)}
				>
					<PlusIcon size={14} weight="bold" />
				</Button>
			</div>

			<AdminNewThreadModal
				open={newThreadOpen}
				onOpenChange={setNewThreadOpen}
			/>
			{/* Фильтры и поиск */}
			<div className="space-y-3">
				{/* Строка поиска */}
				<div className="relative">
					<MagnifyingGlassIcon
						size={18}
						className="z-1 absolute left-3 top-3 text-muted-foreground"
						weight="bold"
					/>
					<Input
						placeholder="Поиск по клиенту, email или теме..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 h-10 rounded-2xl glass-input"
					/>
					{searchQuery && (
						<Button
							size="icon-sm"
							variant="ghost"
							onClick={() => setSearchQuery("")}
							className="absolute right-1 top-1 text-muted-foreground hover:text-foreground transition-colors"
						>
							<XIcon size={18} weight="bold" />
						</Button>
					)}
				</div>

				{/* Фильтры по статусу и сортировка */}
				<div className="flex items-center gap-2 flex-wrap flex-1">
					<FunnelIcon
						size={16}
						className="hidden md:inline text-muted-foreground"
						weight="bold"
					/>

					{/* Статусы */}
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
					{/* Сортировка */}
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
						className="px-3 py-1 h-11 rounded-2xl text-xs font-medium bg-foreground/5 border border-foreground/10 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<option value="newest">Новые</option>
						<option value="oldest">Старые</option>
					</select>

					{/* Кнопка очистки фильтров */}
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSearchQuery("");
								setFilterStatus("all");
								setSortBy("newest");
							}}
							className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors underline"
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
						<Card
							key={thread.id}
							onClick={() => router.push(`/admin/support/thread/${thread.id}`)}
							className={cn(
								"p-4 block group cursor-pointer",
								isWaitingForAdmin && " bg-red-500/5",
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
											{thread.deletedByClientAt && (
												<Badge
													variant="outline"
													className="text-[10px] text-muted-foreground border-muted-foreground/20"
												>
													Удалено клиентом
												</Badge>
											)}
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
										<ClientTime iso={thread.lastMessageAt} fmt="relative" />
									</div>
								</div>

								{/* Статус и действия */}
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
									<span className="text-xs text-muted-foreground">
										{thread.messages.length}
									</span>
								</div>
							</div>
						</Card>
					);
				})}

				{/* Пустое состояние */}
				{filtered.length === 0 && (
					<div className="text-center py-12 text-muted-foreground">
						{threads.length === 0 ? (
							<div className="py-12 text-center space-y-2">
								<div className="w-22 h-22 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto">
									<ChatIcon size={44} className="text-muted-foreground/40" />
								</div>
								<div>
									<p className="text-lg font-semibold mb-2">
										Чатов с клиентами пока нет
									</p>
									<p className="text-md text-muted-foreground mt-1">
										Когда клиенты начнут писать, они появятся здесь
									</p>
								</div>
								<Button
									size="md"
									variant="ghost"
									onClick={() => setNewThreadOpen(true)}
								>
									Написать клиенту
								</Button>
							</div>
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
