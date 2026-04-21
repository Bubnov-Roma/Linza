"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { sendOtpCode } from "@/actions/auth-actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { OtpForm } from "@/components/auth/forms/OtpForm";
import { ValidatedInput } from "@/components/forms";
import { Button } from "@/components/ui";
import { emailSchema } from "@/schemas";

export function UniversalAuthForm() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isEmailSent, setIsEmailSent] = useState(false);
	const [turnstileToken, setTurnstileToken] = useState<string>("");

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

		// ВЫЗЫВАЕМ ЭКШЕН ДЛЯ ОТПРАВКИ ПИСЬМА!
		const res = await sendOtpCode(email, turnstileToken);
		setIsLoading(false);

		if (res.error) {
			toast.error(res.error || "Ошибка при отправке кода");
		} else {
			setIsEmailSent(true);
			toast.success("Код отправлен!");
		}
	};

	const handleGoogleLogin = () =>
		signIn("google", { callbackUrl: "/dashboard" });

	const handleYandexLogin = () =>
		signIn("yandex", { callbackUrl: "/dashboard" });

	if (isEmailSent) {
		return <OtpForm email={email} onBack={() => setIsEmailSent(false)} />;
	}

	return (
		<AuthCard
			title="Войти"
			description="Безопасный вход по одноразовому коду"
			footerLink={{
				text: "Есть пароль?",
				label: "Войти",
				href: "/auth?view=login",
			}}
			isLoading={isLoading}
		>
			<form onSubmit={handleSubmit} className="space-y-4" noValidate>
				{/* Виджет Turnstile. Вставляем перед кнопкой отправки */}
				{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== undefined &&
				turnstileToken === "" ? (
					<div className="my-6 flex justify-center">
						<Turnstile
							siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
							onSuccess={(token) => setTurnstileToken(token)}
						/>
					</div>
				) : (
					<>
						<ValidatedInput
							label="Email"
							type="email"
							placeholder="введите ваш email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setError("");
							}}
							error={error}
							icon={<Mail className="h-4 w-4" />}
							required
						/>
						<Button
							type="submit"
							disabled={!email || isLoading || !turnstileToken}
							className="w-full h-12 font-bold shadow-xl shadow-primary/20"
						>
							{isLoading ? "Отправка..." : "Получить код"}
						</Button>
					</>
				)}
			</form>

			<div className="relative flex justify-center text-xs uppercase my-6">
				<span className="bg-background px-2 text-muted-foreground z-10">
					Или
				</span>
				<div className="absolute top-1/2 left-0 w-full h-px bg-border z-0" />
			</div>

			<div className="w-full flex gap-4 justify-center">
				<Button
					variant="social"
					className="flex-1 gap-2 h-11"
					onClick={handleGoogleLogin}
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
					className="flex-1 gap-2 h-11"
					onClick={handleYandexLogin}
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
		</AuthCard>
	);
}
