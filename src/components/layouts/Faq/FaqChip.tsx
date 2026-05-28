"use client";

import { QuestionMarkIcon } from "@phosphor-icons/react";
import type { DbFaqItem } from "@/actions/admin-faq-actions";
import { Highlight } from "@/components/layouts/Faq/Highlight";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function FaqChip({
	item,
	query,
	isOpen,
	onToggle,
}: {
	item: DbFaqItem;
	query: string;
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<Card
			data-flip-id={item.id}
			className={cn(
				"group relative cursor-pointer w-full",
				"transition-colors duration-200 select-none",
				isOpen
					? "border-foreground/20 bg-foreground/5 col-span-full"
					: "border-foreground/8 bg-foreground/2"
			)}
			onClick={onToggle}
		>
			<div
				className={cn(
					"flex px-4 py-3 items-start justify-start flex-1",
					isOpen ? "flex-col" : "flex-row"
				)}
			>
				<span
					className={cn(
						"text-sm font-semibold flex-1",
						isOpen ? "text-foreground" : "text-foreground/80"
					)}
				>
					<Highlight text={item.question} query={query} />{" "}
					<QuestionMarkIcon
						size={14}
						weight="bold"
						className={cn(
							"shrink-0 transition-colors inline align-middle mb-0.5",
							isOpen ? "text-primary" : "text-foreground/80"
						)}
					/>
				</span>

				{/* Tags — только когда закрыт */}
				{!isOpen && (item.tags ?? []).length > 0 && (
					<div className="flex flex-wrap gap-1 ml-5">
						{(item.tags ?? []).map((tag) => (
							<span
								key={tag}
								className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/6 text-muted-foreground/50 border border-foreground/6"
							>
								#{tag}
							</span>
						))}
					</div>
				)}
				{/* Answer — только когда открыт */}
				{isOpen && (
					<div className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-t border-foreground/6 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
						<Highlight text={item.answer} query={query} />
					</div>
				)}
			</div>
		</Card>
	);
}
