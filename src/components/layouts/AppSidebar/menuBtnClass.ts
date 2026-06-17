import { cn } from "@/lib/utils";

export const menuBtnClass = (isActive: boolean, isCollapsed: boolean) =>
	cn(
		"transition-all duration-300 group/btn w-full",
		isCollapsed
			? "!h-[64px] flex flex-col items-center justify-center !p-0"
			: "!h-14 rounded-xl flex-row",
		!isCollapsed && isActive && "text-foreground font-bold",
		!isCollapsed &&
			!isActive &&
			"text-muted-foreground/60 hover:bg-muted-foreground/5 hover:text-foreground/80"
	);
