"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useFormContext, useWatch } from "react-hook-form";
import { FormInput } from "@/components/forms/shared/FormInput";
import { Label } from "@/components/ui";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { REFERRAL_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";
import type { ClientFormValues } from "@/schemas";

export const ReferralsBlock = () => {
	const { control, setValue, formState } = useFormContext<ClientFormValues>();

	const referralSource = useWatch({
		control,
		name: "applicationData.additional.referralSource",
	});

	const { error } = control.getFieldState(
		"applicationData.additional.referralSource",
		formState
	);

	const selectedOption = REFERRAL_OPTIONS.find(
		(opt) => opt.id === referralSource
	);
	const showExtraInput = !!selectedOption && selectedOption.placeholder !== "";
	const inputIsDisabled =
		referralSource !== "friends" &&
		referralSource !== "photo_school" &&
		referralSource !== "other";

	return (
		<div className="space-y-0">
			<div>
				<div className="flex flex-col md:flex-row w-full gap-4 justify-between">
					<Label required>Как вы о нас узнали?</Label>
					<Select
						value={referralSource ?? ""}
						onValueChange={(val) =>
							setValue(
								"applicationData.additional.referralSource",
								val as ClientFormValues["applicationData"]["additional"]["referralSource"],
								{ shouldValidate: true, shouldDirty: true }
							)
						}
					>
						<SelectTrigger
							className={cn(
								"h-6 rounded-2xl cursor-pointer py-0 bg-muted-foreground/5 min-w-35 w-auto",
								error &&
									"border-red-400/50 bg-red-400/5 text-red-400 focus:ring-red-400/30"
							)}
						>
							<SelectValue placeholder="Выберите вариант..." />
						</SelectTrigger>
						<SelectContent
							className="rounded-xl border border-foreground/10 bg-background/95 backdrop-blur"
							position="popper"
						>
							{REFERRAL_OPTIONS.map((opt) => (
								<SelectItem
									key={opt.id}
									value={opt.id}
									className="rounded-lg cursor-pointer focus:bg-foreground/10"
								>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{error?.message && (
					<motion.p
						initial={{ opacity: 0, y: -5 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-[10px] text-red-400 uppercase font-bold tracking-tighter mt-1.5 text-right"
					>
						{error.message}
					</motion.p>
				)}
			</div>

			<AnimatePresence initial={false}>
				{showExtraInput && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden pt-1"
					>
						<FormInput
							name="applicationData.additional.recommendation"
							label=""
							placeholder={selectedOption.placeholder}
							disabled={inputIsDisabled}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
