"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function InputGroup({
	className,
	error,
	...props
}: React.ComponentProps<"div"> & { error?: boolean }) {
	return (
		// biome-ignore lint/a11y/useSemanticElements: the use of div is justified by styling
		<div
			data-slot="input-group"
			role="group"
			className={cn(
				// "glass-input",
				"group/input-group relative flex w-full items-center transition-all duration-300",
				"h-12 min-w-0 rounded-2xl overflow-hidden",
				"hover:bg-(--input-bg-hover) hover:border-black/15 dark:hover:border-white/15 focus:border-primary/30",
				"focus-within:bg-(--input-bg-focus)! focus-within:shadow-(--input-shadow-focus)!",
				"focus-within:border-[oklch(from_var(--brand-color)_l_c_h/0.5)] focus-within:translate-y-0 focus-within:ring-1 focus-within:ring-primary/10",
				error
					? "border-red-400/50 ring-red-400/10 shadow-error-glow"
					: "border-foreground/10",
				"has-[>textarea]:h-auto",

				// Variants based on alignment.
				"has-[>[data-align=inline-start]]:[&>input]:pl-2",
				"has-[>[data-align=inline-end]]:[&>input]:pr-2",
				"has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
				"has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",
				className
			)}
			{...props}
		/>
	);
}

const inputGroupAddonVariants = cva(
	"text-muted-foreground flex h-full cursor-text items-center justify-center gap-2 px-3 text-sm font-medium select-none transition-colors duration-300",
	{
		variants: {
			align: {
				"inline-start":
					"order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
				"inline-end":
					"order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]",
				"block-start":
					"order-first w-full justify-start px-3 pt-3 [.border-b]:pb-3 group-has-[>input]/input-group:pt-2.5",
				"block-end":
					"order-last w-full justify-start px-3 pb-3 [.border-t]:pt-3 group-has-[>input]/input-group:pb-2.5",
			},
		},
		defaultVariants: {
			align: "inline-start",
		},
	}
);

function InputGroupAddon({
	className,
	align = "inline-start",
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: click only to change focus
		// biome-ignore lint/a11y/useSemanticElements: the use of div is justified by styling
		<div
			role="group"
			data-slot="input-group-addon"
			data-align={align}
			className={cn(inputGroupAddonVariants({ align }), className)}
			onClick={(e) => {
				if ((e.target as HTMLElement).closest("button")) {
					return;
				}
				e.currentTarget.parentElement?.querySelector("input")?.focus();
			}}
			{...props}
		/>
	);
}

const inputGroupButtonVariants = cva(
	"text-sm shadow-none flex gap-2 items-center",
	{
		variants: {
			size: {
				xs: "h-6 gap-1 px-2 rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-3.5 has-[>svg]:px-2",
				sm: "h-8 px-2.5 gap-1.5 rounded-md has-[>svg]:px-2.5",
				"icon-xs":
					"size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
				"icon-sm": "size-8 p-0 has-[>svg]:p-0",
			},
		},
		defaultVariants: {
			size: "xs",
		},
	}
);

function InputGroupButton({
	className,
	type = "button",
	variant = "ghost",
	size = "xs",
	...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
	VariantProps<typeof inputGroupButtonVariants>) {
	return (
		<Button
			type={type}
			data-size={size}
			variant={variant}
			className={cn(inputGroupButtonVariants({ size }), className)}
			{...props}
		/>
	);
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			className={cn(
				"text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
				className
			)}
			{...props}
		/>
	);
}

function InputGroupInput({
	className,
	...props
}: React.ComponentProps<"input">) {
	return (
		<input
			data-slot="input-group-control"
			className={cn(
				"flex-1 h-full w-full bg-transparent border-none outline-none px-3",
				"text-base md:text-sm placeholder:text-foreground/20",
				"focus:ring-0 focus:outline-none",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className
			)}
			{...props}
		/>
	);
}

function InputGroupTextarea({
	className,
	...props
}: React.ComponentProps<"textarea">) {
	return (
		<Textarea
			data-slot="input-group-control"
			className={cn(
				"flex-1 resize-none rounded-2xl border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
				className
			)}
			{...props}
		/>
	);
}

export {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
};
