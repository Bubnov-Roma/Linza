"use client";

import { EyeClosedIcon, EyeIcon, LockIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setPasswordAction } from "@/actions/auth-actions";
import { Button, Input, Label } from "@/components/ui";
import { updatePasswordSchema } from "@/schemas";

export default function SetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const fromInvite = searchParams.get("from") === "invite";

	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [errors, setErrors] = useState<{
		password?: string;
		confirmPassword?: string;
	}>({});
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.SyntheticEvent) => {
		e.preventDefault();

		const result = updatePasswordSchema.safeParse({
			password,
			confirmPassword: confirm,
		});

		if (!result.success) {
			const errs: Record<string, string> = {};
			result.error.issues.forEach((i) => {
				errs[i.path[0] as string] = i.message;
			});
			setErrors(errs);
			return;
		}

		setErrors({});

		startTransition(async () => {
			const r = await setPasswordAction(password);
			if (!r.success) {
				toast.error(r.error ?? "Ошибка сохранения");
				return;
			}
			toast.success("Пароль установлен");
			// После инвайта — в профиль, иначе — на главную дашборда
			router.push(fromInvite ? "/dashboard/profile" : "/dashboard");
			router.refresh();
		});
	};

	return (
		<div className="max-w-sm mx-auto mt-16 px-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{fromInvite && (
				<div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-1">
					<p className="text-sm font-bold text-primary">Добро пожаловать!</p>
					<p className="text-xs text-muted-foreground">
						Администратор создал аккаунт для вас. Придумайте пароль для входа.
					</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4" noValidate>
				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">Новый пароль</Label>
					<div className="relative">
						<LockIcon
							size={14}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								if (errors.password) setErrors((p) => ({ ...p, password: "" }));
							}}
							placeholder="Минимум 8 символов"
							className="glass-input pl-8 h-11 pr-10"
						/>
						<button
							type="button"
							onClick={() => setShowPassword((v) => !v)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						>
							{showPassword ? (
								<EyeClosedIcon size={14} />
							) : (
								<EyeIcon size={14} />
							)}
						</button>
					</div>
					{errors.password && (
						<p className="text-xs text-red-500">{errors.password}</p>
					)}
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs text-muted-foreground">
						Повторите пароль
					</Label>
					<div className="relative">
						<LockIcon
							size={14}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type={showConfirm ? "text" : "password"}
							value={confirm}
							onChange={(e) => {
								setConfirm(e.target.value);
								if (errors.confirmPassword)
									setErrors((p) => ({ ...p, confirmPassword: "" }));
							}}
							placeholder="Повторите пароль"
							className="pl-8 h-11 pr-10 glass-input"
						/>
						<button
							type="button"
							onClick={() => setShowConfirm((v) => !v)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
						>
							{showConfirm ? (
								<EyeClosedIcon size={14} />
							) : (
								<EyeIcon size={14} />
							)}
						</button>
					</div>
					{errors.confirmPassword && (
						<p className="text-xs text-red-500">{errors.confirmPassword}</p>
					)}
				</div>

				<Button
					type="submit"
					disabled={isPending || !password || !confirm}
					className="w-full h-11 font-bold"
				>
					{isPending ? "Сохраняем..." : "Установить пароль"}
				</Button>
			</form>
		</div>
	);
}
