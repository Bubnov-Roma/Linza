import React from "react";
import { FormFieldWrapper } from "@/components/forms/shared/FormFieldWrapper";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ValidatedTextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label: string;
	error?: string;
}
export const ValidatedTextarea = React.forwardRef<
	HTMLTextAreaElement,
	ValidatedTextareaProps
>(({ label, error, required = false, className, rows = 3, ...props }, ref) => {
	return (
		<FormFieldWrapper
			label={label}
			required={required}
			error={error ?? ""}
			id={`field-${label}`}
		>
			<Textarea
				ref={ref}
				{...props}
				rows={rows}
				className={cn(
					"overflow-y-auto custom-scrollbar resize-none glass-input",
					error && "border-red-400/50"
				)}
			/>
		</FormFieldWrapper>
	);
});
ValidatedTextarea.displayName = "ValidatedTextarea";
