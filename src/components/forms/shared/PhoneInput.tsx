"use client";

import { type FieldPath, useFormContext, useWatch } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { FormFieldWrapper } from "@/components/forms/shared/FormFieldWrapper";
import { cn } from "@/lib/utils";
import type { ClientFormValues } from "@/schemas";
import type {
	CornerRounding,
	InputGroupOrientation,
	InputPosition,
} from "@/types";
import { getBorderClasses, getRoundingClasses } from "@/utils";

interface PhoneInputProps {
	name: FieldPath<ClientFormValues>;
	label?: string;
	className?: string;
	disabled?: boolean;
	corners?: CornerRounding;
	orientation?: InputGroupOrientation;
	position?: InputPosition;
	standalone?: boolean;
	onFocus?: () => void;
	onBlur?: () => void;
	required?: boolean;
}

/**
 * Normalize any phone to 11 digits starting with 7.
 * "+79025810525" | "89025810525" | "(902) 581-05-25" → "79025810525"
 */
function normalizePhone(raw: string): string {
	const digits = raw.replace(/\D/g, "");
	if (!digits) return "";
	if (digits.length === 11) {
		return digits[0] === "8" ? `7${digits.slice(1)}` : digits;
	}
	if (digits.length === 10) {
		return `7${digits}`;
	}
	return digits;
}

export const PhoneInput = ({
	name,
	label,
	className,
	disabled,
	corners,
	standalone = true,
	onFocus,
	onBlur,
	required = false,
}: PhoneInputProps) => {
	const { register, setValue, formState, control } =
		useFormContext<ClientFormValues>();

	const currentValue = useWatch({
		control,
		name,
		defaultValue: "",
	}) as string;

	const { error } = control.getFieldState(name, formState);
	const { ref, ...restRegister } = register(name);

	const inputElement = (
		<PatternFormat
			{...restRegister}
			getInputRef={ref}
			value={currentValue}
			format="+#(###)###-##-##"
			mask="_"
			allowEmptyFormatting={false}
			placeholder="+7(___) ___-__-__"
			disabled={disabled}
			autoComplete="tel"
			onFocus={onFocus}
			onBlur={onBlur}
			onValueChange={(values) => {
				// values.value — только цифры (до 11 штук)
				// Нормализуем: если первая цифра 8 → заменяем на 7
				const digits = values.value;
				if (digits.length > 0 && digits[0] === "8") {
					const fixed = `7${digits.slice(1)}`;
					// Форматируем вручную
					const padded = fixed.padEnd(11, "_");
					const f = `+${padded[0]}(${padded.slice(1, 4)})${padded.slice(4, 7)}-${padded.slice(7, 9)}-${padded.slice(9, 11)}`;
					setValue(name, f, { shouldValidate: true });
				} else {
					setValue(name, values.formattedValue, { shouldValidate: true });
				}
			}}
			onInput={(e: React.SyntheticEvent<HTMLInputElement>) => {
				const raw = (e.target as HTMLInputElement).value;
				if (raw && !raw.startsWith("+")) {
					const normalized = normalizePhone(raw);
					if (normalized.length >= 10) {
						const padded = normalized.padEnd(11, "_");
						const f = `+${padded[0]}(${padded.slice(1, 4)})${padded.slice(4, 7)}-${padded.slice(7, 9)}-${padded.slice(9, 11)}`;
						setValue(name, f, { shouldValidate: true });
					}
				}
			}}
			className={cn(
				"h-11 w-full min-w-0 px-4 py-2 text-base transition-all outline-none",
				"disabled:opacity-20 disabled:cursor-not-allowed",
				"md:text-sm",
				corners ? getRoundingClasses(corners) : "rounded-md",
				corners && getBorderClasses(corners),
				corners ? "glass-input-neumorphic" : "glass-input",
				error && "border-red-400/50",
				className
			)}
		/>
	);

	if (!standalone) return inputElement;

	return (
		<FormFieldWrapper
			required={required}
			label={label || "Телефон"}
			error={error?.message ?? ""}
			id={`field-${name}`}
		>
			{inputElement}
		</FormFieldWrapper>
	);
};
