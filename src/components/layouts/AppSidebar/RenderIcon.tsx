import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const RenderIcon = ({
	icon: Icon,
	isActive,
}: {
	icon: Icon;
	isActive: boolean;
}) => (
	<Icon
		className={cn(
			"duration-300 transition-all ease-out size-6!",
			"group-hover/btn:-translate-y-0.5 group-hover/btn:scale-110 group-hover/btn:text-foreground",
			isActive
				? "text-foreground opacity-100"
				: "opacity-70 group-hover/btn:opacity-100 text-muted-foreground"
		)}
		weight={isActive ? "fill" : "duotone"}
		strokeWidth={isActive ? 2.5 : 2}
	/>
);
