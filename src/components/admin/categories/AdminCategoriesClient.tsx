"use client";

import {
	FolderOpenIcon,
	type Icon,
	PlusIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createCategoryAction,
	createSubcategoryAction,
	deleteCategoryAction,
	deleteSubcategoryAction,
	getCategoriesFromDb,
	reorderCategoriesAction,
	reorderSubcategoriesAction,
	updateCategoryAction,
	updateSubcategoryAction,
} from "@/actions/admin-category-actions";
import { CategoryRow } from "@/components/admin/categories/CategoryRow";
import { IconPicker } from "@/components/admin/categories/IconPicker";
import { Button, Input, Label } from "@/components/ui";
import { PHOSPHOR_ICON_MAP } from "@/constants/phosphor-icon-client.config";
import type {
	DbCategory,
	DbSubcategory,
} from "@/core/domain/entities/Equipment";

export default function AdminCategoriesClient({
	initialCategories,
}: {
	initialCategories: DbCategory[];
}) {
	const [categories, setCategories] = useState(initialCategories);
	const [isPending, startTransition] = useTransition();
	const [newCatName, setNewCatName] = useState("");
	const [newCatIcon, setNewCatIcon] = useState("Camera");
	const [newCatModular, setNewCatModular] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);

	const refresh = useCallback(async () => {
		const fresh = await getCategoriesFromDb();
		setCategories(fresh);
	}, []);

	const dragIndex = useRef<number | null>(null);
	const dragOverIndex = useRef<number | null>(null);

	const handleDrop = async () => {
		const from = dragIndex.current;
		const to = dragOverIndex.current;
		if (from === null || to === null || from === to) return;
		const reordered = [...categories];
		const [moved] = reordered.splice(from, 1);
		if (!moved) return;
		reordered.splice(to, 0, moved);
		setCategories(reordered);
		const result = await reorderCategoriesAction(reordered.map((c) => c.id));
		if (!result.success) toast.error("Ошибка сохранения");
		else toast.success("Порядок категорий обновлён");
		dragIndex.current = null;
		dragOverIndex.current = null;
	};

	const handleCreateCat = async () => {
		if (!newCatName.trim()) return;
		startTransition(async () => {
			const result = await createCategoryAction({
				name: newCatName.trim(),
				iconName: newCatIcon,
				isModular: newCatModular,
			});
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			toast.success(`Категория «${newCatName}» создана`);
			setNewCatName("");
			setNewCatModular(false);
			setShowAddForm(false);
			await refresh();
		});
	};

	const handleUpdateCat = async (id: string, data: Partial<DbCategory>) => {
		const result = await updateCategoryAction(id, data);
		if (!result.success) toast.error(result.error);
		await refresh();
	};

	const handleDeleteCat = async (id: string) => {
		const result = await deleteCategoryAction(id);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success("Категория удалена");
		await refresh();
	};

	const handleAddSub = async (catId: string, name: string) => {
		const result = await createSubcategoryAction({ categoryId: catId, name });
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success(`Подкатегория «${name}» создана`);
		await refresh();
	};

	const handleUpdateSub = async (
		subId: string,
		data: Partial<DbSubcategory>
	) => {
		const result = await updateSubcategoryAction(subId, data);
		if (!result.success) toast.error(result.error);
		await refresh();
	};

	const handleDeleteSub = async (subId: string) => {
		const result = await deleteSubcategoryAction(subId);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		toast.success("Подкатегория удалена");
		await refresh();
	};

	const handleReorderSubs = async (_catId: string, orderedIds: string[]) => {
		const result = await reorderSubcategoriesAction(orderedIds);
		if (!result.success) toast.error("Ошибка сохранения порядка подкатегорий");
		else toast.success("Порядок подкатегорий сохранён");
		await refresh();
	};

	const IconComp = (PHOSPHOR_ICON_MAP[newCatIcon] ||
		PHOSPHOR_ICON_MAP.Package) as Icon;
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
						Категории
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{categories.length} категорий · Перетащите для изменения порядка
					</p>
				</div>
				<Button
					onClick={() => setShowAddForm((s) => !s)}
					className="gap-2"
					size="sm"
				>
					{showAddForm ? <XIcon size={16} /> : <PlusIcon size={16} />}
					<span className="hidden sm:inline">
						{showAddForm ? "Отмена" : "Добавить"}
					</span>
				</Button>
			</div>

			{showAddForm && (
				<div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3 animate-in slide-in-from-top-2 duration-200">
					<div className="flex items-center gap-2">
						<IconComp size={18} weight="fill" className="text-primary" />
						<p className="text-sm font-bold">Новая категория</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						<div className="space-y-1.5 md:col-span-2">
							<Label className="text-xs">Название</Label>
							<Input
								value={newCatName}
								onChange={(e) => setNewCatName(e.target.value)}
								placeholder="Например: Мониторы"
								autoFocus
								onKeyDown={(e) => e.key === "Enter" && handleCreateCat()}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs">Иконка</Label>
							<IconPicker value={newCatIcon} onChange={setNewCatIcon} />
						</div>
					</div>
					<div className="flex items-center gap-3">
						<label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
							<input
								type="checkbox"
								checked={newCatModular}
								onChange={(e) => setNewCatModular(e.target.checked)}
								className="accent-violet-500"
							/>
							Модульная (комплект из разных категорий)
						</label>
						<Button
							size="sm"
							className="ml-auto"
							disabled={!newCatName.trim() || isPending}
							onClick={handleCreateCat}
						>
							Создать
						</Button>
					</div>
				</div>
			)}

			<div className="space-y-2">
				{categories.map((cat, index) => (
					<div key={cat.id} className="group">
						<CategoryRow
							cat={cat}
							onUpdate={handleUpdateCat}
							onDelete={handleDeleteCat}
							onAddSub={handleAddSub}
							onUpdateSub={handleUpdateSub}
							onDeleteSub={handleDeleteSub}
							onReorderSubs={handleReorderSubs}
							dragHandleProps={{
								onDragStart: () => {
									dragIndex.current = index;
								},
								onDragOver: (e) => {
									e.preventDefault();
									dragOverIndex.current = index;
								},
								onDrop: handleDrop,
							}}
						/>
					</div>
				))}
				{categories.length === 0 && (
					<div className="text-center py-16 text-muted-foreground">
						<FolderOpenIcon size={32} className="mx-auto mb-3 opacity-20" />
						<p>Категорий ещё нет. Создайте первую.</p>
					</div>
				)}
			</div>
		</div>
	);
}
