"use client";

import { CheckCircleIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { submitFaqQuestionAction } from "@/actions/admin-faq-actions";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function AskForm({ defaultQuestion }: { defaultQuestion: string }) {
	const [text, setText] = useState(defaultQuestion);
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		setText(defaultQuestion);
	}, [defaultQuestion]);

	const handleSubmit = () => {
		if (!text.trim()) return;
		startTransition(async () => {
			const result = await submitFaqQuestionAction({ text, email });
			if (!result.success) {
				toast.error(result.error ?? "Ошибка отправки");
				return;
			}
			setSubmitted(true);
		});
	};

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-3 py-6 text-center animate-in fade-in zoom-in-95 duration-300">
				<CheckCircleIcon
					size={36}
					className="text-green-500"
					weight="duotone"
				/>
				<p className="font-semibold">Вопрос отправлен!</p>
				<p className="text-sm text-muted-foreground">
					Мы добавим ответ в FAQ или свяжемся с вами напрямую.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				rows={3}
				placeholder="Опишите ваш вопрос подробнее..."
				className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40 transition-all"
			/>
			<input
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				type="email"
				placeholder="Email для ответа (необязательно)"
				className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40 transition-all"
			/>
			<Button
				onClick={handleSubmit}
				disabled={!text.trim() || isPending}
				className={cn(
					"flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold",
					"transition-all duration-200 bg-foreground text-background",
					"hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
				)}
			>
				<PaperPlaneTiltIcon size={14} weight="bold" />
				{isPending ? "Отправляем..." : "Отправить"}
			</Button>
		</div>
	);
}
