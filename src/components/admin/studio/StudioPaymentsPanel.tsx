"use client";

import {
	ArrowClockwiseIcon,
	BankIcon,
	HandCoinsIcon,
	PlusIcon,
	TrashIcon,
	WalletIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import type { PaymentMethod, PaymentType } from "@prisma/client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	addStudioBookingPaymentAction,
	deleteStudioBookingPaymentAction,
	getStudioBookingDetailAction,
} from "@/actions/admin-studio-actions";
import type { PaymentStatus } from "@/components/admin/bookings/PaymentsPanel";
import { PAYMENT_STATUS_CONFIG } from "@/components/admin/bookings/PaymentsPanel";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
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
import { PAYMENT_METHOD_LABELS } from "@/constants";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioPaymentRow {
	id: string;
	amount: number;
	method: PaymentMethod;
	type: PaymentType;
	note: string | null;
	paidAt: Date;
	authorName: string | null;
}

interface StudioPaymentsPanelProps {
	studioBookingId: string;
	totalAmount: number;
	currentStatus: BookingStatus;
	onStatusChangeNeeded?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRub(n: number): string {
	return `${n.toLocaleString("ru-RU")} ₽`;
}

function fmtDate(d: Date): string {
	return new Date(d).toLocaleString("ru-RU", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

const OP_TYPE_LABELS: Record<PaymentType, string> = {
	PAYMENT: "Аренда",
	DEPOSIT: "Залог",
	OTHER: "Прочее",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StudioPaymentsPanel({
	studioBookingId,
	totalAmount,
	currentStatus,
	onStatusChangeNeeded,
}: StudioPaymentsPanelProps) {
	// ── State ──────────────────────────────────────────────────────────────────
	const [payments, setPayments] = useState<StudioPaymentRow[]>([]);
	const [totalPaid, setTotalPaid] = useState(0);
	const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
	const [isLoading, setIsLoading] = useState(true);

	// Add form
	const [showAddForm, setShowAddForm] = useState(false);
	const [isExpense, setIsExpense] = useState(false);
	const [opType, setOpType] = useState<PaymentType>("PAYMENT");
	const [newAmount, setNewAmount] = useState("");
	const [newMethod, setNewMethod] = useState<PaymentMethod>("CASH");
	const [newNote, setNewNote] = useState("");
	const [isSaving, startSaving] = useTransition();

	// Delete
	const [deleteTarget, setDeleteTarget] = useState<StudioPaymentRow | null>(
		null
	);
	const [isDeleting, startDelete] = useTransition();

	// Status hint
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
		const detail = await getStudioBookingDetailAction(studioBookingId);
		if (detail) {
			setPayments(detail.payments);
			const paid = detail.payments.reduce((s, p) => s + p.amount, 0);
			setTotalPaid(paid);
			setPaymentStatus(detail.paymentStatus);
		}
		setIsLoading(false);
	}, [studioBookingId]);

	useEffect(() => {
		loadPayments();
	}, [loadPayments]);

	// ── Add ────────────────────────────────────────────────────────────────────
	const handleAddPayment = useCallback(() => {
		const parsed = Number(newAmount);
		if (!parsed || parsed <= 0) {
			toast.error("Введите корректную сумму");
			return;
		}
		const finalAmount = isExpense ? -Math.abs(parsed) : Math.abs(parsed);

		startSaving(async () => {
			const result = await addStudioBookingPaymentAction({
				studioBookingId,
				amount: finalAmount,
				method: newMethod,
				type: opType,
				note: newNote.trim() || "",
			});

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			toast.success(`Платёж ${fmtRub(Math.abs(finalAmount))} зафиксирован`);
			setNewAmount("");
			setNewNote("");
			setShowAddForm(false);
			await loadPayments();

			if (currentStatus === "PENDING_REVIEW") {
				setShowStatusAlert(true);
			}
		});
	}, [
		studioBookingId,
		newAmount,
		newMethod,
		opType,
		newNote,
		isExpense,
		currentStatus,
		loadPayments,
	]);

	// ── Delete ─────────────────────────────────────────────────────────────────
	const handleDelete = useCallback(() => {
		if (!deleteTarget) return;
		startDelete(async () => {
			const result = await deleteStudioBookingPaymentAction(
				deleteTarget.id,
				studioBookingId
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
	}, [studioBookingId, deleteTarget, loadPayments]);

	// ── Loading ────────────────────────────────────────────────────────────────
	if (isLoading) {
		return (
			<div className="py-10 text-center text-sm text-muted-foreground animate-pulse">
				Загрузка платежей...
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* ── Summary bar ── */}
			<div className="rounded-2xl border border-foreground/8 bg-foreground/3 p-4 space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
								psCfg.color
							)}
						>
							<span className={cn("w-1.5 h-1.5 rounded-full", psCfg.dot)} />
							{psCfg.label}
						</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={loadPayments}
					>
						<ArrowClockwiseIcon size={13} />
					</Button>
				</div>

				{/* Progress bar */}
				<div className="space-y-1.5">
					<div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
						<div
							className={cn(
								"h-full rounded-full transition-all duration-500",
								psCfg.bar
							)}
							style={{ width: `${progressPct}%` }}
						/>
					</div>
					<div className="flex justify-between text-xs">
						<span className="text-muted-foreground">
							Оплачено:{" "}
							<strong className="text-foreground">{fmtRub(totalPaid)}</strong>
						</span>
						<span className="text-muted-foreground">
							Итого:{" "}
							<strong className="text-foreground">{fmtRub(totalAmount)}</strong>
						</span>
					</div>
				</div>

				{!isOverpaid && remaining > 0 && (
					<p className="text-xs text-muted-foreground">
						Осталось:{" "}
						<strong className="text-amber-500">{fmtRub(remaining)}</strong>
					</p>
				)}

				{isOverpaid && (
					<div className="flex items-center justify-between rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 py-2">
						<p className="text-xs text-blue-400 font-medium">
							Переплата: {fmtRub(overpaidAmount)}
						</p>
					</div>
				)}
			</div>

			{/* ── Status change hint ── */}
			{showStatusAlert && (
				<div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
					<WarningCircleIcon
						size={16}
						className="text-amber-500 shrink-0 mt-0.5"
					/>
					<div className="flex-1 min-w-0">
						<p className="text-xs text-amber-400 font-medium">
							Не забудьте обновить статус заказа
						</p>
						<p className="text-[10px] text-amber-400/70 mt-0.5">
							После фиксации оплаты переведите заказ в нужный статус.
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="h-6 text-[10px] text-amber-400 hover:bg-amber-500/10 shrink-0"
						onClick={() => {
							setShowStatusAlert(false);
							onStatusChangeNeeded?.();
						}}
					>
						Сменить
					</Button>
				</div>
			)}

			{/* ── Add payment form ── */}
			{showAddForm ? (
				<div className="rounded-2xl border border-foreground/8 bg-foreground/3 p-4 space-y-3">
					<p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
						Новый платёж
					</p>

					{/* Income / Expense toggle */}
					<div className="flex gap-2">
						<Button
							variant={!isExpense ? "default" : "outline"}
							size="sm"
							className="flex-1 h-8 text-xs"
							onClick={() => setIsExpense(false)}
						>
							Приход
						</Button>
						<Button
							variant={isExpense ? "default" : "outline"}
							size="sm"
							className="flex-1 h-8 text-xs"
							onClick={() => setIsExpense(true)}
						>
							Расход
						</Button>
					</div>

					<div className="grid grid-cols-2 gap-2">
						{/* Amount */}
						<div className="space-y-1.5">
							<Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
								Сумма *
							</Label>
							<div className="relative">
								<Input
									type="number"
									min={0}
									value={newAmount}
									onChange={(e) => setNewAmount(e.target.value)}
									placeholder="0"
									className="h-8 pr-6 text-sm"
									onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
								/>
								<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
									₽
								</span>
							</div>
						</div>

						{/* Method */}
						<div className="space-y-1.5">
							<Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
								Способ
							</Label>
							<Select
								value={newMethod}
								onValueChange={(v) => setNewMethod(v as PaymentMethod)}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
										<SelectItem key={k} value={k} className="text-xs">
											{v}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Op type */}
					<div className="space-y-1.5">
						<Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
							Тип операции
						</Label>
						<Select
							value={opType}
							onValueChange={(v) => setOpType(v as PaymentType)}
						>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{(
									Object.entries(OP_TYPE_LABELS) as [PaymentType, string][]
								).map(([k, v]) => (
									<SelectItem key={k} value={k} className="text-xs">
										{v}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Note */}
					<div className="space-y-1.5">
						<Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
							Комментарий
						</Label>
						<Textarea
							value={newNote}
							onChange={(e) => setNewNote(e.target.value)}
							placeholder="Необязательно..."
							rows={2}
							className="resize-none text-xs"
						/>
					</div>

					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							className="flex-1 h-8"
							onClick={() => {
								setShowAddForm(false);
								setNewAmount("");
								setNewNote("");
							}}
						>
							Отмена
						</Button>
						<Button
							size="sm"
							className="flex-1 h-8"
							onClick={handleAddPayment}
							disabled={isSaving || !newAmount}
						>
							{isSaving ? (
								<span className="flex items-center gap-1.5">
									<span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
									Сохраняем...
								</span>
							) : (
								"Зафиксировать"
							)}
						</Button>
					</div>
				</div>
			) : (
				<Button
					variant="outline"
					size="sm"
					className="w-full h-8 gap-2 border-dashed border-foreground/20 hover:border-primary/40"
					onClick={() => setShowAddForm(true)}
				>
					<PlusIcon size={13} />
					Добавить платёж
				</Button>
			)}

			{/* ── Payment history ── */}
			{payments.length > 0 && (
				<div className="space-y-1.5">
					<p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-1">
						История платежей
					</p>
					{payments.map((p) => {
						const isIncome = p.amount > 0;
						const methodIcon =
							p.method === "CASH" ? (
								<HandCoinsIcon size={14} className="text-muted-foreground" />
							) : p.method === "TRANSFER" ? (
								<BankIcon size={14} className="text-muted-foreground" />
							) : (
								<WalletIcon size={14} className="text-muted-foreground" />
							);

						return (
							<div
								key={p.id}
								className="flex items-center gap-2.5 rounded-xl border border-foreground/6 bg-foreground/2 px-3 py-2.5 group"
							>
								{methodIcon}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span
											className={cn(
												"text-sm font-bold",
												isIncome ? "text-emerald-500" : "text-red-500"
											)}
										>
											{isIncome ? "+" : ""}
											{fmtRub(p.amount)}
										</span>
										<span className="text-[9px] text-muted-foreground/50 uppercase tracking-wide">
											{OP_TYPE_LABELS[p.type] ?? p.type}
										</span>
									</div>
									<div className="flex items-center gap-2 mt-0.5">
										<span className="text-[10px] text-muted-foreground">
											{fmtDate(p.paidAt)}
										</span>
										{p.authorName && (
											<span className="text-[10px] text-muted-foreground/50">
												· {p.authorName}
											</span>
										)}
									</div>
									{p.note && (
										<p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
											{p.note}
										</p>
									)}
								</div>
								<button
									type="button"
									onClick={() => setDeleteTarget(p)}
									className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/10 text-red-400"
								>
									<TrashIcon size={13} />
								</button>
							</div>
						);
					})}
				</div>
			)}

			{payments.length === 0 && !showAddForm && (
				<p className="text-xs text-muted-foreground/40 italic text-center py-4">
					Платежей пока нет
				</p>
			)}

			{/* Delete confirmation */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить платёж?</AlertDialogTitle>
						<AlertDialogDescription>
							Платёж на{" "}
							<strong>{fmtRub(Math.abs(deleteTarget?.amount ?? 0))}</strong>{" "}
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
							{isDeleting ? "Удаляем..." : "Удалить"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
