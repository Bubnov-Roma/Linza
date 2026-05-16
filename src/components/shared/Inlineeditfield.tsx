"use client";

import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface InlineEditFieldProps {
	/** Controlled value from parent (the "saved" value) */
	value: string;
	/** Called when user confirms the new value. Return a promise if async. */
	onSave?: (value: string) => Promise<void> | void;
	/** Called when user cancels (X when value unchanged) */
	onCancel?: () => void;
	/** Called when user wants to add a new item (for creation mode) */
	onAdd?: (value: string) => Promise<void> | void;
	placeholder?: string;
	type?: React.InputHTMLAttributes<HTMLTextAreaElement>["type"];
	icon?: React.ReactNode;
	/** Extra classes on the wrapping InputGroup */
	className?: string;
	autoFocus?: boolean;
	/** Disable the field entirely */
	disabled?: boolean;
	/** Mode of the inline edit field */
	mode?: "edit" | "create";
	onChange?: (val: string) => void;
	/** Функция для рендеринга кастомного инпута.
	 * Передает текущее значение черновика, функцию изменения и ссылку.
	 */
	renderInput?: (
		value: string,
		onChange: (val: string) => void,
		onKeyDown: (e: React.KeyboardEvent<Element>) => void
	) => React.ReactNode;
}

/**
 * InlineEditField
 *
 * Two modes:
 *   • edit: Single-button behaviour with save/cancel based on dirty state
 *   • create: Always shows plus button to add new item
 *
 * Enter = save/add (if dirty/in create mode), Escape = cancel
 */
export function InlineEditField({
	value: savedValue,
	onSave,
	onCancel,
	onAdd,
	placeholder,
	icon,
	onChange,
	className,
	autoFocus = false,
	disabled = false,
	mode = "edit",
	renderInput,
}: InlineEditFieldProps) {
	const [draft, setDraft] = useState(savedValue);
	const [saving, setSaving] = useState(false);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Sync if parent value changes (e.g. after successful save)
	useEffect(() => {
		setDraft(savedValue);
	}, [savedValue]);

	useEffect(() => {
		if (autoFocus && !renderInput) inputRef.current?.focus();
	}, [autoFocus, renderInput]);

	const isDirty = draft !== savedValue;
	const isCreateMode = mode === "create";

	const handleSave = async () => {
		if (saving) return;

		if (isCreateMode) {
			if (!draft.trim() || !onAdd) return;
			setSaving(true);
			try {
				await onAdd(draft);
				setDraft("");
				onChange?.("");
			} finally {
				setSaving(false);
			}
		} else {
			if (!isDirty || !onSave) return;
			setSaving(true);
			try {
				await onSave(draft);
			} finally {
				setSaving(false);
			}
		}
	};

	const handleCancel = () => {
		if (isCreateMode) {
			setDraft("");
			onChange?.("");
		} else {
			setDraft(savedValue);
		}
		onCancel?.();
	};

	const handleKeyDown = (e: React.KeyboardEvent<Element>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (isCreateMode) {
				if (draft.trim()) handleSave();
			} else {
				if (isDirty) handleSave();
				else handleCancel();
			}
		}
		if (e.key === "Escape") {
			e.preventDefault();
			handleCancel();
		}
	};

	const internalChange = (val: string) => {
		setDraft(val);
		onChange?.(val);
	};

	const showButton = isCreateMode ? draft.trim().length > 0 : isDirty || saving;

	return (
		<InputGroup className={cn("min-h-10 h-fit group", className)} error={false}>
			{icon && <InputGroupAddon align="inline-start">{icon}</InputGroupAddon>}

			{renderInput ? (
				renderInput(draft, internalChange, handleKeyDown)
			) : (
				<InputGroupTextarea
					ref={inputRef}
					value={draft}
					placeholder={placeholder}
					disabled={disabled || saving}
					onChange={(e) => internalChange(e.target.value)}
					onKeyDown={handleKeyDown}
					className="text-sm"
				/>
			)}
			{showButton && (
				<InputGroupAddon align="inline-end" className="px-3">
					<InputGroupButton
						size="icon-sm"
						variant={isCreateMode || isDirty ? "default" : "ghost"}
						disabled={saving || (isCreateMode && !draft.trim())}
						onClick={handleSave}
						className={cn(
							"transition-all rounded-2xl opacity-70 group-hover:opacity-100",
							isCreateMode || isDirty
								? "bg-primary text-primary-foreground hover:bg-primary/90 "
								: "text-muted-foreground hover:text-foreground"
						)}
						title={isCreateMode ? "Добавить" : isDirty ? "Сохранить" : "Отмена"}
					>
						{saving ? (
							<span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
						) : isCreateMode ? (
							<PlusIcon size={14} />
						) : (
							isDirty && <CheckIcon size={14} />
						)}
					</InputGroupButton>
				</InputGroupAddon>
			)}
		</InputGroup>
	);
}
