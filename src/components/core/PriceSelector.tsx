"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type PeriodType = "h4" | "h8" | "day";

interface PriceSelectorProps {
	prices: { day: number; h4: number; h8: number };
	action?: React.ReactNode;
	variant?: "catalog" | "details";
	className?: string;
	activePeriod?: PeriodType;
	onPeriodChange?: (mode: PeriodType) => void;
}

const OPTIONS = [
	{ id: "h4" as const, labelFull: "4 часа" },
	{ id: "h8" as const, labelFull: "8 часов" },
	{ id: "day" as const, labelFull: "Сутки" },
] as const;

export function PriceSelector({
	prices,
	action,
	variant = "catalog",
	className,
	activePeriod,
	onPeriodChange,
}: PriceSelectorProps) {
	const [internalPeriod, setInternalPeriod] = useState<PeriodType>(() => {
		if (prices.h4 > 0) return "h4";
		if (prices.h8 > 0) return "h8";
		return "day";
	});
	const currentActivePeriod = activePeriod ?? internalPeriod;

	const isDetails = variant === "details";

	const handlePeriodClick = (id: PeriodType) => {
		if (onPeriodChange) {
			onPeriodChange(id);
		} else {
			setInternalPeriod(id);
		}
	};

	// Расчет бенефитов для каждой опции
	const benefits = useMemo(() => {
		const dayPrice = prices.day;
		if (!dayPrice) return {};

		return {
			h4:
				prices.h4 > 0
					? {
							percent: Math.round((1 - prices.h4 / dayPrice) * 100),
							savings: dayPrice - prices.h4,
						}
					: null,
			h8:
				prices.h8 > 0
					? {
							percent: Math.round((1 - prices.h8 / dayPrice) * 100),
							savings: dayPrice - prices.h8,
						}
					: null,
		};
	}, [prices]);

	const currentPrice = prices[currentActivePeriod].toLocaleString("ru");
	const currentBenefit =
		currentActivePeriod !== "day"
			? benefits[currentActivePeriod as "h4" | "h8"]
			: null;

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{/* ── Tabs/Pills */}
			<div className="flex p-1 gap-1 rounded-2xl bg-secondary/50 border border-foreground/5">
				{OPTIONS.map((opt) => {
					const hasPrice = prices[opt.id] > 0;
					if (!hasPrice) return null;

					const isSelected = currentActivePeriod === opt.id;
					// const benefit = opt.id !== "day" ? benefits[opt.id] : null;

					return (
						<button
							key={opt.id}
							type="button"
							onClick={() => handlePeriodClick(opt.id)}
							className={cn(
								"relative flex-1 flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-300",
								isSelected
									? "bg-background shadow-md text-foreground"
									: "text-muted-foreground hover:bg-muted-foreground/10"
							)}
						>
							<span className="text-[10px] font-bold uppercase tracking-tight">
								{opt.labelFull}
							</span>
						</button>
					);
				})}
			</div>

			{/* Динамический бенефит (MD3 Low-emphasis) */}
			{isDetails && (
				<div className="min-h-5">
					{currentBenefit ? (
						<div className="flex items-center gap-1.5 text-lime-600 dark:text-lime-400">
							<span className="text-[11px] font-bold">
								Экономия {currentBenefit.savings.toLocaleString("ru")} ₽
								относительно суток
							</span>
						</div>
					) : currentActivePeriod === "day" ? (
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<span className="text-[11px] font-medium">
								Стандартный суточный тариф
							</span>
						</div>
					) : null}
				</div>
			)}

			{/* ── Price Display ── */}
			<div
				className={cn(
					"flex items-end justify-between gap-4",
					!isDetails && "flex-col sm:flex-row items-start"
				)}
			>
				<div className="space-y-1">
					<div className="flex items-baseline gap-1.5">
						<span
							className={cn(
								"font-black tracking-tighter italic uppercase",
								isDetails ? "text-4xl" : "text-2xl"
							)}
						>
							{currentPrice}
						</span>
						<span className="text-lg font-bold text-muted-foreground italic">
							₽
						</span>
					</div>
				</div>

				{action && (
					<div
						className={cn(
							"shrink-0",
							isDetails ? "w-50 sm:w-70" : "w-full sm:w-auto"
						)}
					>
						{action}
					</div>
				)}
			</div>
		</div>
	);
}
