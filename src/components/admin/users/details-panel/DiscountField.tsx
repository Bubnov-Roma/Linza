import {
	Badge,
	Button,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import { cn, fmtRub } from "@/lib/utils";

export type CurrentDiscount = {
	type: string;
	value: number;
	promoCode: string | null;
} | null;

export type DiscountType = "PERCENT" | "FIXED" | "PROMO";

export interface DiscountFieldProps {
	currentDiscount?: CurrentDiscount;
	discountType: DiscountType;
	setDiscountType: (value: DiscountType) => void;
	discountValue: string;
	setDiscountValue: (value: string) => void;
	discountDesc: string;
	setDiscountDesc: (value: string) => void;
	promoCode: string;
	setPromoCode: (value: string) => void;
	handleAddDiscount: () => void;
	isPending: boolean;
}

export function DiscountField({
	currentDiscount,
	discountType,
	setDiscountType,
	discountValue,
	setDiscountValue,
	discountDesc,
	setDiscountDesc,
	promoCode,
	setPromoCode,
	handleAddDiscount,
	isPending,
}: DiscountFieldProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Badge
					variant="outline"
					className={cn(
						"text-[10px] font-bold",
						currentDiscount && currentDiscount.value !== 0
							? "text-primary-accent border-primary/30 bg-primary/5"
							: "text-foreground border-muted-foreground/30 bg-muted-foreground/5"
					)}
				>
					{currentDiscount && currentDiscount.value !== 0
						? currentDiscount.type === "PERCENT"
							? `Скидка ${currentDiscount.value}%`
							: currentDiscount.type === "FIXED"
								? `Скидка ${fmtRub(currentDiscount.value)}`
								: `ПРОМО: ${currentDiscount.promoCode}`
						: `Назначить скидку`}
				</Badge>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-72 p-4 space-y-3 bg-background/80 backdrop-blur-2xl border-0 shadow-2xl shadow-muted-foreground/30"
			>
				<p className="text-xs font-bold uppercase text-muted-foreground">
					Персональная скидка
				</p>
				<div className="grid grid-cols-2 gap-2">
					<Select
						value={discountType}
						onValueChange={(v) =>
							setDiscountType(v as "PERCENT" | "FIXED" | "PROMO")
						}
					>
						<SelectTrigger className="h-8 text-xs">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="PERCENT">% от суммы</SelectItem>
							<SelectItem value="FIXED">Фикс. ₽</SelectItem>
							<SelectItem value="PROMO">Промокод</SelectItem>
						</SelectContent>
					</Select>
					<Input
						value={discountValue}
						onChange={(e) => setDiscountValue(e.target.value)}
						placeholder={discountType === "PERCENT" ? "10" : "500"}
						type="number"
						className="h-8 text-xs"
					/>
				</div>
				{discountType === "PROMO" && (
					<Input
						value={promoCode}
						onChange={(e) => setPromoCode(e.target.value)}
						placeholder="PROMO2026"
						className="h-8 text-xs uppercase"
					/>
				)}
				<Input
					value={discountDesc}
					onChange={(e) => setDiscountDesc(e.target.value)}
					placeholder="Комментарий (опционально)"
					className="h-8 text-xs"
				/>
				<Button
					size="sm"
					className="w-full h-8"
					onClick={handleAddDiscount}
					disabled={!discountValue || isPending}
				>
					Сохранить
				</Button>
			</PopoverContent>
		</Popover>
	);
}
