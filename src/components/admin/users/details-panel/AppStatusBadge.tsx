"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { startTransition, useState } from "react";
import { toast } from "sonner";
import { updateApplicationStatusAction } from "@/actions/client-application-actions";
import { setStatusClarificationWithThreadAction } from "@/actions/support-actions";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Textarea,
} from "@/components/ui";
import { VERIFICATION_CONFIG } from "@/constants";
import type {
	ApplicationStatus,
	UserProfile,
} from "@/core/domain/entities/User";
import { cn } from "@/lib/utils";

export function AppStatusBadge({
	app,
	status,
	onUpdate,
	userId,
}: {
	app: UserProfile["application"] | null | undefined;
	status?: ApplicationStatus | undefined;
	onUpdate: (updated: Partial<UserProfile>) => void;
	userId?: string;
}) {
	const [clarOpen, setClarOpen] = useState(false);
	const [question, setQuestion] = useState("");
	const [isPending, setIsPending] = useState(false);

	const handleStatusChange = (newStatus: ApplicationStatus) => {
		if (newStatus === "CLARIFICATION") {
			setQuestion("");
			setClarOpen(true);
			return;
		}
		startTransition(async () => {
			if (!app) return;
			const result = await updateApplicationStatusAction(app.id, newStatus);
			if (!result.success) toast.error(result.error);
			else {
				toast.success(`Статус изменен`);
				onUpdate({ application: { ...app, status: newStatus } });
			}
		});
	};

	const handleClarificationSubmit = async () => {
		if (!app || !userId || !question.trim()) return;
		setIsPending(true);
		const result = await setStatusClarificationWithThreadAction({
			applicationId: app.id,
			userId,
			question,
		});
		setIsPending(false);
		if (!result.success) {
			toast.error(result.error ?? "Ошибка");
			return;
		}
		toast.success("Статус изменён, вопрос отправлен клиенту");
		onUpdate({ application: { ...app, status: "CLARIFICATION" } });
		setClarOpen(false);
		setQuestion("");
	};

	const s = status ?? "NO_APPLICATION";
	const cfg = VERIFICATION_CONFIG[s] ?? VERIFICATION_CONFIG.NO_APPLICATION;
	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					onClick={(e) => e.stopPropagation()}
					className={cn(
						"outline-none focus:ring-2 focus:ring-primary rounded-full transition-transform hover:scale-105 active:scale-95",
						cfg?.color
					)}
				>
					<Badge
						variant="outline"
						className={cn(
							"text-[10px] flex items-center gap-1 shadow-sm rounded-full cursor-pointer",
							cfg?.color
						)}
					>
						{VERIFICATION_CONFIG[s].shortLabel}
						<CaretDownIcon size={12} className="text-muted-foreground" />
					</Badge>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="center"
					className="w-55 rounded-2xl bg-background/80"
				>
					<div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase">
						Изменить статус анкеты
					</div>
					{(
						[
							"PENDING",
							"REVIEWING",
							"CLARIFICATION",
							"APPROVED",
							"STANDARD",
							"REJECTED",
						] as const
					).map((s) => {
						const Icon = VERIFICATION_CONFIG[s]?.Icon;
						return (
							<DropdownMenuItem
								key={s}
								onClick={(e) => {
									e.stopPropagation();
									handleStatusChange(s as ApplicationStatus);
								}}
								className={cn(
									`text-xs font-medium cursor-pointer rounded-full hover:${VERIFICATION_CONFIG[s]?.bgColor}`,
									VERIFICATION_CONFIG[s]?.color
								)}
							>
								{Icon && (
									<Icon
										size={14}
										className={cn(VERIFICATION_CONFIG[s]?.color)}
									/>
								)}
								{VERIFICATION_CONFIG[s]?.label ?? s}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
			<Dialog open={clarOpen} onOpenChange={setClarOpen}>
				<DialogContent className="sm:max-w-md bg-card/80 rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-base font-bold">
							Уточняющий вопрос по анкете
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-2">
						<p className="text-xs text-muted-foreground">
							Статус анкеты изменится на «Требует уточнения», клиент получит
							уведомление и сможет ответить прямо из него.
						</p>
						<Textarea
							placeholder="Напишите вопрос клиенту..."
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							rows={4}
							disabled={isPending}
							className="resize-none text-sm rounded-xl glass-input"
							autoFocus
							onKeyDown={(e) => {
								if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
									handleClarificationSubmit();
								}
							}}
						/>
						<p className="text-[11px] text-muted-foreground/50 text-right">
							Ctrl+Enter для отправки
						</p>
						<div className="flex gap-2 justify-end">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setClarOpen(false)}
								disabled={isPending}
							>
								Отмена
							</Button>
							<Button
								size="sm"
								onClick={handleClarificationSubmit}
								disabled={isPending || !question.trim()}
							>
								{isPending ? "Отправляем..." : "Отправить вопрос"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
