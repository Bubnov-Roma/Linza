"use client";

import {
	ArrowCounterClockwiseIcon,
	CheckIcon,
	PencilSimpleIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react";
import type { DiscountType } from "@prisma/client";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	createPromoCodeAction,
	deletePromoCodeAction,
	getPromoCodesAction,
	type PromoCodeItem,
	resetPromoCodeUsageAction,
	updatePromoCodeAction,
} from "@/actions/promo-code-actions";
import { ClientTime } from "@/components/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Skeleton,
	Switch,
} from "@/components/ui";
import { fmtRub } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(type: DiscountType, value: number) {
	return type === "PERCENT" ? `${value}%` : `${fmtRub(value)}`;
}

function usageColor(used: number, limit: number | null) {
	if (limit === null) return "text-muted-foreground";
	const pct = used / limit;
	if (pct >= 1) return "text-destructive font-semibold";
	if (pct >= 0.8) return "text-amber-500";
	return "text-muted-foreground";
}

// ─── PromoForm (создание / редактирование) ────────────────────────────────────

interface PromoFormState {
	code: string;
	type: DiscountType;
	value: string;
	description: string;
	isActive: boolean;
	usageLimit: string; // "" = безлимит
	validFrom: string; // "YYYY-MM-DD" или ""
	validUntil: string;
}

const EMPTY_FORM: PromoFormState = {
	code: "",
	type: "PERCENT",
	value: "",
	description: "",
	isActive: true,
	usageLimit: "",
	validFrom: "",
	validUntil: "",
};

function PromoForm({
	initial,
	onSave,
	onCancel,
	isPending,
}: {
	initial?: PromoFormState;
	onSave: (data: PromoFormState) => void;
	onCancel: () => void;
	isPending: boolean;
}) {
	const [form, setForm] = useState<PromoFormState>(initial ?? EMPTY_FORM);
	const set = <K extends keyof PromoFormState>(k: K, v: PromoFormState[K]) =>
		setForm((prev) => ({ ...prev, [k]: v }));

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label className="text-xs">Кодовое слово *</Label>
					<Input
						placeholder="SUMMER26"
						value={form.code}
						onChange={(e) => set("code", e.target.value.toUpperCase())}
						disabled={isPending}
						className="uppercase glass-input"
					/>
				</div>
				<div className="space-y-1.5">
					<Label className="text-xs">
						Значение {form.type === "PERCENT" ? "(%)" : "(₽)"} *
					</Label>
					<Input
						type="number"
						min={1}
						max={form.type === "PERCENT" ? 100 : undefined}
						placeholder={form.type === "PERCENT" ? "10" : "500"}
						value={form.value}
						onChange={(e) => set("value", e.target.value)}
						disabled={isPending}
						className="glass-input"
					/>
				</div>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label className="text-xs">Тип скидки *</Label>
					<Select
						value={form.type}
						onValueChange={(v) => set("type", v as DiscountType)}
						disabled={isPending}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="PERCENT">Процент (%)</SelectItem>
							<SelectItem value="FIXED">Фиксированная (₽)</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1.5">
					<Label className="text-xs">Лимит активаций (пусто = ∞)</Label>
					<Input
						type="number"
						min={1}
						placeholder="∞"
						value={form.usageLimit}
						onChange={(e) => set("usageLimit", e.target.value)}
						disabled={isPending}
						className="glass-input"
					/>
				</div>
			</div>
			{/* Описание */}
			<div className="space-y-1.5">
				<Label className="text-xs">Описание (для администраторов)</Label>
				<Input
					placeholder="Летняя акция 2025"
					value={form.description}
					onChange={(e) => set("description", e.target.value)}
					disabled={isPending}
					className="glass-input"
				/>
			</div>
			{/* Лимит + Даты */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div className="space-y-1.5">
					<Label className="text-xs">Действует с</Label>
					<Input
						type="date"
						value={form.validFrom}
						onChange={(e) => set("validFrom", e.target.value)}
						disabled={isPending}
						className="glass-input"
					/>
				</div>
				<div className="space-y-1.5">
					<Label className="text-xs">Действует по</Label>
					<Input
						type="date"
						value={form.validUntil}
						onChange={(e) => set("validUntil", e.target.value)}
						disabled={isPending}
						className="glass-input"
					/>
				</div>
			</div>
			{/* Кнопки */}
			<div className="flex items-center gap-2 pt-1">
				<Button
					type="button"
					size="sm"
					onClick={() => onSave(form)}
					disabled={isPending}
					className="flex-1"
				>
					<CheckIcon size={13} className="mr-1.5" />
					Сохранить
				</Button>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={onCancel}
					disabled={isPending}
					className="flex-1"
				>
					<XIcon size={13} className="mr-1.5" />
					Отмена
				</Button>
			</div>
			<Separator />
		</div>
	);
}

// ─── PromoRow ──────────────────────────────────────────────────────────────────

function PromoRow({
	promo,
	onChanged,
}: {
	promo: PromoCodeItem;
	onChanged: () => void;
}) {
	const [editing, setEditing] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleSave = (form: PromoFormState) => {
		const value = parseFloat(form.value);
		if (!form.code || Number.isNaN(value)) {
			toast.error("Заполните обязательные поля");
			return;
		}
		startTransition(async () => {
			const res = await updatePromoCodeAction(promo.id, {
				code: form.code,
				type: form.type,
				value,
				description: form.description || null,
				isActive: form.isActive,
				usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
				validFrom: form.validFrom || null,
				validUntil: form.validUntil || null,
			});
			if (res.success) {
				toast.success("Промокод обновлён");
				setEditing(false);
				onChanged();
			} else {
				toast.error(res.error ?? "Ошибка");
			}
		});
	};

	const handleDelete = () => {
		startTransition(async () => {
			const res = await deletePromoCodeAction(promo.id);
			if (res.success) {
				toast.success("Промокод удалён");
				onChanged();
			} else {
				toast.error(res.error ?? "Ошибка");
			}
		});
	};

	const handleReset = () => {
		startTransition(async () => {
			const res = await resetPromoCodeUsageAction(promo.id);
			if (res.success) {
				toast.success("Счётчик сброшен");
				onChanged();
			} else {
				toast.error(res.error ?? "Ошибка");
			}
		});
	};

	const handleToggle = () => {
		startTransition(async () => {
			const res = await updatePromoCodeAction(promo.id, {
				isActive: !promo.isActive,
			});
			if (res.success) onChanged();
			else toast.error(res.error ?? "Ошибка");
		});
	};

	if (editing) {
		const initial: PromoFormState = {
			code: promo.code,
			type: promo.type,
			value: String(promo.value),
			description: promo.description ?? "",
			isActive: promo.isActive,
			usageLimit: promo.usageLimit !== null ? String(promo.usageLimit) : "",
			validFrom: promo.validFrom ? promo.validFrom.slice(0, 10) : "",
			validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : "",
		};
		return (
			<PromoForm
				initial={initial}
				onSave={handleSave}
				onCancel={() => setEditing(false)}
				isPending={isPending}
			/>
		);
	}

	return (
		<div className="flex gap-3 rounded-xl border border-foreground/10 p-3.5">
			{/* Инфо */}
			<div className="flex-1 min-w-0 space-y-1.5">
				<div className="flex items-center gap-2 flex-wrap">
					<span className="font-mono font-bold text-sm tracking-wide">
						{promo.code}
					</span>
					<Badge
						variant="outline"
						className={
							promo.type === "PERCENT"
								? "border-blue-500/30 text-blue-600 bg-blue-500/5"
								: "border-green-500/30 text-green-600 bg-green-500/5"
						}
					>
						{formatValue(promo.type, promo.value)}
					</Badge>
				</div>

				{promo.description && (
					<p className="text-xs text-muted-foreground">{promo.description}</p>
				)}

				<div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
					<span className={usageColor(promo.usedCount, promo.usageLimit)}>
						Использован: {promo.usedCount}
						{promo.usageLimit !== null ? ` / ${promo.usageLimit}` : " / ∞"}
					</span>
					{(promo.validFrom || promo.validUntil) && (
						<span className="flex items-center gap-1">
							{promo.validFrom ? (
								<ClientTime iso={promo.validFrom} fmt="date" />
							) : (
								"-"
							)}
							<span>-</span>
							{promo.validUntil ? (
								<ClientTime iso={promo.validUntil} fmt="date" />
							) : (
								"—"
							)}
						</span>
					)}
					{promo.creatorName && <span>Создан: {promo.creatorName}</span>}
				</div>
			</div>

			<div className="flex flex-col justify-between h-100% items-end">
				{/* Кнопки */}
				<div className="flex items-center gap-1 shrink-0">
					<Button
						type="button"
						size="icon"
						variant="ghost"
						className="h-7 w-7"
						onClick={handleReset}
						disabled={isPending || promo.usedCount === 0}
						title="Сбросить счётчик"
					>
						<ArrowCounterClockwiseIcon size={13} />
					</Button>
					<Button
						type="button"
						size="icon"
						variant="ghost"
						className="h-7 w-7"
						onClick={() => setEditing(true)}
						disabled={isPending}
						title="Редактировать"
					>
						<PencilSimpleIcon size={13} />
					</Button>
					<Button
						type="button"
						size="icon"
						variant="ghost"
						className="h-7 w-7 text-destructive hover:text-destructive"
						onClick={handleDelete}
						disabled={isPending}
						title="Удалить"
					>
						<TrashIcon size={13} />
					</Button>
				</div>
				<div className="flex flex-col gap-2 items-end">
					<Badge variant="outline" className="text-muted-foreground text-xs">
						{!promo.isActive ? "Неактивен" : "Активен"}
					</Badge>
					<Switch
						checked={promo.isActive}
						onCheckedChange={handleToggle}
						disabled={isPending}
						className="mt-auto shrink-0"
					/>
				</div>
			</div>
		</div>
	);
}

// ─── PromoCodesSection ────────────────────────────────────────────────────────

export function PromoCodesSection() {
	const [promos, setPromos] = useState<PromoCodeItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [isPending, startTransition] = useTransition();

	const reload = async () => {
		setLoading(true);
		const res = await getPromoCodesAction();
		if (res.success && res.data) setPromos(res.data);
		setLoading(false);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <>
	useEffect(() => {
		reload();
	}, []);

	const handleCreate = (form: PromoFormState) => {
		const value = parseFloat(form.value);
		if (!form.code || Number.isNaN(value)) {
			toast.error("Заполните обязательные поля");
			return;
		}
		startTransition(async () => {
			const res = await createPromoCodeAction({
				code: form.code,
				type: form.type,
				value,
				description: form.description || "",
				isActive: form.isActive,
				usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
				validFrom: form.validFrom || null,
				validUntil: form.validUntil || null,
			});
			if (res.success) {
				toast.success(`Промокод ${form.code} создан`);
				setShowForm(false);
				reload();
			} else {
				toast.error(res.error ?? "Ошибка");
			}
		});
	};

	const active = promos.filter((p) => p.isActive).length;
	const total = promos.length;

	return (
		<Card className="py-6 lg:col-span-2">
			<div className="flex items-baseline justify-between w-100% px-6">
				{!showForm ? (
					<div className="flex w-full justify-between ">
						<div>
							<CardTitle className="flex items-start gap-2">
								Промокоды
							</CardTitle>
							<CardDescription>
								<span className="ml-1">
									Активных: {total > 0 ? `${active} из ${total}` : "нет"}
								</span>
							</CardDescription>
						</div>

						<Button
							type="button"
							size="md"
							variant="outline"
							onClick={() => setShowForm(true)}
							className="shrink-0"
						>
							<PlusIcon size={13} />
							Добавить
						</Button>
					</div>
				) : (
					<>
						<CardTitle className="flex items-start gap-2">
							Новый промокод
						</CardTitle>
						<Button
							type="button"
							size="icon"
							variant="ghost"
							onClick={() => setShowForm(false)}
							className="shrink-0"
						>
							<XIcon size={10} />
						</Button>
					</>
				)}
			</div>

			<CardContent>
				{/* Форма создания */}
				{showForm && (
					<PromoForm
						onSave={handleCreate}
						onCancel={() => setShowForm(false)}
						isPending={isPending}
					/>
				)}

				{/* Список */}
				{loading ? (
					<Skeleton className="w-full h-26 mt-4" />
				) : (
					promos.length !== 0 && (
						<div className="space-y-2 mt-4">
							{promos.map((p) => (
								<PromoRow key={p.id} promo={p} onChanged={reload} />
							))}
						</div>
					)
				)}
			</CardContent>
		</Card>
	);
}
