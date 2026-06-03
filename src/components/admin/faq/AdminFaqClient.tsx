"use client";

import { PlusIcon, QuestionIcon } from "@phosphor-icons/react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createFaqItemAction,
	type DbFaqItem,
	deleteFaqItemAction,
	reorderFaqItemsAction,
	updateFaqItemAction,
} from "@/actions/admin-faq-actions";
import { TagInput } from "@/components/admin/faq/TagInput";
import { MarkdownEditor } from "@/components/shared";
import { FaqChip } from "@/components/shared/FaqChip";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function AdminFaqClient({
	initialItems,
}: {
	initialItems: DbFaqItem[];
}) {
	const [items, setItems] = useState(initialItems);
	const [isPending, startTransition] = useTransition();
	const [newQ, setNewQ] = useState("");
	const [newA, setNewA] = useState("");
	const [newTags, setNewTags] = useState<string[]>([]);
	const [showAdd, setShowAdd] = useState(false);

	const dragIndex = useRef<number | null>(null);
	const dragOverIndex = useRef<number | null>(null);

	const handleDrop = async () => {
		const from = dragIndex.current;
		const to = dragOverIndex.current;
		if (from === null || to === null || from === to) return;
		const reordered = [...items];
		const [moved] = reordered.splice(from, 1);
		if (!moved) return;
		reordered.splice(to, 0, moved);
		setItems(reordered);
		await reorderFaqItemsAction(reordered.map((i) => i.id));
		dragIndex.current = null;
		dragOverIndex.current = null;
	};

	const handleCreate = () => {
		if (!newQ.trim() || !newA.trim()) return;
		startTransition(async () => {
			const result = await createFaqItemAction({
				question: newQ.trim(),
				answer: newA.trim(),
				tags: newTags,
			});
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			if (result.item) {
				const resultItem = result.item;
				setItems((prev) => [...prev, resultItem]);
				setNewQ("");
				setNewA("");
				setNewTags([]);
				setShowAdd(false);
				toast.success("Вопрос добавлен");
			}
		});
	};

	const handleUpdate = async (id: string, data: Partial<DbFaqItem>) => {
		const result = await updateFaqItemAction(id, data);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
	};

	const handleDelete = async (id: string) => {
		const result = await deleteFaqItemAction(id);
		if (!result.success) {
			toast.error(result.error);
			return;
		}
		setItems((prev) => prev.filter((i) => i.id !== id));
		toast.success("Вопрос удалён");
	};

	return (
		<div className="space-y-6 container mx-auto max-w-4xl px-4 py-10">
			{/* Шапка админки */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
						<QuestionIcon
							size={22}
							className="text-muted-foreground"
							weight="duotone"
						/>
						Управление FAQ
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{items.length} вопросов · Перетаскивайте карточки для изменения
						порядка на сайте
					</p>
				</div>
				<Button
					size="xl"
					onClick={() => setShowAdd((s) => !s)}
					className="rounded-full"
				>
					<PlusIcon
						size={14}
						className={cn(
							"transition-transform duration-300",
							showAdd && "rotate-135"
						)}
					/>
					<span className="ml-2">
						{showAdd ? "Отменить" : "Добавить вопрос"}
					</span>
				</Button>
			</div>

			{/* Форма добавления нового вопроса */}
			{showAdd && (
				<div className="p-6 rounded-2xl bg-foreground/3 border border-foreground/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
					<div className="space-y-1">
						<Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
							Вопрос
						</Label>
						<Input
							value={newQ}
							onChange={(e) => setNewQ(e.target.value)}
							placeholder="Например: Как оформить аренду оборудования?"
							autoFocus
						/>
					</div>

					<div className="space-y-1">
						<MarkdownEditor
							label="Ответ"
							value={newA}
							onChange={setNewA}
							rows={4}
							placeholder="Подробный ответ с поддержкой стилей..."
						/>
					</div>

					<div className="space-y-3">
						<div className="space-y-1">
							<Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
								Теги быстрого поиска
							</Label>
							<TagInput tags={newTags} onChange={setNewTags} />
						</div>
						<div className="flex justify-end pt-2">
							<Button
								disabled={!newQ.trim() || !newA.trim() || isPending}
								onClick={handleCreate}
							>
								Сохранить и опубликовать
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Список вопросов */}
			<div className="grid gap-3">
				{items.map((item, index) => (
					<FaqChip
						key={item.id}
						item={item}
						isAdmin={true} // Переключаем режим компонента в админский
						onUpdate={handleUpdate}
						onDelete={handleDelete}
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
				))}

				{items.length === 0 && (
					<div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl">
						<QuestionIcon size={32} className="mx-auto mb-3 opacity-20" />
						<p>FAQ пока пуст. Создайте первый вопрос сверху.</p>
					</div>
				)}
			</div>
		</div>
	);
}
