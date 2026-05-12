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
			onValueChange={(values, sourceInfo) => {
				const { value, formattedValue } = values;

				if (
					sourceInfo.source === "prop" ||
					(sourceInfo.event &&
						(sourceInfo.event as unknown as InputEvent)?.inputType ===
							"deleteContentBackward")
				) {
					setValue(name, formattedValue, { shouldValidate: true });
					return;
				}

				// Логика умной вставки:
				// Если пользователь вводит "8", заменяем её на "7"
				if (value.startsWith("8")) {
					const corrected = "7" + value.slice(1);
					// Мы не форматируем вручную, PatternFormat сам применит маску к 7...
					setValue(name, corrected, { shouldValidate: true });
					return;
				}

				// Если пользователь вставил/ввел 10 цифр (без 7), добавляем 7 в начало
				if (value.length === 10 && !value.startsWith("7")) {
					setValue(name, `7${value}`, { shouldValidate: true });
					return;
				}

				setValue(name, formattedValue, { shouldValidate: true });
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
