"use client";

import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { startTransition } from "react";
import { toast } from "sonner";
import { updateApplicationStatusAction } from "@/actions/client-application-actions";
import {
	Badge,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
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
}: {
	app: UserProfile["application"] | null | undefined;
	status?: ApplicationStatus | undefined;
	onUpdate: (updated: Partial<UserProfile>) => void;
}) {
	const handleStatusChange = (newStatus: ApplicationStatus) => {
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
	const s = status ?? "NO_APPLICATION";
	const cfg = VERIFICATION_CONFIG[s] ?? VERIFICATION_CONFIG.NO_APPLICATION;
	return (
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
								<Icon size={14} className={cn(VERIFICATION_CONFIG[s]?.color)} />
							)}
							{VERIFICATION_CONFIG[s]?.label ?? s}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
