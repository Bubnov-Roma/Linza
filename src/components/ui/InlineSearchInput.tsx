"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type React from "react";
import { forwardRef, useEffect, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui";
import { cn } from "@/lib/utils";

interface InlineSearchInputProps {
	value: string;
	onChange: (val: string) => void;
	fetchSuggestion: (query: string) => Promise<string | null>;
	placeholder?: string;
	className?: string;
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	autoFocus?: boolean;
}

export const InlineSearchInput = forwardRef<
	HTMLInputElement,
	InlineSearchInputProps
>(
	(
		{
			value,
			onChange,
			fetchSuggestion,
			placeholder,
			className,
			onKeyDown,
			onFocus,
			onBlur,
			autoFocus,
		},
		ref
	) => {
		const [suggestion, setSuggestion] = useState("");

		useEffect(() => {
			const updateSuggestion = async () => {
				if (value.length < 2) {
					setSuggestion("");
					return;
				}
				const result = await fetchSuggestion(value);

				if (result?.toLowerCase().startsWith(value.toLowerCase())) {
					setSuggestion(value + result.slice(value.length));
				} else {
					setSuggestion("");
				}
			};

			updateSuggestion();
		}, [value, fetchSuggestion]);

		const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if ((e.key === "Tab" || e.key === "ArrowRight") && suggestion) {
				e.preventDefault();
				onChange(suggestion);
				setSuggestion("");
			}
			onKeyDown?.(e);
		};

		return (
			<InputGroup className={cn("relative min-h-9 flex-1", className)}>
				<InputGroupAddon>
					<MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground shrink-0" />
				</InputGroupAddon>

				<div className="relative flex-1 flex items-center">
					{suggestion && (
						<div className="absolute left-0 pl-3 pointer-events-none text-muted-foreground/40 text-base md:text-sm truncate max-w-full pr-3 z-1">
							{suggestion}
						</div>
					)}

					<InputGroupInput
						ref={ref}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						onKeyDown={handleKeyDown}
						onFocus={onFocus}
						onBlur={onBlur}
						autoFocus={autoFocus}
						placeholder={placeholder}
					/>
				</div>

				{value && (
					<button
						type="button"
						onClick={() => {
							onChange("");
							setSuggestion("");
						}}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-11 backdrop-blur-sm card-surface border-0 rounded-full transition-all duration-300 cursor-pointer shrink-0"
					>
						<XIcon size={14} className="w-full h-full p-1" />
					</button>
				)}
			</InputGroup>
		);
	}
);

InlineSearchInput.displayName = "InlineSearchInput";
