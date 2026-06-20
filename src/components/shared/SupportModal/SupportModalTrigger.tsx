"use client";

import { HeadsetIcon, QuestionIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type { DbSupportThread } from "@/actions/support-actions";
import { SupportModal } from "@/components/shared/SupportModal/SupportModal";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

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
				<Button
					onClick={() => setOpen(true)}
					variant="outline"
					size="xl"
					className={cn("rounded-full", className)}
				>
					<QuestionIcon
						size={26}
						weight="duotone"
						className="shrink-0 md:hidden"
					/>
					<span className="hidden md:block">{label}</span>
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
			<Button
				size="icon"
				onClick={() => setOpen(true)}
				aria-label="Открыть чат поддержки"
				className={`fixed bottom-20 right-6 w-14 h-14 rounded-full bg-foreground/20 backdrop-blur-md text-background/80 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 z-40 ${className || ""}`}
			>
				<HeadsetIcon size={30} weight="duotone" />
			</Button>
			<SupportModal
				open={open}
				onOpenChange={setOpen}
				{...(existingThread && { existingThread })}
			/>
		</>
	);
}
