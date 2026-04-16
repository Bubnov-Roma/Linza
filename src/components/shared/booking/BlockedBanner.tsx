"use client";

import { ShieldWarningIcon } from "@phosphor-icons/react";
import type { ApplicationStatus } from "@/core/domain/entities/User";
import { cn } from "@/lib/utils";

export function BlockedBanner({ status }: { status: ApplicationStatus }) {
	const isBlocked = status === "BLOCKED";
	return (
		<div
			className={cn(
				"w-full rounded-2xl border px-4 py-3.5 flex items-start gap-3",
				isBlocked
					? "bg-red-500/8 border-red-500/20"
					: "bg-amber-500/8 border-amber-500/20"
			)}
		>
			<ShieldWarningIcon
				size={16}
				weight="fill"
				className={cn(
					"shrink-0 mt-0.5",
					isBlocked ? "text-red-400" : "text-amber-400"
				)}
			/>
			<div className="space-y-0.5 min-w-0">
				<p
					className={cn(
						"text-sm font-bold leading-snug",
						isBlocked ? "text-red-400" : "text-amber-400"
					)}
				>
					{isBlocked ? "Аккаунт заблокирован" : "Бронирование недоступно"}
				</p>
				<p className="text-[11px] text-muted-foreground leading-snug whitespace-pre-wrap">
					{isBlocked
						? "Услуга аренды для данного профиля временно приостановлена. Обратитесь в поддержку."
						: `Ваша заявка была отклонена. Для возобновления доступа свяжитесь с нами через форму обратной связи`}
				</p>
			</div>
		</div>
	);
}
