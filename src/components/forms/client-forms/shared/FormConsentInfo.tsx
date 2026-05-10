"use client";
import { motion } from "framer-motion";

export const FormConsentInfo = ({ canSubmit }: { canSubmit: boolean }) => {
	return (
		<div className="flex flex-col justify-center items-center w-full px-4 py-2 mt-4 space-y-4">
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
