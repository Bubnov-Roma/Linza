"use client";

import type { KeyboardEvent } from "react";
import { PatternFormat } from "react-number-format";
import { cn } from "@/lib/utils";

interface BasePhoneInputProps {
	value: string;
	onChange: (formattedValue: string) => void;
	className?: string;
	onKeyDown?: (e: KeyboardEvent<Element>) => void;
	disabled?: boolean;
	onFocus?: () => void;
	onBlur?: () => void;
	placeholder?: string;
	autoFocus?: boolean;
}

export const BasePhoneInput = ({
	value: externalValue,
	onChange,
	className,
	disabled,
	onFocus,
	onBlur,
	placeholder = "+7 (___) ___-__-__",
	autoFocus,
	onKeyDown,
}: BasePhoneInputProps) => {
	return (
		<PatternFormat
			value={externalValue}
			format="+#(###)###-##-##"
			mask="_"
			allowEmptyFormatting={false}
			placeholder={placeholder}
			disabled={disabled}
			type="tel"
			onKeyDown={onKeyDown}
			autoFocus={autoFocus}
			autoComplete="tel"
			onFocus={onFocus}
			onBlur={onBlur}
			isAllowed={(values) => values.value.length <= 11}
			onValueChange={(values, sourceInfo) => {
				const { value: rawValue, formattedValue } = values;

				if (sourceInfo.source === "event") {
					const isFirstInput = !externalValue.replace(/\D/g, "");

					// Обработка "8" -> "7"
					if (isFirstInput && rawValue === "8") {
						onChange("7");
						const input = sourceInfo.event?.target as HTMLInputElement;

						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								input.setSelectionRange(2, 2);
							});
						});
						return;
					}
					// вставка 10 цифр
					if (
						isFirstInput &&
						rawValue.length === 10 &&
						!rawValue.startsWith("7")
					) {
						onChange(`7${rawValue}`);
						return;
					}
				}

				// Во всех остальных случаях
				onChange(formattedValue);
			}}
			className={cn(
				"h-11 w-full px-4 py-2 text-base transition-all outline-none rounded-md",
				"disabled:opacity-20 disabled:cursor-not-allowed md:text-sm",
				className
			)}
		/>
	);
};
