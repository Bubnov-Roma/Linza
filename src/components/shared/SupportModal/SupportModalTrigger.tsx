"use client";

import { QuestionIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { DbSupportThread } from "@/actions/support-actions";
import { SupportModal } from "@/components/shared/SupportModal/SupportModal";
import { Button } from "@/components/ui";

export interface SupportModalTriggerProps {
	/** Если передан - это будет ответ в существующий поток */
	existingThread?: DbSupportThread | null;
	/** Внешний вид: "fab" (плавающая кнопка) или "button" (обычная кнопка) */
	variant?: "fab" | "button";
	/** Только для variant="button" - текст кнопки */
	label?: string;
	/** CSS класс для кастомизации */
	className?: string;
}

export function SupportModalTrigger({
	existingThread,
	variant = "fab",
	label = "Задать вопрос",
	className,
}: SupportModalTriggerProps) {
	const [open, setOpen] = useState(false);

	if (variant === "button") {
		return (
			<>
				<Button onClick={() => setOpen(true)} className={className} size="sm">
					<QuestionIcon size={16} weight="duotone" />
					{label}
				</Button>
				<SupportModal
					open={open}
					onOpenChange={setOpen}
					{...(existingThread && { existingThread })}
				/>
			</>
		);
	}

	// FAB (Floating Action Button)
	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Открыть чат поддержки"
				className={`
					fixed bottom-6 right-6 
					w-14 h-14 rounded-full 
					bg-foreground text-background
					flex items-center justify-center
					shadow-lg hover:shadow-xl
					transition-all duration-200
					hover:scale-110 active:scale-95
					z-40
					${className || ""}
				`}
			>
				<QuestionIcon size={24} weight="duotone" />
			</button>
			<SupportModal
				open={open}
				onOpenChange={setOpen}
				{...(existingThread && { existingThread })}
			/>
		</>
	);
}
