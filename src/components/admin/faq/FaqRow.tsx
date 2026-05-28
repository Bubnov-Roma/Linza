"use client";

import {
	ControlIcon,
	EyeClosedIcon,
	EyeIcon,
	PencilIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { DbFaqItem } from "@/actions/admin-faq-actions";
import { TagInput } from "@/components/admin/faq/TagInput";
import {
	Button,
	Card,
	Input,
	Label,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export function FaqRow({
	item,
	onUpdate,
	onDelete,
	dragHandleProps,
}: {
	item: DbFaqItem;
	onUpdate: (id: string, data: Partial<DbFaqItem>) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	dragHandleProps: {
		onDragStart: () => void;
		onDragOver: (e: React.DragEvent) => void;
		onDrop: () => void;
	};
}) {
	const [editing, setEditing] = useState(false);
	const [editQ, setEditQ] = useState(item.question);
	const [editA, setEditA] = useState(item.answer);
	const [editTags, setEditTags] = useState<string[]>(item.tags ?? []);
	const [expanded, setExpanded] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleSave = () => {
		startTransition(async () => {
			await onUpdate(item.id, {
				question: editQ,
				answer: editA,
				tags: editTags,
			});
			setEditing(false);
			toast.success("Вопрос обновлён");
		});
	};

	const handleCancel = () => {
		setEditQ(item.question);
		setEditA(item.answer);
		setEditTags(item.tags ?? []);
		setEditing(false);
	};

	return (
		<Card
			className={cn(
				"rounded-2xl border overflow-hidden transition-all duration-200 ",
				item.isActive
					? "border-white/8 bg-foreground/3"
					: "border-white/4 bg-foreground/1 opacity-60"
			)}
			draggable
			onDragStart={dragHandleProps.onDragStart}
			onDragOver={dragHandleProps.onDragOver}
			onDrop={dragHandleProps.onDrop}
		>
			<div className="flex flex-col md:flex-row items-start gap-2">
				<div className="flex-1 min-w-0 w-full h-full px-3">
					{editing ? (
						<div className="space-y-3 py-3">
							<div className="space-y-1">
								<Label className="text-xs">Вопрос</Label>
								<Input
									value={editQ}
									onChange={(e) => setEditQ(e.target.value)}
									autoFocus
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs">Ответ</Label>
								<Textarea
									value={editA}
									onChange={(e) => setEditA(e.target.value)}
									rows={4}
									className="resize-none text-sm"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs">Теги для поиска</Label>
								<TagInput tags={editTags} onChange={setEditTags} />
							</div>
						</div>
					) : (
						<button
							type="button"
							className="w-full text-left h-full cursor-pointer py-3"
							onClick={() => setExpanded((e) => !e)}
						>
							<div className="flex flex-col md:flex-row items-start gap-2 flex-wrap flex-1">
								<span
									className={cn(
										"text-sm font-semibold leading-snug flex-1 min-w-0",
										expanded && "pb-2  items-end"
									)}
								>
									{item.question}{" "}
									<ControlIcon
										size={12}
										className={cn(
											"shrink-0 inline transition-transform duration-200",
											expanded && "rotate-180"
										)}
									/>
								</span>
								{(item.tags ?? []).length > 3 && (
									<span className="text-[10px] text-muted-foreground/50 items-center">
										+{(item.tags ?? []).length - 3}{" "}
										{(item.tags ?? []).slice(0, 3).map((tag) => (
											<span
												key={tag}
												className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/8 text-muted-foreground border border-foreground/8"
											>
												{" "}
												#{tag}
											</span>
										))}
									</span>
								)}
							</div>
							{expanded && (
								<p className="text-sm text-muted-foreground pt-4 leading-relaxed text-left whitespace-pre-line border-t border-muted-foreground/10">
									{item.answer}
								</p>
							)}
						</button>
					)}
				</div>

				<div className="flex items-center justify-end shrink-0 gap-2 ml-auto w-fit h-full pr-3 py-2">
					{editing ? (
						<div className="flex w-full md:w-fit flex-row md:flex-col mt-2 gap-6">
							<Button
								variant="ghost"
								className="flex-1"
								onClick={handleSave}
								disabled={isPending}
							>
								Сохранить
							</Button>
							<Button variant="ghost" className="flex-1" onClick={handleCancel}>
								Отменить
							</Button>
						</div>
					) : (
						<>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="icon-xs"
										variant="ghost"
										onClick={() =>
											startTransition(async () => {
												await onUpdate(item.id, { isActive: !item.isActive });
											})
										}
									>
										{item.isActive ? (
											<EyeIcon weight="duotone" size={12} />
										) : (
											<EyeClosedIcon weight="duotone" size={12} />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{item.isActive ? "Скрыть" : "Показать"}
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="icon-xs"
										variant="ghost"
										aria-label="Изменить"
										onClick={() => setEditing(true)}
									>
										<PencilIcon weight="duotone" size={12} />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Изменить</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="icon-xs"
										variant="ghost"
										className="text-red-500 hover:text-red-500 hover:bg-red-500/30"
										onClick={() => {
											if (confirm("Удалить вопрос?"))
												startTransition(() => onDelete(item.id));
										}}
									>
										<TrashIcon weight="duotone" size={12} />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Удалить</TooltipContent>
							</Tooltip>
						</>
					)}
				</div>
			</div>
		</Card>
	);
}
