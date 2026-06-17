"use client";
import {
	CardsThreeIcon,
	CheckIcon,
	MinusIcon,
	PackageIcon,
	PlusIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { clientAutocompleteEquipmentAction } from "@/actions/autocomplete-actions";
import { clientSearchEquipmentAction } from "@/actions/client-equipment-actions";
import {
	fetchEquipmentByIdsAction,
	saveSetAction,
} from "@/actions/favorites-actions";
import {
	Button,
	InlineSearchInput,
	Input,
	Label,
	Textarea,
} from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { cn, fmtRub } from "@/lib/utils";
import type { EquipmentSet, FavoriteItem } from "./types";

interface SetItem {
	equipmentId: string;
	quantity: number;
}

interface Props {
	isOpen: boolean;
	onClose: () => void;
	existingSet?: EquipmentSet;
	favorites: FavoriteItem[];
}

// ─── Editor ──────────────────────────────────────────────────────────────────
export function FavoriteSetEditor({
	isOpen,
	onClose,
	existingSet,
	favorites,
}: Props) {
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedItems, setSelectedItems] = useState<SetItem[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	const [debouncedQuery, setDebouncedQuery] = useState("");
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(searchQuery), 200);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	useEffect(() => {
		if (isOpen) {
			setName(existingSet?.name ?? "");
			setDescription(existingSet?.description ?? "");
			setSelectedItems(existingSet?.items ?? []);
			setSearchQuery("");
			setDebouncedQuery("");
		}
	}, [isOpen, existingSet]);

	// Поиск по каталогу
	const { data: searchResults = [], isFetching: isSearchFetching } = useQuery({
		queryKey: ["set-editor-search", debouncedQuery],
		queryFn: () => clientSearchEquipmentAction(debouncedQuery),
		enabled: debouncedQuery.length >= 2,
		staleTime: 1000 * 60 * 2,
		placeholderData: (prev) => prev,
	});

	// 🌟 РЕШЕНИЕ ПРОБЛЕМЫ: Вычисляем ID позиций из сета, которых нет в избранном
	const missingEquipmentIds = useMemo(() => {
		if (!existingSet?.items) return [];
		const favoriteIds = new Set(favorites.map((f) => f.equipmentId));
		return existingSet.items
			.map((item) => item.equipmentId)
			.filter((id) => !favoriteIds.has(id));
	}, [existingSet, favorites]);

	// 🌟 РЕШЕНИЕ ПРОБЛЕМЫ: Подгружаем данные о позициях каталога, которых нет в избранном
	const { data: missingEquipment = [], isLoading: isMissingLoading } = useQuery(
		{
			queryKey: ["set-editor-missing-equipment", missingEquipmentIds],
			queryFn: () => fetchEquipmentByIdsAction(missingEquipmentIds),
			enabled: isOpen && missingEquipmentIds.length > 0,
			staleTime: 1000 * 60 * 5,
		}
	);

	const saveMutation = useMutation({
		mutationFn: saveSetAction,
		onSuccess: (result) => {
			if (!result.success) {
				toast.error(result.error ?? "Ошибка сохранения");
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["equipment-sets"] });
			toast.success(existingSet ? "Комплект обновлён" : "Комплект создан");
			onClose();
		},
		onError: (err) => {
			console.error("saveSet mutation error:", err);
			toast.error("Ошибка сохранения");
		},
	});

	// Переписываем displayItems так, чтобы он учитывал missingEquipment
	const displayItems: GroupedEquipment[] = useMemo(() => {
		if (debouncedQuery.length >= 2) {
			return searchResults;
		}

		// Если строка поиска пуста — собираем массив из всех доступных источников
		return selectedItems
			.map((si) => {
				// 1. Ищем в результатах поиска (из кэша)
				const cached = queryClient
					.getQueriesData<GroupedEquipment[]>({
						queryKey: ["set-editor-search"],
					})
					.flatMap(([, d]) => d ?? [])
					.find((g) => g.id === si.equipmentId);
				if (cached) return cached;

				// 2. Ищем в избранном
				const fav = favorites.find(
					(f) => f.equipmentId === si.equipmentId
				)?.equipment;
				if (fav) return fav as unknown as GroupedEquipment;

				// 3. Ищем в подгруженных недостающих позициях из каталога
				const missing = missingEquipment.find((m) => m.id === si.equipmentId);
				if (missing) return missing;

				return null;
			})
			.filter(Boolean) as GroupedEquipment[];
	}, [
		debouncedQuery,
		searchResults,
		selectedItems,
		queryClient,
		favorites,
		missingEquipment,
	]);

	const totalPrice = useMemo(
		() =>
			selectedItems.reduce((acc, item) => {
				const eq =
					displayItems.find((g) => g.id === item.equipmentId) ||
					favorites.find((f) => f.equipmentId === item.equipmentId)
						?.equipment ||
					missingEquipment.find((m) => m.id === item.equipmentId);
				return acc + (eq?.pricePerDay ?? 0) * item.quantity;
			}, 0),
		[selectedItems, displayItems, favorites, missingEquipment]
	);

	const getQty = (id: string) =>
		selectedItems.find((i) => i.equipmentId === id)?.quantity ?? 0;

	const setQty = useCallback((id: string, qty: number, maxQty: number) => {
		const clampedQty = Math.min(qty, maxQty);
		if (clampedQty <= 0) {
			setSelectedItems((p) => p.filter((i) => i.equipmentId !== id));
		} else {
			setSelectedItems((p) => {
				const ex = p.find((i) => i.equipmentId === id);
				if (ex)
					return p.map((i) =>
						i.equipmentId === id ? { ...i, quantity: clampedQty } : i
					);
				return [...p, { equipmentId: id, quantity: clampedQty }];
			});
		}
	}, []);

	const handleSave = () => {
		if (!name.trim()) {
			toast.error("Введите название");
			return;
		}
		if (!selectedItems.length) {
			toast.error("Добавьте хотя бы одну позицию");
			return;
		}

		saveMutation.mutate({
			id: existingSet?.id || "",
			name: name.trim(),
			description: description.trim(),
			items: selectedItems,
			totalPricePerDay: totalPrice,
		});
	};

	if (!isOpen) return null;

	const isInitialLoading = isMissingLoading && missingEquipmentIds.length > 0;
	const showEmpty =
		debouncedQuery.length >= 2 &&
		!isSearchFetching &&
		searchResults.length === 0;
	const showHint = debouncedQuery.length < 2 && selectedItems.length === 0;

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="absolute inset-0 bg-background/80 backdrop-blur-xs"
					onClick={onClose}
				/>

				<motion.div
					initial={{ opacity: 0, y: 48, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 48, scale: 0.97 }}
					transition={{ type: "spring", stiffness: 380, damping: 32 }}
					className="card-surface relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md"
				>
					{/* Mobile handle */}
					<div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
						<div className="w-10 h-1 rounded-full bg-foreground/15" />
					</div>

					{/* Header */}
					<div className="flex items-center justify-between px-5 py-3.5 border-b border-foreground/5 shrink-0">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-xl bg-background/20 flex items-center justify-center shrink-0">
								<CardsThreeIcon
									size={15}
									className="text-foreground"
									weight="duotone"
								/>
							</div>
							<h2 className="font-bold">
								{existingSet ? "Редактировать сет" : "Новый сет"}
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors"
						>
							<XIcon size={15} className="text-muted-foreground" />
						</button>
					</div>

					{/* Body */}
					<div className="flex-1 overflow-y-auto">
						{/* Название и описание */}
						<div className="px-5 pt-4 pb-3 space-y-3">
							<div className="space-y-1.5">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
									Название
								</Label>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Например: Кинокомплект для интервью"
									className="glass-input"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
									Описание{" "}
									<span className="normal-case text-muted-foreground/30">
										(опционально)
									</span>
								</Label>
								<Textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Для чего этот набор?"
									rows={2}
									className="w-full rounded-2xl resize-none glass-input"
								/>
							</div>
						</div>

						{/* Разделитель */}
						<div className="px-5 pb-3">
							<div className="flex items-center gap-3">
								<div className="h-px flex-1 bg-foreground/5" />
								<span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
									Добавить технику
								</span>
								<div className="h-px flex-1 bg-foreground/5" />
							</div>
						</div>

						{/* Поиск по каталогу */}
						<div className="px-5 pb-3">
							<InlineSearchInput
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder="Поиск по каталогу..."
								fetchSuggestion={clientAutocompleteEquipmentAction}
								className="bg-foreground/5 rounded-xl border-none shadow-none"
							/>
							{((debouncedQuery.length >= 2 && isSearchFetching) ||
								isInitialLoading) && (
								<p className="text-[11px] text-muted-foreground/40 mt-1.5 px-1">
									Загрузка данных...
								</p>
							)}
						</div>

						{/* Список результатов */}
						<div className="px-3 pb-4 space-y-0.5">
							{showHint && !isInitialLoading && (
								<div className="py-10 text-center">
									<PackageIcon
										size={28}
										weight="duotone"
										className="mx-auto text-muted-foreground/20 mb-3"
									/>
									<p className="text-sm text-muted-foreground">
										Начните вводить название техники для поиска
									</p>
								</div>
							)}

							{showEmpty && (
								<div className="py-8 text-center">
									<p className="text-sm text-muted-foreground">
										Ничего не найдено по «{debouncedQuery}»
									</p>
								</div>
							)}

							{/* Результаты поиска или добавленные позиции */}
							{!isInitialLoading &&
								displayItems.map((item) => {
									const qty = getQty(item.id);
									const selected = qty > 0;
									const maxQty = item.availableCount || 1;
									const imgUrl =
										item.imageUrl ||
										item.equipmentImageLinks?.[0]?.image?.url ||
										"/placeholder-equipment.png";

									return (
										<div
											key={item.id}
											className={cn(
												"flex items-center gap-3 p-2.5 rounded-xl transition-all",
												selected
													? "bg-primary/3 border border-primary/30"
													: "hover:bg-foreground/5 border border-transparent"
											)}
										>
											<div className="w-11 h-11 rounded-xl overflow-hidden bg-foreground/5 shrink-0">
												<Image
													src={imgUrl}
													alt={item.title ?? ""}
													width={44}
													height={44}
													className="w-full h-full object-cover"
												/>
											</div>

											{/* Text */}
											<button
												type="button"
												className="flex-1 min-w-0 text-left"
												onClick={() => setQty(item.id, qty > 0 ? 0 : 1, maxQty)}
											>
												<div className="flex items-center gap-1.5">
													{selected && (
														<CheckIcon
															size={15}
															className="text-green-500 shrink-0"
														/>
													)}
													<p className="text-sm font-medium truncate">
														{item.title}
													</p>
												</div>
												<p className="text-xs text-muted-foreground mt-0.5">
													{fmtRub(item.pricePerDay)}/сут
													{qty > 1 && (
														<span className="text-primary font-bold">
															{" "}
															× {qty} = {fmtRub(item.pricePerDay * qty)}
														</span>
													)}
													<span className="text-muted-foreground/40 ml-1">
														· {maxQty} шт.
													</span>
												</p>
											</button>

											{/* Stepper */}
											{selected ? (
												<div className="flex items-center gap-1 shrink-0">
													<button
														type="button"
														onClick={() => setQty(item.id, qty - 1, maxQty)}
														className="w-7 h-7 flex items-center justify-center rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors"
													>
														<MinusIcon size={12} />
													</button>
													<span className="w-5 text-center text-sm font-bold">
														{qty}
													</span>
													<button
														type="button"
														onClick={() => setQty(item.id, qty + 1, maxQty)}
														disabled={qty >= maxQty}
														className="w-7 h-7 flex items-center justify-center rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
													>
														<PlusIcon size={12} />
													</button>
												</div>
											) : (
												<button
													type="button"
													onClick={() => setQty(item.id, 1, maxQty)}
													className="w-7 h-7 flex items-center justify-center rounded-lg bg-foreground/5 hover:bg-foreground/20 hover:text-foreground transition-all text-muted-foreground shrink-0"
												>
													<PlusIcon size={12} />
												</button>
											)}
										</div>
									);
								})}

							{/* Вторая секция для позиций, которые не попали в текущий поиск */}
							{debouncedQuery.length >= 2 &&
								selectedItems.length > 0 &&
								selectedItems
									.filter(
										(si) => !displayItems.find((d) => d.id === si.equipmentId)
									)
									.map((si) => {
										// Ищем данные везде, где только можно
										const eqData =
											favorites.find((f) => f.equipmentId === si.equipmentId)
												?.equipment ||
											missingEquipment.find((m) => m.id === si.equipmentId);

										if (!eqData) return null;
										const qty = si.quantity;
										return (
											<div
												key={si.equipmentId}
												className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/3 border border-primary/20 opacity-60"
											>
												<div className="w-11 h-11 rounded-xl overflow-hidden bg-foreground/5 shrink-0">
													<Image
														src={
															eqData.equipmentImageLinks?.[0]?.image?.url ||
															"/placeholder-equipment.png"
														}
														alt={eqData.title ?? ""}
														width={44}
														height={44}
														className="w-full h-full object-cover"
													/>
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate flex items-center gap-1.5">
														<CheckIcon
															size={13}
															className="text-green-500 shrink-0"
														/>
														{eqData.title}
													</p>
													<p className="text-xs text-muted-foreground">
														× {qty} · в сете
													</p>
												</div>
												<button
													type="button"
													onClick={() =>
														setSelectedItems((p) =>
															p.filter((i) => i.equipmentId !== si.equipmentId)
														)
													}
													className="w-7 h-7 flex items-center justify-center rounded-lg bg-foreground/10 hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
												>
													<XIcon size={12} />
												</button>
											</div>
										);
									})}
						</div>
					</div>

					{/* Footer */}
					<div
						className="shrink-0 border-t border-foreground/5 px-5 py-4"
						style={{
							paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
						}}
					>
						<div className="flex items-center justify-between gap-4">
							<div className="text-sm">
								{selectedItems.length > 0 ? (
									<>
										<span className="font-bold">{selectedItems.length}</span>
										<span className="text-muted-foreground">
											{" "}
											поз. ·{" "}
											<span className="font-bold text-foreground">
												{fmtRub(totalPrice)}/сут
											</span>
										</span>
									</>
								) : (
									<span className="text-muted-foreground/50 text-xs">
										Ничего не выбрано
									</span>
								)}
							</div>
							<Button
								onClick={handleSave}
								disabled={saveMutation.isPending || isInitialLoading}
								className="rounded-xl gap-2 shrink-0"
							>
								<CheckIcon size={14} />
								{saveMutation.isPending
									? "Сохранение…"
									: existingSet
										? "Сохранить"
										: "Создать сет"}
							</Button>
						</div>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	);
}
