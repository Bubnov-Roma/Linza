"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { MobileClientForm } from "@/components/dashboard/profile/forms/mobile/MobileClientForm";
import {
	FormConsentInfo,
	FormNavigation,
} from "@/components/forms/client-forms/shared";
import { getStepsForClientType } from "@/constants/form-steps.config";
import { useIsMobile } from "@/hooks";
import type { ClientFormValues } from "@/schemas";

interface UniversalClientFormProps {
	currentStep: number;
	onStepChange: (step: number) => void;
}

export const UniversalClientForm = ({
	currentStep,
	onStepChange,
}: UniversalClientFormProps) => {
	const [visitedSteps, setVisitedSteps] = useState<Set<number>>(
		new Set([currentStep])
	);
	const isMobile = useIsMobile();

	const {
		trigger,
		control,
		formState: { isSubmitting, isValid },
	} = useFormContext<ClientFormValues>();

	const clientType = useWatch({ control, name: "clientType" });
	const steps = useMemo(() => getStepsForClientType(clientType), [clientType]);

	useEffect(() => {
		setVisitedSteps((prev) => {
			const next = new Set(prev);
			for (let i = 0; i <= currentStep; i++) next.add(i);
			return next;
		});
	}, [currentStep]);

	useEffect(() => {
		if (clientType) {
			document.documentElement.setAttribute("data-client-type", clientType);
		}
	}, [clientType]);

	// ── Mobile: accordion ──────────────────────────────────────────────────────
	if (isMobile) {
		return (
			<div className="relative flex-1 flex flex-col">
				<MobileClientForm />
				<FormConsentInfo canSubmit={isValid} isSubmitting={isSubmitting} />
			</div>
		);
	}

	// ── Desktop: stepper (unchanged) ───────────────────────────────────────────
	const handleStepClick = async (stepIndex: number) => {
		if (stepIndex === currentStep) return;
		setVisitedSteps((prev) => new Set(prev).add(currentStep));
		await trigger(steps[currentStep]?.fields);
		onStepChange(stepIndex);
		setVisitedSteps((prev) => new Set(prev).add(stepIndex));
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const next = async () => {
		const ok = await trigger(steps[currentStep]?.fields);
		if (ok) {
			const nextIndex = currentStep + 1;
			setVisitedSteps((prev) => new Set(prev).add(nextIndex));
			onStepChange(nextIndex);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const prev = () => {
		if (currentStep > 0) onStepChange(currentStep - 1);
	};

	const ActiveComponent = steps[currentStep]?.component;

	return (
		<motion.div className="relative px-0 md:px-6 py-10 rounded-2xl flex-1 flex flex-col justify-between min-h-150">
			<AnimatePresence mode="wait">
				<motion.div
					key={currentStep}
					initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
					transition={{ duration: 0.3, ease: "backOut" }}
					className="min-h-100"
				>
					<h2 className="text-2xl font-black mt-1 px-2">
						{steps[currentStep]?.title}
					</h2>
					{ActiveComponent && <ActiveComponent />}
				</motion.div>
			</AnimatePresence>
			<FormNavigation
				prev={prev}
				next={next}
				currentStep={currentStep}
				isLastStep={currentStep === steps.length - 1}
				isSubmitting={isSubmitting}
				canSubmit={isValid}
				onStepClick={handleStepClick}
				visitedSteps={visitedSteps}
			/>
			<FormConsentInfo canSubmit={isValid} isSubmitting={isSubmitting} />
		</motion.div>
	);
};
