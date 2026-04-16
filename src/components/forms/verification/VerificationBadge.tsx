"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ValidatedTextarea } from "@/components/forms/shared";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import type { StatusAction } from "@/constants";
import { useApplicationStatus } from "@/hooks/use-application-status";
import { cn } from "@/lib/utils";

interface Props {
	isClientPartner?: boolean;
}

function ActionLink({
	action,
	onClose,
}: {
	action: StatusAction;
	onClose: () => void;
}) {
	return (
		<Link
			href={action.href}
			onClick={onClose}
			className="inline-flex items-center gap-1 text-xs font-bold text-foreground hover:underline mt-1.5"
		>
			{action.label}
			<ArrowRight size={11} />
		</Link>
	);
}

export const VerificationBadge: React.FC<Props> = ({
	isClientPartner = false,
}) => {
	const [open, setOpen] = useState(false);
	const { status, config } = useApplicationStatus();
	const {
		Icon,
		label,
		description,
		color,
		bgColor,
		borderColor,
		glowColor,
		action,
	} = config;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<form>
				<Tooltip key={label}>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<Button
								variant="tab"
								className={cn("transition-all border", bgColor, borderColor)}
							>
								{/* Мобильная версия — только иконка */}
								<Icon className={cn("w-4 h-4 md:hidden", color)} />
								{/* Десктоп — текстовый лейбл */}
								<span
									className={cn(
										"hidden md:inline-block text-[10px] font-bold uppercase tracking-widest",
										color
									)}
								>
									{isClientPartner ? "Partner" : label}
								</span>
							</Button>
						</DialogTrigger>
					</TooltipTrigger>
					<TooltipContent className="md:hidden">{label}</TooltipContent>
				</Tooltip>

				<DialogContent
					className={cn(
						"glass items-center justify-center text-center flex-col transition-all rounded-2xl sm:max-w-106.25 backdrop-blur-xl border bg-background/80",
						borderColor
					)}
				>
					<DialogHeader className="flex items-center justify-center text-center">
						<DialogTitle className={color}>{label}</DialogTitle>
						<DialogDescription className="flex flex-col items-center justify-center text-center whitespace-pre-line">
							{description}
							{/* Ссылка-действие под описанием — закрывает диалог при переходе */}
							{action && (
								<ActionLink action={action} onClose={() => setOpen(false)} />
							)}
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col items-center justify-center w-full gap-4">
						{/* Большая иконка с подсветкой */}
						<div
							className={cn(
								"z-10 flex items-center justify-center",
								status !== "LOADING" && glowColor,
								color
							)}
							style={{ willChange: "filter" }}
						>
							<Icon className={cn("w-20 h-20", color)} />
						</div>

						{/* Форма уточнения — только при статусе clarification */}
						{status === "CLARIFICATION" && (
							<>
								<ValidatedTextarea label="Поле для ответа" className="w-full" />
								<DialogFooter className="flex justify-between w-full">
									<Button size="xs" type="submit">
										Отправить
									</Button>
								</DialogFooter>
							</>
						)}
					</div>
				</DialogContent>
			</form>
		</Dialog>
	);
};
