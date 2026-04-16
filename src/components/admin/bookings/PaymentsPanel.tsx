"use client";

import {
	ArrowClockwiseIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	BankIcon,
	HandCoinsIcon,
	PlusIcon,
	TrashIcon,
	VaultIcon,
	WalletIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deleteBookingPaymentAction,
	getBookingPaymentsAction,
	type RecordPaymentPayload,
	recordBookingPaymentAction,
} from "@/actions/admin-booking-actions";
import { refundToBalanceAction } from "@/actions/audit-and-balance-actions";
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@/components/ui";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PAYMENT_METHOD_LABELS } from "@/constants";
import type {
	BookingPaymentRow,
	BookingStatus,
	PaymentMethod,
	PaymentStatus,
} from "@/core/domain/entities/Booking";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";

// ─── Payment status config ────────────────────────────────────────────────────

const PAYMENT_STATUS_CONFIG: Record<
	PaymentStatus,
	{ label: string; color: string; dot: string; bar: string }
> = {
	UNPAID: {
		label: "Не оплачен",
		color: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
		dot: "bg-red-500",
		bar: "bg-red-500",
	},
	PARTIAL: {
		label: "Частично оплачен",
		color:
			"bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
		dot: "bg-amber-500",
		bar: "bg-amber-500",
	},
	PAID: {
		label: "Полностью оплачен",
		color:
			"bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
		dot: "bg-green-500",
		bar: "bg-green-500",
	},
	OVERPAID: {
		label: "Переплата",
		color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
		dot: "bg-blue-500",
		bar: "bg-blue-500",
	},
};

export type { PaymentStatus };
export { PAYMENT_STATUS_CONFIG };

// ─── Op types ─────────────────────────────────────────────────────────────────

type PaymentOpType = RecordPaymentPayload["type"];

const OP_TYPE_LABELS: Record<PaymentOpType, string> = {
	PAYMENT: "Аренда",
	DEPOSIT: "Залог",
	OTHER: "Прочее",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRub(n: number): string {
	return `${n.toLocaleString("ru-RU")} ₽`;
}

function fmtDate(iso: string): string {
	return new Date(iso).toLocaleString("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentsPanelProps {
	bookingId: string;
	totalAmount: number;
	currentStatus: BookingStatus;
	totalDeposit: number;
	userId: string;
	/** Баланс клиента — передаётся снаружи для отображения */
	userBalance?: number;
	onStatusChangeNeeded?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentsPanel({
	bookingId,
	totalAmount,
	currentStatus,
	totalDeposit,
	userId,
	userBalance = 0,
	onStatusChangeNeeded,
}: PaymentsPanelProps) {
	const { profile } = useAuth();
	const isAdmin = profile?.role === "ADMIN" || profile?.role === "MANAGER";

	// ── State ──────────────────────────────────────────────────────────────────
	const [payments, setPayments] = useState<BookingPaymentRow[]>([]);
	const [totalPaid, setTotalPaid] = useState(0);
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
	const [isLoading, setIsLoading] = useState(true);

	// ── Add form ───────────────────────────────────────────────────────────────
	const [showAddForm, setShowAddForm] = useState(false);
	const [isExpense, setIsExpense] = useState(false);
	const [opType, setOpType] = useState<PaymentOpType>("PAYMENT");
	const [newAmount, setNewAmount] = useState("");
	const [newMethod, setNewMethod] = useState<PaymentMethod>("CASH");
	const [newNote, setNewNote] = useState("");
	const [isSaving, startSaving] = useTransition();

	// ── Delete confirm ─────────────────────────────────────────────────────────
	const [deleteTarget, setDeleteTarget] = useState<BookingPaymentRow | null>(
		null
	);
	const [isDeleting, startDelete] = useTransition();

	// ── Refund ─────────────────────────────────────────────────────────────────
	const [isRefunding, startRefundTransition] = useTransition();

	// ── Status reminder ────────────────────────────────────────────────────────
	const [showStatusAlert, setShowStatusAlert] = useState(false);

	// ── Derived ────────────────────────────────────────────────────────────────
	const remaining = totalAmount - totalPaid;
	const isOverpaid = totalPaid > totalAmount;
	const overpaidAmount = Math.max(0, totalPaid - totalAmount);
	const psCfg = PAYMENT_STATUS_CONFIG[paymentStatus];
	const progressPct = Math.min(
		100,
		totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0
	);

	// ── Load ───────────────────────────────────────────────────────────────────
	const loadPayments = useCallback(async () => {
		setIsLoading(true);
		const result = await getBookingPaymentsAction(bookingId);
		if (result.success) {
			setPayments(result.payments ?? []);
			setTotalPaid(result.totalPaid ?? 0);
			setPaymentStatus(result.paymentStatus ?? "UNPAID");
		}
		setIsLoading(false);
	}, [bookingId]);

	useEffect(() => {
		loadPayments();
	}, [loadPayments]);

	// ── Add payment ────────────────────────────────────────────────────────────
	const handleAddPayment = useCallback(() => {
		const parsed = Number(newAmount);
		if (!parsed || parsed <= 0) {
			toast.error("Введите корректную сумму");
			return;
		}

		const finalAmount = isExpense ? -Math.abs(parsed) : Math.abs(parsed);

		startSaving(async () => {
			const result = await recordBookingPaymentAction({
				bookingId,
				amount: finalAmount,
				method: newMethod,
				type: opType,
				note: newNote.trim() || "",
			});

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			// Благодаря discriminated union TypeScript знает: result.payment, result.paymentStatus etc. здесь точно есть
			toast.success(`Платёж ${fmtRub(Math.abs(finalAmount))} зафиксирован`);

			setPayments((prev) => [result.payment, ...prev]);
			setTotalPaid(result.newTotalPaid);
			setPaymentStatus(result.paymentStatus);

			// Сброс формы
			setNewAmount("");
			setNewNote("");
			setShowAddForm(false);

			if (
				(result.paymentStatus === "PAID" ||
					result.paymentStatus === "PARTIAL") &&
				currentStatus === "PENDING_REVIEW"
			) {
				setShowStatusAlert(true);
			}
		});
	}, [
		bookingId,
		newAmount,
		newMethod,
		opType,
		newNote,
		isExpense,
		currentStatus,
	]);

	// ── Delete payment ─────────────────────────────────────────────────────────
	const handleDelete = useCallback(() => {
		if (!deleteTarget) return;
		startDelete(async () => {
			const result = await deleteBookingPaymentAction(
				bookingId,
				deleteTarget.id
			);
			if (!result.success) {
				toast.error(result.error ?? "Ошибка удаления");
				setDeleteTarget(null);
				return;
			}
			toast.success("Платёж удалён");
			setDeleteTarget(null);
			await loadPayments();
		});
	}, [bookingId, deleteTarget, loadPayments]);

	// ── Refund to balance ──────────────────────────────────────────────────────
	const handleRefundToBalance = useCallback(() => {
		if (
			!window.confirm(
				`Вернуть переплату ${fmtRub(overpaidAmount)} на баланс клиента?`
			)
		)
			return;

		startRefundTransition(async () => {
			const result = await refundToBalanceAction(
				userId,
				overpaidAmount,
				bookingId
			);
			if (!result.success) {
				toast.error(result.error ?? "Ошибка возврата");
				return;
			}
			toast.success(`Баланс пополнен на ${fmtRub(overpaidAmount)}`);
			await loadPayments();
		});
	}, [userId, overpaidAmount, bookingId, loadPayments]);

	// ── Loading ────────────────────────────────────────────────────────────────
	if (isLoading) {
		return (
			<div className="py-10 text-center text-sm text-muted-foreground animate-pulse">
				Загрузка платежей...
			</div>
		);
	}

	// ─── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="space-y-4">
			{/* ── Status + progress ──────────────────────────────────────────────── */}
			<div className="rounded-xl border border-foreground/8 overflow-hidden">
				{/* Header row */}
				<div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
								psCfg.color
							)}
						>
							<span className={cn("w-1.5 h-1.5 rounded-full", psCfg.dot)} />
							{psCfg.label}
						</span>
						{/* Баланс клиента — всегда на виду */}
						{userBalance > 0 && (
							<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400">
								<WalletIcon size={11} />
								Баланс: {fmtRub(userBalance)}
							</span>
						)}
					</div>
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs gap-1.5 shrink-0"
						onClick={() => setShowAddForm((v) => !v)}
					>
						<PlusIcon size={12} />
						Платёж
					</Button>
				</div>

				{/* Прогресс-бар */}
				<div className="h-1.5 bg-foreground/5 mx-4 rounded-full overflow-hidden mb-3">
					<div
						className={cn(
							"h-full rounded-full transition-all duration-700",
							psCfg.bar
						)}
						style={{ width: `${progressPct}%` }}
					/>
				</div>

				{/* Stats row */}
				<div className="grid grid-cols-3 divide-x divide-foreground/6 border-t border-foreground/6">
					<div className="p-3 text-center">
						<p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
							К оплате
						</p>
						<p className="text-sm font-bold tabular-nums">
							{fmtRub(totalAmount)}
						</p>
					</div>
					<div className="p-3 text-center">
						<p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
							Оплачено
						</p>
						<p
							className={cn(
								"text-sm font-bold tabular-nums",
								totalPaid > 0 ? "text-green-500" : "text-muted-foreground"
							)}
						>
							{fmtRub(totalPaid)}
						</p>
					</div>
					<div className="p-3 text-center">
						<p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
							{isOverpaid ? "Переплата" : "Остаток"}
						</p>
						<p
							className={cn(
								"text-sm font-bold tabular-nums",
								isOverpaid
									? "text-blue-500"
									: remaining > 0
										? "text-amber-500"
										: "text-green-500"
							)}
						>
							{fmtRub(isOverpaid ? overpaidAmount : remaining)}
						</p>
					</div>
				</div>

				{/* Залог-строка */}
				{totalDeposit > 0 && (
					<div className="px-4 py-2 border-t border-foreground/6 flex items-center justify-between">
						<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
							<VaultIcon size={12} />
							Залог
						</span>
						<span className="text-[12px] font-semibold text-amber-600 tabular-nums">
							{fmtRub(totalDeposit)}
						</span>
					</div>
				)}

				{/* Переплата → вернуть на баланс */}
				{isAdmin && isOverpaid && (
					<div className="px-4 pb-3 border-t border-foreground/6 pt-3">
						<Button
							variant="outline"
							size="sm"
							disabled={isRefunding}
							onClick={handleRefundToBalance}
							className="w-full h-8 text-xs border-dashed border-blue-500/40 text-blue-600 hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-950/30 gap-1.5"
						>
							<ArrowClockwiseIcon
								className={cn("h-3.5 w-3.5", isRefunding && "animate-spin")}
							/>
							Вернуть переплату {fmtRub(overpaidAmount)} на баланс клиента
						</Button>
					</div>
				)}
			</div>

			{/* ── Add payment form ──────────────────────────────────────────────── */}
			{showAddForm && (
				<div className="rounded-xl border border-primary/20 bg-primary/3 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
					<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
						<HandCoinsIcon size={11} />
						Новый платёж
					</p>

					{/* Тогглер Приход / Расход */}
					<div className="flex gap-1 p-1 rounded-lg bg-foreground/5 w-fit">
						<button
							type="button"
							onClick={() => setIsExpense(false)}
							className={cn(
								"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
								!isExpense
									? "bg-green-500 text-white shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							<ArrowUpIcon size={11} />
							Приход
						</button>
						<button
							type="button"
							onClick={() => setIsExpense(true)}
							className={cn(
								"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
								isExpense
									? "bg-red-500 text-white shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							<ArrowDownIcon size={11} />
							Расход
						</button>
					</div>

					{/* Тип транзакции + Способ оплаты */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-xs">Тип транзакции</Label>
							<Select
								value={opType}
								onValueChange={(v) => setOpType(v as PaymentOpType)}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.entries(OP_TYPE_LABELS) as [PaymentOpType, string][]
									).map(([k, v]) => (
										<SelectItem key={k} value={k} className="text-xs">
											{v}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Способ оплаты</Label>
							<Select
								value={newMethod}
								onValueChange={(v) => setNewMethod(v as PaymentMethod)}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{(
										Object.entries(PAYMENT_METHOD_LABELS) as [
											PaymentMethod,
											string,
										][]
									).map(([k, v]) => (
										<SelectItem key={k} value={k} className="text-xs">
											{v}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Сумма */}
					<div className="space-y-1">
						<Label className="text-xs">Сумма, ₽</Label>
						<Input
							type="number"
							placeholder="0"
							value={newAmount}
							onChange={(e) => setNewAmount(e.target.value)}
							className={cn(
								"h-9 text-sm font-semibold tabular-nums",
								isExpense ? "text-red-600" : "text-green-600"
							)}
							autoFocus
							min={0}
						/>
					</div>

					{/* Пресеты быстрой суммы */}
					{!isExpense && remaining > 0 && (
						<div className="flex gap-2 flex-wrap items-center">
							<p className="text-[10px] text-muted-foreground">Быстро:</p>
							{[50, 100].map((pct) => {
								const amt = Math.round((totalAmount * pct) / 100);
								return (
									<button
										key={pct}
										type="button"
										onClick={() => setNewAmount(String(amt))}
										className="text-[10px] px-2 py-0.5 rounded-full border border-foreground/10 hover:border-primary/40 hover:text-primary transition-colors"
									>
										{pct}% → {fmtRub(amt)}
									</button>
								);
							})}
							<button
								type="button"
								onClick={() => setNewAmount(String(Math.ceil(remaining)))}
								className="text-[10px] px-2 py-0.5 rounded-full border border-green-500/30 text-green-600 hover:bg-green-50 hover:border-green-500 transition-colors"
							>
								Остаток {fmtRub(remaining)}
							</button>
							{totalDeposit > 0 && (
								<button
									type="button"
									onClick={() => {
										setOpType("DEPOSIT");
										setNewAmount(String(totalDeposit));
									}}
									className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-600 hover:bg-amber-50 hover:border-amber-500 transition-colors"
								>
									Залог {fmtRub(totalDeposit)}
								</button>
							)}
						</div>
					)}

					{/* Комментарий */}
					<div className="space-y-1">
						<Label className="text-xs">Комментарий (необязательно)</Label>
						<Textarea
							placeholder="Номер чека, дополнительная информация..."
							value={newNote}
							onChange={(e) => setNewNote(e.target.value)}
							className="text-xs resize-none h-14"
						/>
					</div>

					{/* Действия */}
					<div className="flex gap-2 pt-1">
						<Button
							variant="ghost"
							size="sm"
							className="text-xs"
							onClick={() => {
								setShowAddForm(false);
								setNewAmount("");
								setNewNote("");
							}}
							disabled={isSaving}
						>
							Отмена
						</Button>
						<Button
							size="sm"
							className={cn(
								"text-xs flex-1",
								isExpense
									? "bg-red-500 hover:bg-red-600 text-white"
									: "bg-green-600 hover:bg-green-700 text-white"
							)}
							onClick={handleAddPayment}
							disabled={isSaving || !newAmount}
						>
							{isSaving ? (
								"Сохранение..."
							) : (
								<>
									{isExpense ? (
										<ArrowDownIcon size={12} className="mr-1" />
									) : (
										<ArrowUpIcon size={12} className="mr-1" />
									)}
									{isExpense ? "Расход" : "Принять"}
									{newAmount ? ` ${fmtRub(Number(newAmount))}` : ""}
								</>
							)}
						</Button>
					</div>
				</div>
			)}

			{/* ── Payments list ──────────────────────────────────────────────────── */}
			{payments.length > 0 ? (
				<div className="space-y-2">
					<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
						<BankIcon size={11} />
						История операций
						<span className="font-normal text-muted-foreground/60">
							({payments.length})
						</span>
					</p>

					{payments.map((p) => {
						const isRefund = p.amount < 0;
						return (
							<div
								key={p.id}
								className="flex items-start gap-3 p-3 rounded-xl border border-foreground/8 hover:bg-foreground/2 transition-colors group"
							>
								<div
									className={cn(
										"w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
										isRefund ? "bg-red-500/10" : "bg-green-500/10"
									)}
								>
									{isRefund ? (
										<ArrowDownIcon size={13} className="text-red-500" />
									) : (
										<ArrowUpIcon size={13} className="text-green-500" />
									)}
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<p
											className={cn(
												"text-sm font-bold tabular-nums",
												isRefund ? "text-red-500" : "text-green-500"
											)}
										>
											{isRefund ? "−" : "+"}
											{fmtRub(Math.abs(p.amount))}
										</p>
										<span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-foreground/5">
											{PAYMENT_METHOD_LABELS[p.method] ?? p.method}
										</span>
									</div>
									<p className="text-[11px] text-muted-foreground mt-0.5">
										{fmtDate(p.paidAt)}
										{p.authorName && ` · ${p.authorName}`}
									</p>
									{p.note && (
										<p className="text-xs text-muted-foreground/70 mt-1 italic">
											{p.note}
										</p>
									)}
								</div>

								{isAdmin && (
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 shrink-0"
										onClick={() => setDeleteTarget(p)}
									>
										<TrashIcon size={12} />
									</Button>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<div className="py-8 text-center text-sm text-muted-foreground">
					<HandCoinsIcon size={24} className="mx-auto mb-2 opacity-30" />
					Платежей ещё нет
				</div>
			)}

			{/* ── AlertDialog: напоминание о смене статуса ─────────────────────── */}
			<AlertDialog open={showStatusAlert} onOpenChange={setShowStatusAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<WarningCircleIcon size={18} className="text-amber-500" />
							Не забудьте сменить статус
						</AlertDialogTitle>
						<AlertDialogDescription>
							Платёж зафиксирован. Заказ сейчас в статусе{" "}
							<strong>«Ожидает проверки»</strong>. Если предоплата получена,
							переведите его в <strong>«Готов к выдаче»</strong> или другой
							подходящий статус.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Позже</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setShowStatusAlert(false);
								onStatusChangeNeeded?.();
							}}
						>
							Сменить статус
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ── AlertDialog: подтверждение удаления ──────────────────────────── */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(o) => {
					if (!o) setDeleteTarget(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить платёж?</AlertDialogTitle>
						<AlertDialogDescription>
							Платёж на сумму{" "}
							<strong>
								{deleteTarget ? fmtRub(Math.abs(deleteTarget.amount)) : ""}
							</strong>{" "}
							будет удалён. Это действие нельзя отменить.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-red-500 hover:bg-red-600"
						>
							{isDeleting ? "Удаление..." : "Удалить"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
