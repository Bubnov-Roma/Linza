"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import {
	EnvelopeSimpleIcon,
	HeadsetIcon,
	MapPinIcon,
	PaperPlaneRightIcon,
	PhoneIcon,
	TelegramLogoIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendSupportEmailAction } from "@/actions/auth-actions";
import { ValidatedInput } from "@/components/forms";
import { VkLogoIcon } from "@/components/icons";
import { Input, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import type { SupportInfo } from "@/constants";
import { emailSchema } from "@/schemas";

interface ContactsClientViewProps {
	supportInfo: SupportInfo;
}

export default function ContactsClientView({
	supportInfo,
}: ContactsClientViewProps) {
	const [isPending, startTransition] = useTransition();

	// Стейты формы
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [turnstileToken, setTurnstileToken] = useState("");
	const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!turnstileToken) {
			toast.error("Пожалуйста, дождитесь завершения проверки безопасности");
			return;
		}

		const result = emailSchema.safeParse(email);
		if (!result.success && result.error.issues[0]) {
			setError(result.error.issues[0].message);
			return;
		}

		if (!message.trim()) {
			toast.error("Напишите сообщение");
			return;
		}

		if (!email.trim()) {
			toast.error("Укажите контакт для обратной связи");
			return;
		}

		startTransition(async () => {
			const result = await sendSupportEmailAction({
				name: name.trim(),
				email: email.trim(),
				message: message.trim(),
				turnstileToken,
			});

			if (!result.success) {
				toast.error(result.error || "Ошибка отправки писmма");
				return;
			}

			toast.success(
				"Сообщение успешно отправлено! Мы ответим вам на указанный Email."
			);

			// Очищаем форму
			setError("");
			setName("");
			setEmail("");
			setMessage("");
			setTurnstileToken("");
		});
	};

	return (
		<div className="container mx-auto px-4 max-w-6xl space-y-10">
			{/* ЗАГОЛОВОК */}
			<div className="space-y-4 max-w-2xl">
				<h1 className="text-5xl sm:text-6xl font-black uppercase italic text-foreground tracking-tighter leading-[0.9]">
					Контакты
				</h1>
				<p className="text-md md:text-lg font-bold text-muted-foreground/80 tracking-wide select-none">
					LINZA RENTAL на связи{" "}
					<HeadsetIcon className="inline-flex" weight="bold" />
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
				{/* ─── ЛЕВАЯ КОЛОНКА (Инфо + Форма) ─── */}
				<div className="lg:col-span-5 flex flex-col gap-8">
					{/* КАРТОЧКИ КОНТАКТОВ */}
					<div className="grid grid-cols-1 gap-4">
						{/* Адрес */}
						<div className="group flex items-center gap-4 p-5 border border-foreground/5 rounded-2xl backdrop-blur-lg bg-foreground/5 hover:border-primary/20 transition-all duration-300">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl bg-background/80 backdrop-blur-md border border-foreground/5 text-foreground transition-all shadow-xs">
									<MapPinIcon size={18} weight="duotone" />
								</div>
							</div>
							<p className="text-sm font-medium text-foreground leading-snug">
								{supportInfo.address || "Самара, ул. Чапаевская, 203А"}
							</p>
						</div>

						{/* Телефон */}
						<Link
							href={`tel:${supportInfo.phone}`}
							className="group flex items-center gap-4 p-5 border border-foreground/5 rounded-2xl backdrop-blur-lg bg-foreground/5 hover:border-primary/20 transition-all duration-300"
						>
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl bg-background/80 backdrop-blur-md border border-foreground/5 text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-xs">
									<PhoneIcon size={18} weight="duotone" />
								</div>
							</div>
							<p className="text-sm font-medium text-foreground group-hover:text-primary-accent transition-colors">
								{supportInfo.phone}
							</p>
						</Link>

						{/* Соцсети в ряд */}
						<div className="grid grid-cols-3 gap-3">
							<Link
								href={supportInfo.telegram}
								target="_blank"
								className="group flex flex-col items-center justify-center p-4 border border-foreground/5 rounded-2xl backdrop-blur-lg bg-foreground/5 hover:border-[#2AABEE]/20 hover:bg-[#2AABEE]/5 transition-all duration-300 text-center"
							>
								<TelegramLogoIcon
									size={24}
									weight="fill"
									className="text-foreground/80 group-hover:text-[#2AABEE] mb-1 transition-colors"
								/>
								<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
									Telegram
								</span>
							</Link>
							<Link
								href={`mailto:${supportInfo.email}`}
								className="group flex flex-col items-center justify-center p-4 border border-foreground/5 rounded-2xl backdrop-blur-lg bg-foreground/5 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all duration-300 text-center"
							>
								<EnvelopeSimpleIcon
									size={24}
									weight="fill"
									className="text-foreground/80 group-hover:text-emerald-500 mb-1 transition-colors"
								/>
								<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
									Email
								</span>
							</Link>
							<Link
								href={supportInfo.vk}
								target="_blank"
								className="group flex flex-col items-center justify-center p-4 border border-foreground/5 rounded-2xl backdrop-blur-lg bg-foreground/5 hover:border-[#0077FF]/20 hover:bg-[#0077FF]/5 transition-all duration-300 text-center"
							>
								{/* Теперь size и weight прокидываются без TS ошибок! */}
								<VkLogoIcon
									size={24}
									weight="fill"
									className="text-foreground/80 group-hover:text-[#0077FF] mb-1 transition-colors"
								/>
								<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
									ВКонтакте
								</span>
							</Link>
						</div>
					</div>

					{/* ФОРМА ОБРАТНОЙ СВЯЗИ */}
					<div className="p-6 sm:p-8 border border-foreground/5 rounded-[32px] backdrop-blur-lg bg-foreground/5 relative overflow-hidden">
						<div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />

						<h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-4">
							Форма обратной связи
						</h3>

						<form onSubmit={handleSubmit} className="space-y-4 relative z-10">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Input
									type="text"
									placeholder="Ваше имя"
									value={name}
									onChange={(e) => setName(e.target.value)}
									disabled={isPending}
									className="mt-2 glass-input text-sm font-bold bg-background/50 border border-foreground/10 rounded-xl px-4 py-3.5 w-full focus:outline-none focus:border-primary/50 focus:bg-background transition-all placeholder:text-muted-foreground/60 placeholder:font-medium disabled:opacity-50"
								/>
								<ValidatedInput
									label=""
									type="email"
									placeholder="Ваш Email"
									disabled={isPending}
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									error={error ?? ""}
									className="text-sm font-bold bg-background/50 border border-foreground/10 rounded-xl px-4 py-3.5 w-full focus:outline-none focus:border-primary/50 focus:bg-background transition-all placeholder:text-muted-foreground/60 placeholder:font-medium disabled:opacity-50"
								/>
							</div>
							<Textarea
								placeholder="Ваше сообщение..."
								rows={4}
								required
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								disabled={isPending}
								className="text-sm font-bold bg-background/50 border border-foreground/10 rounded-xl px-4 py-3.5 w-full focus:outline-none focus:border-primary/50 focus:bg-background transition-colors placeholder:text-muted-foreground/60 placeholder:font-medium resize-none disabled:opacity-50"
							/>
							{/* Cloudflare Turnstile */}
							<div className="flex flex-col items-center justify-center min-h-16.25 pt-2">
								{!isWidgetLoaded && (
									<p className="text-xs text-muted-foreground animate-pulse mb-2">
										Проверка безопасности...
									</p>
								)}
								{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
									<Turnstile
										siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
										onWidgetLoad={() => setIsWidgetLoaded(true)}
										onSuccess={(token) => setTurnstileToken(token)}
										options={{ theme: "auto" }}
									/>
								)}
							</div>
							<Button
								type="submit"
								disabled={isPending || !message.trim() || !turnstileToken}
								className="w-full rounded-full text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 gap-2 py-6 italic transition-all"
							>
								{isPending ? "Отправка..." : "Отправить сообщение"}
								{!isPending && <PaperPlaneRightIcon size={16} weight="bold" />}
							</Button>
						</form>
					</div>
				</div>

				{/* ─── ПРАВАЯ КОЛОНКА (Карта) ─── */}
				<div className="lg:col-span-7 w-full h-full min-h-108 lg:min-h-full">
					{/* Обертка с вашими стилями инверсии для карты */}
					<div className="relative w-full h-full rounded-[32px] overflow-hidden border border-foreground/5 shadow-xs">
						{/* Используем OID карточки Linza в Яндекс.Картах */}
						<iframe
							src="https://yandex.ru/map-widget/v1/?ll=50.103535%2C53.199654&z=17&mode=search&oid=151843648628&ol=biz"
							title="Linza на Яндекс Карте"
							width="100%"
							height="100%"
							style={{ border: 0 }}
							allowFullScreen={true}
							loading="lazy"
							referrerPolicy="strict-origin-when-cross-origin"
							className="absolute inset-0 w-full h-full dark:invert contrast-90 transition-all duration-500"
						/>
						{/* Визуальная рамка-оверлей (убирает резкие края iframe) */}
						<div className="absolute inset-0 pointer-events-none rounded-[32px] ring-1 ring-inset ring-foreground/10 z-10" />
					</div>
				</div>
			</div>
		</div>
	);
}
