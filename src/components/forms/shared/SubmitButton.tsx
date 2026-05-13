import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr";
import { Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

interface NeonSubmitButtonProps {
	isSubmitting: boolean;
	disabled?: boolean;
}

export const SubmitButton = ({
	isSubmitting,
	disabled = false,
}: NeonSubmitButtonProps) => {
	const isDisabled = isSubmitting || disabled;

	return (
		<Button
			disabled={isDisabled}
			size="md"
			className={cn(
				"w-full relative rounded-2xl justify-center items-center transition-all duration-200 z-10 md:w-auto",
				isDisabled && "bg-muted text-foreground/50 cursor-not-allowed"
			)}
		>
			<div className="flex items-center gap-2">
				<span>Отправить</span>
				{isSubmitting ? (
					<Spinner data-icon="inline-end" />
				) : (
					<PaperPlaneTiltIcon size={15} weight="duotone" />
				)}
			</div>
		</Button>
	);
};
