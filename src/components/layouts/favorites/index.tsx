"use client";

import { CardsThreeIcon, HeartIcon, PlusIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart.store";
import { FavoriteSetEditor } from "./FavoriteSetEditor";
import type { EquipmentSet, FavoriteItem } from "./types";

// ─── Normalizer ───────────────────────────────────────────────────────────────

export function getFavoriteGrouped(
	fav: FavoriteItem,
	groupedMap: Map<string, GroupedEquipment>
): GroupedEquipment {
	const fromMap = groupedMap.get(fav.equipmentId);
	if (fromMap) return fromMap;

	const eq = fav.equipment;
	const links = eq?.equipmentImageLinks ?? [];
	const imagesData = links.map((l) => l.image).filter(Boolean);
	const imageUrls = imagesData.map((img) => img.url);

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
		rating: 5,
		reviewsCount: 0,
		specifications: (eq.specifications as Record<string, unknown>) || {},
		comments: eq.comments || [],
	};
}

// ─── Skeleton Cards ───────────────────────────────────────────────────────────

function FavoriteCardSkeleton() {
	return (
		<div className="relative flex flex-col overflow-hidden rounded-3xl border border-foreground/4 bg-card/60">
			<div className="aspect-4/3 bg-foreground/5 animate-pulse" />
			<div className="px-4 pt-4 pb-2 space-y-2">
				<Skeleton className="h-3.5 w-3/4 rounded" />
				<Skeleton className="h-3 w-1/2 rounded" />
			</div>
			<div className="p-4 pt-2">
				<div className="rounded-2xl bg-foreground/5 animate-pulse h-10" />
			</div>
		</div>
	);
}

function SetCardSkeleton() {
	return (
		<div className="rounded-2xl border border-foreground/5 bg-card/50 overflow-hidden animate-pulse">
			<div className="h-28 bg-foreground/5" />
			<div className="p-4 space-y-3">
				<Skeleton className="h-4 w-2/3 rounded" />
				<Skeleton className="h-3 w-1/2 rounded" />
				<div className="flex items-center justify-between">
					<Skeleton className="h-3 w-24 rounded" />
					<Skeleton className="h-7 w-28 rounded-xl" />
				</div>
			</div>
		</div>
	);
}

function UnavailableFavoriteCard({
	fav,
	onRemove,
}: {
	fav: FavoriteItem;
	onRemove: () => void;
}) {
	const eq = fav.equipment;
	const catalogHref = "/equipment";

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.3 }}
			className="relative flex flex-col overflow-hidden rounded-3xl border border-foreground/10 bg-card/40 backdrop-blur-xl"
		>
			{/* Затемнённая обложка */}
			<div className="aspect-4/3 relative bg-foreground/5 flex items-center justify-center overflow-hidden">
				{eq?.equipmentImageLinks?.[0]?.image?.url ? (
					<Image
						src={eq.equipmentImageLinks[0].image.url}
						alt={eq.title}
						fill
						sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw"
						loading="eager"
						className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale"
					/>
				) : null}
				<div className="relative z-10 text-center px-4 space-y-1">
					<div className="w-10 h-10 rounded-2xl bg-foreground/10 flex items-center justify-center mx-auto mb-2">
						<HeartIcon
							size={18}
							className="text-muted-foreground/40"
							weight="fill"
						/>
					</div>
					<p className="text-xs font-bold text-muted-foreground uppercase tracking-wide select-none">
						Выведено из проката
					</p>
				</div>
			</div>

			{/* Info */}
			<div className="px-4 pt-4 pb-1">
				<p
					className="text-sm font-medium text-muted-foreground/60 line-clamp-2 leading-tight"
					style={{ height: "2.6em" }}
				>
					{eq?.title}
				</p>
			</div>

			{/* Actions */}
			<div className="p-4 pt-4 flex flex-col gap-4">
				<Button asChild variant="outline">
					<Link href={catalogHref}>Найти замену</Link>
				</Button>
				<Button variant="secondary" onClick={onRemove}>
					Удалить из избранного
				</Button>
			</div>
		</motion.div>
	);
}

// ─── Undo Toast ────────────────────────────────────────────────────────────────

const UNDO_DELAY_MS = 4000;

type Tab = "favorites" | "sets";

const TAB_STORAGE_KEY = "favorites_active_tab";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientFavoritesPage() {
	const [isMounted, setIsMounted] = useState(false);
	const [activeTab, setActiveTab] = useState<Tab>("favorites");
	const [editingSet, setEditingSet] = useState<EquipmentSet | null>(null);
	const [creatingSet, setCreatingSet] = useState(false);
	const queryClient = useQueryClient();
	const addItem = useCartStore((s) => s.addItem);
	const router = useRouter();

	// Undo-очередь: Map<favId, timeoutId>
	const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map()
	);
	// Список id в "ожидании удаления" (визуально скрываем)
	const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(
		new Set()
	);

	useEffect(() => {
		setIsMounted(true);
		const saved = localStorage.getItem(TAB_STORAGE_KEY);
		if (saved === "favorites" || saved === "sets") {
			setActiveTab(saved);
		}

		return () => {
			for (const t of undoTimers.current.values()) clearTimeout(t);
		};
	}, []);

	const handleTabChange = (tab: Tab) => {
		setActiveTab(tab);
		if (typeof window !== "undefined") {
			localStorage.setItem(TAB_STORAGE_KEY, tab);
		}
	};

	const { data: favorites = [], isLoading: favsLoading } = useQuery({
		queryKey: ["favorites"],
		queryFn: fetchFavoritesAction,
		staleTime: 1000 * 60 * 2,
	});

	const { data: sets = [], isLoading: setsLoading } = useQuery({
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

	// Очищаем таймеры при размонтировании
	useEffect(() => {
		return () => {
			for (const t of undoTimers.current.values()) clearTimeout(t);
		};
	}, []);

	const handleRemoveFav = (fav: FavoriteItem) => {
		const favId = fav.id;
		setPendingRemoveIds((prev) => new Set([...prev, favId]));

		// Показываем undo-тост с прогресс-баром
		toast(`Удалено из избранного`, {
			duration: UNDO_DELAY_MS,
			action: {
				label: "Отменить",
				onClick: () => {
					// Отмена: убираем из pendingRemoveIds, чистим таймер
					const timer = undoTimers.current.get(favId);
					if (timer) {
						clearTimeout(timer);
						undoTimers.current.delete(favId);
					}
					setPendingRemoveIds((prev) => {
						const next = new Set(prev);
						next.delete(favId);
						return next;
					});
				},
			},
		});

		// Запускаем таймер реального удаления
		const timer = setTimeout(() => {
			undoTimers.current.delete(favId);
			setPendingRemoveIds((prev) => {
				const next = new Set(prev);
				next.delete(favId);
				return next;
			});
			// Оптимистично убираем из кэша
			queryClient.setQueryData<FavoriteItem[]>(["favorites"], (old = []) =>
				old.filter((f) => f.id !== favId)
			);
			removeFavMutation.mutate(favId);
		}, UNDO_DELAY_MS);

		undoTimers.current.set(favId, timer);
	};

	const deleteSetMutation = useMutation({
		mutationFn: deleteSetAction,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["equipment-sets"] });
			toast.success("Комплект удалён");
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
			label: "Комплекты",
			icon: CardsThreeIcon,
			count: sets.length,
		},
	];

	// Фильтруем те, что ожидают удаления
	const visibleFavorites = favorites.filter((f) => !pendingRemoveIds.has(f.id));

	const isEmptyFavs = visibleFavorites.length === 0 && !favsLoading;
	const isEmptySets = sets.length === 0 && !setsLoading;

	// Универсальный скелетон на этапе SSR и первоначального монтирования
	if (!isMounted) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
				<div className="flex items-center justify-between gap-4">
					<div>
						<div className="h-10 w-48 rounded-2xl bg-foreground/5 animate-pulse" />
						<div className="h-4 w-36 rounded bg-foreground/5 animate-pulse mt-2" />
					</div>
				</div>
				<div className="h-10 w-72 rounded-2xl bg-foreground/5 animate-pulse" />
				<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4">
					{Array.from({ length: 6 }).map((_, i) => (
						<FavoriteCardSkeleton key={i} />
					))}
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
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
					<Button
						onClick={() => {
							activeTab === "sets"
								? setCreatingSet(true)
								: router.push("/equipment");
						}}
						className="rounded-full gap-2 shrink-0"
						size="icon-xl"
					>
						<PlusIcon size={16} />
					</Button>
				</div>

				{/* Tabs */}
				<div className="tabs-group w-full sm:w-fit">
					{tabs.map(({ id, label, icon: Icon, count }) => (
						<Button
							key={id}
							variant="tab"
							type="button"
							onClick={() => handleTabChange(id)}
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
							{favsLoading ? (
								<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4">
									{Array.from({ length: 6 }).map((_, i) => (
										<FavoriteCardSkeleton key={i} />
									))}
								</div>
							) : isEmptyFavs ? (
								<EmptyState
									icon={HeartIcon}
									title="Нет избранного"
									description="Сохраняйте любимую технику в избранное чтобы всегда иметь под рукой"
									action={{
										label: "Добавить избранное",
										href: "/equipment",
									}}
								/>
							) : (
								<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 md:gap-4">
									<AnimatePresence>
										{visibleFavorites.map((fav) => {
											const eq = fav.equipment;
											if (!eq?.isAvailable) {
												return (
													<UnavailableFavoriteCard
														key={fav.id}
														fav={fav}
														onRemove={() => handleRemoveFav(fav)}
													/>
												);
											}
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
									</AnimatePresence>
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
							{setsLoading ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{Array.from({ length: 4 }).map((_, i) => (
										<SetCardSkeleton key={i} />
									))}
								</div>
							) : (
								<>
									{isEmptySets && (
										<EmptyState
											icon={CardsThreeIcon}
											title="Нет комплектов"
											description="Создавайте компелкты под разные сценарии съемок"
											action={{
												label: "Собрать компелкт",
												onClick: () => setCreatingSet(true),
											}}
										/>
									)}
									{!isEmptySets && (
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
																label: "В корзину",
																onClick: () => {
																	window.location.href = "/checkout";
																},
															},
														});
													}}
												/>
											))}
										</div>
									)}
								</>
							)}
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
