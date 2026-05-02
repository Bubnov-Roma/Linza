"use client";

import {
	CaretDownIcon,
	CaretUpDownIcon,
	CaretUpIcon,
	CopyIcon,
	DotsThreeVerticalIcon,
	FunnelIcon,
	MagnifyingGlassIcon,
	PlusIcon,
	ProhibitIcon,
	TagIcon,
	UploadSimpleIcon,
	UserIcon,
	UsersIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import {
	exportAdminUsersAction,
	getPaginatedUsersAction,
} from "@/actions/admin-user-actions";
import { toggleUserBlockAction } from "@/actions/client-application-actions";
import { CreateUserSheet } from "@/components/admin/users/CreateUserSheet";
import { AppStatusBadge } from "@/components/admin/users/details-panel/AppStatusBadge";
import { UserDetailPanel } from "@/components/admin/users/details-panel/UserDetailPanel";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui";
import { LABEL_COLORS, VERIFICATION_CONFIG } from "@/constants";
import type { UserProfile } from "@/core/domain/entities/User";
import { cn } from "@/lib/utils";
import { useAdminTablesStore } from "@/store/admin-tables.store";
import { formatPlural } from "@/utils";

const PAGE_SIZE = 25;

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortField = "createdAt" | "name";
type SortDir = "asc" | "desc";

function SortIcon({
	field,
	active,
	dir,
}: {
	field: SortField;
	active: SortField;
	dir: SortDir;
}) {
	if (field !== active)
		return <CaretUpDownIcon size={12} className="opacity-30" />;
	return dir === "asc" ? (
		<CaretUpIcon size={12} className="text-primary" />
	) : (
		<CaretDownIcon size={12} className="text-primary" />
	);
}

// ─── Active filter chip ────────────────────────────────────────────────────────

function ActiveFilterChip({
	label,
	onRemove,
}: {
	label: string;
	onRemove: () => void;
}) {
	return (
		<span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium border border-primary/20">
			{label}
			<button
				type="button"
				onClick={onRemove}
				className="hover:text-primary/60 transition-colors"
			>
				<XIcon size={10} />
			</button>
		</span>
	);
}

// ─── Discount badge ────────────────────────────────────────────────────────────

function DiscountBadge({ user }: { user: UserProfile }) {
	const discount = user.discount;
	if (!discount || discount.value === 0) return null;

	const label =
		discount.type === "PERCENT"
			? `${discount.value}%`
			: discount.type === "FIXED"
				? `−${discount.value} ₽`
				: (discount.promoCode ?? "PROMO");
	return (
		<Badge
			variant="outline"
			className="text-[10px] font-bold text-primary border-primary/30 bg-primary/5 whitespace-nowrap"
		>
			<TagIcon size={9} className="mr-0.5" />
			{label}
		</Badge>
	);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UsersTable({
	initialUsers,
	initialCount,
}: {
	initialUsers: UserProfile[];
	initialCount: number;
}) {
	const queryClient = useQueryClient();

	const { users: usersState, setUsers } = useAdminTablesStore();

	const search = usersState.search;
	const appFilter = usersState.roleFilter;
	const blockFilter = usersState.statusFilter as "all" | "active" | "blocked";
	const discountFilter =
		(
			usersState as unknown as {
				discountFilter: "all" | "has_discount" | "no_discount";
			}
		).discountFilter ?? "all";
	const regFrom = (usersState as unknown as { regFrom: string }).regFrom ?? "";
	const regTo = (usersState as unknown as { regTo: string }).regTo ?? "";
	const page = usersState.page;
	const sortField = usersState.sortField as SortField;
	const sortDir = usersState.sortDir as SortDir;
	const showFilters =
		(usersState as unknown as { showFilters: boolean }).showFilters ?? false;

	const setSearch = (v: string) => setUsers({ search: v, page: 1 });
	const setAppFilter = (v: string) => setUsers({ roleFilter: v, page: 1 });
	const setBlockFilter = (v: "all" | "active" | "blocked") =>
		setUsers({ statusFilter: v, page: 1 });
	const setDiscountFilter = (v: "all" | "has_discount" | "no_discount") =>
		setUsers({ discountFilter: v, page: 1 });
	const setShowFilters = (v: boolean) => setUsers({ showFilters: v });
	const setRegFrom = (v: string) => setUsers({ regFrom: v, page: 1 });
	const setRegTo = (v: string) => setUsers({ regTo: v, page: 1 });
	const setPage = (fn: number | ((p: number) => number)) =>
		setUsers({ page: typeof fn === "function" ? fn(page) : fn });
	const setSortField = (v: SortField) => setUsers({ sortField: v, page: 1 });
	const setSortDir = (fn: SortDir | ((d: SortDir) => SortDir)) =>
		setUsers({ sortDir: typeof fn === "function" ? fn(sortDir) : fn });

	// Локальные
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const csvInputRef = useRef<HTMLInputElement>(null);

	const [debouncedSearch] = useDebounceValue(search, 300);

	// ── Fetch Data
	const queryKey = [
		"admin-users",
		debouncedSearch,
		appFilter,
		blockFilter,
		discountFilter,
		regFrom,
		regTo,
		sortField,
		sortDir,
		page,
	] as const;

	const { data: queryData, isFetching } = useQuery({
		queryKey,
		queryFn: () =>
			getPaginatedUsersAction({
				search: debouncedSearch,
				appFilter,
				blockFilter,
				discountFilter,
				regFrom,
				regTo,
				sortField,
				sortDir,
				limit: PAGE_SIZE,
				offset: (page - 1) * PAGE_SIZE,
			}),
		placeholderData: (prev) => prev,
	});

	const users = (queryData?.data as unknown as UserProfile[]) ?? initialUsers;
	const totalCount = queryData?.count ?? initialCount;
	const isLoading = isFetching && !queryData;
	const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

	const pendingCount = users.filter(
		(u) => u.application?.status === "PENDING"
	).length;

	const refreshData = () => {
		queryClient.invalidateQueries({ queryKey: ["admin-users"] });
	};

	const openUser = (user: UserProfile) => {
		setActiveUser(user);
		setSheetOpen(true);
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDir("asc");
		}
	};

	// ── CSV Export
	const handleExport = async () => {
		try {
			const exportedUsers = await exportAdminUsersAction(
				selectedIds.size > 0 ? Array.from(selectedIds) : undefined
			);

			const rows = [
				[
					"ID",
					"Имя",
					"Email",
					"Телефон",
					"Статус анкеты",
					"Заблокирован",
					"Дата регистрации",
				],
				...exportedUsers.map((u) => [
					u.id,
					u.name,
					u.email,
					u.phone,
					u.status,
					u.isBlocked,
					new Date(u.createdAt).toLocaleDateString("ru-RU"),
				]),
			];

			const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
			const blob = new Blob([`\ufeff${csv}`], {
				type: "text/csv;charset=utf-8;",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `clients_${new Date().toISOString().slice(0, 10)}.csv`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success(
				selectedIds.size > 0
					? "Выбранные клиенты экспортированы"
					: "Все клиенты экспортированы"
			);
		} catch {
			toast.error("Ошибка экспорта");
		}
	};

	// ── CSV Import placeholder
	const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		toast.info("Импорт в разработке");
		e.target.value = "";
	};

	// ── Active filter chips
	const activeFilters: { label: string; onRemove: () => void }[] = [];
	if (appFilter !== "all") {
		const label =
			appFilter === "none"
				? "Без анкеты"
				: (VERIFICATION_CONFIG[appFilter as keyof typeof VERIFICATION_CONFIG]
						?.label ?? appFilter);
		activeFilters.push({
			label: `Анкета: ${label}`,
			onRemove: () => setAppFilter("all"),
		});
	}
	if (blockFilter !== "all") {
		activeFilters.push({
			label: blockFilter === "active" ? "Только активные" : "Только заблок.",
			onRemove: () => setBlockFilter("all"),
		});
	}
	if (discountFilter !== "all") {
		activeFilters.push({
			label: discountFilter === "has_discount" ? "Со скидкой" : "Без скидки",
			onRemove: () => setDiscountFilter("all"),
		});
	}
	if (regFrom)
		activeFilters.push({
			label: `Рег. от: ${new Date(regFrom).toLocaleDateString("ru-RU")}`,
			onRemove: () => setRegFrom(""),
		});
	if (regTo)
		activeFilters.push({
			label: `Рег. до: ${new Date(regTo).toLocaleDateString("ru-RU")}`,
			onRemove: () => setRegTo(""),
		});

	return (
		<>
			{/* ── Header ── */}
			<div className="px-3 py-4 border-b border-foreground/5 flex items-start justify-between gap-4">
				<div className="flex items-center gap-2.5">
					<UserIcon size={20} weight="duotone" />
					<h1 className="text-2xl font-black italic uppercase tracking-tighter">
						Клиенты
					</h1>
					{pendingCount > 0 && (
						<Badge className="h-5 px-2 text-[10px] font-bold bg-primary text-primary-foreground">
							{formatPlural(pendingCount, "new")}
						</Badge>
					)}
				</div>

				<Button
					variant="ghost"
					size="sm"
					className="h-9 gap-2 font-bold"
					onClick={() => setCreateOpen(true)}
				>
					<PlusIcon size={14} weight="bold" />
				</Button>
			</div>

			<div className="space-y-4 relative p-2">
				{/* Controls */}
				<Card className="p-2">
					<CardContent className="p-0">
						<div className="flex flex-col sm:flex-row gap-3">
							{/* Search */}
							<div className="relative flex-1">
								<MagnifyingGlassIcon className="z-1 absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
								<Input
									placeholder="Имя, email, телефон..."
									className="pl-9 h-9"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
								{search && (
									<button
										type="button"
										onClick={() => setSearch("")}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										<XIcon size={12} />
									</button>
								)}
							</div>

							{/* App status filter */}
							<Select value={appFilter} onValueChange={setAppFilter}>
								<SelectTrigger className="h-9 w-44">
									<SelectValue placeholder="Статус анкеты" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Все анкеты</SelectItem>
									<SelectItem value="none">Без анкеты</SelectItem>
									<SelectItem value="PENDING">На проверке</SelectItem>
									<SelectItem value="REVIEWING">Проверяется</SelectItem>
									<SelectItem value="CLARIFICATION">Уточнение</SelectItem>
									<SelectItem value="APPROVED">Одобрена</SelectItem>
									<SelectItem value="STANDARD">Стандарт</SelectItem>
									<SelectItem value="REJECTED">Отклонена</SelectItem>
									<SelectItem value="DRAFT">Черновик</SelectItem>
								</SelectContent>
							</Select>

							{/* Block filter */}
							<Select
								value={blockFilter}
								onValueChange={(v) => setBlockFilter(v as typeof blockFilter)}
							>
								<SelectTrigger className="h-9 w-44">
									<SelectValue placeholder="Состояние" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Все клиенты</SelectItem>
									<SelectItem value="active">Только активные</SelectItem>
									<SelectItem value="blocked">Заблокированные</SelectItem>
								</SelectContent>
							</Select>

							{/* Action buttons */}
							<div className="flex gap-2 shrink-0">
								<Button
									variant="outline"
									size="sm"
									className={cn(
										"h-9 gap-2",
										showFilters && "border-primary text-primary"
									)}
									onClick={() => setShowFilters(!usersState.showFilters)}
								>
									<FunnelIcon size={13} />
									Ещё
									{(discountFilter !== "all" || regFrom || regTo) && (
										<span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
											{(discountFilter !== "all" ? 1 : 0) +
												(regFrom ? 1 : 0) +
												(regTo ? 1 : 0)}
										</span>
									)}
								</Button>

								<Button
									variant="outline"
									size="sm"
									className="h-9 gap-2"
									onClick={handleExport}
								>
									<UploadSimpleIcon size={13} />
									CSV {selectedIds.size > 0 && `(${selectedIds.size})`}
								</Button>

								<Button
									variant="outline"
									size="sm"
									className="h-9 gap-2"
									onClick={() => csvInputRef.current?.click()}
								>
									<UploadSimpleIcon size={13} />
									Импорт
								</Button>
								<input
									ref={csvInputRef}
									type="file"
									accept=".csv"
									className="hidden"
									onChange={handleCSVImport}
								/>
							</div>
						</div>

						{/* Extended filters panel */}
						{showFilters && (
							<div className="pt-2 border-t border-foreground/5 flex flex-wrap gap-3 items-end">
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground font-medium">
										Скидка
									</p>
									<Select
										value={discountFilter}
										onValueChange={(v) =>
											setDiscountFilter(v as typeof discountFilter)
										}
									>
										<SelectTrigger className="h-8 text-xs w-38">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Любая</SelectItem>
											<SelectItem value="has_discount">Со скидкой</SelectItem>
											<SelectItem value="no_discount">Без скидки</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground font-medium">
										Регистрация от
									</p>
									<Input
										type="date"
										className="h-8 text-xs w-36"
										value={regFrom}
										onChange={(e) => setRegFrom(e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<p className="text-xs text-muted-foreground font-medium">
										до
									</p>
									<Input
										type="date"
										className="h-8 text-xs w-36"
										value={regTo}
										onChange={(e) => setRegTo(e.target.value)}
									/>
								</div>
								{(regFrom || regTo || discountFilter !== "all") && (
									<Button
										variant="ghost"
										size="sm"
										className="h-8 text-xs text-muted-foreground gap-1"
										onClick={() => {
											setRegFrom("");
											setRegTo("");
											setDiscountFilter("all");
										}}
									>
										<XIcon size={11} /> Сброс
									</Button>
								)}
							</div>
						)}

						{/* Active filter chips */}
						{activeFilters.length > 0 && (
							<div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-foreground/5">
								<span className="text-[10px] text-muted-foreground">
									Активные:
								</span>
								{activeFilters.map((f) => (
									<ActiveFilterChip
										key={f.label}
										label={f.label}
										onRemove={f.onRemove}
									/>
								))}
								<button
									type="button"
									onClick={() => {
										setAppFilter("all");
										setBlockFilter("all");
										setDiscountFilter("all");
										setRegFrom("");
										setRegTo("");
									}}
									className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-1"
								>
									Сбросить все
								</button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Summary strip */}
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<span>
						Найдено: <strong className="text-foreground">{totalCount}</strong>
					</span>
					{isFetching && !isLoading && (
						<span className="text-primary-accent/60 flex items-center gap-1">
							<span className="w-2 h-2 border border-primary/40 border-t-primary rounded-full animate-spin" />
							Обновление...
						</span>
					)}
					{selectedIds.size > 0 && (
						<span className="text-primary font-medium">
							Выбрано: {selectedIds.size}
						</span>
					)}
				</div>

				{/* Table */}
				<Card className="overflow-hidden relative rounded-xl">
					{/* NpLoader */}
					<div
						className={cn(
							"absolute top-0 left-0 w-full h-2 z-50 bg-primary/10 overflow-hidden transition-opacity duration-300",
							isFetching ? "opacity-100" : "opacity-0"
						)}
					>
						<div className="h-full bg-primary w-1/2 rounded-full animate-[pulse_1s_ease-in-out_infinite] origin-left" />
					</div>

					<div className="overflow-x-auto">
						<Table className="w-full backdrop-blur-md rounded-lg overflow-hidden">
							<TableHeader
								className={cn(
									"bg-muted-foreground/20 rounded-2xl",
									isFetching &&
										!isLoading &&
										"opacity-80 transition-opacity duration-200"
								)}
							>
								<TableRow className="border-foreground/5 font-black hover:bg-transparent">
									<TableHead className="w-10">
										<Checkbox
											checked={
												users.length > 0 && selectedIds.size === users.length
											}
											onCheckedChange={(checked) => {
												setSelectedIds(
													checked ? new Set(users.map((i) => i.id)) : new Set()
												);
											}}
										/>
									</TableHead>

									{/* Name */}
									<TableHead
										className="cursor-pointer select-none hover:text-foreground transition-colors min-w-48"
										onClick={() => handleSort("name")}
									>
										<span className="flex items-center gap-1">
											Клиент{" "}
											<SortIcon field="name" active={sortField} dir={sortDir} />
										</span>
									</TableHead>

									{/* Email and Phone */}
									<TableHead>Email</TableHead>
									<TableHead>Телефон</TableHead>

									{/* App & Status */}
									<TableHead>Анкета</TableHead>
									<TableHead>Статус</TableHead>

									{/* Labels & Discount */}
									<TableHead>Метки</TableHead>
									<TableHead>Скидка</TableHead>

									{/* Reg date */}
									<TableHead
										className="cursor-pointer select-none hover:text-foreground transition-colors"
										onClick={() => handleSort("createdAt")}
									>
										<span className="flex items-center gap-1">
											Регистрация{" "}
											<SortIcon
												field="createdAt"
												active={sortField}
												dir={sortDir}
											/>
										</span>
									</TableHead>

									<TableHead className="text-right">Действия</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user) => {
									const labels = user.labels ?? [];

									return (
										<TableRow
											key={user.id}
											className={cn(
												"border-foreground/5 cursor-pointer hover:bg-foreground/3 transition-colors",
												user.isBlocked && "opacity-50",
												selectedIds.has(user.id) && "bg-primary/10",
												activeUser?.id === user.id &&
													sheetOpen &&
													"bg-foreground/7",
												user.application?.status === "NO_APPLICATION" &&
													"bg-amber-500/7 border-l-2 border-l-amber-500/40",
												user.application?.status === "DRAFT" &&
													"bg-gray-500/7 border-l-2 border-l-gray-500/40",
												user.application?.status === "PENDING" &&
													"bg-neutral-500/7 border-l-2 border-l-neutral-500/40",
												user.application?.status === "REVIEWING" &&
													"bg-sky-500/7 border-l-2 border-l-sky-500/40",
												user.application?.status === "CLARIFICATION" &&
													"bg-lime-500/7 border-l-2 border-l-lime-500/40",
												user.application?.status === "STANDARD" &&
													"bg-emerald-500/7 border-l-2 border-l-emerald-500/40",
												user.application?.status === "REJECTED" &&
													"bg-red-500/7 border-l-2 border-l-red-500/40"
											)}
											onClick={() => openUser(user)}
										>
											<TableCell onClick={(e) => e.stopPropagation()}>
												<Checkbox
													checked={selectedIds.has(user.id)}
													onCheckedChange={(checked) => {
														const newSelected = new Set(selectedIds);
														if (checked) newSelected.add(user.id);
														else newSelected.delete(user.id);
														setSelectedIds(newSelected);
													}}
												/>
											</TableCell>

											{/* Клиент */}
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="h-8 w-8 rounded-full bg-foreground/8 flex items-center justify-center overflow-hidden shrink-0">
														{user.avatarUrl ? (
															<Image
																src={user.avatarUrl}
																alt=""
																width={32}
																height={32}
																className="object-cover"
															/>
														) : (
															<UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
														)}
													</div>
													<div className="min-w-0">
														<p className="font-medium text-sm truncate max-w-48">
															{user.name || "Без имени"}
														</p>
													</div>
												</div>
											</TableCell>

											{/* Email */}
											<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
												{user.email || "—"}
											</TableCell>

											{/* Телефон */}
											<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
												{user.phone || "—"}
											</TableCell>

											{/* Анкета */}
											<TableCell onClick={(e) => e.stopPropagation()}>
												<AppStatusBadge
													status={user.application?.status}
													onUpdate={() => refreshData()}
													app={user.application}
												/>
											</TableCell>

											{/* Статус блок./активен */}
											<TableCell>
												{user.isBlocked ? (
													<Badge
														variant="outline"
														className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20 gap-1"
													>
														<ProhibitIcon size={9} /> Заблок.
													</Badge>
												) : (
													<Badge
														variant="outline"
														className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20"
													>
														Активен
													</Badge>
												)}
											</TableCell>

											{/* Метки (Красивые точки) */}
											<TableCell onClick={(e) => e.stopPropagation()}>
												<div className="flex flex-wrap gap-1 max-w-32">
													{labels.length === 0 ? (
														<span className="text-muted-foreground/30 text-[10px]">
															—
														</span>
													) : (
														<TooltipProvider delayDuration={150}>
															{labels.slice(0, 5).map((l) => (
																<Tooltip key={l.id}>
																	<TooltipTrigger asChild>
																		<div
																			className={cn(
																				"w-2.5 h-2.5 rounded-full border cursor-help",
																				LABEL_COLORS[
																					l.color as keyof typeof LABEL_COLORS
																				]?.split(" ")[0]
																			)}
																		/>
																	</TooltipTrigger>
																	<TooltipContent className="text-xs">
																		{l.text}
																	</TooltipContent>
																</Tooltip>
															))}
															{labels.length > 5 && (
																<span className="text-[9px] text-muted-foreground ml-1">
																	+{labels.length - 5}
																</span>
															)}
														</TooltipProvider>
													)}
												</div>
											</TableCell>

											{/* Скидка */}
											<TableCell>
												<DiscountBadge user={user} />
											</TableCell>

											{/* Дата регистрации */}
											<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
												{new Date(user.createdAt).toLocaleDateString("ru-RU")}
											</TableCell>

											{/* Действия */}
											<TableCell
												className="text-right"
												onClick={(e) => e.stopPropagation()}
											>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8"
														>
															<DotsThreeVerticalIcon className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-52">
														<DropdownMenuItem onClick={() => openUser(user)}>
															<UserIcon className="w-4 h-4 mr-2" />
															Открыть профиль
														</DropdownMenuItem>

														<DropdownMenuSeparator />

														{/* Быстрые ссылки */}
														<DropdownMenuItem
															onClick={() => {
																if (user.email) {
																	navigator.clipboard.writeText(user.email);
																	toast.success("Email скопирован");
																}
															}}
														>
															<CopyIcon className="w-4 h-4 mr-2 rotate-180" />
															Скопировать email
														</DropdownMenuItem>
														{user.phone && (
															<DropdownMenuItem
																onClick={() => {
																	navigator.clipboard.writeText(
																		user.phone ?? ""
																	);
																	toast.success("Телефон скопирован");
																}}
															>
																<UploadSimpleIcon className="w-4 h-4 mr-2 rotate-180" />
																Скопировать телефон
															</DropdownMenuItem>
														)}

														<DropdownMenuSeparator />

														{/* Блокировка */}
														<DropdownMenuItem
															className={
																user.isBlocked
																	? "text-green-500"
																	: "text-red-500"
															}
															onClick={async () => {
																const reason = user.isBlocked
																	? undefined
																	: (window.prompt("Причина блокировки:") ??
																		"");
																const r = await toggleUserBlockAction(
																	user.id,
																	!user.isBlocked,
																	reason
																);
																if (r.success) {
																	refreshData();
																	toast.success(
																		user.isBlocked
																			? "Разблокирован"
																			: "Заблокирован"
																	);
																} else {
																	toast.error(r.error);
																}
															}}
														>
															<ProhibitIcon className="w-4 h-4 mr-2" />
															{user.isBlocked
																? "Разблокировать"
																: "Заблокировать"}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>

					{users.length === 0 && !isLoading && (
						<div className="py-16 text-center space-y-2">
							<UsersIcon
								size={32}
								className="mx-auto text-muted-foreground/20"
							/>
							<p className="text-sm text-muted-foreground">
								Пользователи не найдены
							</p>
						</div>
					)}

					{/* Pagination Footer */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-foreground/5">
							<span className="text-xs text-muted-foreground">
								Страница {page} из {totalPages}
							</span>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page === 1}
									onClick={() => setPage((p) => p - 1)}
								>
									Назад
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= totalPages}
									onClick={() => setPage((p) => p + 1)}
								>
									Вперед
								</Button>
							</div>
						</div>
					)}
				</Card>

				{/* Detail panel */}
				<UserDetailPanel
					user={activeUser}
					open={sheetOpen}
					onOpenChange={(open) => {
						setSheetOpen(open);
						if (!open) {
							setTimeout(() => setActiveUser(null), 300);
							refreshData();
						}
					}}
					onUpdate={() => refreshData()}
				/>

				{/* Create user sheet */}
				<CreateUserSheet
					open={createOpen}
					onOpenChange={setCreateOpen}
					onCreated={() => {
						refreshData();
						setCreateOpen(false);
					}}
				/>
			</div>
		</>
	);
}
