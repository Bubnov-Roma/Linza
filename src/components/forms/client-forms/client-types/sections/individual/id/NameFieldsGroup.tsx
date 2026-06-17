"use client";

import { useFormContext } from "react-hook-form";
import { ValidatedInput } from "@/components/forms/shared";
import type { ClientFormValues } from "@/schemas";

// Префикс пути — всё что идёт перед .lastName / .firstName / .middleName
// Например: "applicationData.personalData"
interface NameFieldsGroupProps {
	prefix?: string; // default: "applicationData.personalData"
}

type NamePath =
	| "applicationData.personalData.lastName"
	| "applicationData.personalData.firstName"
	| "applicationData.personalData.middleName";

export function NameFieldsGroup({
	prefix = "applicationData.personalData",
}: NameFieldsGroupProps) {
	const {
		register,
		formState: { errors },
	} = useFormContext<ClientFormValues>();

	// Достаём вложенные ошибки по произвольному префиксу
	const getError = (field: string): string => {
		const keys = `${prefix}.${field}`.split(".");
		let node: unknown = errors;
		for (const k of keys) {
			if (typeof node !== "object" || node === null) return "";
			node = (node as Record<string, unknown>)[k];
		}
		if (typeof node === "object" && node !== null && "message" in node) {
			return String((node as { message?: string }).message ?? "");
		}
		return "";
	};

	const path = (field: string) => `${prefix}.${field}` as NamePath;

	return (
		<div className="grid grid-cols-1">
			<ValidatedInput
				required
				label="Фамилия"
				placeholder="Иванов"
				{...register(path("lastName"))}
				error={getError("lastName")}
				autoComplete="family-name"
			/>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<ValidatedInput
					required
					label="Имя"
					placeholder="Иван"
					{...register(path("firstName"))}
					error={getError("firstName")}
					autoComplete="given-name"
				/>
				<ValidatedInput
					label="Отчество"
					placeholder="Иванович"
					{...register(path("middleName"))}
					error={getError("middleName")}
					autoComplete="additional-name"
				/>
			</div>
		</div>
	);
}
