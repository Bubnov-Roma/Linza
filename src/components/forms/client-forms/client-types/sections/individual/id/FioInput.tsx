"use client";

import { useRef, useState } from "react";
import {
	type FieldPath,
	type PathValue,
	useFormContext,
	useWatch,
} from "react-hook-form";
import { ValidatedInput } from "@/components/forms/shared";
import { SuggestionsDropdown } from "@/components/forms/shared/SuggestionsDropdown";
import { useDadataFioSuggestions } from "@/hooks/use-dadata-suggestions";
import type { ClientFormValues } from "@/schemas";

interface FioProps {
	name: FieldPath<ClientFormValues>;
	label: string;
	required?: boolean;
}

export const FioInput = ({ name, label, required = false }: FioProps) => {
	const { register, setValue, control, formState } =
		useFormContext<ClientFormValues>();
	const [isOpen, setIsOpen] = useState(false);
	const isSelectingRef = useRef(false);

	const query = useWatch({
		control,
		name,
		defaultValue: "",
	}) as string;

	const { suggestions, isLoading } = useDadataFioSuggestions(query, {
		debounceMs: 200,
	});

	const { error } = control.getFieldState(name, formState);

	const handleSelect = (val: string) => {
		isSelectingRef.current = false;
		setValue(name, val as PathValue<ClientFormValues, typeof name>, {
			shouldValidate: true,
			shouldDirty: true,
		});
		setIsOpen(false);
	};

	return (
		<div className="relative w-full">
			<ValidatedInput
				required={required}
				label={label}
				{...register(name)}
				error={error?.message ?? ""}
				onFocus={() => setIsOpen(true)}
				onBlur={() => {
					if (isSelectingRef.current) return;
					setTimeout(() => setIsOpen(false), 250);
				}}
				autoComplete="off"
				placeholder="Иванов Иван Иванович"
				onChange={(e) => {
					const val = e.target.value;
					setValue(name, val, { shouldValidate: true });
					if (val.length >= 2) {
						setIsOpen(true);
					} else {
						setIsOpen(false);
					}
				}}
			/>
			<SuggestionsDropdown
				isOpen={isOpen}
				suggestions={suggestions}
				onSelect={handleSelect}
				isLoading={isLoading}
			/>
		</div>
	);
};
