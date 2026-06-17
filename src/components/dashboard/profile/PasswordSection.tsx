"use client";

import {
	ArrowLeftIcon,
	CheckIcon,
	EnvelopeIcon,
	EyeClosedIcon,
	EyeIcon,
	LockIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	resetPasswordWithOtpAction,
	sendPasswordResetOtpAction,
} from "@/actions/auth-actions";
import { updateUserPasswordAction } from "@/actions/user-actions";
import { Button, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Вспомогательные компоненты
// ─────────────────────────────────────────────────────────────────────────────

function PasswordStrengthHints({ password }: { password: string }) {
	const checks = [
		{ label: "Минимум 8 символов", ok: password.length >= 8 },
		{ label: "Заглавная буква", ok: /[A-ZА-Я]/.test(password) },
		{ label: "Цифра", ok: /\d/.test(password) },
	];
	if (!password) return null;
	return (
		<ul className="space-y-1 mt-1.5">
			{checks.map(({ label, ok }) => (
				<li key={label} className="flex items-center gap-1.5 text-[11px]">
					{ok ? (
						<CheckIcon className="w-3 h-3 text-green-500 shrink-0" />
					) : (
						<XIcon className="w-3 h-3 text-muted-foreground/30 shrink-0" />
					)}
					<span
						className={
							ok
								? "text-green-600 dark:text-green-400"
								: "text-muted-foreground/50"
						}
					>
						{label}
					</span>
				</li>
			))}
		</ul>
	);
}

function PasswordInput({
	label,
	value,
	onChange,
	placeholder,
	error,
	autoFocus,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	error?: string;
	autoFocus?: boolean;
}) {
	const [show, setShow] = useState(false);
	return (
		<div className="space-y-1">
			<Label className="text-xs font-medium text-muted-foreground">
				{label}
			</Label>
			<div
				className={cn(
					"flex items-center gap-2 px-3 h-10 rounded-xl border bg-background/50 transition-all",
					error
						? "border-destructive/60 ring-1 ring-destructive/20"
						: "border-foreground/10 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
				)}
			>
				<LockIcon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
				<input
					// biome-ignore lint/a11y/noAutofocus: intentional focus management in modal-like flow
					autoFocus={autoFocus}
					type={show ? "text" : "password"}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder ?? "••••••••"}
					className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/30"
				/>
				<button
					type="button"
					onClick={() => setShow((s) => !s)}
					tabIndex={-1}
					className="text-muted-foreground/40 hover:text-foreground transition-colors p-0.5"
				>
					{show ? (
						<EyeClosedIcon className="h-3.5 w-3.5" />
					) : (
						<EyeIcon className="h-3.5 w-3.5" />
					)}
				</button>
			</div>
			{error && (
				<p className="text-[11px] text-destructive/80 flex items-center gap-1">
					<XIcon className="w-3 h-3 shrink-0" />
					{error}
				</p>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP-инпут: 6 квадратиков
// ─────────────────────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function OtpInput({
	value,
	onChange,
	error,
}: {
	value: string;
	onChange: (v: string) => void;
	error?: string;
}) {
	const digits = value.padEnd(OTP_LENGTH, "").split("").slice(0, OTP_LENGTH);

	const handleKey = (
		e: React.KeyboardEvent<HTMLInputElement>,
		index: number
	) => {
		if (e.key === "Backspace" && !digits[index] && index > 0) {
			const el = document.getElementById(`otp-reset-${index - 1}`);
			el?.focus();
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement>,
		index: number
	) => {
		const char = e.target.value.replace(/\D/g, "").slice(-1);
		const next = [...digits];
		next[index] = char;
		const joined = next.join("").slice(0, OTP_LENGTH);
		onChange(joined);
		if (char && index < OTP_LENGTH - 1) {
			document.getElementById(`otp-reset-${index + 1}`)?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		const pasted = e.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, OTP_LENGTH);
		if (pasted) {
			onChange(pasted);
			const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
			document.getElementById(`otp-reset-${lastIdx}`)?.focus();
			e.preventDefault();
		}
	};

	return (
		<div className="space-y-2">
			<div className="flex gap-2 justify-center" onPaste={handlePaste}>
				{digits.map((d, i) => (
					<input
						// biome-ignore lint/a11y/noAutofocus: first cell gets focus when OTP step opens
						autoFocus={i === 0}
						key={`otp-cell-${i}`}
						id={`otp-reset-${i}`}
						type="text"
						inputMode="numeric"
						maxLength={1}
						value={d}
						onChange={(e) => handleChange(e, i)}
						onKeyDown={(e) => handleKey(e, i)}
						className={cn(
							"w-10 h-12 text-center text-lg font-bold rounded-xl border bg-background transition-all outline-none",
							d
								? "border-primary/60 ring-1 ring-primary/20 text-foreground"
								: "border-foreground/10 text-muted-foreground",
							error && "border-destructive/60 ring-1 ring-destructive/20"
						)}
					/>
				))}
			</div>
			{error && (
				<p className="text-[11px] text-destructive/80 text-center flex items-center justify-center gap-1">
					<XIcon className="w-3 h-3 shrink-0" />
					{error}
				</p>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Шаг 1: форма нового пароля (первичная установка)
// ─────────────────────────────────────────────────────────────────────────────
function SetPasswordForm({ onDone }: { onDone: () => void }) {
	const [newPass, setNewPass] = useState("");
	const [confirm, setConfirm] = useState("");
	const [errors, setErrors] = useState<{ newPass?: string; confirm?: string }>(
		{}
	);
	const [saving, setSaving] = useState(false);

	const validate = () => {
		const e: typeof errors = {};
		if (newPass.length < 8) e.newPass = "Минимум 8 символов";
		if (newPass !== confirm) e.confirm = "Пароли не совпадают";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) return;
		setSaving(true);
		try {
			const res = await updateUserPasswordAction("password", newPass);
			if (!res.success) throw new Error(res.error);
			toast.success("Пароль установлен");
			onDone();
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-3">
			<PasswordInput
				label="Новый пароль"
				value={newPass}
				autoFocus
				onChange={(v) => {
					setNewPass(v);
					if (errors.newPass) setErrors((p) => ({ ...p, newPass: "" }));
				}}
				error={errors.newPass || ""}
			/>
			<PasswordStrengthHints password={newPass} />
			<PasswordInput
				label="Повторите пароль"
				value={confirm}
				onChange={(v) => {
					setConfirm(v);
					if (errors.confirm) setErrors((p) => ({ ...p, confirm: "" }));
				}}
				error={errors.confirm || ""}
			/>
			<div className="flex gap-2 pt-1">
				<Button
					type="button"
					size="sm"
					onClick={handleSave}
					disabled={saving || !newPass}
					className="flex-1 h-9 text-sm"
				>
					{saving ? "Сохранение..." : "Сохранить"}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={onDone}
					className="h-9 text-sm"
				>
					Отмена
				</Button>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Шаг 1: смена пароля (знает текущий)
// ─────────────────────────────────────────────────────────────────────────────
function ChangePasswordForm({
	onDone,
	onForgot,
}: {
	onDone: () => void;
	onForgot: () => void;
}) {
	const [currentPass, setCurrentPass] = useState("");
	const [newPass, setNewPass] = useState("");
	const [confirm, setConfirm] = useState("");
	const [errors, setErrors] = useState<{
		currentPass?: string;
		newPass?: string;
		confirm?: string;
	}>({});
	const [saving, setSaving] = useState(false);

	const validate = () => {
		const e: typeof errors = {};
		if (!currentPass) e.currentPass = "Введите текущий пароль";
		if (newPass.length < 8) e.newPass = "Минимум 8 символов";
		if (newPass === currentPass) e.newPass = "Новый пароль совпадает с текущим";
		if (newPass !== confirm) e.confirm = "Пароли не совпадают";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) return;
		setSaving(true);
		try {
			const res = await updateUserPasswordAction(
				"verifyAndChange",
				`${currentPass}|||${newPass}`
			);
			if (!res.success) {
				// Сервер вернул «Неверный текущий пароль» — подсвечиваем поле
				setErrors((p) => ({
					...p,
					currentPass: res.error ?? "Неверный текущий пароль",
				}));
				return;
			}
			toast.success("Пароль успешно изменён");
			onDone();
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-3 relative">
			<PasswordInput
				label="Текущий пароль"
				value={currentPass}
				autoFocus
				onChange={(v) => {
					setCurrentPass(v);
					if (errors.currentPass) setErrors((p) => ({ ...p, currentPass: "" }));
				}}
				error={errors.currentPass || ""}
			/>
			{/* Ссылка «Забыли пароль?» — только под полем текущего */}
			<button
				type="button"
				onClick={onForgot}
				className="absolute top-1 right-2 text-[11px] text-muted-foreground/50 hover:text-foreground/80 transition-colors -mt-1 block"
			>
				Забыли пароль?
			</button>
			<PasswordInput
				label="Новый пароль"
				value={newPass}
				onChange={(v) => {
					setNewPass(v);
					if (errors.newPass) setErrors((p) => ({ ...p, newPass: "" }));
				}}
				error={errors.newPass || ""}
			/>
			<PasswordStrengthHints password={newPass} />
			<PasswordInput
				label="Повторите новый пароль"
				value={confirm}
				onChange={(v) => {
					setConfirm(v);
					if (errors.confirm) setErrors((p) => ({ ...p, confirm: "" }));
				}}
				error={errors.confirm || ""}
			/>
			<div className="flex gap-2 pt-1">
				<Button
					type="button"
					size="sm"
					onClick={handleSave}
					disabled={saving || !newPass || !currentPass}
					className="flex-1 h-9 text-sm"
				>
					{saving ? "Изменение..." : "Изменить пароль"}
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={onDone}
					className="h-9 text-sm"
				>
					Отмена
				</Button>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Шаг 2: отправили OTP, ждём ввода
// ─────────────────────────────────────────────────────────────────────────────
function ResetOtpStep({
	email,
	onVerified,
	onBack,
}: {
	email: string;
	onVerified: (code: string) => void;
	onBack: () => void;
}) {
	const [code, setCode] = useState("");
	const [error, setError] = useState("");
	const [verifying, setVerifying] = useState(false);
	const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
	const [resending, setResending] = useState(false);

	useEffect(() => {
		if (cooldown <= 0) return;
		const t = setInterval(() => {
			setCooldown((s) => {
				if (s <= 1) {
					clearInterval(t);
					return 0;
				}
				return s - 1;
			});
		}, 1000);
		return () => clearInterval(t);
	}, [cooldown]);

	const handleVerify = async () => {
		if (code.length < OTP_LENGTH) {
			setError("Введите все 6 цифр");
			return;
		}
		setVerifying(true);
		setError("");
		try {
			// Проверяем код без смены пароля — это делает следующий шаг
			// Но чтобы не делать двойной запрос, передаём код наверх и
			// финальный экшен вызывается на шаге NewPasswordStep
			onVerified(code);
		} finally {
			setVerifying(false);
		}
	};

	const handleResend = async () => {
		setResending(true);
		try {
			const res = await sendPasswordResetOtpAction();
			if (res.error) {
				toast.error(res.error);
			} else {
				toast.success("Новый код отправлен");
				setCooldown(RESEND_COOLDOWN);
				setCode("");
				setError("");
			}
		} finally {
			setResending(false);
		}
	};

	const fmt = (s: number) =>
		`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

	return (
		<div className="space-y-4">
			<div className="space-y-1">
				<p className="text-sm font-medium">Код подтверждения</p>
				<p className="text-[11px] text-muted-foreground/60">
					Отправили 6-значный код на{" "}
					<span className="font-medium text-foreground/70">{email}</span>
				</p>
			</div>

			<OtpInput value={code} onChange={setCode} error={error} />

			{cooldown > 0 ? (
				<p className="text-center text-[11px] text-muted-foreground/50">
					Повторный запрос через{" "}
					<span className="font-mono text-foreground/60 tabular-nums">
						{fmt(cooldown)}
					</span>
				</p>
			) : (
				<button
					type="button"
					onClick={handleResend}
					disabled={resending}
					className="w-full text-center text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
				>
					{resending ? "Отправка..." : "Отправить код повторно"}
				</button>
			)}

			<div className="flex gap-2">
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={onBack}
					className="h-9 w-9 p-0 shrink-0"
				>
					<ArrowLeftIcon className="w-4 h-4" />
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={handleVerify}
					disabled={verifying || code.length < OTP_LENGTH}
					className="flex-1 h-9 text-sm"
				>
					{verifying ? "Проверка..." : "Подтвердить"}
				</Button>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Шаг 3: ввод нового пароля после OTP
// ─────────────────────────────────────────────────────────────────────────────
function NewPasswordStep({
	otpCode,
	onDone,
	onBack,
}: {
	otpCode: string;
	onDone: () => void;
	onBack: () => void;
}) {
	const [newPass, setNewPass] = useState("");
	const [confirm, setConfirm] = useState("");
	const [errors, setErrors] = useState<{
		newPass?: string;
		confirm?: string;
		otp?: string;
	}>({});
	const [saving, setSaving] = useState(false);

	const validate = () => {
		const e: typeof errors = {};
		if (newPass.length < 8) e.newPass = "Минимум 8 символов";
		if (newPass !== confirm) e.confirm = "Пароли не совпадают";
		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) return;
		setSaving(true);
		try {
			const res = await resetPasswordWithOtpAction(otpCode, newPass);
			if (!res.success) {
				// Код оказался неверным или истёк — возвращаем на шаг OTP
				setErrors({ otp: res.error || "Время действия кода истекло" });
				return;
			}
			toast.success("Пароль успешно изменён");
			onDone();
		} catch (e: unknown) {
			toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
		} finally {
			setSaving(false);
		}
	};

	if (errors.otp) {
		return (
			<div className="space-y-3">
				<p className="text-sm text-destructive/80 flex items-center gap-2">
					<XIcon className="w-4 h-4 shrink-0" />
					{errors.otp}
				</p>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={onBack}
					className="w-full h-9 text-sm"
				>
					← Ввести код заново
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<p className="text-[11px] text-muted-foreground/60">
				Код подтверждён. Придумайте новый пароль.
			</p>
			<PasswordInput
				label="Новый пароль"
				value={newPass}
				autoFocus
				onChange={(v) => {
					setNewPass(v);
					if (errors.newPass) setErrors((p) => ({ ...p, newPass: "" }));
				}}
				error={errors.newPass || ""}
			/>
			<PasswordStrengthHints password={newPass} />
			<PasswordInput
				label="Повторите пароль"
				value={confirm}
				onChange={(v) => {
					setConfirm(v);
					if (errors.confirm) setErrors((p) => ({ ...p, confirm: "" }));
				}}
				error={errors.confirm || ""}
			/>
			<div className="flex gap-2 pt-1">
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={onBack}
					className="h-9 w-9 p-0 shrink-0"
				>
					<ArrowLeftIcon className="w-4 h-4" />
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={handleSave}
					disabled={saving || !newPass}
					className="flex-1 h-9 text-sm"
				>
					{saving ? "Сохранение..." : "Сохранить пароль"}
				</Button>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Флоу восстановления: отправка → OTP → новый пароль
// ─────────────────────────────────────────────────────────────────────────────
type ResetStep = "sending" | "otp" | "new-password";

function ForgotPasswordFlow({
	userEmail,
	onDone,
	onBack,
}: {
	userEmail: string;
	onDone: () => void;
	onBack: () => void;
}) {
	const [step, setStep] = useState<ResetStep>("sending");
	const [otpCode, setOtpCode] = useState("");
	const [sending, setSending] = useState(false);

	const handleSendOtp = async () => {
		setSending(true);
		try {
			const res = await sendPasswordResetOtpAction();
			if (res.error) {
				toast.error(res.error);
			} else {
				toast.success("Код отправлен");
				setStep("otp");
			}
		} finally {
			setSending(false);
		}
	};

	if (step === "sending") {
		return (
			<div className="space-y-4">
				<div className="space-y-1">
					<p className="text-sm font-medium">Восстановление пароля</p>
					<p className="text-[11px] text-muted-foreground/60">
						Отправим одноразовый код на вашу почту:
					</p>
					<div className="flex items-center gap-2 px-3 h-9 rounded-xl border border-foreground/10 bg-background/30 mt-1">
						<EnvelopeIcon className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
						<span className="text-sm text-foreground/70 truncate">
							{userEmail}
						</span>
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={onBack}
						className="h-9 w-9 p-0 shrink-0"
					>
						<ArrowLeftIcon className="w-4 h-4" />
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={handleSendOtp}
						disabled={sending}
						className="flex-1 h-9 text-sm"
					>
						{sending ? "Отправка..." : "Отправить код"}
					</Button>
				</div>
			</div>
		);
	}

	if (step === "otp") {
		return (
			<ResetOtpStep
				email={userEmail}
				onVerified={(code) => {
					setOtpCode(code);
					setStep("new-password");
				}}
				onBack={() => setStep("sending")}
			/>
		);
	}

	return (
		<NewPasswordStep
			otpCode={otpCode}
			onDone={onDone}
			onBack={() => setStep("otp")}
		/>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Публичный компонент
// ─────────────────────────────────────────────────────────────────────────────
type Mode = "idle" | "set" | "change" | "forgot";

export function PasswordSection({
	hasPassword,
	userEmail,
}: {
	hasPassword: boolean;
	/** Передаётся из ProfileDetails — нужен для отображения адреса в forgot-флоу */
	userEmail: string;
}) {
	const [mode, setMode] = useState<Mode>("idle");

	if (mode === "set") {
		return <SetPasswordForm onDone={() => setMode("idle")} />;
	}

	if (mode === "change") {
		return (
			<ChangePasswordForm
				onDone={() => setMode("idle")}
				onForgot={() => setMode("forgot")}
			/>
		);
	}

	if (mode === "forgot") {
		return (
			<ForgotPasswordFlow
				userEmail={userEmail}
				onDone={() => setMode("idle")}
				onBack={() => setMode("change")}
			/>
		);
	}

	// idle
	return (
		<button
			type="button"
			onClick={() => setMode(hasPassword ? "change" : "set")}
			className="text-sm text-foreground/70 hover:text-foreground transition-colors underline-offset-4 hover:underline"
		>
			{hasPassword ? "Изменить пароль" : "Установить пароль"}
		</button>
	);
}
