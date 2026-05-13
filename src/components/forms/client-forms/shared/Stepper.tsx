"use client";

import { useMemo } from "react";
import { get, useFormContext, useWatch } from "react-hook-form";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { getStepsForClientType } from "@/constants/form-steps.config";
import { cn } from "@/lib/utils";
import type { ClientFormValues } from "@/schemas";
import { isValueFilled } from "@/utils";

interface StepperProps {
	currentStep: number;
	onStepClick: (index: number) => void;
	visitedSteps: Set<number>;
}

export const Stepper = ({
	currentStep,
	onStepClick,
	visitedSteps,
}: StepperProps) => {
	const {
		control,
		formState: { errors },
	} = useFormContext<ClientFormValues>();

	const allValues = useWatch({ control });
	const clientType = useWatch({ control, name: "clientType" });

	const steps = useMemo(() => getStepsForClientType(clientType), [clientType]);

	const stepsStatus = useMemo(() => {
		return steps.map((step, index) => {
			const hasError = step.fields.some((path) => !!get(errors, path));

			const isFilled = step.fields.every((path) => {
				const fieldValue = get(allValues, path);
				return isValueFilled(fieldValue);
			});

			const isVisited = visitedSteps.has(index);
			const isActive = currentStep === index;

			let state: "active" | "completed" | "error" | "untouched" = "untouched";

			if (isActive) state = "active";
			else if (hasError && isVisited) state = "error";
			else if (isFilled && !hasError) state = "completed";
			else if (isVisited) state = "untouched";

			return { state, isFilled, hasError };
		});
	}, [allValues, errors, currentStep, visitedSteps, steps]);

	return (
		<div className="flex justify-center items-center h-full gap-1 md:gap-2 w-full">
			{steps.map((step, index) => {
				const status = stepsStatus[index];
				if (!status) return null;

				const Icon = step.icon;

				return (
					<Tooltip key={step.id} delayDuration={0}>
						<TooltipTrigger asChild>
							<button
								key={step.id}
								type="button"
								onClick={() => onStepClick(index)}
								className={cn(
									"flex items-center group outline-none cursor-pointer rounded-full bg-background/50 hover:bg-background/60 transition-all duration-500",
									status.state === "active" && "bg-background"
								)}
							>
								<div
									className={cn(
										"w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-200",
										"w-8 h-8 md:w-10 md:h-10 hover:bg-accent/20",
										status.state === "active" && "shadow-brand-glow",
										status.state === "error" && "shadow-error-glow"
									)}
								>
									<Icon
										weight={status.state === "active" ? "duotone" : "regular"}
										className={cn(
											"w-4 h-4 md:w-5 md:h-5 transition-colors",
											status.state === "active"
												? "text-blue-400"
												: status.state === "error"
													? "text-orange-400"
													: "text-foreground/60"
										)}
									/>
								</div>
							</button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							<p>{step.label}</p>
						</TooltipContent>
					</Tooltip>
				);
			})}
		</div>
	);
};
