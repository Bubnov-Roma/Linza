"use client";

import {
	CaretRightIcon,
	DotsSixVerticalIcon,
	PencilSimpleIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button, Card, Input } from "@/components/ui";
import type { DbSubcategory } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

export function SubcategoryRow({
	sub,
	onUpdate,
	onDelete,
	dragHandleProps,
}: {
	sub: DbSubcategory;
	onUpdate: (id: string, data: Partial<DbSubcategory>) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	dragHandleProps?: {
		onDragStart: () => void;
		onDragOver: (e: React.DragEvent) => void;
		onDrop: () => void;
	};
}) {
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState(sub.name);
	const [editNotes, setEditNotes] = useState(sub.adminNotes ?? "");
	const [isPending, startTransition] = useTransition();

	const handleSave = () => {
		startTransition(async () => {
			await onUpdate(sub.id, {
				name: editName,
				adminNotes: editNotes || undefined,
			});
			setEditing(false);
			toast.success("Подкатегория обновлена");
		});
	};

	return (
		<Card
			className={cn(
				"p-0",
				editing ? "bg-foreground/5" : "hover:bg-foreground/5"
			)}
			draggable={!!dragHandleProps}
			onDragStart={dragHandleProps?.onDragStart}
			onDragOver={dragHandleProps?.onDragOver}
			onDrop={dragHandleProps?.onDrop}
		>
			<div className="flex items-center w-full gap-2 rounded-lg group p-1.5">
				{dragHandleProps ? (
					<DotsSixVerticalIcon
						size={11}
						className="text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground/60 cursor-grab transition-colors"
					/>
				) : (
					<CaretRightIcon
						size={11}
						className="text-muted-foreground/30 shrink-0"
					/>
				)}
				{editing ? (
					<div className="flex-1 space-y-1.5">
						<Input
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							className="h-7 text-sm glass-input"
							autoFocus
						/>
						<Input
							value={editNotes}
							onChange={(e) => setEditNotes(e.target.value)}
							placeholder="Заметка..."
							className="h-7 text-xs glass-input"
						/>
					</div>
				) : (
					<div className="flex-1 min-w-0">
						<span className="text-sm truncate">{sub.name}</span>
						{sub.adminNotes && (
							<p className="text-[11px] text-amber-400/70 truncate">
								{sub.adminNotes}
							</p>
						)}
					</div>
				)}
				<div className="flex items-center gap-1 shrink-0">
					{editing ? (
						<>
							<Button
								size="sm"
								variant="ghost"
								className="h-6 px-2 text-xs"
								onClick={handleSave}
								disabled={isPending}
							>
								Ок
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="h-6 w-6 p-0"
								onClick={() => setEditing(false)}
							>
								<XIcon size={11} />
							</Button>
						</>
					) : (
						<>
							<Button
								size="sm"
								variant="ghost"
								className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={() => setEditing(true)}
							>
								<PencilSimpleIcon size={11} className="text-muted-foreground" />
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-opacity"
								onClick={() => {
									if (confirm(`Удалить «${sub.name}»?`))
										startTransition(() => onDelete(sub.id));
								}}
							>
								<TrashIcon size={11} />
							</Button>
						</>
					)}
				</div>
			</div>
		</Card>
	);
}
