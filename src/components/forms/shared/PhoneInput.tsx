"use client";

import { Controller, type FieldPath, useFormContext } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/shared/FormFieldWrapper";
import { BasePhoneInput } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { ClientFormValues } from "@/schemas";
import type {
	CornerRounding,
	InputGroupOrientation,
	InputPosition,
} from "@/types";

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
	required = false,
	className,
	...props
}: PhoneInputProps) => {
	const { control, formState, setValue } = useFormContext();
	const { error } = control.getFieldState(name, formState);

	return (
		<FormFieldWrapper
			label={label || "Телефон"}
			error={error?.message ?? ""}
			required={required}
			id={`field-${name}`}
		>
			<Controller
				control={control}
				name={name}
				render={({ field }) => (
					<BasePhoneInput
						className={cn(
							"glass-input w-full bg-input-bg", // Класс теперь применится корректно
							error &&
								"border-red-400/50 shadow-[0_0_0_1px_rgba(248,113,113,0.5)]",
							className
						)}
						{...props}
						value={field.value}
						onChange={(val) =>
							setValue(name, val, { shouldValidate: true, shouldDirty: true })
						}
					/>
				)}
			/>
		</FormFieldWrapper>
	);
};
