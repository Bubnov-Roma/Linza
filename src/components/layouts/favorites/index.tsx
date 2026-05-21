"use client";

import { HeartIcon, PlusIcon } from "@phosphor-icons/react";
import { CardsThreeIcon } from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import {
	deleteSetAction,
	fetchFavoritesAction,
	fetchGroupedEquipmentMapAction,
	fetchSetsAction,
	removeFavoriteAction,
} from "@/actions/favorites-actions";
import { EmptyState } from "@/components/layouts/favorites/EmptyState";
import { SetCard } from "@/components/layouts/favorites/SetCard";
import { EquipmentCard } from "@/components/shared/EquipmentCard";
import { Button } from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart.store";
import { FavoriteSetEditor } from "./FavoriteSetEditor";
import type { EquipmentSet, FavoriteItem } from "./types";

// ─── Normalizer ───────────────────────────────────────────────────────────────

// Строит GroupedEquipment из одиночной строки join + map с реальными счётчиками.
export function getFavoriteGrouped(
	fav: FavoriteItem,
	groupedMap: Map<string, GroupedEquipment>
): GroupedEquipment {
	// Приоритет — полноценный GroupedEquipment из глобального map
	const fromMap = groupedMap.get(fav.equipmentId);
	if (fromMap) return fromMap;

	// Fallback: map ещё не загружен, собираем из join-данных
	const eq = fav.equipment;
	const links = eq?.equipmentImageLinks ?? [];
	const imagesData = links.map((l) => l.image).filter(Boolean);
	const imageUrls = imagesData.map((img) => img.url);

	// Возвращаем полный объект GroupedEquipment
	return {
		...eq,
		description: eq.description || "Нет описания",
		kit: eq.kitDescription ?? null,
		imageUrl: imageUrls[0] ?? "/placeholder-equipment.png",
		images: imageUrls,
		imagesData: imagesData,
		totalCount: 1,
		availableCount: eq.status === "AVAILABLE" && eq.isAvailable ? 1 : 0,
		allUnitIds: [fav.equipmentId],
		rating: 5, // Заглушка, если нет реальных отзывов
		reviewsCount: 0,
		specifications: (eq.specifications as Record<string, unknown>) || {},
		comments: eq.comments || [],
	};
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "favorites" | "sets";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientFavoritesPage() {
	const [activeTab, setActiveTab] = useState<Tab>("favorites");
	const [editingSet, setEditingSet] = useState<EquipmentSet | null>(null);
	const [creatingSet, setCreatingSet] = useState(false);
	const queryClient = useQueryClient();
	const addItem = useCartStore((s) => s.addItem);

	// SSR-prefetched data as initialData — no loading flash on first render
	const { data: favorites = [] } = useQuery({
		queryKey: ["favorites"],
		queryFn: fetchFavoritesAction,
		staleTime: 1000 * 60 * 2,
	});

	const { data: sets = [] } = useQuery({
		queryKey: ["equipment-sets"],
		queryFn: fetchSetsAction,
		staleTime: 1000 * 60 * 2,
	});

	const { data: groupedMap = new Map() } = useQuery({
		queryKey: ["equipment-grouped-map"],
		queryFn: async () => new Map(await fetchGroupedEquipmentMapAction()),
		staleTime: 1000 * 60 * 5,
	});

	const removeFavMutation = useMutation({
		mutationFn: removeFavoriteAction,
		onError: () => {
			queryClient.invalidateQueries({ queryKey: ["favorites"] });
			toast.error("Не удалось удалить из избранного");
		},
	});

	const handleRemoveFav = (fav: FavoriteItem) => {
		queryClient.setQueryData<FavoriteItem[]>(["favorites"], (old = []) =>
			old.filter((f) => f.id !== fav.id)
		);
		removeFavMutation.mutate(fav.id);
		toast.arguments(`Удалено из избранного`, {});
	};

	const deleteSetMutation = useMutation({
		mutationFn: deleteSetAction,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["equipment-sets"] });
			toast.success("Сет удалён");
		},
	});

	const tabs = [
		{
			id: "favorites" as Tab,
			label: "Избранное",
			icon: HeartIcon,
			count: favorites.length,
		},
		{
			id: "sets" as Tab,
			label: "Сеты",
			icon: CardsThreeIcon,
			count: sets.length,
		},
	];

	const isEmptyFavs = favorites.length === 0;
	const isEmptySets = sets.length === 0;
	const isEmptyFavsAndSets = isEmptySets && isEmptyFavs;
	return (
		<>
			<div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic">
							Избранное
						</h1>
						<p className="text-muted-foreground mt-1 text-sm">
							Сохранённая техника и сеты
						</p>
					</div>
					{activeTab === "sets" && !isEmptyFavs && (
						<Button
							onClick={() => setCreatingSet(true)}
							className="rounded-full gap-2 shrink-0"
							size="icon-lg"
						>
							<PlusIcon size={16} />
							<span className="hidden sm:inline">Новый сет</span>
						</Button>
					)}
				</div>

				{/* Tabs */}
				<div className="tabs-group w-full sm:w-fit">
					{tabs.map(({ id, label, icon: Icon, count }) => (
						<Button
							key={id}
							variant="tab"
							type="button"
							onClick={() => setActiveTab(id)}
							className={cn(
								"min-w-36 items-start transition-all duration-300 w-full flex-1 mx-auto",
								activeTab === id
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							<Icon size={15} weight={activeTab === id ? "fill" : "regular"} />
							{label}
							{count > 0 && (
								<span
									className={cn(
										"flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold px-1",
										activeTab === id
											? "bg-foreground/10 text-foreground/80"
											: "bg-foreground/10"
									)}
								>
									{count}
								</span>
							)}
						</Button>
					))}
				</div>

				{/* Content */}
				<AnimatePresence mode="wait">
					{activeTab === "favorites" ? (
						<motion.div
							key="favs"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.18 }}
						>
							{isEmptyFavs ? (
								<EmptyState
									icon={HeartIcon}
									title="Пусто"
									description="Сохраняйте любимую технику в избранное чтобы всегда иметь под рукой"
									action={{
										label: "Добавить избранное",
										href: "/equipment",
									}}
								/>
							) : (
								<div className="grid grid-cols sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4">
									{favorites.map((fav) => {
										const grouped = getFavoriteGrouped(fav, groupedMap);
										return (
											<EquipmentCard
												key={fav.id}
												item={grouped}
												variant="favorites"
												onFavoriteToggle={(e) => {
													e.preventDefault();
													e.stopPropagation();
													handleRemoveFav(fav);
												}}
											/>
										);
									})}
								</div>
							)}
						</motion.div>
					) : (
						<motion.div
							key="sets"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.18 }}
						>
							{isEmptySets && !isEmptyFavsAndSets && (
								<EmptyState
									icon={CardsThreeIcon}
									title="Нет сетов"
									description="Собирайте сеты из избранного под разные сценарии съемок"
									action={{
										label: "Создать сет",
										onClick: () => setCreatingSet(true),
									}}
								/>
							)}
							{isEmptyFavsAndSets && (
								<EmptyState
									icon={CardsThreeIcon}
									title="Нет сетов"
									description="Добаьте любимые позиции в избранное чтобы собрать из них сет"
									action={{
										label: "Найти избранное",
										href: "/equipment",
									}}
								/>
							)}
							{
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{sets.map((set) => (
										<SetCard
											groupedMap={groupedMap}
											key={set.id}
											set={set}
											favorites={favorites}
											onEdit={() => setEditingSet(set)}
											onDelete={() => deleteSetMutation.mutate(set.id)}
											onAddAllToCart={(items) => {
												for (const i of items) addItem(i);
												toast.success(`${items.length} позиций в корзине`, {
													action: {
														label: "В корзину →",
														onClick: () => {
															window.location.href = "/checkout";
														},
													},
												});
											}}
										/>
									))}
								</div>
							}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<FavoriteSetEditor
				isOpen={creatingSet}
				onClose={() => setCreatingSet(false)}
				favorites={favorites}
			/>
			{editingSet && (
				<FavoriteSetEditor
					isOpen
					onClose={() => setEditingSet(null)}
					existingSet={editingSet}
					favorites={favorites}
				/>
			)}
		</>
	);
}
