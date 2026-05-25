import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuickActionLinkProps {
	href: string;
	icon: React.ReactNode;
	label: string;
	description?: string;
	badge?: number;
	className?: string;
}

export function QuickActionLink({
	href,
	icon,
	label,
	description,
	badge,
	className,
}: QuickActionLinkProps) {
	return (
		<Link
			href={href}
			className={cn(
				"group relative flex items-center justify-between gap-3 p-3 rounded-2xl transition-all duration-300",
				"bg-foreground/5 border border-foreground/5 hover:bg-foreground/10 hover:border-foreground/10 hover:shadow-lg",
				className
			)}
		>
			{icon}
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold truncate">{label}</p>
				{description && (
					<p className="text-xs text-muted-foreground truncate">
						{description}
					</p>
				)}
			</div>
			{badge !== undefined && badge > 0 && (
				<span className="shrink-0 min-w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center px-1.5">
					{badge}
				</span>
			)}
			<ChevronRight
				size={18}
				className="text-white/20 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-300"
			/>
		</Link>
	);
}
