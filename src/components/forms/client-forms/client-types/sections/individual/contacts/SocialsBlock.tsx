"use client";
import { PencilIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button, CardContent, Label } from "@/components/ui";

import { cn } from "@/lib/utils";
import { type IndividualClient, socialMediaObjectSchema } from "@/schemas";

export const SocialsBlock = () => {
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

	const isAvailable = editingIndex === 4 || fields.length < 5;

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
		<div className="space-y-1.5">
			<Label required error={!!arrayError || !!localError}>
				Соцсети
			</Label>

			{/* Поле с чипами */}
			<CardContent
				className={cn(
					"glass-input rounded-md min-h-11 px-3 py-2 flex flex-wrap gap-2 items-center cursor-text",
					arrayError && "border-red-400/50"
				)}
				onClick={() => inputRef.current?.focus()}
			>
				{/* Чипы добавленных ссылок */}
				{fields.map((field, index) => {
					const isEditing = editingIndex === index;
					return (
						<div
							key={field.id}
							className={cn(
								"flex items-center gap-1 rounded-lg px-0 p-0.5 text-xs max-w-36 md:max-w-43",
								isEditing
									? "bg-primary/20 border border-primary/40"
									: "bg-foreground/10 border border-foreground/10"
							)}
						>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									remove(index);
									if (editingIndex === index) cancelEdit();
									toast.info("Ссылка удалена");
								}}
								className="cursor-pointer text-muted-foreground hover:text-destructive hover:bg-muted-foreground/20 shrink-0 py-1 px-2 rounded-md"
							>
								<TrashIcon size={10} weight="duotone" />
							</button>
							<span className="truncate text-foreground/80">{field.url}</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									if (isEditing) cancelEdit();
									else startEdit(index);
								}}
								className="cursor-pointer text-muted-foreground hover:text-foreground shrink-0 hover:bg-muted-foreground/20 py-1 px-2 rounded-md"
							>
								{isEditing ? (
									<XIcon size={10} />
								) : (
									<PencilIcon size={10} weight="duotone" />
								)}
							</button>
						</div>
					);
				})}

				{/* Инпут */}
				{isAvailable && (
					<input
						ref={inputRef}
						value={inputValue}
						placeholder={
							fields.length === 0
								? "https://... или @username"
								: "Добавить ещё..."
						}
						className="flex-1 min-w-30 bg-transparent outline-none text-sm placeholder:text-muted-foreground/50 py-0.5"
						onChange={(e) => {
							setInputValue(e.target.value);
							if (localError) validate(e.target.value);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleAddOrUpdate();
							}
							if (e.key === "Escape" && editingIndex !== null) cancelEdit();
						}}
					/>
				)}
			</CardContent>

			{/* Лейбл + кнопка добавить */}
			<div className="flex items-center justify-between min-h-10">
				{inputValue && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<Button
							variant="outline"
							onClick={handleAddOrUpdate}
							className="font-medium cursor-pointer rounded-2xl bg-foreground/5"
						>
							{editingIndex !== null ? "Сохранить" : "Добавить"}
						</Button>
					</motion.div>
				)}
				<span
					className={cn(
						"ml-auto text-[10px] text-muted-foreground/40",
						(arrayError || localError) && "text-red-400"
					)}
				>
					{!arrayError && !localError
						? `${fields.length}/5`
						: localError
							? localError
							: arrayError}
				</span>
			</div>
		</div>
	);
};
