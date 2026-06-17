"use client";

import {
	EnvelopeIcon,
	EyeClosedIcon,
	EyeIcon,
	LockIcon,
} from "@phosphor-icons/react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { ValidatedInput } from "@/components/forms";
import { Button } from "@/components/ui";
import { loginSchema } from "@/schemas";
import { AuthCard } from "../AuthCard";

interface LoginFormProps {
	isModal: boolean;
	onSuccess: () => void;
}

export function LoginForm({ isModal, onSuccess }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState<{ email?: string; password?: string }>(
		{}
	);
	const [isLoading, setIsLoading] = useState(false);

	const handlePasswordLogin = async (e: React.SubmitEvent) => {
		e.preventDefault();

		const result = loginSchema.safeParse({ email, password });

		if (!result.success) {
			const formattedErrors: Record<string, string> = {};
			result.error.issues.forEach((issue) => {
				formattedErrors[issue.path[0] as string] = issue.message;
			});
			setErrors(formattedErrors);
			return;
		}

		setErrors({});
		setIsLoading(true);

		try {
			const res = await signIn("password", {
				email,
				password,
				redirect: false,
			});

			if (res?.error) {
				toast.error("Неверный email или пароль");
				return;
			}

			if (isModal && onSuccess) {
				onSuccess();
			} else {
				toast.success("С возвращением!");
				window.location.href = "/dashboard";
			}
		} catch {
			toast.error("Ошибка авторизации");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthCard
			title={isModal ? "Вход по паролю" : "С возвращением"}
			isModal={isModal}
			description={isModal ? undefined : "Введите данные для входа в аккаунт"}
			footerLink={
				isModal
					? {
							text: "",
							label: "",
							href: "#",
						}
					: {
							text: "Нет аккаунта?",
							label: "Зарегистрироваться",
							href: "/auth?view=register",
						}
			}
			isLoading={isLoading}
		>
			<form onSubmit={handlePasswordLogin} className="space-y-3" noValidate>
				<ValidatedInput
					label="Email"
					type="email"
					placeholder="mail@example.com"
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
					}}
					error={errors.email ?? ""}
					icon={<EnvelopeIcon className="h-4 w-4" />}
					required
				/>

				<div className="relative">
					<ValidatedInput
						label="Пароль"
						type={showPassword ? "text" : "password"}
						placeholder="••••••••"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							if (errors.password)
								setErrors((prev) => ({ ...prev, password: "" }));
						}}
						error={errors.password ?? ""}
						icon={<LockIcon className="h-4 w-4" />}
						required
						suffix={
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="text-muted-foreground hover:text-foreground transition-colors p-1"
								tabIndex={-1}
							>
								{showPassword ? (
									<EyeClosedIcon className="h-4 w-4" />
								) : (
									<EyeIcon className="h-4 w-4" />
								)}
							</button>
						}
					/>
				</div>

				<Button
					type="submit"
					className="w-full h-12 font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
					disabled={isLoading}
				>
					{isLoading ? "Вход..." : "Войти"}
				</Button>
			</form>
		</AuthCard>
	);
}
