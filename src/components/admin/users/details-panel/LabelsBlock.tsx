"use client";

import { ChatIcon, NoteIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import {
	CommentsBlock,
	type UserComment,
} from "@/components/admin/users/details-panel/CommentsBlock";
import { SectionCard } from "@/components/shared";
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import { LABEL_COLOR_OPTIONS, LABEL_COLORS } from "@/constants";
import { cn } from "@/lib/utils";

export interface UserLabel {
	id: string;
	text: string;
	color: keyof typeof LABEL_COLORS;
	dueDate?: string;
	shift?: string;
	createdAt: string;
	author: string;
}

interface LabelsBlockProps {
	labels: UserLabel[];
	onAdd: (l: Omit<UserLabel, "id" | "createdAt" | "author">) => void;
	onRemove: (id: string) => void;
	comments: UserComment[];
	onAddComment: (text: string) => void;
	onRemoveComment: (id: string) => void;
}

export function LabelsBlock({
	labels,
	onAdd,
	onRemove,
	comments,
	onAddComment,
	onRemoveComment,
}: LabelsBlockProps) {
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("");
	const [color, setColor] = useState<keyof typeof LABEL_COLORS>("amber");
	const [dueDate, setDueDate] = useState("");

	const handleAdd = () => {
		if (!text.trim()) return;
		onAdd({ text: text.trim(), color, dueDate: dueDate || "" });
		setText("");
		setDueDate("");
		setOpen(false);
	};

	return (
		<div className="space-y-2 py-6">
			{labels.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{labels.map((label) => (
						<div
							key={label.id}
							className={cn(
								"group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
								LABEL_COLORS[label.color]
							)}
						>
							<NoteIcon size={9} />
							<span>{label.text}</span>
							{label.dueDate && (
								<span className="opacity-60 text-[10px]">
									·{" "}
									{new Date(label.dueDate).toLocaleDateString("ru-RU", {
										day: "numeric",
										month: "short",
									})}
								</span>
							)}
							<button
								type="button"
								onClick={() => onRemove(label.id)}
								className="opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity ml-0.5"
							>
								<XIcon size={10} />
							</button>
						</div>
					))}
				</div>
			)}
			{open ? (
				<div className="p-3 rounded-xl bg-foreground/4 border border-foreground/8 space-y-2.5">
					<Input
						autoFocus
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Текст метки..."
						className="h-8 text-xs"
						onKeyDown={(e) => e.key === "Enter" && handleAdd()}
					/>
					<div className="flex items-center gap-2">
						<div>
							<Label className="text-[10px] text-muted-foreground">Цвет</Label>
							<Select
								value={color}
								onValueChange={(v) => setColor(v as typeof color)}
							>
								<SelectTrigger className="h-7 text-xs rounded-2xl border-muted-foreground/30">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-2xl border-muted-foreground/30">
									{LABEL_COLOR_OPTIONS.map((c) => (
										<SelectItem
											key={c.value}
											value={c.value}
											className="text-xs capitalize"
										>
											{c.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="text-[10px] text-muted-foreground">
								Дата напоминания (опц.)
							</Label>
							<Input
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								className="h-7 text-xs"
							/>
						</div>
						<Button
							size="sm"
							className="h-9 text-xs flex-1"
							onClick={handleAdd}
							disabled={!text.trim()}
						>
							Добавить
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="h-9 text-xs hover:bg-muted-foreground/20"
							onClick={() => setOpen(false)}
						>
							<XIcon size={10} />
						</Button>
					</div>
				</div>
			) : (
				<div className="flex items-center">
					<Button
						variant="link"
						onClick={() => setOpen(true)}
						className="flex text-muted-foreground items-center gap-1 text-[11px] hover:text-foreground transition-colors"
					>
						<NoteIcon size={12} /> Добавить заметку
					</Button>
					<p className="text-[11px] text-muted-foreground">
						( видны только команде )
					</p>
				</div>
			)}
			{/* Внутренние комментарии */}
			<SectionCard
				icon={<ChatIcon size={14} />}
				title="Комментарии сотрудников"
			>
				<div className="p-4">
					<CommentsBlock
						comments={comments}
						onAdd={onAddComment}
						onRemove={onRemoveComment}
					/>
				</div>
			</SectionCard>
		</div>
	);
}
