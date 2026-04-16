import type React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
	title?: string;
	icon?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	headerClassName?: string;
}

export function SectionCard({
	title,
	icon,
	children,
	className,
	headerClassName,
}: SectionCardProps) {
	return (
		<div className={cn("card-surface overflow-hidden", className)}>
			{(title || icon) && (
				<div
					className={cn(
						"card-section-header flex items-center gap-2",
						headerClassName
					)}
				>
					{icon && <span>{icon}</span>}
					{title && (
						<p className="card-section-label uppercase tracking-wider text-[11px]">
							{title}
						</p>
					)}
				</div>
			)}
			<div className="divide-y divide-foreground/5">{children}</div>
		</div>
	);
}
