"use client";

import {
	CheckCircleIcon,
	LayoutIcon,
	PackageIcon,
} from "@phosphor-icons/react";
import Link from "next/link";

// Replace with your actual Telegram bot link
// const TG_BOT_LINK = "https://t.me/linza_bot";

interface BookingSuccessScreenProps {
	bookingId: string;
	/** Pass server-loaded telegram url if you have it */
	telegramUrl?: string;
	redirectUrl?: string;
}

export function BookingSuccessScreen({
	bookingId,
	// telegramUrl = TG_BOT_LINK,
	redirectUrl = `/dashboard/bookings/${bookingId}`,
}: BookingSuccessScreenProps) {
	const shortId = bookingId.split("-")[0]?.toUpperCase() ?? bookingId;

	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4 mt-2 md:mt-10">
			<div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
				{/* ── Icon ── */}
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="relative">
						<div className="absolute inset-0 blur-3xl bg-green-500/20 rounded-full scale-150 drop-shadow-xl drop-shadow-green-500" />
						<div className="relative bg-background rounded-full p-3 border border-green-500/20">
							<CheckCircleIcon
								size={66}
								className="text-green-500"
								weight="duotone"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter">
							Заказ отправлен!
						</h1>
						<h2 className="text-muted-foreground text-sm leading-relaxed">
							Заказ на бронирование{" "}
							<span className="font-bold text-foreground">№ {shortId}</span>{" "}
							принят.
						</h2>
						<p className="text-muted-foreground text-sm leading-relaxed">
							Будьте на связи, мы свяжется с вами в ближайшее время.
						</p>
					</div>
				</div>

				{/* ── What's next hint ── */}
				<div>
					<p className="text-[10px] pl-8 font-bold uppercase tracking-widest text-muted-foreground/50">
						Что будет дальше
					</p>
					<ol className="hidden md:flex flex-col items-start gap-4 px-5 py-4 rounded-2xl border border-foreground/5 bg-card/40 space-y-2 transition-colors group">
						{[
							"Проверим и подготовим всё для вашего заказа",
							"Свяжемся по телефону или email для подтверждения аренды",
							"После внесения предоплаты статус обновиься на 'Готов к аренде'",
						].map((step, i) => (
							<li
								key={`${step}` + `${i}`}
								className="flex items-start gap-3 text-sm text-muted-foreground"
							>
								<span className="shrink-0 w-5 h-5 rounded-full bg-foreground/10 text-muted-foreground text-[10px] font-bold flex items-center justify-center mt-0.5">
									{i + 1}
								</span>
								{step}
							</li>
						))}
					</ol>
				</div>

				{/* ── Telegram Bot CTA ── */}
				{/* <a
					href={telegramUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-6 px-5 py-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 transition-colors group"
				>
					<div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
						<Send size={20} className="text-sky-400" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold">
							Подключите Telegram-уведомления
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							и получайте статусы заказа прямо в мессенджер
						</p>
					</div>
				</a> */}

				{/* ── Navigation buttons ── */}
				<div className="grid grid-cols-2 gap-3">
					<Link
						href={redirectUrl}
						className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border border-foreground/10 bg-secondary/50 hover:bg-foreground/5 transition-colors text-center group"
					>
						<PackageIcon
							weight="duotone"
							size={20}
							className="text-muted-foreground group-hover:text-foreground not-odd:transition-colors"
						/>
						<span className="text-xs font-semibold">К заказу</span>
					</Link>

					<Link
						href="/dashboard"
						className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border border-foreground/10 bg-secondary/50 hover:bg-foreground/5 transition-colors text-center group"
					>
						<LayoutIcon
							weight="duotone"
							size={20}
							className="text-muted-foreground group-hover:text-foreground transition-colors"
						/>
						<span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
							В личный кабинет
						</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
