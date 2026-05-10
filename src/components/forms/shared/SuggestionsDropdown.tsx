"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface SuggestionsDropdownProps {
	isOpen: boolean;
	suggestions: string[];
	onSelect: (value: string) => void;
	isLoading?: boolean;
}

export const SuggestionsDropdown = ({
	isOpen,
	suggestions,
	onSelect,
	isLoading = false,
}: SuggestionsDropdownProps) => {
	const showDropdown = isOpen && (suggestions.length > 0 || isLoading);
	return (
		<AnimatePresence>
			{showDropdown && (
				<motion.div
					initial={{ opacity: 0, y: -5 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -5 }}
					transition={{ duration: 0.15 }}
					onMouseDown={(e) => e.preventDefault()}
					onTouchStart={(e) => e.preventDefault()}
					className="absolute backdrop-blur supports-backdrop-filter:bg-background/95 z-100 w-full -mt-2 border border-foreground/10 rounded-xl overflow-hidden shadow-xl  p-1"
				>
					<div className="relative p-1 max-h-60 min-h-10 overflow-y-auto custom-scrollbar">
						{isLoading && (
							<div className="flex w-full h-full absolute items-center bg-background/50 justify-center gap-2 px-4 py-3 text-sm text-foreground/50">
								<Loader2 className="w-4 h-4 animate-spin" />
							</div>
						)}
						{suggestions.map((s, index) => (
							<button
								key={`${s}-${index}+${s}`}
								type="button"
								className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-foreground/10 rounded-lg focus:bg-foreground/10 hover:text-foreground transition-colors"
								onClick={() => onSelect(s)}
								onMouseDown={() => onSelect(s)}
								onTouchEnd={(e) => {
									e.preventDefault();
									onSelect(s);
								}}
							>
								{s}
							</button>
						))}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
