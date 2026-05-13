"use client";

import { type FieldPath, useFormContext } from "react-hook-form";
import type { ClientFormValues } from "@/schemas";
import { ValidatedTextarea } from "./ValidatedTextarea";

interface FormTextareaProps {
	name: FieldPath<ClientFormValues>;
	label: string;
	placeholder?: string;
	className?: string;
	required?: boolean;
	rows?: number;
}

export const FormTextarea = ({
	name,
	label,
	className,
	rows,
	required = false,
	...props
}: FormTextareaProps) => {
	const { register, formState, control } = useFormContext<ClientFormValues>();

	const { error } = control.getFieldState(name, formState);
	const { ref, ...restRegister } = register(name);

	return (
		<ValidatedTextarea
			{...props}
			{...restRegister}
			ref={ref}
			label={label}
			required={required}
			className={className}
			error={error?.message ?? ""}
			rows={rows}
		/>
	);
};
