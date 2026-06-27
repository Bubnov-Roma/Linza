"use client";

import {
	CheckCircleIcon,
	LayoutIcon,
	PackageIcon,
	TagChevronIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fmtRub } from "@/lib/utils";
import { useClientNotificationsStore } from "@/store/use-client-notifications.store";

// Replace with your actual Telegram bot link
// const TG_BOT_LINK = "https://t.me/linza_bot";

interface BookingSuccessScreenProps {
	bookingId: string;
	redirectUrl?: string;
	// telegramUrl?: string;
	appliedPromoCode?: {
		code: string;
		discountAmount: number;
	} | null;
}

// ─── Конфетти-частица ─────────────────────────────────────────────────────────

function ConfettiPiece({
	color,
	delay,
	x,
}: {
	color: string;
	delay: number;
	x: number;
}) {
	return (
		<motion.div
			className="absolute top-0 w-2 h-2 rounded-sm"
			style={{ left: `${x}%`, backgroundColor: color }}
			initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
			animate={{
				y: 320,
				opacity: [1, 1, 0],
				rotate: [0, 180, 360],
				scale: [1, 1.2, 0.8],
				x: [0, Math.random() * 60 - 30],
			}}
			transition={{
				duration: 1.8 + Math.random() * 0.8,
				delay,
				ease: "easeIn",
			}}
		/>
	);
}

const CONFETTI_COLORS = [
	"#ffd106",
	"#22c55e",
	"#3b82f6",
	"#f59e0b",
	"#ec4899",
	"#8b5cf6",
];

function Confetti() {
	const pieces = Array.from({ length: 24 }, (_, i) => ({
		id: i,
		color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? "#ffd106",
		delay: i * 0.05,
		x: (i / 24) * 100,
	}));

	return (
		<div className="absolute inset-x-0 top-0 h-80 overflow-hidden pointer-events-none">
			{pieces.map((p) => (
				<ConfettiPiece key={p.id} color={p.color} delay={p.delay} x={p.x} />
			))}
		</div>
	);
}

// ─── Блок авто-промокода ──────────────────────────────────────────────────────

function AutoPromoBlock({
	code,
	discountAmount,
	type,
	value,
}: {
	code: string;
	discountAmount?: number;
	type?: string;
	value?: number;
}) {
	const [copied, setCopied] = useState(false);

	const displayDiscount =
		discountAmount && discountAmount > 0
			? `−${fmtRub(discountAmount)}`
			: type === "PERCENT" && value
				? `−${value}%`
				: null;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9, y: 20 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
			className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-linear-to-br from-green-500/10 via-emerald-500/5 to-transparent p-5"
		>
			{/* Фоновое свечение */}
			<div className="absolute inset-0 bg-linear-to-br from-green-500/5 to-transparent pointer-events-none" />

			<div className="flex items-start gap-3">
				<div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
					<TagChevronIcon
						size={20}
						weight="duotone"
						className="text-green-500"
					/>
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">
						🎁 Промокод на первый заказ
					</p>
					<p className="text-sm text-muted-foreground leading-snug mb-3">
						Ваша анкета одобрена — вам доступна скидка на первый заказ!
					</p>

					{/* Промокод */}
					<div className="flex items-center gap-2">
						<div className="flex-1 flex items-center justify-between bg-background/60 border border-green-500/20 rounded-xl px-3 py-2">
							<span className="font-mono font-black text-lg tracking-widest text-foreground">
								{code}
							</span>
							{displayDiscount && (
								<span className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">
									{displayDiscount}
								</span>
							)}
						</div>
						<button
							type="button"
							onClick={handleCopy}
							className="h-10 px-3 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 transition-colors text-xs font-bold text-green-600 dark:text-green-400 shrink-0"
						>
							{copied ? "✓ Скопирован" : "Копировать"}
						</button>
					</div>

					<p className="text-[10px] text-muted-foreground/60 mt-2">
						Применится автоматически при следующем оформлении заказа
					</p>
				</div>
			</div>
		</motion.div>
	);
}

// ─── Блок применённого промокода ──────────────────────────────────────────────

function AppliedPromoBlock({
	code,
	discountAmount,
}: {
	code: string;
	discountAmount: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.5 }}
			className="flex items-center gap-3 rounded-xl border border-green-500/25 bg-green-500/8 px-4 py-3"
		>
			<TagChevronIcon
				size={16}
				className="text-green-500 shrink-0"
				weight="duotone"
			/>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-green-700 dark:text-green-400">
					Промокод <span className="font-mono font-black">{code}</span> применён
				</p>
				<p className="text-xs text-muted-foreground mt-0.5">
					Скидка{" "}
					<span className="font-bold text-green-600">
						−{fmtRub(discountAmount)}
					</span>{" "}
					учтена в стоимости заказа
				</p>
			</div>
		</motion.div>
	);
}

// ─── Основной компонент ───────────────────────────────────────────────────────

export function BookingSuccessScreen({
	bookingId,
	redirectUrl,
	// telegramUrl = TG_BOT_LINK,
	appliedPromoCode,
}: BookingSuccessScreenProps) {
	const shortId = bookingId.split("-")[0]?.toUpperCase() ?? bookingId;
	const href = redirectUrl ?? `/dashboard/bookings/${bookingId}`;

	// Достаём авто-промокод из стора (если одобрение было раньше)
	const availableAutoPromo = useClientNotificationsStore(
		(s) => s.availableAutoPromo
	);

	// Показываем конфетти если был применён промокод или есть авто-промокод
	const showConfetti = !!(appliedPromoCode || availableAutoPromo);

	// Задержка появления контента
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4 mt-2 md:mt-10">
			<div className="relative w-full max-w-md space-y-6">
				{/* Конфетти */}
				<AnimatePresence>
					{showConfetti && mounted && <Confetti />}
				</AnimatePresence>

				{/* Иконка */}
				<motion.div
					initial={{ opacity: 0, scale: 0.5 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 20 }}
					className="flex flex-col items-center gap-4 text-center"
				>
					<div className="relative">
						<div className="absolute inset-0 blur-3xl bg-green-500/20 rounded-full scale-150 drop-shadow-xl" />
						<div className="relative bg-background rounded-full p-3 border border-green-500/20">
							<CheckCircleIcon
								size={66}
								className="text-green-500"
								weight="duotone"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<motion.h1
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter"
						>
							Заказ отправлен!
						</motion.h1>
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
							className="text-muted-foreground text-sm leading-relaxed"
						>
							Заказ на бронирование{" "}
							<span className="font-bold text-foreground">№ {shortId}</span>{" "}
							принят. Будьте на связи, мы свяжемся с вами в ближайшее время.
						</motion.p>
					</div>
				</motion.div>

				{/* Применённый промокод */}
				{appliedPromoCode && appliedPromoCode.discountAmount > 0 && (
					<AppliedPromoBlock
						code={appliedPromoCode.code}
						discountAmount={appliedPromoCode.discountAmount}
					/>
				)}

				{/* Авто-промокод на первый заказ (из стора) */}
				{availableAutoPromo && !appliedPromoCode && (
					<AutoPromoBlock
						code={availableAutoPromo.code}
						type={availableAutoPromo.type}
						value={availableAutoPromo.value}
					/>
				)}

				{/* Шаги */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
				>
					<p className="text-[10px] pl-8 font-bold uppercase tracking-widest text-muted-foreground/50">
						Что будет дальше
					</p>
					<ol className="hidden md:flex flex-col items-start gap-4 px-5 py-4 rounded-2xl border border-foreground/5 bg-card/40 space-y-2 transition-colors">
						{[
							"Проверим и подготовим всё для вашего заказа",
							"Свяжемся по телефону или email для подтверждения аренды",
							"После внесения предоплаты статус обновится на «Готов к аренде»",
						].map((step, i) => (
							<li
								key={step}
								className="flex items-start gap-3 text-sm text-muted-foreground"
							>
								<span className="shrink-0 w-5 h-5 rounded-full bg-foreground/10 text-muted-foreground text-[10px] font-bold flex items-center justify-center mt-0.5">
									{i + 1}
								</span>
								{step}
							</li>
						))}
					</ol>
				</motion.div>

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
				{/* Навигация */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.5 }}
					className="grid grid-cols-2 gap-3"
				>
					<Link
						href={href}
						className="flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border border-foreground/10 bg-secondary/50 hover:bg-foreground/5 transition-colors text-center group"
					>
						<PackageIcon
							weight="duotone"
							size={20}
							className="text-muted-foreground group-hover:text-foreground transition-colors"
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
				</motion.div>
			</div>
		</div>
	);
}
