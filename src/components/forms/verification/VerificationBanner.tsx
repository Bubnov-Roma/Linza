"use client";

import { ShieldCheckIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui";
import { Button } from "@/components/ui/button";

export function VerificationBanner() {
	const [isVisible, setIsVisible] = useState(true);

	if (!isVisible) return null;
	return (
		<Dialog open={isVisible} onOpenChange={setIsVisible}>
			<DialogTrigger asChild></DialogTrigger>
			<DialogContent className="group overflow-hidden bg-background/80 rounded-[32px] bg-linear-to-r from-blue-500/10 via-purple-200/30 to-blue-500/10">
				<DialogHeader className="flex items-center justify-center">
					<ShieldCheckIcon
						weight="fill"
						size={32}
						className="inline w-14 h-14 rounded-full p-1 items-center justify-center text-green-400 shadow-[0_0_20px_rgba(37,222,119,0.2)]"
					/>
					<DialogTitle className="text-3xl text-center font-bold text-foreground flex-col justify-center items-center gap-2">
						<p>Аренда</p>
						<p>без залога</p>
					</DialogTitle>
					<DialogDescription className="text-muted-foreground text-sm sm:text-base flex text-center">
						Заполните анкету, чтобы арендовать технику без страхового депозита.
					</DialogDescription>
				</DialogHeader>
				<Button asChild size="xl" className="rounded-3xl font-black border-0">
					<Link href="/dashboard/profile">Заполнить анкету</Link>
				</Button>
			</DialogContent>
		</Dialog>
	);
}
