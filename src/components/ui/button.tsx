import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive duration-300 cursor-pointer active:scale-95",
	{
		variants: {
			variant: {
				default:
					"bg-primary brightness-100 text-primary-foreground hover:brightness-105",
				destructive:
					"bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
				outline:
					"border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/50",
				ghost:
					"hover:bg-foreground/20 hover:text-foreground transition-colors duration-500",
				link: "text-primary underline-offset-4 hover:underline",
				social:
					"bg-muted-foreground/5 backdrop-blur-lg border border-foreground/5 text-foreground hover:bg-white/10 hover:shadow-xl hover:border-foreground/10 active:shadow-md",
				glass: cn(
					"relative overflow-hidden bg-secondary/80 backdrop-blur-lg text-foreground transition-all duration-500",
					"hover:border-primary/30",
					// glow layer under btn
					"before:content-[''] before:absolute before:inset-0 before:-z-10 before:bg-[var(--brand-glow)] before:opacity-0 before:blur-xl before:transition-opacity hover:before:opacity-30",
					// glow layer above btn
					"after:content-[''] after:absolute after:inset-0 after:pointer-events-none",
					"after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
					"after:-translate-x-[200%] after:-skew-x-20"
				),
				brand:
					"bg-muted-foreground/10 text-foreground/80 hover:bg-primary hover:text-primary-foreground transition-all duration-200 group/auth",
				tab: cn(
					"flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-2xl text-muted-foreground hover:text-foreground transition-all duration-200"
				),
			},
			isActive: {
				true: "",
				false: "",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				xs: "h-6 rounded-xl gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 rounded-xl gap-1.5 px-3 has-[>svg]:px-2.5",
				md: "h-10 rounded-xl px-6 has-[>svg]:px-3.5",
				lg: "h-12 rounded-xl px-6 has-[>svg]:px-4",
				xl: "h-14 rounded-xl px-6 text-md has-[>svg]:px-5",
				icon: "size-9",
				"icon-xs": "size-6 rounded-xl [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		compoundVariants: [
			{
				variant: "tab",
				isActive: true,
				class: "bg-background text-foreground shadow-sm",
			},
		],
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	isActive,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			data-active={isActive}
			className={cn(buttonVariants({ variant, size, isActive, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
