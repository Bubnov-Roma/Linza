"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { AnimatePresence, motion } from "framer-motion";
import { Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { sendOtpCode } from "@/actions/auth-actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { ValidatedInput } from "@/components/forms";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { emailSchema } from "@/schemas";

interface UniversalAuthFormProps {
	onSuccess?: (email: string) => void;
	onEmailChange?: (email: string) => void;
	initialEmail?: string;
	title?: string;
	isModal?: boolean;
}

export function UniversalAuthForm({
	onSuccess,
	onEmailChange,
	initialEmail = "",
	isModal = false,
	title = "Войти",
}: UniversalAuthFormProps) {
	const [email, setEmail] = useState(initialEmail);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [turnstileToken, setTurnstileToken] = useState<string>("");
	const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!turnstileToken) {
			toast.error("Пожалуйста, подождите проверку безопасности");
			return;
		}

		const result = emailSchema.safeParse(email);
		if (!result.success && result.error.issues[0]) {
			setError(result.error.issues[0].message);
			return;
		}

		setError("");
		setIsLoading(true);
		const res = await sendOtpCode(email, turnstileToken);
		setIsLoading(false);

		if (res.error) {
			toast.error(res.error || "Ошибка при отправке кода");
			onSuccess?.("");
		} else {
			toast.success("Код отправлен!");
			onSuccess?.(email);
		}
	};

	const handleEmailChange = (val: string) => {
		setEmail(val);
		setError("");
		onEmailChange?.(val);
	};

	return (
		<AuthCard
			title={title}
			description={
				!isModal
					? "Войдите через соц. сеть или по одноразовому коду"
					: undefined
			}
			isModal={isModal}
			footerLink={
				isModal
					? {
							text: "",
							label: "",
							href: "#",
						}
					: {
							text: "Есть пароль?",
							label: "Войти",
							href: "/auth?view=login",
						}
			}
			isLoading={isLoading}
		>
			<form onSubmit={handleSubmit} className="space-y-4" noValidate>
				<AnimatePresence mode="wait">
					{!turnstileToken ? (
						<motion.div
							key="captcha-section"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
							transition={{ duration: 0.4 }}
							className="min-h-62 flex flex-col items-center justify-start space-y-6"
						>
							{!turnstileToken && isWidgetLoaded && (
								<p className="text-center py-3 text-xs text-muted-foreground animate-pulse">
									Проверка безопасности
								</p>
							)}
							{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== undefined && (
								<Turnstile
									siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
									onWidgetLoad={() => setIsWidgetLoaded(true)}
									onSuccess={(token) => {
										setTimeout(() => setTurnstileToken(token), 1000);
									}}
									options={{ theme: "auto" }}
								/>
							)}
						</motion.div>
					) : (
						<>
							{/* Соц-кнопки — проявляем их чуть-чуть, чтобы не отвлекали от капчи */}
							<motion.div
								animate={{ opacity: turnstileToken ? 1 : 0.4 }}
								className={cn(
									"transition-all duration-500",
									!turnstileToken && "pointer-events-none grayscale"
								)}
							>
								<div className="w-full flex gap-4 justify-center">
									<Button
										variant="social"
										type="button"
										className="flex-1 gap-2 h-11"
										onClick={() => signIn("google")}
									>
										<svg
											viewBox="0 0 24 24"
											width="18"
											height="18"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
												fill="#4285F4"
											/>
											<path
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
												fill="#34A853"
											/>
											<path
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
												fill="#FBBC05"
											/>
											<path
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
												fill="#EA4335"
											/>
										</svg>
										Google
									</Button>
									<Button
										variant="social"
										type="button"
										className="flex-1 gap-2 h-11"
										onClick={() => signIn("yandex")}
									>
										<svg
											viewBox="0 0 24 24"
											width="18"
											height="18"
											xmlns="http://www.w3.org/2000/svg"
										>
											<circle cx="12" cy="12" r="12" fill="#FC3F1D" />
											<path
												d="M14 18.5V5.5H11C9.1 5.5 7.5 7.1 7.5 9C7.5 10.9 9.1 12.5 11 12.5H14 M7.5 18.5L11.5 12.5"
												fill="none"
												stroke="white"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
										Яндекс
									</Button>
								</div>
								<div className="relative flex justify-center text-xs uppercase my-6">
									<span className="bg-background px-2 text-muted-foreground/70 z-10">
										Или
									</span>
									<div className="absolute top-1/2 w-1/2 h-px bg-border z-0" />
								</div>
							</motion.div>
							<motion.div
								key="form-section"
								initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
								animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
								transition={{ duration: 0.5, delay: 0.1 }}
								className="space-y-2"
							>
								<ValidatedInput
									label="Email"
									type="email"
									placeholder="введите ваш email"
									value={email}
									onChange={(e) => handleEmailChange(e.target.value)}
									error={error}
									icon={<Mail className="h-4 w-4" />}
									required
								/>
								<Button
									type="submit"
									disabled={!email || isLoading}
									className="w-full h-12 font-bold shadow-xl shadow-primary/20"
								>
									{isLoading ? "Отправка..." : "Получить код"}
								</Button>
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</form>
		</AuthCard>
	);
}
