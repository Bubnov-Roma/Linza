import { ChevronLeft, ChevronRight } from "lucide-react";
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
					"z-10 h-10 transition-all md:h-11 md:w-auto  rounded-xl ",
					currentStep === 0
						? "invisible"
						: "text-foreground/60 hover:text-foreground group"
				)}
			>
				<ChevronLeft className="w-6 h-6 md:mr-2 md:h-4 md:w-4 transition-transform group-hover:-translate-x-1" />
				<span className="hidden md:inline">Назад</span>
			</Button>
			<div className="flex flex-1 px-1 md:flex-initial">
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
				<ChevronRight className="h-5 w-5 md:ml-2 md:h-4 md:w-4 transition-transform group-hover:translate-x-1" />
			</Button>
		</div>
	);
};
