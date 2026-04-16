"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { FormCheckbox } from "@/components/forms/shared";

export const FormConsentInfo = ({ canSubmit }: { canSubmit: boolean }) => {
	return (
		<div className="flex flex-col justify-center items-center w-full px-4 py-2 mt-4 space-y-4">
			<div className="px-6 border-t border-foreground/5 pt-6 w-full max-w-2xl">
				<FormCheckbox
					name="agreements.personalDataConsent"
					className="normal-case tracking-normal"
					label={
						<span className="leading-relaxed">
							Я подтверждаю корректность данных, принимаю условия сотрудничества
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

			{!canSubmit && (
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-[10px] md:text-xs text-center text-orange-400/80 font-medium"
				>
					Для отправки анкеты, пожалуйста, заполните все обязательные поля и
					дайте согласие
				</motion.p>
			)}
		</div>
	);
};
