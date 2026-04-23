"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OtpForm } from "@/components/auth/forms/OtpForm";
import { SuccessView } from "@/components/auth/forms/SuccessView";
import { UpdatePasswordForm } from "@/components/auth/forms/UpdatePasswordForm";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "./forms/LoginForm";
import { UniversalAuthForm } from "./forms/UniversalAuthForm";

export function AuthFormController({ view }: { view: string }) {
	const { user } = useAuth();
	const [authEmail, setAuthEmail] = useState("");
	const router = useRouter();

	const handleEmailSent = (email: string) => {
		setAuthEmail(email); // Сохраняем в памяти

		// Переключаем вьюху, но НЕ добавляем email в URL
		const params = new URLSearchParams(window.location.search);
		params.set("view", "otp");
		router.push(`/auth?${params.toString()}`);
	};
	const searchParams = useSearchParams();
	// const email = searchParams.get("email") || "";

	useEffect(() => {
		if (user && view !== "update-password" && view !== "success") {
			const redirectUrl = searchParams.get("redirect") || "/dashboard";
			router.push(redirectUrl);
		}
	}, [user, router, view, searchParams]);

	const setView = (newView: string, targetEmail?: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("view", newView);
		if (targetEmail) params.set("email", targetEmail);
		router.push(`/auth?${params.toString()}`);
	};

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={view}
				initial={{ x: 20, opacity: 0 }}
				animate={{ x: 0, opacity: 1 }}
				exit={{ x: -20, opacity: 0 }}
				transition={{ duration: 0.3, ease: "easeInOut" }}
				className="w-full"
			>
				{view === "login" && (
					<LoginForm isModal={false} onSuccess={() => setView("success")} />
				)}
				{(view === "otp-login" || view === "register") && (
					<UniversalAuthForm isModal={false} onSuccess={handleEmailSent} />
				)}
				{view === "otp" && (
					<OtpForm
						email={authEmail}
						isModal={false}
						onBack={() => setView("register")}
						onSuccess={() => setView("success")}
					/>
				)}
				{view === "update-password" && <UpdatePasswordForm />}
				{view === "success" && <SuccessView />}
			</motion.div>
		</AnimatePresence>
	);
}
