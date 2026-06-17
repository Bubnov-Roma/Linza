"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
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
		<Button
			variant="ghost"
			size="icon"
			onClick={handleBack}
			className={cn(
				"inline-flex items-center gap-2 transition-colors rounded-xl mr-2 p-0!",
				className
			)}
		>
			<CaretLeftIcon size={18} className="m-auto" />
		</Button>
	);
}
