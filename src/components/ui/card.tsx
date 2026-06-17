import type * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card"
			className={cn(
				"glass-card group relative flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300",
				className
			)}
			{...props}
		>
			{/* 1. Background Noise Effects ) */}
			<div
				className="absolute inset-0 opacity-3 mix-blend-overlay pointer-events-none z-0"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
				}}
			/>
			{/* 2. Hover Glow & Refraction */}
			{/* Насыщенный диагональный блик при ховере (эффект скольжения света) */}
			<div className="absolute top-0 left-0 right-0 inset-0 bg-linear-to-r from-white/4 via-white-2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none z-0" />
			{/* Насыщенный диагональный блик при ховере */}
			<div className="absolute inset-0 bg-linear-155 from-transparent to-neutral-100/15 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none z-0" />
			<div
				className={cn(
					"absolute inset-0 pointer-events-none z-0",
					"rounded-[inherit] border border-t-white/12 border-x-transparent border-b-transparent",
					"mask-[linear-gradient(to_right,transparent,white_25%,white_75%,transparent)]"
				)}
			/>
			{/* 3. Контентная часть (z-10, чтобы быть выше шума) */}
			<div className="relative flex flex-col h-full w-full rounded-2xl gap-2">
				{props.children}
			</div>
		</div>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
				className
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-title"
			className={cn("flex flex-col gap-1.5", className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-description"
			className={cn("text-sm text-foreground/50", className)}
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-action" className={cn(className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-content"
			className={cn("px-6", className)}
			{...props}
		/>
	);
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-footer"
			className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
			{...props}
		/>
	);
}

export {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
};
