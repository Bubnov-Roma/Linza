"use client";

import { motion } from "framer-motion";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

function AlertDialog({
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
	return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
	return (
		<AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
	);
}

function AlertDialogPortal({
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
	return (
		<AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
	);
}

function AlertDialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
	return (
		<AlertDialogPrimitive.Overlay asChild {...props}>
			<motion.div
				initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
				animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
				exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
				transition={{ duration: 0.1, ease: "easeOut" }}
				className="fixed inset-0 z-71 bg-muted-foreground/10"
			>
				<div className="absolute inset-0 bg-noise opacity-[0.03]" />
			</motion.div>
		</AlertDialogPrimitive.Overlay>
	);
}

function AlertDialogContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
	return (
		<AlertDialogPortal>
			<AlertDialogOverlay />
			<div className="fixed inset-0 z-80 pointer-events-none flex items-center justify-center">
				<motion.div
					initial={{ opacity: 0, scale: 0.95, y: 8 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.95, y: 10 }}
					transition={{
						type: "keyframes",
						damping: 20,
						stiffness: 10,
					}}
					className="max-w-lg mx-2"
				>
					<AlertDialogPrimitive.Content
						data-slot="alert-dialog-content"
						className={cn(
							"relative pointer-events-auto bg-background/80",
							"rounded-[32px] py-6 px-2 mx-auto overflow-hidden shadow-2xl border border-white/10",
							"outline-none",
							className
						)}
						{...props}
					>
						<div className="absolute inset-0 bg-noise opacity-[0.09] pointer-events-none" />
						<div className="absolute inset-0 glass-glow-subtle pointer-events-none" />
						<div className="relative z-10 px-2 space-y-4">{children}</div>
					</AlertDialogPrimitive.Content>
				</motion.div>
			</div>
		</AlertDialogPortal>
	);
}

function AlertDialogHeader({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-dialog-header"
			className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
			{...props}
		/>
	);
}

function AlertDialogFooter({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-dialog-footer"
			className={cn(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className
			)}
			{...props}
		/>
	);
}

function AlertDialogTitle({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
	return (
		<AlertDialogPrimitive.Title
			data-slot="alert-dialog-title"
			className={cn("text-lg font-semibold", className)}
			{...props}
		/>
	);
}

function AlertDialogDescription({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
	return (
		<AlertDialogPrimitive.Description
			data-slot="alert-dialog-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

function AlertDialogAction({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
	return <AlertDialogPrimitive.Action className={cn(className)} {...props} />;
}

function AlertDialogCancel({
	className,
	...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
	return <AlertDialogPrimitive.Cancel className={cn(className)} {...props} />;
}

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
};
