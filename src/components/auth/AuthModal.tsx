"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/auth/forms/LoginForm";
import { OtpForm } from "@/components/auth/forms/OtpForm";
import { UniversalAuthForm } from "@/components/auth/forms/UniversalAuthForm";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui";
import type { AuthModalIntent } from "@/store/auth-modal.store";

type Step = "options" | "otp" | "password" | "success";

interface AuthModalProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	intent: AuthModalIntent;
}

export function AuthModal({ open, onOpenChange, intent }: AuthModalProps) {
	const router = useRouter();
	const [step, setStep] = useState<Step>("options");
	const [email, setEmail] = useState("");
	// Сброс при закрытии
	useEffect(() => {
		if (!open) {
			setTimeout(() => {
				setStep("options");
				setEmail("");
			}, 300);
		}
	}, [open]);

	const handleSuccess = () => {
		setStep("success");
		setTimeout(() => {
			onOpenChange(false);
			if (intent.type === "redirect") {
				window.location.href = intent.url;
			} else if (intent.type === "callback") {
				intent.fn();
				router.refresh();
			}
		}, 2000);
	};

	// ── Заголовок по intent ───────────────────────────────────────────────────
	const title =
		intent.type === "booking"
			? "Войдите для бронирования"
			: intent.type === "redirect" || intent.type === "callback"
				? "Требуется авторизация"
				: "Вход в Linza";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="rounded-2xl p-0 overflow-hidden max-w-sm border border-foreground/8">
				<DialogTitle className="hidden">Авторизация</DialogTitle>
				<DialogDescription className="hidden">Вход в систему</DialogDescription>
				<div className="relative min-h-110 flex flex-col justify-center">
					<AnimatePresence mode="wait" initial={false}>
						{step === "success" && (
							<motion.div
								key="success"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0 }}
								className="p-8 flex flex-col items-center justify-center text-center space-y-6"
							>
								<div className="relative">
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{
											type: "spring",
											damping: 12,
											stiffness: 200,
											delay: 0.2,
										}}
										className="bg-green-500/10 rounded-full p-6"
									>
										<CheckCircleIcon
											className="text-green-500"
											size={64}
											weight="fill"
										/>
									</motion.div>
									<motion.div
										animate={{ rotate: 360 }}
										transition={{
											duration: 4,
											repeat: Infinity,
											ease: "linear",
										}}
										className="absolute inset-0 border-2 border-dashed border-green-500/20 rounded-full"
									/>
								</div>
								<div className="space-y-2">
									<h2 className="text-2xl font-black uppercase italic tracking-tight">
										Готово!
									</h2>
									<p className="text-muted-foreground text-sm">
										Входим в ваш аккаунт...
									</p>
								</div>
							</motion.div>
						)}

						{step === "options" && (
							<motion.div
								key="options"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<UniversalAuthForm
									isModal
									title={title}
									onEmailChange={setEmail}
									onSuccess={() => setStep("otp")}
								/>

								{/* Переключатель на пароль */}
								<Button
									variant="link"
									onClick={() => setStep("password")}
									className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
								>
									Войти по паролю →
								</Button>
							</motion.div>
						)}

						{step === "otp" && (
							<motion.div
								key="otp"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<OtpForm
									isModal
									email={email}
									onBack={() => setStep("options")}
									onSuccess={handleSuccess}
								/>
								<Button
									variant="link"
									onClick={() => setStep("options")}
									className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
								>
									← Изменить email
								</Button>
							</motion.div>
						)}

						{step === "password" && (
							<motion.div
								key="password"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<LoginForm isModal onSuccess={handleSuccess} />
								<Button
									variant="link"
									onClick={() => setStep("options")}
									className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
								>
									← Войти по коду
								</Button>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</DialogContent>
		</Dialog>
	);
}
