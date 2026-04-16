"use client";

import {
	ClockIcon,
	DotsSixVerticalIcon,
	type Icon,
	PencilSimpleIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { getCategoryHistoryAction } from "@/actions/admin-category-actions";
import { uploadCategoryImageAction } from "@/actions/upload-actions";
import { IconPicker } from "@/components/admin/categories/IconPicker";
import { SubcategoryRow } from "@/components/admin/categories/SubcategoryRow";
import { ImageUploader, InlineEditField } from "@/components/shared";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { PHOSPHOR_ICON_MAP } from "@/constants/phosphor-icon-client.config";
import type {
	DbCategory,
	DbSubcategory,
} from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

type HistoryEntry = {
	id: string;
	action: string;
	changedAt: Date;
	changes: Record<string, [unknown, unknown]> | null;
	profiles: { name: string; email: string } | null;
};

export function CategoryRow({
	cat,
	onUpdate,
	onDelete,
	onAddSub,
	onUpdateSub,
	onDeleteSub,
	onReorderSubs,
	dragHandleProps,
}: {
	cat: DbCategory;
	onUpdate: (id: string, data: Partial<DbCategory>) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	onAddSub: (catId: string, name: string) => Promise<void>;
	onUpdateSub: (subId: string, data: Partial<DbSubcategory>) => Promise<void>;
	onDeleteSub: (subId: string) => Promise<void>;
	onReorderSubs: (catId: string, orderedIds: string[]) => Promise<void>;
	dragHandleProps: {
		onDragStart: () => void;
		onDragOver: (e: React.DragEvent) => void;
		onDrop: () => void;
	};
}) {
	const [expanded, setExpanded] = useState(false);
	const [editing, setEditing] = useState(false);
	const [showHistory, setShowHistory] = useState(false);
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [editName, setEditName] = useState(cat.name);
	const [editIcon, setEditIcon] = useState(cat.iconName ?? "Package");
	const [editNotes, setEditNotes] = useState(cat.adminNotes ?? "");
	const [editModular, setEditModular] = useState(cat.isModular ?? false);
	const [newSubName, setNewSubName] = useState("");
	const [isPending, startTransition] = useTransition();
	const [localSubs, setLocalSubs] = useState(cat.subcategories);
	const subDragIndex = useRef<number | null>(null);
	const subDragOverIndex = useRef<number | null>(null);

	useEffect(() => setLocalSubs(cat.subcategories), [cat.subcategories]);

	const handleSubDrop = async () => {
		const from = subDragIndex.current;
		const to = subDragOverIndex.current;
		if (from === null || to === null || from === to) return;
		const reordered = [...localSubs];
		const [moved] = reordered.splice(from, 1);
		if (!moved) return;
		reordered.splice(to, 0, moved);
		setLocalSubs(reordered);
		await onReorderSubs(
			cat.id,
			reordered.map((s) => s.id)
		);
		subDragIndex.current = null;
		subDragOverIndex.current = null;
	};

	const handleSave = () => {
		startTransition(async () => {
			await onUpdate(cat.id, {
				name: editName,
				iconName: editIcon,
				adminNotes: editNotes || undefined,
				isModular: editModular,
			});
			setEditing(false);
			toast.success("Категория обновлена");
		});
	};

	const loadHistory = async () => {
		const data = await getCategoryHistoryAction(cat.id);
		setHistory(data as unknown as HistoryEntry[]);
		setShowHistory(true);
	};

	const handleFileChange = async (file: File | null) => {
		if (!file) return;

		try {
			const formData = new FormData();
			formData.append("file", file);

			startTransition(async () => {
				const result = await uploadCategoryImageAction(
					formData,
					cat.id,
					cat.imageUrl
				);
				if (result.success) {
					toast.success("Изображение категории обновлено");
				} else {
					toast.error(result.error);
				}
			});
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(
				error instanceof Error ? error.message : "Не удалось загрузить фото"
			);
		}
	};

	const IconComp = (PHOSPHOR_ICON_MAP[editIcon] ||
		PHOSPHOR_ICON_MAP.Package) as Icon;

	return (
		<Card
			className="card-surface rounded-2xl border overflow-hidden"
			draggable
			onDragStart={dragHandleProps.onDragStart}
			onDragOver={dragHandleProps.onDragOver}
			onDrop={dragHandleProps.onDrop}
		>
			{/* Category header */}
			<div className="flex items-center gap-2">
				<DotsSixVerticalIcon
					size={15}
					className="text-muted-foreground hover:text-muted-foreground cursor-grab shrink-0 transition-colors"
				/>

				<button
					type="button"
					onClick={() => setExpanded((e) => !e)}
					className="flex items-center justify-start gap-2 flex-1 min-w-0 h-14 text-left cursor-pointer"
				>
					{/* Иконка категории — показываем саму иконку, не текст */}
					<IconComp size={18} weight="fill" className="shrink-0" />

					{editing ? (
						<Input
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							className="h-7 text-sm font-semibold"
							autoFocus
							onClick={(e) => e.stopPropagation()}
						/>
					) : (
						<span className="font-semibold text-sm truncate">{cat.name}</span>
					)}
					{cat.isModular && (
						<span className="shrink-0 text-[10px] font-bold uppercase tracking-widest px-1.5 rounded-md bg-violet-500/15 text-violet-400">
							Модуль
						</span>
					)}
					<span className="text-xs text-muted-foreground/60 shrink-0 ml-auto">
						{cat.subcategories.length} подкат.
					</span>
				</button>

				<div className="flex items-center gap-1 shrink-0">
					{editing ? (
						<>
							<Button
								size="sm"
								variant="ghost"
								className="h-7 px-2"
								onClick={handleSave}
								disabled={isPending}
							>
								Сохранить
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="h-7 w-7 p-0"
								onClick={() => setEditing(false)}
							>
								<XIcon size={13} />
							</Button>
						</>
					) : (
						<>
							<Button
								size="sm"
								variant="ghost"
								className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
								onClick={loadHistory}
							>
								<ClockIcon size={13} className="text-muted-foreground" />
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="h-7 w-7 p-0"
								onClick={() => {
									setEditing(true);
									setExpanded(true);
								}}
							>
								<PencilSimpleIcon size={13} className="text-muted-foreground" />
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="h-7 w-7 p-0 hover:text-red-500 hover:bg-red-500/10"
								onClick={() => {
									if (confirm(`Удалить категорию «${cat.name}»?`))
										startTransition(() => onDelete(cat.id));
								}}
							>
								<TrashIcon size={13} />
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Editing panel */}
			{editing && (
				<div className="px-4 pb-4 pt-0 border-t border-foreground/5 space-y-3 bg-foreground/2">
					<div className="grid grid-cols-2 gap-3 pt-3">
						<div className="space-y-1.5">
							<Label className="text-xs">Иконка</Label>
							<IconPicker value={editIcon} onChange={setEditIcon} />
						</div>
						<div className="flex items-center gap-2 pt-5">
							<input
								type="checkbox"
								id={`mod-${cat.id}`}
								checked={editModular}
								onChange={(e) => setEditModular(e.target.checked)}
								className="accent-violet-500"
							/>
							<label
								htmlFor={`mod-${cat.id}`}
								className="text-sm text-muted-foreground cursor-pointer"
							>
								Модульная категория
							</label>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">Изображение на главной странице</Label>
						<div className="flex items-center gap-4">
							{cat.imageUrl && (
								<div className="relative w-12 h-12 rounded-lg overflow-hidden border">
									<Image
										src={cat.imageUrl}
										alt="Image for category"
										fill
										sizes="16px"
										className="object-cover"
									/>
								</div>
							)}
							<ImageUploader
								onFileSelect={handleFileChange}
								aspectRatio={1.7}
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label className="text-xs">Заметки для сотрудников</Label>
						<Textarea
							value={editNotes}
							onChange={(e) => setEditNotes(e.target.value)}
							rows={2}
							placeholder="Внутренняя заметка..."
							className="text-xs resize-none"
						/>
					</div>
				</div>
			)}

			{/* History panel */}
			{showHistory && (
				<div className="px-4 pb-4 border-t border-foreground/5 bg-foreground/2">
					<div className="flex items-center justify-between py-2">
						<span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
							<ClockIcon size={11} /> История изменений
						</span>
						<button type="button" onClick={() => setShowHistory(false)}>
							<XIcon size={13} className="text-muted-foreground" />
						</button>
					</div>
					{history.length === 0 ? (
						<p className="text-xs text-muted-foreground/50">Нет записей</p>
					) : (
						<div className="space-y-1">
							{history.map((h) => (
								<div
									key={h.id}
									className="text-xs flex items-start gap-2 py-1 border-b border-foreground/5 last:border-0"
								>
									<span
										className={cn(
											"shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
											h.action === "CREATED" &&
												"bg-green-500/15 text-green-400",
											h.action === "UPDATED" && "bg-blue-500/15 text-blue-400",
											h.action === "DELETED" && "bg-red-500/15 text-red-400"
										)}
									>
										{h.action === "CREATED"
											? "создан"
											: h.action === "UPDATED"
												? "изменён"
												: "удалён"}
									</span>
									<span className="text-muted-foreground flex-1">
										{h.profiles?.name ?? "Система"} ·{" "}
										{new Date(h.changedAt).toLocaleString("ru-RU")}
										{h.changes && Object.keys(h.changes).length > 0 && (
											<span className="ml-1 opacity-50">
												({Object.keys(h.changes).join(", ")})
											</span>
										)}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Admin notes */}
			{!editing && cat.adminNotes && (
				<div className="px-4 pb-3 flex items-start gap-2">
					<p className="text-xs text-muted-foreground italic">
						{cat.adminNotes}
					</p>
				</div>
			)}

			{/* Subcategories */}
			{expanded && (
				<div className="border-t border-foreground/5 px-4 py-3 space-y-2">
					{localSubs.map((sub, subIndex) => (
						<SubcategoryRow
							key={sub.id}
							sub={sub}
							onUpdate={onUpdateSub}
							onDelete={onDeleteSub}
							dragHandleProps={{
								onDragStart: () => {
									subDragIndex.current = subIndex;
								},
								onDragOver: (e) => {
									e.preventDefault();
									subDragOverIndex.current = subIndex;
								},
								onDrop: handleSubDrop,
							}}
						/>
					))}
					<InlineEditField
						value={newSubName}
						onChange={(e) => setNewSubName(e.target.value)}
						onAdd={async (name) => {
							if (!name.trim()) return;
							await onAddSub(cat.id, name.trim());
							setNewSubName("");
						}}
						placeholder="Новая подкатегория..."
						className="h-8 text-sm"
						mode="create"
						autoFocus={false}
					/>
				</div>
			)}
		</Card>
	);
}
