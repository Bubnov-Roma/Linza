"use client";

import {
	DotsSixVerticalIcon,
	EyeClosedIcon,
	EyeIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { DbFaqItem } from "@/actions/admin-faq-actions";
import { TagInput } from "@/components/admin/faq/TagInput";
import { MarkdownEditor, SimpleMarkdown } from "@/components/shared";
import {
	Button,
	Card,
	CardAction,
	CardContent,
	Input,
	Label,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface FaqChipProps {
	item: DbFaqItem;
	query?: string;
	isOpen?: boolean;
	onToggle?: () => void;
	isAdmin?: boolean;
	onUpdate?: (id: string, data: Partial<DbFaqItem>) => Promise<void>;
	onDelete?: (id: string) => Promise<void>;
	dragHandleProps?: {
		onDragStart: () => void;
		onDragOver: (e: React.DragEvent) => void;
		onDrop: () => void;
	};
}

export function FaqChip({
	item,
	query = "",
	isOpen: controlledIsOpen,
	onToggle: controlledOnToggle,
	isAdmin = false,
	onUpdate,
	onDelete,
	dragHandleProps,
}: FaqChipProps) {
	// Локальные состояния
	const [localExpanded, setLocalExpanded] = useState(false);
	const [editing, setEditing] = useState(false);
	const [editQ, setEditQ] = useState(item.question);
	const [editA, setEditA] = useState(item.answer);
	const [editTags, setEditTags] = useState<string[]>(item.tags ?? []);
	const [isPending, startTransition] = useTransition();

	// Состояние, разрешающее тащить карточку (активируется только при зажатии иконки)
	const [canDrag, setCanDrag] = useState(false);

	const isExpanded =
		controlledIsOpen !== undefined ? controlledIsOpen : localExpanded;

	const toggleExpand = () => {
		if (editing) return; // Не закрывать/открывать аккордеон во время редактирования
		if (controlledOnToggle) controlledOnToggle();
		else setLocalExpanded((prev) => !prev);
	};

	const handleSave = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!onUpdate) return;
		startTransition(async () => {
			await onUpdate(item.id, {
				question: editQ.trim(),
				answer: editA.trim(),
				tags: editTags,
			});
			setEditing(false);
			toast.success("Вопрос обновлён");
		});
	};

	const handleCancel = (e: React.MouseEvent) => {
		e.stopPropagation();
		setEditQ(item.question);
		setEditA(item.answer);
		setEditTags(item.tags ?? []);
		setEditing(false);
	};

	return (
		<Card
			data-flip-id={item.id}
			// Карточка становится draggable только в админке, вне режима редактирования и ЕСЛИ зажата иконка
			draggable={isAdmin && !editing && canDrag}
			onDragStart={dragHandleProps?.onDragStart}
			onDragOver={dragHandleProps?.onDragOver}
			onDrop={dragHandleProps?.onDrop}
			// Сбрасываем флаг перетаскивания при любом завершении события
			onDragEnd={() => setCanDrag(false)}
			onMouseUp={() => setCanDrag(false)}
			className={cn(
				"group relative px-6 md:px-8 py-8 transition-all duration-200 select-none border",
				isAdmin ? "hover:border-foreground/20" : "border-0",
				editing ? "cursor-default" : "cursor-pointer",
				item.isActive
					? isExpanded && !isAdmin
						? "bg-foreground/5 col-span-full border-foreground/10 border-0"
						: "bg-foreground/2 border-transparent"
					: "border-dashed border-foreground/10 bg-foreground/1 opacity-60"
			)}
			onClick={toggleExpand}
		>
			{/* РЕЖИМ РЕДАКТИРОВАНИЯ (ТОЛЬКО ДЛЯ АДМИНА) */}
			{isAdmin && editing ? (
				<CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
					<div className="space-y-1">
						<Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
							Вопрос
						</Label>
						<Input
							value={editQ}
							onChange={(e) => setEditQ(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="space-y-1">
						<MarkdownEditor
							label="Ответ (Поддерживает форматирование)"
							value={editA}
							onChange={setEditA}
							rows={5}
						/>
					</div>

					<div className="space-y-1">
						<Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
							Теги для поиска
						</Label>
						<TagInput tags={editTags} onChange={setEditTags} />
					</div>

					<div className="flex gap-2 pt-2 justify-end">
						<Button variant="ghost" size="sm" onClick={handleCancel}>
							Отменить
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isPending || !editQ.trim() || !editA.trim()}
						>
							Сохранить
						</Button>
					</div>
				</CardContent>
			) : (
				/* СТАНДАРТНЫЙ РЕЖИМ ОТОБРАЖЕНИЯ (КЛИЕНТ И АДМИН) */
				<div className="space-y-4">
					<div className={cn("flex justify-between items-center gap-4")}>
						<div className="flex items-center gap-3 flex-1 min-w-0">
							{isAdmin && (
								<CardAction
									onMouseDown={(e) => {
										if (e.button === 0) setCanDrag(true);
									}}
									onClick={(e) => e.stopPropagation()}
									className="text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing shrink-0 px-1 py-8 transition-colors h-full"
								>
									<DotsSixVerticalIcon size={16} weight="bold" />
								</CardAction>
							)}
							<div className="text-base font-semibold leading-snug text-foreground">
								<SimpleMarkdown
									text={item.question}
									query={query}
									className="inline-block"
								/>
								{/* Отрендерим теги в админ-панели */}
								{isAdmin && (item.tags ?? []).length > 0 && (
									<div className="flex flex-wrap gap-1 mt-1.5">
										{(item.tags ?? []).map((tag) => (
											<span
												key={tag}
												className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted-foreground border border-foreground/5"
											>
												#{tag}
											</span>
										))}
									</div>
								)}
							</div>
						</div>

						{/* БЛОК КНОПОК УПРАВЛЕНИЯ */}
						<Card
							className="flex items-center gap-1 shrink-0 rounded-full text-muted-foreground/70"
							onClick={(e) => e.stopPropagation()}
						>
							{isAdmin && (
								<>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="icon"
												variant="ghost"
												disabled={isPending}
												className="hover:bg-transparent"
												onClick={() =>
													onUpdate?.(item.id, { isActive: !item.isActive })
												}
											>
												{item.isActive ? (
													<EyeIcon weight="duotone" size={14} />
												) : (
													<EyeClosedIcon weight="duotone" size={14} />
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent side="left">
											{item.isActive ? "Скрыть" : "Показать"}
										</TooltipContent>
									</Tooltip>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => setEditing(true)}
												className="hover:bg-transparent"
											>
												<PencilIcon weight="duotone" size={14} />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="left">Изменить</TooltipContent>
									</Tooltip>

									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="icon"
												variant="ghost"
												className="text-red-500 hover:text-red-500 hover:bg-transparent"
												onClick={() => {
													if (confirm("Удалить этот вопрос?"))
														onDelete?.(item.id);
												}}
											>
												<TrashIcon weight="duotone" size={14} />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="left">Удалить</TooltipContent>
									</Tooltip>
								</>
							)}

							{/* Дефолтная кнопка раскрытия */}
							<Button
								variant="ghost"
								size="icon"
								onClick={toggleExpand}
								className={cn(
									"p-1.5 hover:bg-transparent",
									!isAdmin && "hover:bg-muted-foreground/25"
								)}
							>
								<PlusIcon
									className={cn(
										"transition-transform duration-200 text-muted-foreground/70",
										isExpanded && "rotate-45"
									)}
									size={14}
								/>
							</Button>
						</Card>
					</div>

					{/* ВЫДВИЖНОЙ БЛОК ОТВЕТА С MARKDOWN */}
					{isExpanded && (
						<div className="text-muted-foreground leading-relaxed whitespace-pre-line border-t border-foreground/6 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
							<SimpleMarkdown text={item.answer} query={query} />
						</div>
					)}
				</div>
			)}
		</Card>
	);
}
