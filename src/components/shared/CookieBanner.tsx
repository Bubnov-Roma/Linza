"use client";

import { CookieIcon } from "@phosphor-icons/react";
import Link from "next/link";
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
		<div className="fixed bottom-16 sm:bottom-4 max-w-fit mx-auto sm:ml-auto left-0 right-0 rounded-3xl dark:bg-slate-500/90  bg-slate-900/90 backdrop-blur-2xl text-white p-4 z-50 shadow-2xl shadow-muted-foreground flex flex-col md:flex-row items-center justify-between border-t border-slate-700">
			<div className="text-xs border-spacing-1.5 text-center mb-4 md:mb-0 md:mr-8 max-w-4xl">
				Мы используем файлы <strong>cookies</strong> чтобы улучшить работу
				сервиса. Вы можете отключить cookies в настройках вашего браузера.
				<br />
				Продолжая использовать сайт, вы принимаете{" "}
				<Link
					href="/privacy"
					className="underline hover:text-blue-400 font-black"
				>
					Политику конфиденциальности
				</Link>{" "}
				и
				<Link
					href="/terms"
					className="underline hover:text-blue-400 font-black"
				>
					Правила использования
				</Link>
				.
			</div>
			<Button size="md" onClick={acceptCookies} className="rounded-2xl">
				<CookieIcon size={13} weight="duotone" />
				Принять
			</Button>
		</div>
	);
}
