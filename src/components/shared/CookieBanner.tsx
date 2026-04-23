"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

export default function CookieBanner() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const consent = localStorage.getItem("cookie-consent");
		if (!consent) setIsVisible(true);
	}, []);

	const acceptCookies = () => {
		localStorage.setItem("cookie-consent", "true");
		setIsVisible(false);
	};

	if (!isVisible) return null;

	return (
		<div className="fixed bottom-16 sm:bottom-3 max-w-fit mx-auto sm:ml-auto left-0 right-0 rounded-2xl bg-slate-900/80 backdrop-blur-2xl text-white p-4 z-50 shadow-2xl shadow-muted-foreground flex flex-col md:flex-row items-center justify-between border-t border-slate-700">
			<div className="text-xs text-center mb-4 md:mb-0 md:mr-8 max-w-4xl">
				Мы используем файлы cookie, чтобы сайт работал лучше. Продолжая
				использовать сайт, вы соглашаетесь с нашей{" "}
				<a href="/privacy" className="underline hover:text-blue-400">
					Политикой конфиденциальности
				</a>
				.
			</div>
			<Button size="md" onClick={acceptCookies}>
				Принять
			</Button>
		</div>
	);
}
