"use client";

import {
	LightningIcon,
	MinusIcon,
	PlusIcon,
	ShoppingCartSimpleIcon,
} from "@phosphor-icons/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart.store";

interface AddToCartButtonProps {
	item: GroupedEquipment;
	className?: string;
	sourceRef?: React.RefObject<HTMLElement | null>;
	size?: "sm" | "md" | "lg";
	variant?: "catalog" | "details" | "icon";
	onQuickBook?: () => void;
}

// ─── Animations & Toasts (оставляем логику) ──────────────────────────────────
function flyToCart(sourceEl: HTMLElement | null, imageUrl?: string) {
	if (!sourceEl || typeof document === "undefined") return;
	const cartEl = document.querySelector<HTMLElement>("[data-cart-icon]");
	if (!cartEl) return;

	const srcRect = sourceEl.getBoundingClientRect();
	const cartRect = cartEl.getBoundingClientRect();
	const SIZE = 44;

	const ghost = document.createElement("div");
	ghost.style.cssText = `
    position:fixed;
    width:${SIZE}px;height:${SIZE}px;
    border-radius:12px;overflow:hidden;
    background:hsl(var(--primary));
    z-index:9999;pointer-events:none;
    left:${srcRect.left + srcRect.width / 2 - SIZE / 2}px;
    top:${srcRect.top + srcRect.height / 2 - SIZE / 2}px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
  `;
	if (imageUrl) {
		const img = document.createElement("img");
		img.src = imageUrl;
		img.style.cssText = "width:100%;height:100%;object-fit:cover;";
		ghost.appendChild(img);
	}
	document.body.appendChild(ghost);

	const tx = cartRect.left + cartRect.width / 2 - SIZE / 2;
	const ty = cartRect.top + cartRect.height / 2 - SIZE / 2;

	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			ghost.style.transition =
				"left .6s cubic-bezier(.4,0,.2,1), top .6s cubic-bezier(.4,0,.2,1), transform .6s ease, opacity .35s ease .28s";
			ghost.style.left = `${tx}px`;
			ghost.style.top = `${ty}px`;
			ghost.style.transform = "scale(0.2)";
			ghost.style.opacity = "0";
		})
	);

	setTimeout(() => {
		cartEl.animate(
			[
				{ transform: "scale(1)" },
				{ transform: "scale(1.4) rotate(-10deg)" },
				{ transform: "scale(0.9) rotate(5deg)" },
				{ transform: "scale(1)" },
			],
			{ duration: 400, easing: "ease-out" }
		);
	}, 550);

	setTimeout(() => ghost.remove(), 1100);
}

function showCartToast(title: string) {
	toast.success(`Добавлено: ${title}`, {
		action: {
			label: "В корзину",
			onClick: () => {
				window.location.href = "/checkout";
			},
		},
		duration: 3000,
	});
}

export function AddToCartButton({
	item,
	className,
	sourceRef,
	size = "sm",
	variant = "catalog",
	onQuickBook,
}: AddToCartButtonProps) {
	const { items, addItem, removeOne } = useCartStore();
	const cartItem = items.find((i) => i.equipment.id === item.id);
	const quantity = cartItem?.quantity || 0;
	const btnRef = useRef<HTMLButtonElement>(null);
	const [pulse, setPulse] = useState(false);

	const s = {
		sm: { h: "h-10", side: "w-6", text: "text-xs", icon: 12 },
		md: { h: "h-12", side: "w-10", text: "text-sm", icon: 14 },
		lg: { h: "h-14", side: "w-12", text: "text-base", icon: 16 },
	}[size];

	const handleAdd = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			addItem(item);
			const src = (sourceRef?.current as HTMLElement | null) ?? btnRef.current;
			flyToCart(src, item.imageUrl);
			setPulse(true);
			setTimeout(() => setPulse(false), 600);
			showCartToast(item.title);
		},
		[addItem, item, sourceRef]
	);

	const handleRemove = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			removeOne(item.id);
		},
		[removeOne, item.id]
	);

	// ── Icon Variant (Search Panel) ──────────────────────────────────────────
	if (variant === "icon") {
		const inCart = quantity > 0;
		return (
			<button
				ref={btnRef}
				type="button"
				onClick={inCart ? handleRemove : handleAdd}
				className={cn(
					"flex items-center justify-center rounded-xl transition-all active:scale-90 cursor-pointer",
					"w-9 h-9",
					inCart
						? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
						: "bg-foreground/5 text-muted-foreground hover:bg-primary/20 hover:text-foreground",
					className
				)}
			>
				<ShoppingCartSimpleIcon size={s.icon} weight="duotone" />
			</button>
		);
	}

	// ── Details Variant (Product Page) ───────────────────────────────────────
	if (variant === "details") {
		if (quantity === 0) {
			return (
				<button
					ref={btnRef}
					type="button"
					onClick={handleAdd}
					className={cn(
						"w-full flex items-center justify-center gap-2.5  min-h-12 rounded-2xl",
						"bg-primary text-primary-foreground font-black uppercase italic tracking-wider",
						"shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer",
						pulse && "scale-95 opacity-70",
						s.h,
						s.text,
						className
					)}
				>
					<ShoppingCartSimpleIcon size={s.icon + 2} weight="duotone" />
					{size === "lg" ? "Добавить в корзину" : "В корзину"}
				</button>
			);
		}

		return (
			<div className={cn("flex items-center gap-0 w-full rounded-2xl")}>
				{/* Stepper - фиксированная ширина, чтобы не «схлопывался» */}
				<div
					className={cn(
						"flex items-center bg-foreground/5 rounded-l-2xl rounded-r-md overflow-hidden shrink-0  border border-primary/20 shadow-xl shadow-primary/10",
						s.h
					)}
				>
					<button
						type="button"
						onClick={handleRemove}
						className={cn(
							"flex items-center justify-center hover:bg-foreground/20 active:scale-75 transition-all  active:rounded-2xl",
							s.side,
							s.h
						)}
					>
						<MinusIcon size="14px" />
					</button>
					<span
						className={cn(
							"flex items-center justify-center font-black min-w-0",
							s.text
						)}
					>
						{quantity}
					</span>
					<button
						type="button"
						onClick={handleAdd}
						disabled={quantity >= (item.availableCount || 99)}
						className={cn(
							"flex cursor-pointer items-center justify-center hover:bg-foreground/20 active:scale-75 transition-all",
							"disabled:opacity-20",
							s.side,
							s.h
						)}
					>
						<PlusIcon size="14px" />
					</button>
				</div>

				{/* Quick Book - тянется на всю оставшуюся ширину */}
				<Button
					type="button"
					onClick={onQuickBook}
					className={cn(
						"flex-1 flex p-1 w-full items-center justify-center gap-2.5  min-h-11  rounded-r-2xl rounded-l-md",
						"bg-primary text-primary-foreground font-black uppercase italic tracking-wider",
						"shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer",
						s.h,
						s.text
					)}
				>
					<LightningIcon
						size={s.icon}
						weight="duotone"
						className="fill-current transition-all text-primary-foreground"
					/>
					<span className="hidden md:inline text-primary-foreground">
						Оформить
					</span>
					<span className="shorthand md:hidden text-primary-foreground">
						Бронь
					</span>
				</Button>
			</div>
		);
	}

	// ── Catalog Variant (Grid Card) ──────────────────────────────────────────
	if (quantity === 0) {
		return (
			<button
				ref={btnRef}
				type="button"
				onClick={handleAdd}
				className={cn(
					"cursor-pointer w-full flex items-center justify-center gap-2 rounded-2xl px-2.5",
					"bg-primary text-primary-foreground font-bold transition-all",
					"hover:shadow-lg hover:shadow-primary/30 active:scale-95",
					s.h,
					s.text,
					className
				)}
			>
				{size === "lg" ? "Добавить" : "В корзину"}
				<ShoppingCartSimpleIcon size={s.icon + 2} weight="duotone" />
			</button>
		);
	}

	return (
		<div
			className={cn(
				"w-full flex items-center rounded-2xl overflow-hidden border border-foreground/30 bg-foreground/5",
				"animate-in fade-in zoom-in-95 duration-200",
				s.h,
				className
			)}
		>
			<button
				type="button"
				onClick={handleRemove}
				className={cn(
					"flex items-center cursor-pointer justify-center shrink-0 h-full transition-all hover:bg-foreground/10 rounded-2xl active:scale-80",
					"w-10"
				)}
			>
				<MinusIcon size={18} className="text-foreground" />
			</button>

			<span
				className={cn(
					"flex items-center justify-center flex-1 font-black text-foreground leading-none px-1",
					s.text
				)}
			>
				{quantity}
			</span>

			<button
				ref={btnRef}
				type="button"
				onClick={handleAdd}
				disabled={quantity >= (item.availableCount || 99)}
				className={cn(
					"flex items-center cursor-pointer justify-center shrink-0 h-full transition-all hover:bg-foreground/10 rounded-2xl active:scale-80",
					"disabled:opacity-20",
					"w-10",
					quantity >= (item.availableCount || 99) && "cursor-not-allowed"
				)}
			>
				<PlusIcon size={18} />
			</button>
		</div>
	);
}
