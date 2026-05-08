import {
	CardsThreeIcon,
	CubeIcon,
	PencilSimpleLineIcon,
	ShoppingCartSimpleIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { DotsThreeIcon } from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { getFavoriteGrouped } from "@/components/layouts/favorites";
import type {
	EquipmentSet,
	FavoriteItem,
} from "@/components/layouts/favorites/types";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { fmtRub } from "@/lib/utils";

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
	if (!set) return;

	const favMap = Object.fromEntries(
		favorites.map((f) => [f.equipmentId, f.equipment])
	);
	const items = set.items ?? [];

	const itemCount = items.length;

	const allImages = items.map((item) => {
		const eq = favMap[item.equipmentId];
		return {
			equipmentId: item.equipmentId,
			url:
				(eq as FavoriteItem["equipment"])?.equipmentImageLinks?.[0]?.image
					?.url ?? "/placeholder-equipment.png",
			title: (eq as { title?: string })?.title ?? "",
		};
	});

	const handleAddAll = () => {
		if (!items || items.length === 0) {
			toast.info("Сет пуст");
			return;
		}
		const all = items
			.map((i) => {
				// Приоритет — GroupedEquipment из map с реальным available_count
				const fromMap = groupedMap.get(i.equipmentId);
				if (fromMap) return fromMap;
				// Fallback через favMap если map не загружен
				const eq = favMap[i.equipmentId];
				return eq
					? getFavoriteGrouped(
							{ equipmentId: i.equipmentId, equipment: eq, id: "" },
							groupedMap
						)
					: null;
			})
			.filter(Boolean) as GroupedEquipment[];

		if (!all.length) {
			toast.error("Техника из сета не найдена в избранном");
			return;
		}
		onAddAllToCart(all);
	};

	return (
		<motion.div
			layout
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			className="group rounded-2xl border border-foreground/5 bg-card/50 overflow-hidden hover:border-foreground/10 hover:shadow-lg transition-all duration-300"
		>
			{/* ── Горизонтальный скролл фото ── */}
			<div className="relative">
				<div
					className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-0.5 h-28"
					style={{ scrollbarWidth: "none" }}
				>
					{allImages.length > 0 ? (
						allImages.map((img) => (
							<div
								key={img.equipmentId}
								className="relative shrink-0 snap-start overflow-hidden bg-foreground/5"
								// Ширина адаптируется: если мало — шире, если много — уже
								style={{
									width:
										allImages.length <= 2
											? "50%"
											: allImages.length <= 4
												? "25%"
												: "20%",
									minWidth: "72px",
								}}
							>
								<Image
									src={img.url}
									alt={img.title}
									fill
									className="object-cover"
								/>
							</div>
						))
					) : (
						<div className="flex-1 flex items-center justify-center bg-foreground/5">
							<CardsThreeIcon size={20} className="text-muted-foreground/20" />
						</div>
					)}
				</div>

				{/* Градиент и счётчик справа — подсказка что можно скроллить */}
				{allImages.length > 4 && (
					<div className="absolute right-0 top-0 bottom-0 w-10 bg-linear-to-l from-background/60 to-transparent pointer-events-none flex items-center justify-end pr-2">
						<span className="text-[10px] font-bold text-foreground/60 bg-background/70 rounded-full px-1.5 py-0.5">
							+{allImages.length - 4}
						</span>
					</div>
				)}
			</div>

			{/* ── Info ── */}
			<div className="p-4 space-y-3">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<h3 className="font-bold text-sm truncate">{set.name}</h3>
						{set.description && (
							<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
								{set.description}
							</p>
						)}
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/10 transition-colors"
							>
								<DotsThreeIcon size={14} className="text-muted-foreground" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="rounded-xl">
							<DropdownMenuItem onClick={onEdit} className="gap-2">
								<PencilSimpleLineIcon size={13} /> Редактировать
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={onDelete}
								className="gap-2 text-red-400 focus:text-red-400"
							>
								<TrashIcon size={13} /> Удалить
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<CubeIcon size={12} />
						<span>{itemCount} поз.</span>
						{set.totalPricePerDay ? (
							<>
								<span className="opacity-30">·</span>
								<span className="font-bold text-foreground/70">
									{fmtRub(set.totalPricePerDay)}/сут
								</span>
							</>
						) : null}
					</div>
					<button
						type="button"
						onClick={handleAddAll}
						className="flex items-center gap-1.5 px-3 h-7 rounded-xl bg-foreground/5 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all text-xs font-semibold shrink-0"
					>
						<ShoppingCartSimpleIcon size={12} />
						Всё в корзину
					</button>
				</div>
			</div>
		</motion.div>
	);
}
