import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				// Layout & typography
				"w-full min-w-0 h-11 rounded-xl px-3 py-1 border border-transparent hover:border-foreground/10 transition-all duration-300 ease-out",
				"focus:outline-none focus:ring-1 focus:ring-foreground/10 focus:shadow-lg focus-within:border-primary/50",
				"text-base md:text-sm placeholder:text-muted-foreground",
				"selection:bg-primary selection:text-primary-foreground",
				// File input reset
				"file:text-foreground file:inline-flex file:h-7 file:bg-transparent file:text-sm file:font-medium file:border-0",
				// Disabled state
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				// Validation state
				"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
				className
			)}
			{...props}
		/>
	);
}

export { Input };
