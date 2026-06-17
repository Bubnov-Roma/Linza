"use client";

import {
	ArrowClockwiseIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	BankIcon,
	CreditCardIcon,
	FileTextIcon,
	HandCoinsIcon,
	MoneyIcon,
	PlusIcon,
	QrCodeIcon,
	TrashIcon,
	VaultIcon,
	WalletIcon,
	WarningCircleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { recordStudioPaymentAction } from "@/actions/admin-studio-actions";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Badge,
	Button,
	Input,
	Label,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import { PAYMENT_STATUS_CONFIG } from "@/constants";
import type {
	BookingStatus,
	PaymentMethod,
	PaymentStatus,
} from "@/core/domain/entities/Booking";
import { cn, fmtRub } from "@/lib/utils";
export interface RecordPaymentPayload {
	bookingId: string;
	amount: number;
	method: PaymentMethod;
	type: PaymentOpType;
	note: string;
}

export interface PaymentsPanelActions {
	getPayments: (
		bookingId: string
	) => Promise<{ success: boolean; payments?: PaymentRow[]; error?: string }>;
	recordPayment: (
		payload: RecordPaymentPayload
	) => Promise<{ success: boolean; error?: string }>;
	deletePayment: (
		bookingId: string,
		paymentId: string
	) => Promise<{ success: boolean; error?: string }>;
	getUserBalance: (
		userId: string
	) => Promise<{ success: boolean; balance?: number; error?: string }>;
	refundToBalance: (
		userId: string,
		amount: number,
		bookingId: string
	) => Promise<{ success: boolean; error?: string }>;
	applyBalance: (
		userId: string,
		bookingId: string,
		amount: number
	) => Promise<{ success: boolean; error?: string }>;
}

export interface PaymentRow {
	id: string;
	amount: number;
	method: PaymentMethod;
	note: string | null;
	paidAt: Date | string;
	authorName: string | null;
	type?: string;
}

type PaymentOpType = "PAYMENT" | "DEPOSIT" | "OTHER";

// const OP_TYPE_LABELS: Record<PaymentOpType, string> = {
// 	PAYMENT: "Аренда",
// 	DEPOSIT: "Залог",
// 	OTHER: "Прочее",
// };

const getMethodOptions = (isExpense: boolean) => [
	{ value: "CASH", label: "Наличные", icon: MoneyIcon },
	{
		value: "CARD",
		label: "Эквайринг",
		icon: CreditCardIcon,
	},
	{ value: "TRANSFER", label: "Перевод / QR", icon: QrCodeIcon },
	{
		value: "BALANCE",
		label: isExpense ? "На баланс" : "С баланса",
		icon: WalletIcon,
	},
	{ value: "OTHER", label: "По счету", icon: FileTextIcon },
];

function fmtDate(d: Date | string): string {
	return new Date(d).toLocaleString("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
interface PaymentsPanelProps {
	bookingId: string;
	userId: string;
	totalAmount: number;
	totalDeposit?: number;
	bookingStatus?: BookingStatus;
	showOpType?: boolean;
	onStatusChangeNeeded?: () => void;
	actions: PaymentsPanelActions;
	isStudioBooking?: boolean;
}

export function PaymentsPanel({
	bookingId,
	userId,
	totalAmount: initialTotalAmount,
	totalDeposit = 0,
	bookingStatus,
	// showOpType = true,
	isStudioBooking = false,
	onStatusChangeNeeded,
	actions,
}: PaymentsPanelProps) {
	// ─── Состояния данных ─────────────────────────────────────────────────────────
	const [payments, setPayments] = useState<PaymentRow[]>([]);
	const [userBalance, setUserBalance] = useState(0);
	const [currentTotalAmount, setCurrentTotalAmount] =
		useState(initialTotalAmount);
	const [isLoading, setIsLoading] = useState(true);

	// Обновляем локальный total, если пропс поменялся снаружи (например, пересчёт периода)
	useEffect(() => {
		setCurrentTotalAmount(initialTotalAmount);
	}, [initialTotalAmount]);

	// ─── Загрузка данных ──────────────────────────────────────────────────────────
	const loadData = useCallback(async () => {
		setIsLoading(true);
		// Вызываем экшены из пропсов!
		const [payRes, balRes] = await Promise.all([
			actions.getPayments(bookingId),
			actions.getUserBalance(userId),
		]);

		if (payRes.success) setPayments(payRes.payments || []);
		if (balRes.success) setUserBalance(balRes.balance || 0);
		setIsLoading(false);
	}, [bookingId, userId, actions]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// ─── Локальные вычисления ─────────────────────────────────────────────────────
	const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
	const isOverpaid = totalPaid > currentTotalAmount;
	const overpaidAmount = Math.max(0, totalPaid - currentTotalAmount);
	const remaining = Math.max(0, currentTotalAmount - totalPaid);
	const progressPct = Math.min(
		100,
		currentTotalAmount > 0 ? (totalPaid / currentTotalAmount) * 100 : 0
	);

	const paymentStatus: PaymentStatus =
		totalPaid <= 0
			? "UNPAID"
			: totalPaid >= currentTotalAmount + 0.01
				? "OVERPAID"
				: totalPaid >= currentTotalAmount - 0.01
					? "PAID"
					: "PARTIAL";
	const psCfg = PAYMENT_STATUS_CONFIG[paymentStatus];

	// ─── Состояния UI ─────────────────────────────────────────────────────────────
	const [showAddForm, setShowAddForm] = useState(false);
	const [isExpense, setIsExpense] = useState(false);
	const [opType, _setOpType] = useState<PaymentOpType>("PAYMENT");
	const [newAmount, setNewAmount] = useState("");
	const [newMethod, setNewMethod] = useState<PaymentMethod>("CASH");
	const [newNote, setNewNote] = useState("");
	const [isSaving, startSaving] = useTransition();

	const [deleteTarget, setDeleteTarget] = useState<PaymentRow | null>(null);
	const [isDeleting, startDelete] = useTransition();

	const [isRefunding, startRefund] = useTransition();
	const [isApplyingBalance, startApplyBalance] = useTransition();
	const [showStatusAlert, setShowStatusAlert] = useState(false);

	const parsedAmount = Number(newAmount) || 0;
	const isBalanceMethod = newMethod === "BALANCE";
	const balanceShortfall =
		!isExpense && isBalanceMethod && parsedAmount > userBalance
			? parsedAmount - userBalance
			: 0;
	const isBalanceBlocked = balanceShortfall > 0;
	const methodOptions = getMethodOptions(isExpense);

	// ─── Обработчики действий ─────────────────────────────────────────────────────
	const handleAdd = useCallback(() => {
		if (!parsedAmount || parsedAmount <= 0) {
			toast.error("Введите корректную сумму");
			return;
		}
		if (isBalanceBlocked) return;

		const finalAmount = isExpense
			? -Math.abs(parsedAmount)
			: Math.abs(parsedAmount);

		startSaving(async () => {
			const result = await actions.recordPayment({
				bookingId,
				amount: finalAmount,
				method: newMethod,
				type: opType,
				note: newNote.trim(),
			});

			if (!result.success) {
				toast.error(result.error ?? "Ошибка сохранения");
				return;
			}
			toast.success(`Платёж ${fmtRub(Math.abs(finalAmount))} зафиксирован`);
			setNewAmount("");
			setNewNote("");
			setShowAddForm(false);

			await loadData(); // Обновляем платежи и баланс
			if (
				(!isExpense && bookingStatus === "PENDING_REVIEW") ||
				bookingStatus === "WAIT_PAYMENT"
			) {
				setShowStatusAlert(true);
			}
		});
	}, [
		parsedAmount,
		isExpense,
		isBalanceBlocked,
		newMethod,
		opType,
		newNote,
		bookingId,
		bookingStatus,
		loadData,
		actions.recordPayment,
	]);

	const handleDelete = useCallback(() => {
		if (!deleteTarget) return;
		startDelete(async () => {
			const result = await actions.deletePayment(bookingId, deleteTarget.id);
			if (!result.success) toast.error(result.error ?? "Ошибка удаления");
			else {
				toast.success("Платёж удалён");
				await loadData();
			}
			setDeleteTarget(null);
		});
	}, [bookingId, deleteTarget, loadData, actions.deletePayment]);

	const handleRefund = useCallback(() => {
		if (
			!window.confirm(
				`Перевести сумму ${fmtRub(overpaidAmount)} на баланс клиента?`
			)
		)
			return;
		startRefund(async () => {
			const result = await actions.refundToBalance(
				userId,
				overpaidAmount,
				bookingId
			);
			if (!result.success) toast.error(result.error ?? "Ошибка возврата");
			else {
				toast.success(`Баланс пополнен на ${fmtRub(overpaidAmount)}`);
				await loadData();
			}
		});
	}, [userId, overpaidAmount, bookingId, loadData, actions.refundToBalance]);

	const handleApplyBalance = useCallback(() => {
		const amountToApply = Math.min(userBalance, remaining);
		if (amountToApply <= 0) return;
		if (
			!window.confirm(
				`Списать ${fmtRub(amountToApply)} с баланса клиента в счёт оплаты заказа?`
			)
		)
			return;

		startApplyBalance(async () => {
			// biome-ignore lint/suspicious/noImplicitAnyLet: <>
			let result;

			// Разделяем логику в зависимости от типа заказа
			if (isStudioBooking) {
				result = await recordStudioPaymentAction({
					bookingId,
					amount: amountToApply,
					method: "BALANCE",
					type: "PAYMENT",
					note: "Оплата заказа студии с баланса клиента",
				});
			} else {
				result = await actions.applyBalance(userId, bookingId, amountToApply);
			}

			if (!result.success) toast.error(result.error ?? "Ошибка списания");
			else {
				toast.success(`Списано ${fmtRub(amountToApply)} с баланса`);
				await loadData();
			}
		});
	}, [
		userId,
		bookingId,
		userBalance,
		remaining,
		isStudioBooking,
		loadData,
		actions,
	]);

	// ─── Рендер ───────────────────────────────────────────────────────────────────
	if (isLoading) {
		return (
			<div className="py-10 text-center text-sm text-muted-foreground animate-pulse">
				Загрузка платежей и баланса...
			</div>
		);
	}

	const MethodSelector = () => (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-1 bg-muted-foreground/20 p-2 rounded-lg">
				{methodOptions.map((opt) => {
					const isActive = newMethod === opt.value;
					return (
						<Button
							key={opt.value}
							type="button"
							size="lg"
							variant="tab"
							onClick={() => setNewMethod(opt.value as PaymentMethod)}
							className={cn(
								"flex py-3 uppercase tracking-wider flex-col flex-1 items-center hover:bg-background/60 transition-all text-xs font-medium duration-300",
								isActive &&
									"border-primary shadow-sm shadow-muted-foreground/50 bg-background text-foreground hover:bg-background/90"
							)}
						>
							<opt.icon
								size={10}
								weight={isActive ? "duotone" : "regular"}
								className={cn(isActive && "text-green-500")}
							/>
							{opt.label}
						</Button>
					);
				})}
			</div>
		</div>
	);

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="shrink-0 space-y-3 pb-3 backdrop-blur-2xl ">
				<div className="rounded-xl border border-foreground/8 overflow-hidden card-surface">
					{/* Шапка прогресса */}
					<div className="px-3 py-2 flex items-center justify-between gap-3 relative">
						<div className="flex items-center gap-2 flex-wrap z-2">
							<Badge
								className={cn(
									"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-background/60 shadow-md shadow-muted-foreground/40 backdrop-blur-2xl text-foreground"
								)}
							>
								<span className={cn("w-1.5 h-1.5 rounded-full", psCfg.dot)} />
								{psCfg.label}
							</Badge>
							{userBalance > 0 && (
								<Badge className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-background/60 shadow-md shadow-muted-foreground/40 backdrop-blur-2xl">
									<WalletIcon
										size={11}
										weight="fill"
										className="text-violet-600 dark:text-violet-400 bg-none"
									/>{" "}
									Баланс: {fmtRub(userBalance)}
								</Badge>
							)}
						</div>
						<Tooltip>
							<TooltipTrigger className="z-2">
								<Button
									asChild
									variant="outline"
									size="icon"
									className="text-xs p-2 rounded-full"
									onClick={() => setShowAddForm((v) => !v)}
								>
									{showAddForm ? <XIcon size={15} /> : <PlusIcon size={15} />}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="left" className="text-xs">
								{showAddForm ? <p>Закрыть форму</p> : <p>Добавить платеж</p>}
							</TooltipContent>
						</Tooltip>
						<div
							className={cn(
								"h-full transition-all duration-700 absolute left-0 top-0 right-0 z-0",
								psCfg.bar
							)}
							style={{ width: `${progressPct}%` }}
						/>
					</div>

					<div className="grid grid-cols-3 divide-x divide-foreground/6 border-t border-foreground/6">
						<div className="p-3 text-center">
							<p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
								К оплате
							</p>
							<p className="text-sm font-bold tabular-nums">
								{fmtRub(currentTotalAmount)}
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

					{totalDeposit > 0 && (
						<div className="px-4 py-2 border-t border-foreground/6 flex items-center justify-between">
							<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
								<VaultIcon size={12} /> Залог
							</span>
							<span className="text-[12px] font-semibold text-amber-600 tabular-nums">
								{fmtRub(totalDeposit)}
							</span>
						</div>
					)}

					{/* Кнопка "Списать с баланса" */}
					{userBalance > 0 && remaining > 0 && (
						<div className="px-4 pb-3 border-t border-foreground/6 pt-3">
							<Button
								variant="outline"
								size="sm"
								disabled={isApplyingBalance}
								onClick={handleApplyBalance}
								className="w-full h-8 text-xs border-dashed border-violet-500/40 text-violet-600 hover:bg-violet-50 hover:border-violet-500 dark:hover:bg-violet-950/30 gap-1.5"
							>
								<WalletIcon
									className={cn(
										"h-3.5 w-3.5",
										isApplyingBalance && "animate-pulse"
									)}
								/>
								Списать с баланса {fmtRub(Math.min(userBalance, remaining))} в
								счёт оплаты
							</Button>
						</div>
					)}

					{/* Вернуть переплату на баланс */}
					{isOverpaid && (
						<div className="px-4 pb-3 border-t border-foreground/6 pt-3">
							<Button
								variant="outline"
								size="sm"
								disabled={isRefunding}
								onClick={handleRefund}
								className="w-full h-8 text-xs border-dashed border-blue-500/40 text-blue-600 hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-950/30 gap-1.5"
							>
								<ArrowClockwiseIcon
									className={cn("h-3.5 w-3.5", isRefunding && "animate-spin")}
								/>
								Вернуть переплату {fmtRub(overpaidAmount)} на баланс
							</Button>
						</div>
					)}
				</div>
				{/* Форма добавления платежа */}
				{showAddForm && (
					<div className="rounded-xl border border-primary/20 bg-primary/3 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
						<div className="flex items-center gap-4 flex-wrap">
							<div className="flex flex-col gap-1 flex-1">
								{/* <Label className="text-xs">
									<HandCoinsIcon size={11} /> Новый платёж
								</Label> */}
								<div className="flex w-full gap-1 p-1 rounded-lg bg-foreground/5 h-10">
									{[false, true].map((exp) => (
										<button
											key={String(exp)}
											type="button"
											onClick={() => setIsExpense(exp)}
											className={cn(
												"flex flex-1 items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
												isExpense === exp
													? exp
														? "bg-red-500 text-white shadow-sm"
														: "bg-green-500 text-white shadow-sm"
													: "text-muted-foreground hover:text-foreground"
											)}
										>
											{exp ? (
												<>
													<ArrowDownIcon size={11} /> Расход
												</>
											) : (
												<>
													<ArrowUpIcon size={11} /> Приход
												</>
											)}
										</button>
									))}
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-1 flex-1 relative items-baseline pt-2">
							{!isExpense && remaining > 0 && (
								<div className="flex gap-2 flex-wrap items-center">
									{[50, 100].map((pct) => {
										const amt = Math.round((currentTotalAmount * pct) / 100);
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
								</div>
							)}
							<Input
								type="number"
								placeholder="Сумма в ₽"
								value={newAmount}
								onChange={(e) => setNewAmount(e.target.value)}
								className={cn(
									"h-9 mt-2 text-sm font-semibold tabular-nums glass-input",
									isExpense ? "text-red-600" : "text-green-600"
								)}
								autoFocus
								min={0}
							/>
						</div>

						<MethodSelector />

						<div className="space-y-1">
							<Label className="text-xs">Комментарий (необязательно)</Label>
							<Textarea
								placeholder="Номер чека..."
								value={newNote}
								onChange={(e) => setNewNote(e.target.value)}
								className="text-xs resize-none h-14 glass-input"
							/>
						</div>

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

							{isBalanceBlocked ? (
								<p className="flex flex-1 items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
									<WarningCircleIcon
										size={14}
										weight="fill"
										className="shrink-0 mt-0.5"
									/>
									Не хватает <strong>{fmtRub(balanceShortfall)}</strong>.
								</p>
							) : (
								<Button
									size="sm"
									className={cn(
										"text-xs flex-1",
										isExpense
											? "bg-red-500 hover:bg-red-600 text-white"
											: "bg-green-600 hover:bg-green-700 text-white"
									)}
									onClick={handleAdd}
									disabled={isSaving || !newAmount || isBalanceBlocked}
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
							)}
						</div>
					</div>
				)}
			</div>

			<div className="flex-1 overflow-y-auto min-h-0 space-y-2 custom-scrollbar pr-0.5">
				{payments.length > 0 ? (
					<>
						<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 sticky top-0 bg-background/80 backdrop-blur-sm py-1 z-10">
							<BankIcon size={11} /> История операций{" "}
							<span className="font-normal text-muted-foreground/60">
								({payments.length})
							</span>
						</p>
						{payments.map((p) => {
							const isRefund = p.amount < 0;
							const methodData = getMethodOptions(isRefund).find(
								(opt) => opt.value === p.method
							);
							const MethodIcon = methodData?.icon || FileTextIcon;
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
											<span className="flex items-center gap-1 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-foreground/5">
												<MethodIcon size={10} /> {methodData?.label || p.method}
											</span>
										</div>
										<p className="text-[11px] text-muted-foreground mt-0.5">
											{fmtDate(p.paidAt)} {p.authorName && ` · ${p.authorName}`}
										</p>
										{p.note && (
											<p className="text-xs text-muted-foreground/70 mt-1 italic">
												{p.note}
											</p>
										)}
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 shrink-0"
										onClick={() => setDeleteTarget(p)}
									>
										<TrashIcon size={12} />
									</Button>
								</div>
							);
						})}
					</>
				) : (
					<div className="py-8 text-center text-sm text-muted-foreground">
						<HandCoinsIcon size={24} className="mx-auto mb-2 opacity-30" />{" "}
						Платежей ещё нет
					</div>
				)}
			</div>

			<AlertDialog open={showStatusAlert} onOpenChange={setShowStatusAlert}>
				<AlertDialogContent className="p-2 md:p-6 space-y-6 backdrop-blur-xs">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							Обновите статус заказа
						</AlertDialogTitle>
						<AlertDialogDescription className="p-2">
							<span className="block">Платёж успешно зафиксирован.</span>
							Заказ находится в статусе{" "}
							<strong>
								{bookingStatus === "PENDING_REVIEW"
									? "«Ожидает проверки»"
									: "«Ожидает оплаты»"}
							</strong>
							,
							<span className="block">
								желаете обновить статус на
								<strong>«Готов к выдаче»</strong>.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex">
						<AlertDialogCancel asChild className="flex flex-1">
							<Button variant="outline" className="flex-1">
								Позже
							</Button>
						</AlertDialogCancel>
						<AlertDialogAction
							asChild
							className="flex flex-1"
							onClick={() => {
								setShowStatusAlert(false);
								onStatusChangeNeeded?.();
							}}
						>
							<Button className="flex-1">Обновить статус</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

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
