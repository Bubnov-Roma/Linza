"use client";

import Link from "next/link";
import { FormCheckbox, FormTextarea } from "@/components/forms/shared";

export const FinalBlock = () => {
	return (
		<div className="space-y-6">
			<FormTextarea
				name="agreements.comment"
				label="Комментарий"
				placeholder="Дополнительная информация или пожелания (необязательно)"
				rows={5}
				className="mt-auto"
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
