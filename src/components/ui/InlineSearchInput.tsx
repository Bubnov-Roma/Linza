"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui";
import { cn } from "@/lib/utils";

interface InlineSearchInputProps {
	value: string;
	onChange: (val: string) => void;
	fetchSuggestion: (query: string) => Promise<string | null>;
	placeholder?: string;
	className?: string;
}

export function InlineSearchInput({
	value,
	onChange,
	fetchSuggestion,
	placeholder,
	className,
}: InlineSearchInputProps) {
	const [suggestion, setSuggestion] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const updateSuggestion = async () => {
			if (value.length < 2) {
				setSuggestion("");
				return;
			}
			const result = await fetchSuggestion(value);

			// Если результат начинается с того, что ввел пользователь (регистронезависимо)
			if (result?.toLowerCase().startsWith(value.toLowerCase())) {
				// Сохраняем "хвост" подсказки с учетом регистра оригинала
				setSuggestion(value + result.slice(value.length));
			} else {
				setSuggestion("");
			}
		};

		updateSuggestion();
	}, [value, fetchSuggestion]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		// При нажатии Tab или стрелки Вправо — подставляем всё значение
		if ((e.key === "Tab" || e.key === "ArrowRight") && suggestion) {
			e.preventDefault();
			onChange(suggestion);
			setSuggestion("");
		}
	};

	return (
		<InputGroup
			className={cn("relative glass-input min-h-9 flex-1", className)}
		>
			<InputGroupAddon>
				<MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" />
			</InputGroupAddon>

			<div className="relative flex-1 flex items-center">
				{/* Слой с подсказкой (Ghost Text) */}
				{suggestion && (
					<div className="absolute left-0 pl-3 pointer-events-none text-muted-foreground/40 text-base md:text-sm truncate max-w-full pr-3 z-1">
						{suggestion}
					</div>
				)}

				<InputGroupInput
					ref={inputRef}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="bg-transparent border-none focus-visible:ring-0 pl-3 w-full z-10"
				/>
			</div>
			{value && (
				<button
					type="button"
					onClick={() => {
						onChange("");
						setSuggestion("");
					}}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-11 backdrop-blur-sm card-surface border-0 rounded-full transition-all duration-300 cursor-pointer"
				>
					<XIcon size={14} className="w-full h-full p-1" />
				</button>
			)}
		</InputGroup>
	);
}
