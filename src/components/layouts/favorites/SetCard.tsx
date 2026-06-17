import {
	CardsThreeIcon,
	CubeIcon,
	PencilSimpleLineIcon,
	ShoppingCartSimpleIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { getFavoriteGrouped } from "@/components/layouts/favorites";
import type {
	EquipmentSet,
	FavoriteItem,
} from "@/components/layouts/favorites/types";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
} from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { fmtRub } from "@/lib/utils";

/** Возвращает ширину каждой картинки в зависимости от кол-ва позиций */
function getImageWidth(total: number): string {
	if (total === 1) return "100%";
	if (total === 2) return "50%";
	if (total === 3) return "33.333%";
	if (total <= 4) return "25%";
	return "20%";
}

export function SetCard({
	set,
	favorites,
	groupedMap,
	onEdit,
	onDelete,
	onAddAllToCart,
}: {
	set: EquipmentSet;
	favorites: FavoriteItem[];
	groupedMap: Map<string, GroupedEquipment>;
	onEdit: () => void;
	onDelete: () => void;
	onAddAllToCart: (items: GroupedEquipment[]) => void;
}) {
	const [deleteOpen, setDeleteOpen] = useState(false);

	if (!set) return null;

	const items = set.items ?? [];
	const itemCount = items.length;

	// Строим превью: сначала ищем в groupedMap (полные данные с картинками),
	// потом fallback в favMap (данные из избранного)
	const favMap = Object.fromEntries(
		favorites.map((f) => [f.equipmentId, f.equipment])
	);

	const allImages = items
		.filter((item) => {
			// Фильтруем позиции выведенные из проката
			const fromMap = groupedMap.get(item.equipmentId);
			if (fromMap) return fromMap.isAvailable;
			const eq = favMap[item.equipmentId];
			return eq?.isAvailable !== false; // если нет данных — показываем
		})
		.map((item) => {
			// Приоритет: groupedMap → favMap → placeholder
			const fromMap = groupedMap.get(item.equipmentId);
			if (fromMap) {
				return {
					equipmentId: item.equipmentId,
					url:
						fromMap.imageUrl ||
						fromMap.equipmentImageLinks?.[0]?.image?.url ||
						"/placeholder-equipment.png",
					title: fromMap.title,
				};
			}
			const eq = favMap[item.equipmentId];
			return {
				equipmentId: item.equipmentId,
				url:
					eq?.equipmentImageLinks?.[0]?.image?.url ??
					"/placeholder-equipment.png",
				title: eq?.title ?? "",
			};
		});

	const handleAddAll = () => {
		if (!items.length) {
			toast.info("Комплект пуст");
			return;
		}
		const all = items
			.map((i) => {
				const fromMap = groupedMap.get(i.equipmentId);
				if (fromMap) return fromMap.isAvailable ? fromMap : null;
				const eq = favMap[i.equipmentId];
				return eq
					? getFavoriteGrouped(
							{ equipmentId: i.equipmentId, equipment: eq, id: "" },
							groupedMap
						)
					: null;
			})
			.filter(
				(g): g is GroupedEquipment => g !== null && g.isAvailable !== false
			);

		if (!all.length) {
			toast.error("Доступная техника из сета не найдена");
			return;
		}
		onAddAllToCart(all);
	};

	const MAX_VISIBLE = 5;
	const visibleImages = allImages.slice(0, MAX_VISIBLE);
	const hiddenCount = allImages.length - MAX_VISIBLE;
	const imageWidth = getImageWidth(Math.min(allImages.length, MAX_VISIBLE));

	// Считаем активные (доступные) позиции для счётчика
	const availableItemCount = items.filter((item) => {
		const fromMap = groupedMap.get(item.equipmentId);
		if (fromMap) return fromMap.isAvailable;
		const eq = favMap[item.equipmentId];
		return eq?.isAvailable !== false;
	}).length;
	const unavailableCount = itemCount - availableItemCount;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			className="group rounded-2xl border border-foreground/5 bg-card/50 overflow-hidden hover:border-foreground/10 hover:shadow-lg transition-all duration-300"
		>
			{/* ── Лента фото ── */}
			<div className="relative">
				<div className="flex h-28 overflow-hidden">
					{visibleImages.length > 0 ? (
						visibleImages.map((img, idx) => (
							<div
								key={img.equipmentId}
								className="relative shrink-0 overflow-hidden bg-foreground/5"
								style={{ width: imageWidth, minWidth: "60px" }}
							>
								<Image
									src={img.url}
									alt={img.title}
									fill
									className="object-cover"
									loading="eager"
									sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,20vw"
								/>
								{hiddenCount > 0 && idx === visibleImages.length - 1 && (
									<div className="absolute inset-0 bg-background/60 flex items-center justify-center">
										<span className="text-sm font-bold text-foreground/80">
											+{hiddenCount}
										</span>
									</div>
								)}
							</div>
						))
					) : (
						<div className="flex-1 flex items-center justify-center bg-foreground/5">
							<CardsThreeIcon size={20} className="text-muted-foreground/20" />
						</div>
					)}
				</div>
			</div>

			{/* ── Info ── */}
			<div className="p-4 space-y-3">
				<div className="w-full flex  justify-between">
					<div className="min-w-0">
						<h3 className="font-bold text-sm truncate">{set.name}</h3>
						{set.description && (
							<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
								{set.description}
							</p>
						)}
					</div>

					{/* Предупреждение о выведенных позициях */}
					{unavailableCount > 0 && (
						<p className="text-[10px] text-amber-500/80 font-medium">
							{unavailableCount} поз. выведено из проката
						</p>
					)}
					{/* Редактировать */}
					<div className="flex gap-4">
						{/* Удалить с подтверждением */}
						<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
							<AlertDialogTrigger asChild>
								<Button
									variant="outline"
									size="icon-sm"
									className="h-7 w-12 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
									title="Удалить"
								>
									<TrashIcon size={13} weight="duotone" />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent className="rounded-2xl max-w-sm">
								<AlertDialogHeader>
									<AlertDialogTitle>Удалить комплект?</AlertDialogTitle>
									<AlertDialogDescription>
										Комплект «{set.name}» будет удалён. Это действие нельзя
										отменить.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel asChild>
										<Button variant="ghost">Отмена</Button>
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => {
											setDeleteOpen(false);
											onDelete();
										}}
										asChild
									>
										<Button variant="destructive">Удалить</Button>
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						<Button
							variant="outline"
							size="icon-sm"
							onClick={onEdit}
							className="h-7 w-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/10"
							title="Редактировать"
						>
							<PencilSimpleLineIcon size={13} weight="duotone" />
						</Button>
					</div>
				</div>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<CubeIcon size={12} />
						<span>{availableItemCount} поз.</span>
						{set.totalPricePerDay ? (
							<>
								<span className="opacity-30">·</span>
								<span className="font-bold text-foreground/70">
									{fmtRub(set.totalPricePerDay)}/сут
								</span>
							</>
						) : null}
					</div>

					{/* Кнопки действий */}
					<div className="flex items-center gap-1.5 shrink-0">
						{/* В корзину */}
						<Button
							variant="outline"
							onClick={handleAddAll}
							className="flex items-center gap-1.5 px-3 h-7 rounded-xl bg-foreground/5 hover:bg-primary/10 hover:text-primary-accent text-muted-foreground transition-all text-xs font-semibold"
						>
							<ShoppingCartSimpleIcon size={12} weight="duotone" />В корзину
						</Button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
