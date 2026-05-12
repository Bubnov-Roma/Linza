"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";
import { FormCheckbox, FormTextarea } from "@/components/forms/shared";
import { FormInput } from "@/components/forms/shared/FormInput";
import { FormRadioGroup } from "@/components/forms/shared/FormRadioGroup";
import { REFERRAL_OPTIONS } from "@/constants";
import type { ClientFormValues } from "@/schemas";

export const FinalsSection = () => {
	const { control } = useFormContext<ClientFormValues>();

	const referralSource = useWatch({
		control,
		name: "applicationData.additional.referralSource",
	});

	const selectedOption = REFERRAL_OPTIONS.find(
		(opt) => opt.id === referralSource
	);

	const showExtraInput = !!selectedOption && selectedOption.placeholder !== "";
	const inputIsDisabled =
		referralSource !== "friends" &&
		referralSource !== "photo_school" &&
		referralSource !== "other";

	return (
		<div className="space-y-5">
			<FormRadioGroup
				name="applicationData.additional.referralSource"
				label="Как вы о нас узнали?"
				options={REFERRAL_OPTIONS}
				required
				gridClassName="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-3 pb-3 pt-1 justify-start scrollbar-hide no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			/>
			{showExtraInput && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<FormInput
						name="applicationData.additional.recommendation"
						label={selectedOption.placeholder}
						placeholder=""
						disabled={inputIsDisabled}
					/>
				</motion.div>
			)}
			<FormTextarea
				name="agreements.comment"
				label="Комментарий"
				placeholder="Дополнительная информация или пожелания (необязательно)"
				rows={3}
			/>
			<FormCheckbox
				name="agreements.personalDataConsent"
				className="normal-case tracking-normal"
				label={
					<span className="leading-relaxed text-sm">
						Я подтверждаю корректность данных
						{/* , принимаю условия сотрудничества */} и даю согласие на{" "}
						<Link
							href="/privacy"
							target="_blank"
							className="underline hover:text-blue-500"
						>
							обработку персональных данных
						</Link>
					</span>
				}
			/>
		</div>
	);
};
