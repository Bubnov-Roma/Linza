import React from "react";
import { FormFieldWrapper } from "@/components/forms/shared/FormFieldWrapper";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ValidatedInputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
	icon?: React.ReactNode;
	suffix?: React.ReactNode;
	name?: string;
}

export const ValidatedInput = React.forwardRef<
	HTMLInputElement,
	ValidatedInputProps
>(({ label, error, icon, suffix, className, onKeyDown, ...props }, ref) => {
	return (
		<FormFieldWrapper
			label={label}
			error={error ?? ""}
			id={`field-${props.name}`}
		>
			<div className="relative flex items-center">
				{icon && (
					<div className="z-1 absolute left-3 text-muted-foreground pointer-events-none">
						{icon}
					</div>
				)}

				<Input
					ref={ref}
					{...props}
					onKeyDown={onKeyDown}
					className={cn(
						"glass-input w-full rounded-lg",
						icon && "pl-10",
						suffix && "pr-10",
						error && "border-red-400/50",
						className
					)}
				/>

				{suffix && (
					<div className="z-1 absolute right-3 flex items-center justify-center">
						{suffix}
					</div>
				)}
			</div>
		</FormFieldWrapper>
	);
});

ValidatedInput.displayName = "ValidatedInput";
