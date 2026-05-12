"use client";

import {
	CheckIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { ValidatedInput } from "@/components/forms/shared/ValidatedInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type IndividualClient, socialMediaObjectSchema } from "@/schemas";

export const SocialsSection = () => {
	const {
		control,
		formState: { errors },
	} = useFormContext<IndividualClient>();

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: "applicationData.contacts.socials",
	});

	const [inputValue, setInputValue] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const validate = (val: string): boolean => {
		if (!val) {
			setLocalError(null);
			return false;
		}
		const result = socialMediaObjectSchema.safeParse({ url: val });
		if (!result.success) {
			setLocalError(result.error.issues[0]?.message ?? "Некорректный формат");
			return false;
		}
		setLocalError(null);
		return true;
	};

	const handleAddOrUpdate = () => {
		if (!validate(inputValue)) return;

		if (editingIndex !== null) {
			update(editingIndex, { url: inputValue });
			setEditingIndex(null);
			toast.success("Ссылка обновлена");
		} else {
			if (fields.length >= 5) {
				toast.error("Максимум 5 ссылок");
				return;
			}
			append({ url: inputValue });
			toast.success("Ссылка добавлена");
		}

		// Auto-clear and refocus for next entry
		setInputValue("");
		setLocalError(null);
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const startEdit = (index: number) => {
		setEditingIndex(index);
		setInputValue(fields[index]?.url ?? "");
		setLocalError(null);
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const cancelEdit = () => {
		setEditingIndex(null);
		setInputValue("");
		setLocalError(null);
	};

	const arrayError =
		errors.applicationData?.contacts?.socials?.root?.message ??
		errors.applicationData?.contacts?.socials?.message;

	return (
		<div className="space-y-4">
			{/* Array-level error */}
			{arrayError && (
				<p className="text-xs text-destructive px-1">{arrayError}</p>
			)}

			{/* Input row */}
			<div className="flex gap-2 items-end">
				<div className="flex-1">
					<ValidatedInput
						ref={inputRef}
						label={
							editingIndex !== null
								? `Редактирование ссылки #${editingIndex + 1}`
								: "Соцсети и мессенджеры"
						}
						placeholder="https://... или @username"
						value={inputValue}
						error={localError ?? ""}
						onChange={(e) => {
							setInputValue(e.target.value);
							if (localError) validate(e.target.value);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleAddOrUpdate();
							}
							if (e.key === "Escape" && editingIndex !== null) {
								cancelEdit();
							}
						}}
						// icon={<Globe className="h-4 w-4" />}
					/>
				</div>

				{editingIndex !== null ? (
					<div className="flex gap-1 mb-4">
						<Button
							type="button"
							variant="default"
							onClick={handleAddOrUpdate}
							disabled={!inputValue}
							className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
						>
							<CheckIcon size={18} />
						</Button>
						<Button
							type="button"
							variant="brand"
							onClick={cancelEdit}
							className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-muted-foreground"
						>
							<XIcon size={18} />
						</Button>
					</div>
				) : (
					<Button
						type="button"
						variant="brand"
						onClick={handleAddOrUpdate}
						disabled={!inputValue || fields.length >= 5}
						className="w-12 h-12 mb-4 rounded-full flex items-center justify-center shrink-0"
					>
						<PlusIcon size={20} />
					</Button>
				)}
			</div>

			{/* Link cards */}
			{fields.length > 0 && (
				<div className="space-y-2">
					{fields.map((field, index) => {
						const isEditing = editingIndex === index;

						return (
							<div
								key={field.id}
								className={cn(
									"flex items-center gap-3 rounded-xl transition-all duration-200 px-2 py-2 md:py-0",
									isEditing
										? "border-primary/30 bg-primary/5"
										: "border-foreground/10 hover:bg-foreground/[0.07]"
								)}
							>
								{/* Platform badge */}

								{/* URL */}
								<span className="flex-1 text-sm truncate text-foreground/80 min-w-0">
									{field.url}
								</span>

								{/* Actions */}
								<div className="flex items-center gap-1 shrink-0">
									<button
										type="button"
										onClick={() => {
											remove(index);
											if (editingIndex === index) cancelEdit();
											toast.info("Ссылка удалена");
										}}
										className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
										title="Удалить"
									>
										<TrashIcon size={14} />
									</button>
									<button
										type="button"
										onClick={() =>
											isEditing ? cancelEdit() : startEdit(index)
										}
										className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
										title={isEditing ? "Отмена" : "Редактировать"}
									>
										{isEditing ? <XIcon size={14} /> : <PencilIcon size={14} />}
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Counter hint */}
			{fields.length > 0 && (
				<p className="text-[11px] text-muted-foreground/50 text-right">
					{fields.length} / 5
				</p>
			)}
		</div>
	);
};
