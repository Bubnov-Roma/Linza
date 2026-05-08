"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
	Check,
	Layers,
	Minus,
	Package,
	Plus,
	Save,
	Search,
	X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { saveSetAction } from "@/actions/favorites-actions";
import { Button, Label } from "@/components/ui";
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

	useEffect(() => {
		if (isOpen) {
			setName(existingSet?.name ?? "");
			setDescription(existingSet?.description ?? "");
			setSelectedItems(existingSet?.items ?? []);
			setSearchQuery("");
		}
	}, [isOpen, existingSet]);

	const saveMutation = useMutation({
		mutationFn: saveSetAction,
		onSuccess: (result) => {
			if (!result.success) {
				toast.error(result.error ?? "Ошибка сохранения");
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["equipment-sets"] });
			toast.success(existingSet ? "Сет обновлён" : "Сет создан");
			onClose();
		},
		onError: (err) => {
			console.error("saveSet mutation error:", err);
			toast.error("Ошибка сохранения");
		},
	});

	const filteredFavs = useMemo(() => {
		if (!searchQuery.trim()) return favorites;
		const q = searchQuery.toLowerCase();
		return favorites.filter((f) =>
			f.equipment?.title?.toLowerCase().includes(q)
		);
	}, [favorites, searchQuery]);

	const totalPrice = useMemo(
		() =>
			selectedItems.reduce((acc, item) => {
				const eq = favorites.find(
					(f) => f.equipmentId === item.equipmentId
				)?.equipment;
				return acc + (eq?.pricePerDay ?? 0) * item.quantity;
			}, 0),
		[selectedItems, favorites]
	);

	const getQty = (id: string) =>
		selectedItems.find((i) => i.equipmentId === id)?.quantity ?? 0;

	const setQty = (id: string, qty: number) => {
		if (qty <= 0) {
			setSelectedItems((p) => p.filter((i) => i.equipmentId !== id));
		} else {
			setSelectedItems((p) => {
				const ex = p.find((i) => i.equipmentId === id);
				if (ex)
					return p.map((i) =>
						i.equipmentId === id ? { ...i, quantity: qty } : i
					);
				return [...p, { equipmentId: id, quantity: qty }];
			});
		}
	};

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

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="absolute inset-0 bg-background/80 backdrop-blur-md"
					onClick={onClose}
				/>

				<motion.div
					initial={{ opacity: 0, y: 48, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 48, scale: 0.97 }}
					transition={{ type: "spring", stiffness: 380, damping: 32 }}
					className="glass-card relative z-10 w-full max-w-lg max-h-[92vh] flex flex-col border border-foreground/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
				>
					{/* Mobile handle */}
					<div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
						<div className="w-10 h-1 rounded-full bg-foreground/15" />
					</div>

					{/* Header */}
					<div className="flex items-center justify-between px-5 py-3.5 border-b border-foreground/5 shrink-0">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
								<Layers size={15} className="text-primary" />
							</div>
							<h2 className="font-bold">
								{existingSet ? "Редактировать сет" : "Новый сет"}
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-foreground/10 transition-colors"
						>
							<X size={15} className="text-muted-foreground" />
						</button>
					</div>

					{/* Body */}
					<div className="flex-1 overflow-y-auto">
						<div className="px-5 pt-4 pb-3 space-y-3">
							<div className="space-y-1.5">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
									Название
								</Label>
								<input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Например: Кинокомплект для интервью"
									className="w-full bg-foreground/5 rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
									Описание
									<span className="normal-case text-muted-foreground/30">
										(необязательно)
									</span>
								</Label>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Для чего этот набор?"
									rows={2}
									className="w-full bg-foreground/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40 resize-none"
								/>
							</div>
						</div>

						<div className="px-5 pb-3">
							<div className="flex items-center gap-3">
								<div className="h-px flex-1 bg-foreground/5" />
								<span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">
									Выберите технику
								</span>
								<div className="h-px flex-1 bg-foreground/5" />
							</div>
						</div>

						<div className="px-5 pb-3">
							<div className="flex items-center gap-2 bg-foreground/5 rounded-xl px-3 h-9">
								<Search size={14} className="text-muted-foreground shrink-0" />
								<input
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Поиск в избранном..."
									className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/40"
								/>
							</div>
						</div>

						<div className="px-3 pb-4 space-y-0.5">
							{favorites.length === 0 ? (
								<div className="py-10 text-center">
									<Package
										size={28}
										className="mx-auto text-muted-foreground/20 mb-3"
									/>
									<p className="text-sm text-muted-foreground">
										Добавьте технику в избранное, чтобы включить в сет
									</p>
								</div>
							) : filteredFavs.length === 0 ? (
								<div className="py-8 text-center">
									<p className="text-sm text-muted-foreground">
										Ничего не найдено
									</p>
								</div>
							) : (
								filteredFavs.map((fav) => {
									const qty = getQty(fav.equipmentId);
									const selected = qty > 0;
									const imgUrl =
										fav.equipment?.equipmentImageLinks?.[0]?.image?.url ??
										"/placeholder-equipment.png";

									return (
										<div
											key={fav.equipmentId}
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
													alt={fav.equipment?.title ?? ""}
													width={44}
													height={44}
													className="w-full h-full object-cover"
												/>
											</div>

											{/* Text area — plain button, no nested <Button> to avoid hydration error */}
											<button
												type="button"
												className="flex-1 min-w-0 text-left"
												onClick={() => setQty(fav.equipmentId, qty > 0 ? 0 : 1)}
											>
												<div className="flex items-center gap-1.5">
													{selected && (
														<Check
															size={15}
															className="text-green-500 shrink-0"
														/>
													)}
													<p className="text-sm font-medium truncate">
														{fav.equipment?.title}
													</p>
												</div>
												<p className="text-xs text-muted-foreground mt-0.5">
													{fmtRub(fav.equipment?.pricePerDay)}/сут
													{qty > 1 && (
														<span className="text-primary font-bold">
															{" "}
															× {qty} ={" "}
															{fmtRub((fav.equipment?.pricePerDay ?? 0) * qty)}
														</span>
													)}
												</p>
											</button>

											{selected ? (
												<div className="flex items-center gap-1 shrink-0">
													<button
														type="button"
														onClick={() => setQty(fav.equipmentId, qty - 1)}
														className="w-7 h-7 flex items-center justify-center rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors"
													>
														<Minus size={12} />
													</button>
													<span className="w-5 text-center text-sm font-bold">
														{qty}
													</span>
													<button
														type="button"
														onClick={() => setQty(fav.equipmentId, qty + 1)}
														className="w-7 h-7 flex items-center justify-center rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors"
													>
														<Plus size={12} />
													</button>
												</div>
											) : (
												<button
													type="button"
													onClick={() => setQty(fav.equipmentId, 1)}
													className="w-7 h-7 flex items-center justify-center rounded-lg bg-foreground/5 hover:bg-primary/20 hover:text-primary transition-all text-muted-foreground shrink-0"
												>
													<Plus size={12} />
												</button>
											)}
										</div>
									);
								})
							)}
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
								disabled={saveMutation.isPending}
								className="rounded-xl gap-2 shrink-0"
							>
								<Save size={14} />
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
