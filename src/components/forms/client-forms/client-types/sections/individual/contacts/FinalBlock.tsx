"use client";

import Link from "next/link";
import { FormCheckbox, FormTextarea } from "@/components/forms/shared";
import { Separator } from "@/components/ui";

export const FinalBlock = () => {
	return (
		<div className="space-y-4">
			<FormTextarea
				name="agreements.comment"
				label="Комментарий"
				placeholder="Дополнительная информация или комментарии (необязательно)"
				rows={4}
				className="mt-auto"
			/>
			<Separator />
			<FormCheckbox
				name="agreements.personalDataConsent"
				className="normal-case tracking-normal"
				label={
					<span className="leading-relaxed text-sm">
						Я подтверждаю корректность данных, принимаю{" "}
						<Link
							href="/terms"
							target="_blank"
							className="underline hover:text-blue-500"
						>
							условия сотрудничества
						</Link>{" "}
						и даю согласие на{" "}
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
