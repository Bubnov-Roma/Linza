"use client";

import {
	ArrowsOutLineVerticalIcon,
	PencilSimpleIcon,
	PlusIcon,
	ProhibitIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import type { StudioTariffData } from "@/actions/admin/admin-studio-actions";
import {
	reorderStudioTariffsAction,
	updateStudioTariffAction,
} from "@/actions/admin/admin-studio-actions";
import { Badge, Button, CardContent, Switch } from "@/components/ui";
import { cn, fmtRub } from "@/lib/utils";
import { StudioTariffSheet } from "./StudioTariffSheet";

interface AdminStudioTariffsPanelProps {
	tariffs: StudioTariffData[];
	onRefresh: () => void;
}

// ─── DraggableTariffRow ───────────────────────────────────────────────────────

function TariffRow({
	tariff,
	onEdit,
	onRefresh,
	dragHandleProps,
}: {
	tariff: StudioTariffData;
	onEdit: (t: StudioTariffData) => void;
	onRefresh: () => void;
	dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
	const [isActive, setIsActive] = useState(tariff.isActive);
	const [isTogglingActive, startToggle] = useTransition();

	useEffect(() => {
		setIsActive(tariff.isActive);
	}, [tariff.isActive]);

	const handleToggleActive = (checked: boolean) => {
		setIsActive(checked);

		startToggle(async () => {
			const r = await updateStudioTariffAction({
				id: tariff.id,
				isActive: checked,
			});
			if (r.success) {
				toast.success(checked ? "Тариф активирован" : "Тариф скрыт");
				onRefresh();
			} else {
				setIsActive(tariff.isActive);
				toast.error(r.error ?? "Ошибка");
			}
		});
	};

	return (
		<div
			className={cn(
				"flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl border-foreground/8 bg-card/50 hover:bg-card transition-colors",
				!isActive &&
					"opacity-60 bg-muted-foreground/5 hover:bg-muted-foreground/5"
			)}
		>
			{/* Drag handle */}
			<div className="flex items-center gap-3 flex-1 min-w-0 w-full justify-between md:justify-start">
				<div
					{...dragHandleProps}
					className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors p-1"
				>
					<ArrowsOutLineVerticalIcon size={16} />
				</div>

				{/* Image */}
				<div className="relative shrink-0 w-14 h-10 rounded-lg overflow-hidden bg-foreground/5">
					{tariff.imageUrls[0] ? (
						<Image
							src={tariff.imageUrls[0]}
							alt={tariff.name}
							fill
							sizes="56px"
							className="object-cover"
						/>
					) : (
						<div className="flex items-center justify-center h-full">
							<span className="text-[9px] text-muted-foreground/30 font-bold uppercase">
								Нет
							</span>
						</div>
					)}
				</div>
				<div className="flex-1 min-w-0">
					{/* Info */}
					{tariff.description && (
						<p className="text-xs text-muted-foreground truncate mt-0.5">
							{tariff.description}
						</p>
					)}
				</div>
			</div>

			<div className="flex items-center gap-3 flex-1 min-w-0 w-full justify-between">
				<div className="flex flex-row items-center gap-1 flex-wrap">
					<span className="font-bold text-sm truncate">{tariff.name}</span>
					{!isActive && (
						<Badge
							variant="outline"
							className="text-[9px] h-4 px-1.5 text-muted-foreground border-foreground/20"
						>
							Скрыт
						</Badge>
					)}
					{tariff.imageUrls.length > 0 && isActive && (
						<Badge
							variant="outline"
							className="text-[9px] h-4 px-1.5 text-muted-foreground/50 border-foreground/10"
						>
							{tariff.imageUrls.length} фото
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-3">
					{/* Price */}
					<div className="shrink-0 text-right">
						<p className="font-black text-sm text-primary">
							{fmtRub(tariff.pricePerHour)}
							<span className="text-[10px] text-muted-foreground">/час</span>
						</p>
					</div>

					{/* Active toggle */}
					<div className="shrink-0">
						<Switch
							checked={isActive}
							onCheckedChange={handleToggleActive}
							disabled={isTogglingActive}
							className="data-[state=checked]:bg-primary bg-muted-foreground"
						/>
					</div>

					{/* Edit button */}
					<Button
						variant="ghost"
						size="icon"
						className="shrink-0 h-8 w-8"
						onClick={() => onEdit(tariff)}
					>
						<PencilSimpleIcon size={14} />
					</Button>
				</div>
			</div>
		</div>
	);
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AdminStudioTariffsPanel({
	tariffs,
	onRefresh,
}: AdminStudioTariffsPanelProps) {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [editingTariff, setEditingTariff] = useState<
		StudioTariffData | undefined
	>();

	// Drag & drop reorder (simple internal state)
	const [localTariffs, setLocalTariffs] = useState(tariffs);
	const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [isSavingOrder, startReorderTransition] = useTransition();

	// Sync when parent refreshes
	useState(() => {
		setLocalTariffs(tariffs);
	});

	const handleOpenCreate = () => {
		setEditingTariff(undefined);
		setSheetOpen(true);
	};

	const handleOpenEdit = (t: StudioTariffData) => {
		setEditingTariff(t);
		setSheetOpen(true);
	};

	const handleSheetSuccess = (
		action: "save" | "delete",
		data?: StudioTariffData
	) => {
		// Мгновенно обновляем локальный стейт без перезагрузки
		if (action === "save" && data) {
			setLocalTariffs((prev) => {
				const isEdit = prev.some((t) => t.id === data.id);
				if (isEdit) {
					// Если редактировали — заменяем старый на новый
					return prev.map((t) => (t.id === data.id ? data : t));
				}
				// Если создали — добавляем в конец (или можно отсортировать по sortOrder)
				return [...prev, data].sort((a, b) => a.sortOrder - b.sortOrder);
			});
		} else if (action === "delete" && typeof data === "string") {
			// Удаляем из стейта по ID
			setLocalTariffs((prev) => prev.filter((t) => t.id !== data));
		}

		// Запускаем фоновое обновление с сервера, чтобы данные точно синхронизировались с БД
		onRefresh();
	};

	// ── Drag & drop ────────────────────────────────────────────────────────────
	const handleDrop = useCallback(async () => {
		const from = draggingIndex;
		const to = dragOverIndex;
		if (from === null || to === null || from === to) {
			setDraggingIndex(null);
			setDragOverIndex(null);
			return;
		}
		const reordered = [...localTariffs];
		const [moved] = reordered.splice(from, 1);
		if (!moved) return;
		reordered.splice(to, 0, moved);
		setLocalTariffs(reordered);
		setDraggingIndex(null);
		setDragOverIndex(null);

		startReorderTransition(async () => {
			const result = await reorderStudioTariffsAction(
				reordered.map((t) => t.id)
			);
			if (result.success) {
				onRefresh();
			} else {
				toast.error(result.error ?? "Ошибка сортировки");
				setLocalTariffs(tariffs);
			}
		});
	}, [draggingIndex, dragOverIndex, localTariffs, tariffs, onRefresh]);

	return (
		<>
			<div className="space-y-3">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-sm font-bold">Тарифы студии</h3>
						<p className="text-xs text-muted-foreground">
							{localTariffs.filter((t) => t.isActive).length} активных ·{" "}
							{localTariffs.length} всего
						</p>
					</div>
					<Button size="sm" onClick={handleOpenCreate} className="h-8 gap-1.5">
						<PlusIcon size={14} />
						Добавить
					</Button>
				</div>

				{/* Tariff list */}
				{localTariffs.length === 0 ? (
					<div className="py-12 text-center rounded-xl border border-dashed border-foreground/10">
						<ProhibitIcon
							size={32}
							className="text-muted-foreground/20 mx-auto mb-3"
						/>
						<p className="text-sm text-muted-foreground">Тарифов пока нет</p>
						<p className="text-xs text-muted-foreground/60 mt-1">
							Добавьте первый тариф студии
						</p>
					</div>
				) : (
					<div
						className={cn(
							"space-y-1.5 transition-opacity",
							isSavingOrder && "opacity-60 pointer-events-none"
						)}
					>
						{localTariffs.map((tariff, index) => (
							<CardContent
								key={tariff.id}
								draggable
								onDragStart={() => setDraggingIndex(index)}
								onDragOver={(e) => {
									e.preventDefault();
									setDragOverIndex(index);
								}}
								onDrop={handleDrop}
								onDragEnd={() => {
									setDraggingIndex(null);
									setDragOverIndex(null);
								}}
								className={cn(
									"transition-all duration-150 px-0 ",
									draggingIndex === index && "opacity-40 scale-[0.98]",
									dragOverIndex === index &&
										draggingIndex !== index &&
										"scale-[1.01] border-t-2 border-primary/40"
								)}
							>
								<TariffRow
									tariff={tariff}
									onEdit={handleOpenEdit}
									onRefresh={onRefresh}
								/>
							</CardContent>
						))}
					</div>
				)}

				{localTariffs.length > 1 && (
					<p className="text-[10px] text-muted-foreground/40 italic text-center">
						Перетащите тарифы для изменения порядка отображения
					</p>
				)}
			</div>

			<StudioTariffSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				tariff={editingTariff}
				onSuccess={handleSheetSuccess}
			/>
		</>
	);
}
