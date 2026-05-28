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
import { FaqRow } from "@/components/admin/faq/FaqRow";
import { TagInput } from "@/components/admin/faq/TagInput";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── MAIN CLIENT ──────────────────────────────────────────────────────────────

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
				const newItem = result.item;
				setItems((prev) => [...prev, newItem]);
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

	const active = items.filter((i) => i.isActive).length;

	return (
		<div className="space-y-6 container mx-auto max-w-6xl px-4 py-10">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
						<QuestionIcon
							size={22}
							className="text-muted-foreground"
							weight="duotone"
						/>
						FAQ
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{items.length} вопросов · {active} активных · Перетащите для
						изменения порядка
					</p>
				</div>
				<Button
					size="xl"
					onClick={() => setShowAdd((s) => !s)}
					className="rounded-full md:min-w-35 transition-all duration-300 justify-between items-center"
				>
					{" "}
					<PlusIcon
						size={14}
						className={cn(
							"transition-transform duration-300",
							showAdd && "rotate-135"
						)}
					/>
					<span className="hidden md:block">
						{showAdd ? "Отменить" : "Добавить"}
					</span>
				</Button>
			</div>

			{showAdd && (
				<div className="p-4 rounded-2xl bg-secondary space-y-3 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
					<div className="flex w-full justify-between items-center">
						<p className="text-md md:text-xl font-bold uppercase">
							Новый вопрос
						</p>
						<Button
							disabled={!newQ.trim() || !newA.trim() || isPending}
							onClick={handleCreate}
						>
							Сохранить
						</Button>
					</div>
					<div className="space-y-1.5">
						<Input
							value={newQ}
							onChange={(e) => setNewQ(e.target.value)}
							placeholder="Вопрос ( Как оформить заказ )"
							autoFocus
						/>
					</div>
					<div className="space-y-1.5">
						<Textarea
							value={newA}
							onChange={(e) => setNewA(e.target.value)}
							rows={4}
							placeholder="Подробный ответ..."
							className="resize-none"
						/>
					</div>
					<div className="flex items-end gap-3">
						<div className="flex-1 space-y-1.5">
							<Label className="text-xs">Теги для быстрого поиска</Label>
							<TagInput tags={newTags} onChange={setNewTags} />
						</div>
					</div>
				</div>
			)}

			<div className="space-y-2">
				{items.map((item, index) => (
					<FaqRow
						key={item.id}
						item={item}
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
					<div className="text-center py-16 text-muted-foreground">
						<QuestionIcon size={32} className="mx-auto mb-3 opacity-20" />
						<p>FAQ пока пуст. Добавьте первый вопрос.</p>
					</div>
				)}
			</div>
		</div>
	);
}
