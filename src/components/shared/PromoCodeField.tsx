"use client";

import { TagChevronIcon, XIcon } from "@phosphor-icons/react";
import type { DiscountType } from "@prisma/client";
import { useTransition } from "react";
import { validatePromoCodeAction } from "@/actions/promo-code-actions";
import { cn, fmtRub } from "@/lib/utils";

export interface AppliedPromo {
	code: string;
	type: DiscountType;
	value: number;
}

/**
 * Вычислить итоговую цену с учётом промокода.
 * Вызывается как в компоненте, так и в местах сабмита.
 */
export function applyPromoDiscount(
	originalPrice: number,
	promo: AppliedPromo | null
): { finalPrice: number; discountAmount: number } {
	if (!promo || originalPrice <= 0) {
		return { finalPrice: originalPrice, discountAmount: 0 };
	}
	const discount =
		promo.type === "PERCENT"
			? (originalPrice * promo.value) / 100
			: Math.min(promo.value, originalPrice);
	const discountAmount = Math.round(discount * 100) / 100;
	const finalPrice = Math.max(0, originalPrice - discountAmount);
	return { finalPrice, discountAmount };
}

// ─── Компонент ────────────────────────────────────────────────────────────────

interface PromoCodeFieldProps {
	appliedPromo: AppliedPromo | null;
	onApply: (promo: AppliedPromo) => void;
	onRemove: () => void;
	originalPrice: number;
	className?: string;
}

export function PromoCodeField({
	appliedPromo,
	onApply,
	onRemove,
	originalPrice,
	className,
}: PromoCodeFieldProps) {
	const [isPending, startTransition] = useTransition();

	// Локальный стейт для черновика кода — через неконтролируемый input
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			const val = (e.target as HTMLInputElement).value.trim();
			if (val) handleApply(val, e.target as HTMLInputElement);
		}
	};

	const handleApply = (code: string, inputEl?: HTMLInputElement | null) => {
		if (!code.trim()) return;
		startTransition(async () => {
			const res = await validatePromoCodeAction(code.trim());
			if (res.success && res.type !== undefined && res.value !== undefined) {
				onApply({
					code: code.trim().toUpperCase(),
					type: res.type,
					value: res.value,
				});
				if (inputEl) inputEl.value = "";
			} else {
				// Показываем ошибку через aria-live — не тянем toast зависимость в shared
				const errEl = inputEl
					?.closest("[data-promo-root]")
					?.querySelector("[data-promo-error]");
				if (errEl) {
					errEl.textContent = res.error ?? "Промокод не найден";
					setTimeout(() => {
						errEl.textContent = "";
					}, 3000);
				}
			}
		});
	};

	const { discountAmount, finalPrice } = applyPromoDiscount(
		originalPrice,
		appliedPromo
	);

	if (appliedPromo) {
		return (
			<div
				data-promo-root
				className={cn(
					"flex items-center justify-between gap-3 rounded-xl",
					"border border-green-500/30 bg-green-500/8 px-4 py-3",
					className
				)}
			>
				<div className="flex items-center gap-2 min-w-0">
					<TagChevronIcon size={14} className="text-green-600 shrink-0" />
					<div className="min-w-0">
						<p className="text-sm font-bold font-mono text-green-700 dark:text-green-400 truncate">
							{appliedPromo.code}
						</p>
						<p className="text-xs text-muted-foreground">
							{appliedPromo.type === "PERCENT"
								? `Скидка ${appliedPromo.value}%`
								: `Скидка ${fmtRub(appliedPromo.value)}`}
							{" · "}
							<span className="text-green-600 font-semibold">
								−{fmtRub(discountAmount)}
							</span>
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3 shrink-0">
					<span className="text-lg font-black italic tabular-nums">
						{fmtRub(Math.round(finalPrice))}
					</span>
					<button
						type="button"
						onClick={onRemove}
						className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/8 transition-colors"
						title="Убрать промокод"
					>
						<XIcon size={14} />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div data-promo-root className={cn("space-y-1.5", className)}>
			<div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/3 overflow-hidden pr-1 focus-within:border-primary/40 transition-colors">
				<TagChevronIcon
					size={14}
					className="ml-3 text-muted-foreground/50 shrink-0"
				/>
				<input
					type="text"
					placeholder="Промокод"
					disabled={isPending}
					onKeyDown={handleKeyDown}
					className={cn(
						"flex-1 bg-transparent text-sm py-2.5 outline-none",
						"placeholder:text-muted-foreground/40 uppercase font-mono",
						"disabled:opacity-50"
					)}
					onChange={(e) => {
						e.target.value = e.target.value.toUpperCase();
					}}
					onBlur={(e) => {
						const val = e.target.value.trim();
						if (val) handleApply(val, e.target);
					}}
				/>
				<button
					type="button"
					disabled={isPending}
					onClick={(e) => {
						const input = (e.currentTarget as HTMLElement)
							.closest("[data-promo-root]")
							?.querySelector("input") as HTMLInputElement | null;
						const val = input?.value.trim() ?? "";
						if (val) handleApply(val, input);
					}}
					className={cn(
						"px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0",
						"bg-foreground/8 hover:bg-foreground/15 disabled:opacity-40"
					)}
				>
					{isPending ? (
						<span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
					) : (
						"Применить"
					)}
				</button>
			</div>
			<p
				data-promo-error
				aria-live="polite"
				className="text-xs text-destructive min-h-4 px-1"
			/>
		</div>
	);
}
