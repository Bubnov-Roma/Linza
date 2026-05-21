"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
	fallback?: string;
	className?: string;
}

export function BackButton({ fallback = "/", className }: BackButtonProps) {
	const router = useRouter();

	const handleBack = () => {
		if (window.history.length > 2) {
			router.back();
		} else {
			router.push(fallback);
		}
	};

	return (
		<button
			type="button"
			onClick={handleBack}
			className={cn(
				"w-8 h-8 rounded-xl border border-foreground/10 flex items-center justify-center text-center hover:bg-foreground/5 transition-all shrink-0",
				className
			)}
		>
			<ArrowLeft size={18} className="m-auto" />
		</button>
	);
}
