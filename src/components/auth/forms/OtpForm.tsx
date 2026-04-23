"use client";

import { OTPInput } from "input-otp";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { sendOtpCode } from "@/actions/auth-actions";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/utils";

const RESEND_COOLDOWN_SEC = 120;

interface OtpFormProps {
	email: string;
	onBack: () => void;
	onSuccess?: (() => void) | undefined;
	isModal?: boolean;
	title?: string;
}

export function OtpForm({
	email,
	onSuccess,
	// onBack,
	isModal = false,
	title = "Введите код",
}: OtpFormProps) {
	const router = useRouter();
	const [isSendingCode, setIsSendingCode] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setInterval(() => {
			setCooldown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [cooldown]);

	const handleComplete = async (code: string) => {
		setIsVerifying(true);
		try {
			const result = await signIn("otp", {
				email,
				code,
				redirect: false,
			});
			if (result?.ok) {
				if (onSuccess) {
					onSuccess();
				} else {
					router.push("/dashboard");
					router.refresh();
				}
			}
		} catch (err) {
			toast.error(getErrorMessage(err) || "Ошибка проверки кода");
		} finally {
			setIsVerifying(false);
		}
	};

	const handleResend = async () => {
		if (!email) {
			toast.error("Email не найден");
			return;
		}

		setIsSendingCode(true);
		try {
			const result = await sendOtpCode(email);
			if (result.success) {
				setCooldown(RESEND_COOLDOWN_SEC);
				toast.success("Код отправлен повторно");
			} else {
				toast.error(result.error);
			}
		} catch (err) {
			toast.error(getErrorMessage(err) || "Ошибка отправки");
		} finally {
			setIsVerifying(false);
		}
	};

	const isLoading = isVerifying || isSendingCode;

	// Форматируем mm:ss
	const formatCooldown = (sec: number) => {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

	return (
		<AuthCard
			title={isModal ? title : "Введите код"}
			description={`Отправили код подтверждения на ${email}`}
			isModal={isModal}
			footerLink={
				isModal
					? {
							text: "",
							label: "",
							href: "#",
						}
					: {
							text: "Ошиблись почтой?",
							label: "Изменить",
							href: "/auth?view=register",
						}
			}
			isLoading={isLoading}
		>
			<div
				className={cn(
					"flex flex-col items-center space-y-8",
					isModal && "py-6"
				)}
			>
				<OTPInput
					maxLength={6}
					onComplete={handleComplete}
					disabled={isLoading}
					containerClassName="flex gap-2 justify-center"
					render={({ slots }) => (
						<div className="flex gap-2">
							{slots.map((slot, idx) => (
								<div
									key={`${idx}+${slot.char}`}
									className={cn(
										"w-10 h-14 flex items-center justify-center text-xl font-bold rounded-lg border bg-background transition-all duration-200",
										slot.isActive
											? "border-primary ring-2 ring-primary/20 scale-105 z-10"
											: "border-white/10 bg-foreground/5 text-muted-foreground"
									)}
								>
									{slot.char}
									{slot.hasFakeCaret && (
										<div className="w-0.5 h-6 bg-primary animate-pulse" />
									)}
								</div>
							))}
						</div>
					)}
				/>

				<div className="w-full space-y-2">
					{cooldown > 0 ? (
						<p className="text-center text-xs text-muted-foreground py-2">
							Повторный запрос через{" "}
							<span className="font-mono text-foreground/70 tabular-nums">
								{formatCooldown(cooldown)}
							</span>
						</p>
					) : (
						<Button
							variant="ghost"
							onClick={handleResend}
							disabled={isLoading}
							className="w-full text-xs text-muted-foreground hover:text-foreground h-auto py-2"
						>
							Отправить код повторно
						</Button>
					)}
				</div>
			</div>
		</AuthCard>
	);
}
