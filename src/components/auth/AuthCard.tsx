"use client";

import { CircleNotchIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface AuthFooterLink {
	text?: string;
	href: string;
	label: string;
	onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}
interface AuthCardProps {
	title: string;
	description?: string | undefined;
	children: React.ReactNode;
	footerLink?: AuthFooterLink;
	isLoading?: boolean;
	isModal?: boolean;
}

export function AuthCard({
	title,
	description,
	children,
	footerLink,
	isLoading,
	isModal = false,
}: AuthCardProps) {
	return (
		<div
			className={cn(
				"w-full transition-all duration-500",
				!isModal
					? "max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 p-4"
					: "space-y-4 p-6"
			)}
		>
			<div className="text-center space-y-2">
				<h1
					className={cn(
						"font-bold tracking-tight text-foreground",
						isModal ? "text-2xl uppercase italic font-black" : "text-3xl"
					)}
				>
					{title}
				</h1>
				{description && (
					<p className="text-muted-foreground text-sm px-4">{description}</p>
				)}
			</div>

			<div className="relative">
				{isLoading && (
					<div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
						<CircleNotchIcon size={50} className="text-primary animate-spin" />
					</div>
				)}
				<div className={cn(isModal ? "py-2" : "p-2")}>{children}</div>
			</div>

			{footerLink && (
				<p className="text-center text-sm text-muted-foreground">
					{footerLink.text}{" "}
					<Link
						href={footerLink.href}
						className="font-medium text-foreground hover:underline underline-offset-4"
					>
						{footerLink.label}
					</Link>
				</p>
			)}

			{!isModal && (
				<p className="text-center text-[10px] text-muted-foreground/50 px-8">
					Продолжая, вы принимаете{" "}
					<Link target="_blank" href="/terms" className="hover:text-foreground">
						Условия использования
					</Link>{" "}
					и{" "}
					<Link
						target="_blank"
						href="/privacy"
						className="hover:text-foreground"
					>
						Политику конфиденциальности
					</Link>
				</p>
			)}
		</div>
	);
}
