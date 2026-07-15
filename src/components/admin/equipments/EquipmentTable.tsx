"use client";

import {
	ArrowLeftIcon,
	ArrowRightIcon,
	CameraIcon,
	CaretDownIcon,
	CaretUpDownIcon,
	CaretUpIcon,
	ColumnsIcon,
	ColumnsPlusRightIcon,
	CopySimpleIcon,
	DotsThreeVerticalIcon,
	FunnelSimpleIcon,
	PencilSimpleIcon,
	PlusIcon,
	SortDescendingIcon,
	SparkleIcon,
	StarIcon,
	TrashIcon,
	UploadSimpleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import { getCategoriesFromDb } from "@/actions/admin/admin-category-actions";
import {
	deleteEquipment,
	duplicateEquipment,
	type EquipmentFilter,
	type EquipmentSort,
	exportEquipment,
	getEquipmentWithFilters,
	toggleEquipmentAvailabilityAction,
	toggleEquipmentFeaturedAction,
	toggleEquipmentPrimaryAction,
} from "@/actions/admin/admin-equipment-actions";
import { getAutocompleteAction } from "@/actions/autocomplete-actions";
import { FilterBuilder } from "@/components/admin/equipments/FilterBuilder";
import { SortBuilder } from "@/components/admin/equipments/SortBuilder";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Badge,
	Button,
	Card,
	CardContent,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	InlineSearchInput,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import type {
	DbCategory,
	DbEquipmentWithImages,
} from "@/core/domain/entities/Equipment";
import { cn, fmtRub } from "@/lib/utils";
import { useAdminTablesStore } from "@/store/admin-tables.store";
import { useUnsavedChanges } from "@/store/unsaved-changes.store";
import { formatPlural } from "@/utils";
import { EquipmentSheet } from "./EquipmentSheet";

const PAGE_SIZE = 25;

const SKELETON_COUNT = 10;

function SortIcon({
	column,
	sorts,
}: {
	column: string;
	sorts: EquipmentSort[];
}) {
	const activeSort = sorts.find((s) => s.column === column);
	if (!activeSort) return <CaretUpDownIcon size={12} className="opacity-30" />;
	return activeSort.ascending ? (
		<CaretUpIcon size={12} className="text-primary" />
	) : (
		<CaretDownIcon size={12} className="text-primary" />
	);
}

function TableRowSkeleton() {
	return (
		<TableRow className="border-foreground/5">
			<TableCell>
				<Skeleton className="h-4 w-4 rounded-full" />
			</TableCell>
			<TableCell>
				<Skeleton className="h-10 w-10 rounded" />
			</TableCell>
			<TableCell>
				<div className="space-y-1.5">
					<Skeleton className="h-3.5 w-32 rounded" />
					<Skeleton className="h-2.5 w-20 rounded" />
				</div>
			</TableCell>
			<TableCell>
				<Skeleton className="h-5 w-16 rounded-full" />
			</TableCell>
			<TableCell>
				<Skeleton className="h-5 w-20 rounded-full" />
			</TableCell>
			<TableCell>
				<Skeleton className="h-3.5 w-14 rounded" />
			</TableCell>
			<TableCell>
				<Skeleton className="h-2 w-2 rounded-full" />
			</TableCell>
			<TableCell />
		</TableRow>
	);
}

// ─── Inline Toggles ──────────────────────────────────────────────────────────

function PrimaryToggle({
	id,
	isPrimary,
	onRefresh,
}: {
	id: string;
	isPrimary: boolean;
	onRefresh: () => void;
}) {
	const [isPending, startTransition] = useTransition();
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					disabled={isPending}
					onClick={(e) => {
						e.stopPropagation();
						startTransition(async () => {
							const r = await toggleEquipmentPrimaryAction(id, !isPrimary);
							if (r.success) {
								toast.success(
									isPrimary ? "Убрано из витрины" : "Добавлено на витрину"
								);
								onRefresh();
							} else toast.error(r.error);
						});
					}}
					className="p-1 rounded hover:bg-foreground/10 transition-colors disabled:opacity-50 shrink-0"
				>
					<StarIcon
						weight={isPrimary ? "fill" : "regular"}
						size={16}
						className={
							isPrimary
								? "text-amber-400"
								: "text-muted-foreground/30 hover:text-amber-400/50"
						}
					/>
				</button>
			</TooltipTrigger>
			<TooltipContent className="text-xs">
				{isPrimary
					? "Убрать из каталога на сайте"
					: "Показывать в каталоге на сайте"}
			</TooltipContent>
		</Tooltip>
	);
}

function FeaturedToggle({
	id,
	isFeatured,
	onRefresh,
}: {
	id: string;
	isFeatured: boolean;
	onRefresh: () => void;
}) {
	const [isPending, startTransition] = useTransition();
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					disabled={isPending}
					onClick={(e) => {
						e.stopPropagation();
						startTransition(async () => {
							const r = await toggleEquipmentFeaturedAction(id, !isFeatured);
							if (r.success) {
								toast.success(
									isFeatured ? "Убрано из витрины" : "Добавлено на витрину"
								);
								onRefresh();
							} else toast.error(r.error);
						});
					}}
					className="p-1 rounded hover:bg-foreground/10 transition-colors disabled:opacity-50 shrink-0"
				>
					<SparkleIcon
						weight={isFeatured ? "fill" : "regular"}
						size={16}
						className={
							isFeatured
								? "text-violet-400"
								: "text-muted-foreground/30 hover:text-violet-400/50"
						}
					/>
				</button>
			</TooltipTrigger>
			<TooltipContent className="text-xs">
				{isFeatured
					? "Убрать с витрины главной страницы"
					: "Показать на витрине главной страницы"}
			</TooltipContent>
		</Tooltip>
	);
}

function AvailabilityToggle({
	id,
	isAvailable,
	onRefresh,
}: {
	id: string;
	isAvailable: boolean;
	onRefresh: () => void;
}) {
	const [isPending, startTransition] = useTransition();

	return (
		<div className="flex flex-col gap-1 items-start">
			<DropdownMenu>
				<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
					<button
						type="button"
						disabled={isPending}
						className={cn(
							"flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-foreground/10 bg-background/60 hover:bg-background transition-colors",
							!isAvailable && "bg-red-300/40 hover:bg-red-300/50"
						)}
					>
						<span className="text-[10px] font-medium">
							{isAvailable ? "Доступно" : "Скрыто"}
						</span>
						<CaretDownIcon size={10} className="opacity-50" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="center"
					className="min-w-30 rounded-2xl text-xs brightness-125"
					onClick={(e) => e.stopPropagation()}
				>
					<DropdownMenuItem
						disabled={isPending || isAvailable}
						onClick={() =>
							startTransition(async () => {
								const r = await toggleEquipmentAvailabilityAction(id, true);
								if (r.success) onRefresh();
								else toast.error(r.error);
							})
						}
					>
						<div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2" />
						Сдается в аренду
					</DropdownMenuItem>
					<DropdownMenuItem
						disabled={isPending || !isAvailable}
						onClick={() =>
							startTransition(async () => {
								const r = await toggleEquipmentAvailabilityAction(id, false);
								if (r.success) onRefresh();
								else toast.error(r.error);
							})
						}
					>
						<div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" />
						Не сдается в аренду
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export default function EquipmentTable() {
	const queryClient = useQueryClient();

	const { equipment: eqState, setEquipment } = useAdminTablesStore();

	const filters = eqState.filters as EquipmentFilter[];
	const sorts = eqState.sorts as EquipmentSort[];
	const search = eqState.search;
	const page = eqState.page;
	const viewMode = eqState.viewMode;

	const setFilters = (
		v: EquipmentFilter[] | ((prev: EquipmentFilter[]) => EquipmentFilter[])
	) =>
		setEquipment({
			filters: typeof v === "function" ? v(filters) : v,
			page: 1,
		});
	const setSorts = (
		v: EquipmentSort[] | ((prev: EquipmentSort[]) => EquipmentSort[])
	) => setEquipment({ sorts: typeof v === "function" ? v(sorts) : v, page: 1 });
	const setSearchTerm = (v: string) => setEquipment({ search: v, page: 1 });
	const setPage = (fn: number | ((p: number) => number)) =>
		setEquipment({ page: typeof fn === "function" ? fn(page) : fn });
	const setViewMode = (v: "compact" | "extended") =>
		setEquipment({ viewMode: v });

	const markClean = useUnsavedChanges((s) => s.markClean);
	const [duplicateId, setDuplicateId] = useState<string | null>(null);
	const [categories, setCategories] = useState<DbCategory[]>([]);
	const [showCreateSheet, setShowCreateSheet] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [activeEquipment, setActiveEquipment] =
		useState<DbEquipmentWithImages | null>(null);

	const [debouncedSearch] = useDebounceValue(search, 300);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		getCategoriesFromDb().then(setCategories);
	}, []);

	const getCategoryName = (id: string) =>
		categories.find((c) => c.id === id)?.name ?? id;
	const getSubcategoryName = (id: string): string => {
		if (!id) return "";
		for (const cat of categories) {
			const sub = cat.subcategories.find((s) => s.id === id);
			if (sub) return sub.name;
		}
		return id;
	};

	const queryKey = [
		"admin-equipment",
		debouncedSearch,
		filters,
		sorts,
		page,
	] as const;

	const { data: queryData, isFetching } = useQuery({
		queryKey,
		queryFn: () =>
			getEquipmentWithFilters({
				search: debouncedSearch,
				filters,
				sort: sorts,
				limit: PAGE_SIZE,
				offset: (page - 1) * PAGE_SIZE,
			}),
		staleTime: 1000 * 30,
		gcTime: 1000 * 60 * 5,
		refetchOnWindowFocus: true,
		placeholderData: (prev) => prev,
	});
	const items = queryData?.data ?? [];
	const totalCount = queryData?.count ?? 0;
	const isLoading = isFetching && items.length === 0;
	const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

	const refreshData = () => {
		queryClient.invalidateQueries({ queryKey: ["admin-equipment"] });
	};

	const handleHeaderSort = (column: EquipmentSort["column"]) => {
		setSorts((prev) => {
			const existing = prev.find((s) => s.column === column);
			if (existing) {
				if (existing.ascending) return [{ column, ascending: false }];
				else return [];
			}
			return [{ column, ascending: true }];
		});
	};

	const toggleSelect = (id: string) => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(id)) newSelected.delete(id);
		else newSelected.add(id);
		setSelectedIds(newSelected);
	};

	const handleDelete = async (singleId?: string) => {
		const idsToDelete = singleId ? [singleId] : Array.from(selectedIds);
		if (idsToDelete.length === 0) return;
		if (
			!confirm(
				`Удалить ${idsToDelete.length} поз.?\n\nПозиции участвующие в бронях будут архивированы (скрыты из каталога), но не удалены.`
			)
		)
			return;

		startTransition(async () => {
			try {
				const result = await deleteEquipment(idsToDelete);
				if (result.partial)
					toast.warning(result.message ?? "Часть позиций архивирована");
				else toast.success(`Удалено позиций: ${idsToDelete.length}`);
				setSelectedIds(new Set());
				refreshData();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Ошибка удаления");
			}
		});
	};

	const handleDuplicate = async (id?: string) => {
		const idsToDuplicate = id ? [id] : Array.from(selectedIds);
		if (idsToDuplicate.length === 0) return;

		startTransition(async () => {
			try {
				for (const targetId of idsToDuplicate) {
					await duplicateEquipment(targetId);
				}
				toast.success(`Скопировано позиций: ${idsToDuplicate.length}`);
				refreshData();
				if (!id) setSelectedIds(new Set());
			} catch {
				toast.error("Ошибка при копировании");
			}
		});
	};

	const handleExport = async () => {
		startTransition(async () => {
			try {
				const data = await exportEquipment(
					selectedIds.size > 0 ? Array.from(selectedIds) : undefined
				);
				const blob = new Blob([JSON.stringify(data, null, 2)], {
					type: "application/json",
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `equipment-export-${new Date().toISOString()}.json`;
				a.click();
				URL.revokeObjectURL(url);
				toast.success("Экспорт завершён");
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Ошибка экспорта");
			}
		});
	};

	return (
		<div className="container mx-auto max-w-6xl px-4 py-10 space-y-6">
			{/* Header */}
			<div className="px-3 py-4 flex items-start justify-between gap-4">
				<div className="flex items-center gap-2.5">
					<CameraIcon size={20} weight="duotone" />
					<h1 className="text-2xl font-black italic uppercase tracking-tighter">
						Техника
					</h1>
					{selectedIds.size > 0 && (
						<Badge className="h-8 pr-0 gap-1 text-[10px] font-bold bg-secondary text-muted-foreground rounded-2xl">
							<span>{formatPlural(selectedIds.size, "items")} </span>{" "}
							<Tooltip>
								<TooltipTrigger>
									<Button
										asChild
										variant="ghost"
										size="icon"
										onClick={() => handleDelete()}
										disabled={isPending}
										className="rounded-l-2xl rounded-r-lg p-2"
									>
										<TrashIcon size={4} />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									<p>Удалить</p>
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger>
									<Button
										asChild
										variant="ghost"
										size="icon"
										onClick={handleExport}
										disabled={isPending}
										className="rounded-lg p-2"
									>
										<UploadSimpleIcon size={4} />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									<p>Экспортировать</p>
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger>
									<Button
										asChild
										variant="ghost"
										size="icon"
										onClick={() => handleDuplicate()}
										disabled={isPending}
										className="rounded-r-2xl rounded-l-lg p-2"
									>
										<CopySimpleIcon size={4} />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="bottom">
									<p>Копировать</p>
								</TooltipContent>
							</Tooltip>
						</Badge>
					)}
				</div>

				{/* Add button */}
				<Button
					aria-label="Добавить новую технику"
					onClick={() => setShowCreateSheet(true)}
					size="sm"
					className="sm:flex h-9 gap-2 font-bold"
				>
					<PlusIcon size={14} weight="bold" />
				</Button>
			</div>

			{/* Toolbar Card */}
			<Card className="p-2 shadow-none!">
				<CardContent className="px-0 space-y-3 justify-between">
					<div className="flex flex-col lg:flex-row items-center gap-2 flex-wrap">
						<div className="flex flex-col flex-1 w-full sm:max-w-sm">
							<InlineSearchInput
								value={search}
								onChange={setSearchTerm}
								className="glass-input"
								placeholder="Название или инв. номер..."
								fetchSuggestion={async (q) => {
									const results = await getAutocompleteAction("equipment", q);
									return results[0] || null;
								}}
							/>
						</div>
						<div className="flex gap-2 w-full sm:w-auto items-center flex-wrap justify-between">
							{/* Filters */}
							<div className="flex items-center gap-1 rounded-lg border border-foreground/10 bg-foreground/5 p-1">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="tab"
											size="sm"
											className={cn(
												"h-7",
												filters.length > 0 && "border-primary"
											)}
										>
											<FunnelSimpleIcon size={13} />{" "}
											<span className="hidden md:inline">Фильтры</span>
											{filters.length > 0 && (
												<Badge
													variant="outline"
													className="ml-1 h-4 px-1 text-[9px]"
												>
													{filters.length}
												</Badge>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-auto backdrop-blur-xl p-0"
										align="start"
									>
										<FilterBuilder
											filters={filters}
											onFiltersChange={setFilters}
											categories={categories}
										/>
									</PopoverContent>
								</Popover>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="tab"
											size="sm"
											className={cn(
												"h-7",
												sorts.length > 0 && "border-primary"
											)}
										>
											<SortDescendingIcon size={13} />{" "}
											<span className="hidden md:inline">Сортировка</span>
											{sorts.length > 0 && (
												<Badge
													variant="outline"
													className="ml-1 h-4 px-1 text-[9px]"
												>
													{sorts.length}
												</Badge>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-100 backdrop-blur-xl"
										align="start"
									>
										<SortBuilder sorts={sorts} onSortChange={setSorts} />
									</PopoverContent>
								</Popover>
							</div>

							{/* View mode toggle */}
							<div className="flex items-center gap-1 rounded-lg border border-foreground/10 bg-foreground/5 p-1">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="tab"
											size="sm"
											onClick={() => setViewMode("compact")}
											className={cn(
												"h-7 flex gap-1.5 transition-colors",
												viewMode === "compact"
													? "bg-background text-foreground shadow-md"
													: "text-muted-foreground hover:text-foreground"
											)}
										>
											<ColumnsIcon size={13} />{" "}
											<span className="hidden md:inline">Сжатый</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent className="text-xs">
										Компактный вид таблицы
									</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="tab"
											size="sm"
											onClick={() => setViewMode("extended")}
											className={cn(
												"h-7 flex gap-1.5 transition-colors",
												viewMode === "extended"
													? "bg-background text-foreground shadow-md"
													: "text-muted-foreground hover:text-foreground"
											)}
										>
											<ColumnsPlusRightIcon size={13} />{" "}
											<span className="hidden md:inline">Полный</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent className="text-xs">
										Полноразмерный вид таблицы
									</TooltipContent>
								</Tooltip>
							</div>
							<div className="flex items-center gap-2 rounded-lg">
								{/* Quick: isPrimary sort */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											className={cn(
												"h-9 gap-1.5 text-xs",
												sorts.some((s) => s.column === "isPrimary")
													? "border-amber-400 text-primary-accent bg-secondary/30"
													: "text-muted-foreground"
											)}
											onClick={() => {
												const hasPrimarySort = sorts.some(
													(s) => s.column === "isPrimary"
												);
												setSorts(
													hasPrimarySort
														? sorts.filter((s) => s.column !== "isPrimary")
														: [
																{ column: "isPrimary", ascending: false },
																...sorts,
															]
												);
											}}
										>
											<StarIcon
												size={13}
												weight={
													sorts.some((s) => s.column === "isPrimary")
														? "fill"
														: "light"
												}
												className={cn(
													sorts.some((s) => s.column === "isPrimary")
														? "text-amber-400 fill-amber-400"
														: "text-muted-foreground"
												)}
											/>
										</Button>
									</TooltipTrigger>
									<TooltipContent className="text-xs">
										Отображаются на сайте
									</TooltipContent>
								</Tooltip>

								{/* Quick: isFeatured filter */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className={cn(
												"h-9 gap-1.5 text-xs",
												filters.some(
													(f) => f.column === "isFeatured" && f.value === true
												)
													? "border-violet-400 text-violet-400 bg-secondary/30"
													: "text-muted-foreground"
											)}
											onClick={() => {
												const hasFilter = filters.some(
													(f) => f.column === "isFeatured" && f.value === true
												);
												setFilters(
													hasFilter
														? filters.filter((f) => f.column !== "isFeatured")
														: [
																...filters,
																{
																	column:
																		"isFeatured" as EquipmentFilter["column"],
																	operator: "eq" as const,
																	value: true,
																},
															]
												);
											}}
										>
											<SparkleIcon
												size={13}
												weight={
													filters.some(
														(f) => f.column === "isFeatured" && f.value === true
													)
														? "fill"
														: "light"
												}
												className={cn(
													filters.some(
														(f) => f.column === "isFeatured" && f.value === true
													)
														? "text-violet-400"
														: "text-muted-foreground"
												)}
											/>
										</Button>
									</TooltipTrigger>
									<TooltipContent className="text-xs">
										В "Популярном" на главной странице
									</TooltipContent>
								</Tooltip>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Summary strip */}
			<div className="flex items-center gap-4 text-sm text-muted-foreground px-3 justify-between min-h-8">
				<span>
					Найдено: <strong className="text-foreground">{totalCount}</strong>
				</span>
				{selectedIds.size > 0 && (
					<span className="text-primary font-medium">
						Выбрано: {selectedIds.size}
					</span>
				)}
				<div className="flex flex-1 flex-col sm:flex-row justify-between items-center pt-1 border-foreground/5 w-full">
					{/* Active filter chips */}
					{(filters.length > 0 || sorts.length > 0) && (
						<div className="flex flex-wrap gap-1.5 items-center">
							<span className="text-[10px] text-muted-foreground py-2">
								Активные:
							</span>
							{filters.map((f, i) => (
								<span
									key={i}
									className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-primary-accent text-[10px] font-medium border border-primary/50"
								>
									{f.column ?? "фильтр"}
									<button
										type="button"
										onClick={() =>
											setFilters(filters.filter((_, j) => j !== i))
										}
										className="hover:text-destructive/60 cursor-pointer"
									>
										<XIcon size={10} />
									</button>
								</span>
							))}
							<button
								type="button"
								onClick={() => {
									setFilters([]);
									setSorts([]);
								}}
								className="flex items-center border gap-1 pl-2 pr-1 py-0.5 rounded-full border-muted-foreground/50 text-[10px] text-muted-foreground hover:text-foreground hover:bg-destructive/5 cursor-pointer"
							>
								Сбросить все <TrashIcon size={10} />
							</button>
						</div>
					)}
				</div>
				{isFetching && !isLoading && (
					<span className="text-primary-accent/60 flex items-center gap-1">
						<span className="w-2 h-2 border border-primary/40 border-t-primary rounded-full animate-spin" />
						Обновление
					</span>
				)}
				{totalPages > 1 && (
					<div className="flex items-center gap-2 md:ml-auto w-auto">
						<span className="text-xs text-muted-foreground hidden sm:inline">
							Страница {page} из {totalPages}
						</span>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page === 1}
								onClick={() => setPage((p) => p - 1)}
							>
								<span className="hidden md:inline">Назад</span>
								<ArrowLeftIcon size={13} className="md:hidden" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								<span className="hidden md:inline">Вперед</span>
								<ArrowRightIcon size={13} className="md:hidden" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{totalCount === 0 && !isPending && !isLoading ? (
				<div className="flex flex-col w-full items-center justify-center space-y-4 py-8 text-center">
					<p className="text-3xl italic">Нет результатов</p>
					<p className="text-muted-foreground">
						Попробуйте обновить поиск или сбросить фильтры
					</p>
				</div>
			) : (
				<div className="px-3">
					<Card className="overflow-hidden relative rounded-lg">
						{/* NpLoader (Top Loading Bar) */}
						<div
							className={cn(
								"absolute top-0 left-0 w-full h-2 z-50 bg-primary/10 overflow-hidden transition-opacity duration-300",
								isFetching ? "opacity-100" : "opacity-0"
							)}
						>
							<div className="h-full bg-primary w-1/2 rounded-full animate-[pulse_1s_ease-in-out_infinite] origin-left" />
						</div>

						<div className="overflow-x-auto">
							<Table className="w-full backdrop-blur-2xl rounded-xl overflow-hidden">
								<TableHeader
									className={cn(
										"bg-muted-foreground/20 rounded-2xl",
										isFetching &&
											!isLoading &&
											"opacity-80 transition-opacity duration-200"
									)}
								>
									<TableRow className="font-black">
										<TableHead className="w-10">
											<Checkbox
												checked={
													items.length > 0 && selectedIds.size === items.length
												}
												onCheckedChange={(checked) => {
													setSelectedIds(
														checked
															? new Set(items.map((i) => i.id))
															: new Set()
													);
												}}
											/>
										</TableHead>
										<TableHead className="w-12 text-amber-50" />
										<TableHead
											className="min-w-45 cursor-pointer select-none hover:text-foreground transition-colors"
											onClick={() => handleHeaderSort("title")}
										>
											<span className="flex items-center gap-1">
												Наименование
												<SortIcon column="title" sorts={sorts} />
											</span>
										</TableHead>
										<TableHead
											className="min-w-27.5 cursor-pointer select-none hover:text-foreground transition-colors"
											onClick={() => handleHeaderSort("categoryId")}
										>
											<span className="flex items-center gap-1">
												Категория <SortIcon column="categoryId" sorts={sorts} />
											</span>
										</TableHead>
										<TableHead className="min-w-30">Подкатегория</TableHead>
										<TableHead
											className="min-w-22.5 cursor-pointer select-none hover:text-foreground transition-colors"
											onClick={() => handleHeaderSort("pricePerDay")}
										>
											<span className="flex items-center gap-1">
												Цена/сут <SortIcon column="pricePerDay" sorts={sorts} />
											</span>
										</TableHead>
										<TableHead
											className="min-w-32 cursor-pointer select-none hover:text-foreground transition-colors"
											onClick={() => handleHeaderSort("status")}
										>
											<span className="flex items-center gap-1">
												Доступность <SortIcon column="status" sorts={sorts} />
											</span>
										</TableHead>

										{viewMode === "extended" && (
											<>
												<TableHead className="min-w-24">4ч / 8ч</TableHead>
												<TableHead
													className="min-w-22 cursor-pointer select-none hover:text-foreground transition-colors"
													onClick={() => handleHeaderSort("deposit")}
												>
													<span className="flex items-center gap-1">
														Депозит <SortIcon column="deposit" sorts={sorts} />
													</span>
												</TableHead>
												<TableHead
													className="min-w-28 cursor-pointer select-none hover:text-foreground transition-colors"
													onClick={() => handleHeaderSort("replacementValue")}
												>
													<span className="flex items-center gap-1">
														Замена{" "}
														<SortIcon column="replacementValue" sorts={sorts} />
													</span>
												</TableHead>
												<TableHead className="min-w-24">Владение</TableHead>
												<TableHead className="min-w-20">Инв. №</TableHead>
											</>
										)}
										<TableHead className="w-12 text-right">Действия</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading
										? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
												<TableRowSkeleton key={i} />
											))
										: items.map((item) => {
												const siblings =
													(
														item as DbEquipmentWithImages & {
															siblingCount?: number;
														}
													).siblingCount ?? 1;
												const hasSiblings = siblings > 1;
												const categoryName = getCategoryName(item.categoryId);
												const subcategoryName = getSubcategoryName(
													item.subcategoryId ?? ""
												);

												return (
													<TableRow
														key={item.id}
														className={cn(
															"group hover:bg-foreground/3 border-foreground/5 transition-colors cursor-pointer",
															selectedIds.has(item.id) && "bg-primary/10"
														)}
														onClick={() => {
															setActiveEquipment(item);
														}}
													>
														<TableCell onClick={(e) => e.stopPropagation()}>
															<Checkbox
																checked={selectedIds.has(item.id)}
																onCheckedChange={() => toggleSelect(item.id)}
															/>
														</TableCell>
														<TableCell>
															<div className="relative w-10 h-10 rounded overflow-hidden border border-white/10 bg-zinc-400/15 shrink-0">
																<Image
																	src={
																		item.equipmentImageLinks?.[0]?.image?.url ??
																		(
																			item as unknown as {
																				imageUrlFallback?: string;
																			}
																		).imageUrlFallback ??
																		"/placeholder-equipment.png"
																	}
																	alt="placeholder"
																	fill
																	sizes="40px"
																	className="object-cover"
																/>
															</div>
														</TableCell>
														<TableCell className="font-medium">
															<div className="flex flex-col gap-0.5">
																<div className="flex items-center gap-1.5">
																	{/* Быстрый переключатель isPrimary */}
																	<PrimaryToggle
																		id={item.id}
																		isPrimary={!!item.isPrimary}
																		onRefresh={refreshData}
																	/>
																	{/* Витрина isFeatured */}
																	<FeaturedToggle
																		id={item.id}
																		isFeatured={
																			!!(
																				item as unknown as {
																					isFeatured?: boolean;
																				}
																			).isFeatured
																		}
																		onRefresh={refreshData}
																	/>

																	<span className="truncate max-w-50">
																		{item.title}
																	</span>
																	{hasSiblings && (
																		<Badge
																			variant="secondary"
																			className="h-4 py-0 px-1.5 text-[10px] shrink-0 text-muted-foreground"
																		>
																			×{siblings}
																		</Badge>
																	)}
																</div>
																{viewMode === "compact" && (
																	<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
																		{item.inventoryNumber}
																	</span>
																)}
															</div>
														</TableCell>
														<TableCell>
															{categoryName && (
																<Badge
																	variant="outline"
																	className="bg-background text-[10px] font-normal"
																>
																	{categoryName}
																</Badge>
															)}
														</TableCell>
														<TableCell>
															{subcategoryName && (
																<Badge
																	variant="outline"
																	className="bg-background/50 text-[10px] font-normal border-foreground/10 text-muted-foreground"
																>
																	{subcategoryName}
																</Badge>
															)}
														</TableCell>
														<TableCell className="text-sm">
															{fmtRub(item.pricePerDay)}
														</TableCell>
														<TableCell onClick={(e) => e.stopPropagation()}>
															<AvailabilityToggle
																id={item.id}
																isAvailable={item.isAvailable}
																onRefresh={refreshData}
															/>
														</TableCell>

														{viewMode === "extended" && (
															<>
																<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
																	{item.price4h
																		? `${fmtRub(item.price4h)}`
																		: "—"}{" "}
																	/{" "}
																	{item.price8h
																		? `${fmtRub(item.price8h)}`
																		: "—"}
																</TableCell>
																<TableCell className="text-xs text-muted-foreground">
																	{fmtRub(item.deposit)
																		? `${fmtRub(item.deposit)}`
																		: "—"}
																</TableCell>
																<TableCell className="text-xs text-muted-foreground">
																	{item.replacementValue
																		? `${fmtRub(item.replacementValue)}`
																		: "—"}
																</TableCell>
																<TableCell>
																	<Badge
																		variant="outline"
																		className={cn(
																			"text-[10px] border-white/10",
																			item.ownershipType === "SUBLEASE"
																				? "text-violet-400"
																				: "text-muted-foreground"
																		)}
																	>
																		{item.ownershipType === "SUBLEASE"
																			? "Субаренда"
																			: "Своё"}
																	</Badge>
																</TableCell>
																<TableCell className="text-[10px] text-muted-foreground font-mono">
																	{item.inventoryNumber ?? "—"}
																</TableCell>
															</>
														)}
														<TableCell
															className="text-right"
															onClick={(e) => e.stopPropagation()}
														>
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button
																		variant="ghost"
																		size="icon"
																		className="h-8 w-8 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
																	>
																		<DotsThreeVerticalIcon className="h-4 w-4" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent
																	align="end"
																	className="w-48 bg-foreg/20 border-white/10 brightness-125 rounded-2xl"
																>
																	<DropdownMenuItem
																		className="rounded-2xl"
																		onClick={() => setActiveEquipment(item)}
																	>
																		<PencilSimpleIcon
																			weight="duotone"
																			className="w-4 h-4 mr-2"
																		/>{" "}
																		Редактировать
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		className="rounded-2xl"
																		onClick={() => handleDuplicate(item.id)}
																	>
																		<CopySimpleIcon
																			weight="duotone"
																			className="w-4 h-4 mr-2"
																		/>{" "}
																		Создать копию
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		className="text-red-500 focus:text-red-500 rounded-2xl"
																		onClick={() => handleDelete(item.id)}
																	>
																		<TrashIcon
																			weight="duotone"
																			className="w-4 h-4 mr-2"
																		/>{" "}
																		Удалить позицию
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

						{totalPages > 1 && (
							<div className="flex items-center justify-between px-4 py-3 bg-foreground/10 rounded-md border-foreground/5 mt-2">
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
				</div>
			)}

			{activeEquipment && (
				<EquipmentSheet
					key={activeEquipment.id}
					mode="edit"
					equipment={activeEquipment}
					categories={categories}
					open={!!activeEquipment}
					onOpenChange={(open) => {
						if (!open) {
							markClean();
							setActiveEquipment(null);
						}
					}}
					onSuccess={() => refreshData()}
					onCategoriesChange={() => getCategoriesFromDb().then(setCategories)}
					hasSiblings={
						((
							activeEquipment as DbEquipmentWithImages & {
								siblingCount?: number;
							}
						).siblingCount ?? 1) > 1
					}
				/>
			)}

			<AlertDialog
				open={duplicateId !== null}
				onOpenChange={() => setDuplicateId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Создать копию позиции?</AlertDialogTitle>
						<AlertDialogDescription>
							Будет создана копия выбранной позиции с новым инвентарным номером.
							Все изображения и данные будут скопированы.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Отмена</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => duplicateId && handleDuplicate(duplicateId)}
							disabled={isPending}
						>
							Создать копию
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						onClick={() => setShowCreateSheet(true)}
						className={cn(
							"fixed sm:hidden bottom-18 right-6 z-50 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 group bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 active:scale-95 flex items-center justify-center",
							selectedIds.size > 0 && "w-auto px-5 gap-2 rounded-full"
						)}
					>
						<PlusIcon
							className={cn(
								"transition-transform duration-300 group-hover:scale-150",
								selectedIds.size > 0 ? "h-4 w-4" : "h-6 w-6"
							)}
						/>
						{selectedIds.size === 0 && (
							<span className="sr-only">Добавить технику</span>
						)}
						{selectedIds.size > 0 && (
							<span className="text-sm font-semibold whitespace-nowrap">
								Добавить технику
							</span>
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="left" className="text-xs">
					Добавить новую технику
				</TooltipContent>
			</Tooltip>

			<EquipmentSheet
				mode="create"
				categories={categories}
				open={showCreateSheet}
				onOpenChange={(open) => {
					if (!open) markClean();
					setShowCreateSheet(open);
				}}
				onSuccess={() => {
					refreshData();
					setShowCreateSheet(false);
				}}
				onCategoriesChange={() => getCategoriesFromDb().then(setCategories)}
			/>
		</div>
	);
}
