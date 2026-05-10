"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	loadDraftAction,
	saveDraftAction,
	submitClientApplicationAction,
} from "@/actions/client-application-actions";
import { UniversalClientForm } from "@/components/forms/client-forms/client-types/UniversalClientForm";
import { Card } from "@/components/ui/card";
import { type ClientFormValues, clientFormSchema } from "@/schemas";
import { useApplicationStore } from "@/store";

export const ClientForm = () => {
	const submitSuccess = useApplicationStore((s) => s.submitSuccess);
	const clearFormDraft = useApplicationStore((s) => s.clearFormDraft);

	const { data: session } = useSession();
	const user = session?.user ?? null;

	const [step, setStep] = useQueryState("step", {
		defaultValue: 0,
		parse: (v) => parseInt(v, 10) || 0,
		serialize: String,
		shallow: true,
	});

	const methods = useForm<ClientFormValues>({
		resolver: zodResolver(clientFormSchema),
		mode: "onBlur",
		defaultValues: {
			clientType: "individual",
			applicationData: {
				personalData: {
					phone: "+7",
					email: user?.email ?? "",
				},
			},
		},
	});

	const { handleSubmit, setError, watch, reset, setValue } = methods;

	// biome-ignore lint/correctness/useExhaustiveDependencies: <draft save>
	useEffect(() => {
		const registrationEmail = user?.email ?? "";

		loadDraftAction().then(({ data, status }) => {
			if (data && status === "DRAFT") {
				// Merge draft into a full IndividualClient shape.
				// Since clientFormSchema = individualClientSchema (no discriminated union),
				// ClientFormValues IS IndividualClient — no cast needed.
				const draft = data as Partial<ClientFormValues>;

				reset(
					{
						...draft,
						clientType: "individual",
						applicationData: {
							...draft.applicationData,
							personalData: {
								...draft.applicationData?.personalData,
								email: registrationEmail,
							},
						},
					},
					{ keepDefaultValues: false }
				);
			} else if (registrationEmail) {
				setValue("applicationData.personalData.email", registrationEmail);
			}
		});
	}, [user?.email]);

	// Autosave debounced 2s
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const triggerAutosave = useCallback((values: Partial<ClientFormValues>) => {
		if (saveTimer.current) clearTimeout(saveTimer.current);
		saveTimer.current = setTimeout(() => {
			saveDraftAction(values);
		}, 2000);
	}, []);

	useEffect(() => {
		const sub = watch((v) => triggerAutosave(v as Partial<ClientFormValues>));
		return () => {
			sub.unsubscribe();
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, [watch, triggerAutosave]);

	const onSubmit = async (values: ClientFormValues) => {
		try {
			const result = await submitClientApplicationAction(values);
			if (!result.success) {
				if (result.errors) {
					Object.entries(result.errors).forEach(([path, messages]) => {
						setError(path as Parameters<typeof setError>[0], {
							message: messages[0] ?? "",
						});
					});
				}
				toast.error(result.message || "Произошла ошибка");
				return;
			}
			toast.success(result.message);
			clearFormDraft();
			submitSuccess(values);
		} catch {
			toast.error("Критическая ошибка соединения");
		}
	};

	return (
		<div className="max-w-4xl mx-auto space-y-4">
			<FormProvider {...methods}>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-8 w-full py-6 px-2 md:px-4"
				>
					<Card className="rounded-[32px]">
						<UniversalClientForm currentStep={step} onStepChange={setStep} />
					</Card>
				</form>
			</FormProvider>
		</div>
	);
};
