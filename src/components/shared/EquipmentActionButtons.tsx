"use client";

import { HeartIcon, ShareFatIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import { useFavorite } from "@/hooks";
import { cn } from "@/lib/utils";

interface ActionButtonsProps {
	id: string;
	slug: string;
	title: string;
	className?: string;
}

export function EquipmentActionButtons({
	id,
	slug,
	className,
}: ActionButtonsProps) {
	const [isCopied, setIsCopied] = useState(false);
	const { isFavorite, toggle: toggleFavorite } = useFavorite(id);

	const handleShare = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const url = `${window.location.origin}/equipment/item/${slug}`;
		navigator.clipboard.writeText(url).then(() => {
			toast.success("Ссылка скопирована");
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		});
	};

	const handleHeart = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		toggleFavorite(e);
	};

	return (
		<div className={cn("flex z-2 justify-between", className)}>
			<Tooltip>
				<TooltipTrigger>
					<Button
						asChild
						size="icon"
						type="button"
						onClick={handleShare}
						className={cn(
							"w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors shadow-sm p-2 text-primary-foreground/50"
						)}
					>
						<ShareFatIcon weight={isCopied ? "fill" : "regular"} size={16} />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="right">
					{isCopied ? "Ссылка скопирована" : "Скопировать ссылку"}
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger>
					<Button
						asChild
						size="icon"
						type="button"
						onClick={handleHeart}
						className={cn(
							"w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors shadow-sm p-2 text-primary-foreground/50",
							isFavorite && "text-primary"
						)}
					>
						<HeartIcon weight={isFavorite ? "fill" : "regular"} size={16} />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="left">
					{isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
