"use client";

import { CookieIcon } from "@phosphor-icons/react";
// import Link from "next/link";
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
		<div className="fixed bottom-16 md:right-10 gap-2 sm:max-w-2xs rounded-3xl bg-muted-foreground/25 drop-shadow-2xl backdrop-blur-2xl p-4 z-50 shadow-2xl shadow-muted-foreground/60">
			<div className="flex flex-row items-center justify-between gap-3">
				<span className="text-xs border-spacing-2 text-center mb-0 leading-relaxed font-normal">
					Мы используем файлы <strong>cookie</strong> чтобы делать сервис
					удобнее.
					{/* Продолжая использовать сайт, вы принимаете{" "}
					<Link
						href="/privacy"
						target="_blank"
						className="underline hover:text-blue-400 font-black"
					>
						политику
					</Link>{" "}
					и{" "}
					<Link
						href="/terms"
						target="_blank"
						className="underline hover:text-blue-400 font-black"
					>
						соглашение
					</Link>
					. */}
				</span>
				<Button
					size="md"
					onClick={acceptCookies}
					className="rounded-full gap-0! text-lg font-semibold"
				>
					<CookieIcon size={13} weight="bold" />K
				</Button>
			</div>
		</div>
	);
}
