import { Stepper } from "@/components/forms/client-forms/shared";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface FormNavigationProps {
	prev: () => void;
	next: () => Promise<void>;
	currentStep: number;
	isLastStep: boolean;
	isSubmitting: boolean;
	canSubmit: boolean;
	onStepClick: (stepIndex: number) => Promise<void>;
	visitedSteps: Set<number>;
}

export const FormNavigation = ({
	prev,
	next,
	currentStep,
	isLastStep,
	onStepClick,
	visitedSteps,
}: FormNavigationProps) => {
	return (
		<div className="flex justify-between items-center w-full px-4">
			<Button
				variant="ghost"
				onClick={prev}
				disabled={currentStep === 0}
				className={cn(
					"h-10 transition-all md:h-11 md:w-auto rounded-xl",
					currentStep === 0
						? "invisible"
						: "text-foreground/60 hover:text-foreground group"
				)}
			>
				<span className="hidden md:inline">Назад</span>
			</Button>
			<div className="flex flex-1 md:flex-initial bg-muted-foreground/20 rounded-3xl p-2">
				<Stepper
					currentStep={currentStep}
					onStepClick={onStepClick}
					visitedSteps={visitedSteps}
				/>
			</div>
			<Button
				variant="ghost"
				onClick={next}
				disabled={isLastStep}
				className={cn(
					"group rounded-xl h-10 w-10 p-0 text-foreground/60 hover:text-foreground md:h-11 md:w-auto md:px-4",
					isLastStep && "invisible"
				)}
			>
				<span className="hidden md:inline">Далее</span>
			</Button>
		</div>
	);
};
