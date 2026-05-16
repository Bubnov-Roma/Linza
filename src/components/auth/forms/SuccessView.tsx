"use client";

import { CheckCircleIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export function SuccessView() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectPath = searchParams.get("redirect") || "/dashboard";

	useEffect(() => {
		// Небольшая задержка, чтобы пользователь успел порадоваться
		const timer = setTimeout(() => {
			router.push(redirectPath);
			router.refresh(); // Обновляем данные сессии
		}, 2000);
		return () => clearTimeout(timer);
	}, [redirectPath, router]);

	return (
		<AuthCard title="Успешно" description="Выполняется вход в систему...">
			<div className="flex flex-col items-center justify-center py-8">
				<div className="relative">
					<div className="absolute inset-0 blur-2xl bg-green-500/20 rounded-full" />
					<div className="relative bg-background rounded-full p-2 border border-green-500/20">
						<CheckCircleIcon size={64} className="text-green-500" />
					</div>
				</div>

				<div className="space-y-2">
					<h2 className="text-2xl font-black italic uppercase tracking-wide">
						Успешно!
					</h2>
					<p className="text-muted-foreground">Выполняется вход в систему...</p>
				</div>

				<CircleNotchIcon className="w-6 h-6 animate-spin text-primary" />
			</div>
		</AuthCard>
	);
}
