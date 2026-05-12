"use client";
import type { LucideIcon } from "lucide-react";
import type { JSX } from "react";
import {
	Controller,
	type FieldPath,
	type FieldValues,
	type PathValue,
	useFormContext,
} from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/shared/FormFieldWrapper";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface RadioOption {
	id: string;
	label: string;
	color?: string;
	icon?: LucideIcon;
	badgeCount?: number;
}

interface FormRadioGroupProps<TFieldValues extends FieldValues> {
	name: FieldPath<TFieldValues>;
	options: RadioOption[];
	label: string;
	className?: string;
	gridClassName?: string;
	onValueChange?: (value: string) => void;
	renderExtra?: (
		option: RadioOption,
		labelContent: JSX.Element
	) => React.ReactNode;
	externalError?: string;
	required?: boolean;
}

export const FormRadioGroup = <TFieldValues extends FieldValues>({
	name,
	options,
	label,
	className,
	gridClassName,
	onValueChange,
	renderExtra,
	externalError,
	required = false,
}: FormRadioGroupProps<TFieldValues>) => {
	const { control, formState, setValue } = useFormContext<TFieldValues>();
	const { error } = control.getFieldState(name, formState);
	const displayError = error?.message || externalError;

	return (
		<div className={`space-y-3 ${className} w-full`}>
			<FormFieldWrapper
				label={label}
				error={displayError ?? ""}
				topErrorPosition={true}
				required={required}
			>
				<Controller
					control={control}
					name={name}
					render={({ field }) => (
						<RadioGroup
							onValueChange={(val) => {
								setValue(
									name,
									val as PathValue<TFieldValues, FieldPath<TFieldValues>>,
									{
										shouldValidate: true,
										shouldDirty: true,
										shouldTouch: true,
									}
								);
							}}
							value={field.value ?? ""}
							className={
								gridClassName ||
								"relative flex items-center flex-wrap justify-center gap-3 rounded-xl w-full"
							}
						>
							{options.map((option) => {
								const isActive = field.value === option.id;
								const Icon = option.icon;

								const labelContent = (
									<Label
										onClick={() => isActive && onValueChange?.(option.id)}
										className={`relative shrink-0 backdrop-blur-md flex items-center rounded-xl h-10 drop-shadow-xs duration-200 cursor-pointer border
                      ${
												isActive
													? "bg-white/10 border-border/90 shadow-lg z-10 text-foreground"
													: "bg-white/5 border-foreground/10 hover:bg-white/10 hover:border-foreground/20 z-0"
											}
                    `}
										style={{
											boxShadow: isActive
												? `inset -5px 5px 10px -10px ${option.color}, inset 5px -5px 10px -10px ${option.color}, 0 0 25px -5px ${option.color}44`
												: "none",
										}}
									>
										<RadioGroupItem value={option.id} className="sr-only" />
										{Icon ? (
											<div className="w-6 h-6 flex items-center justify-center">
												<Icon
													className="w-4 h-4 transition-colors"
													style={{
														color: isActive ? option.color : "foreground-muted",
														transform: isActive ? "scale(1.2)" : "scale(1)",
														transition:
															"transform 0.3s ease-in-out, color 0.1s ease-in-out",
													}}
												/>
											</div>
										) : (
											<div
												className={`absolute bottom-0 left-5 right-5 rounded-full h-0.5 ${isActive ? "bg-white shadow-[0_0_8px_white]" : "bg-white/20"}`}
												style={{
													transform: isActive ? "scale(1)" : "scale(0.1)",
													transition:
														"transform 0.3s ease-in-out, color 0.1s ease-in-out",
													background: isActive ? option.color : "bg-white/20",
												}}
											/>
										)}
										<span
											className={`uppercase px-2 text-[11px] ${isActive ? "text-foreground" : "text-foreground/60"}`}
										>
											{option.label}
										</span>

										{/* Число ссылок рядом с текстом */}
										{(option.badgeCount ?? 0) > 0 && (
											<span className="text-[11px] mx-1 font-black text-muted-foreground/80 bg-background/70 px-1.5 py-0.5 rounded-md">
												{option.badgeCount}
											</span>
										)}
									</Label>
								);

								return (
									<div key={option.id} className="relative">
										{/* Если есть renderExtra, передаем ему контент для обертки в Dropdown */}
										{renderExtra
											? renderExtra(option, labelContent)
											: labelContent}
									</div>
								);
							})}
						</RadioGroup>
					)}
				/>
			</FormFieldWrapper>
		</div>
	);
};
