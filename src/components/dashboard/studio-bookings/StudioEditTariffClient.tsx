"use client";

import { ArrowLeft, Check, Package, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { StudioTariffData } from "@/actions/admin/admin-studio-actions";
import {
	type ClientStudioBookingDetail,
	updateStudioBookingTariffAction,
} from "@/actions/client-studio-actions";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { BookingButton, ClientTime } from "@/components/shared";
import { Button } from "@/components/ui";
import {
	BOOKING_STATUS_LABELS,
	BOOKING_STATUS_STYLES,
} from "@/constants/booking-status";
import type { BookingStatus } from "@/core/domain/entities/Booking";
import { cn, fmtRub } from "@/lib/utils";

interface AvailableEquipment {
	id: string;
	title: string;
	priceStudio: number;
	imageUrl: string | null;
	categoryName: string;
}

interface StudioEditTariffClientProps {
	booking: ClientStudioBookingDetail;
	tariffs: StudioTariffData[];
	availableEquipment: AvailableEquipment[];
}

export function StudioEditTariffClient({
	booking,
	tariffs,
	availableEquipment,
}: StudioEditTariffClientProps) {
	const router = useRouter();

	const [selectedTariffId, setSelectedTariffId] = useState(booking.tariffId);
	const [selectedEquipIds, setSelectedEquipIds] = useState<Set<string>>(
		new Set(booking.items.map((i) => i.equipmentId))
	);
	const [search, setSearch] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const selectedTariff = tariffs.find((t) => t.id === selectedTariffId);

	const filteredEquip = useMemo(() => {
		if (!search) return availableEquipment;
		const q = search.toLowerCase();
		return availableEquipment.filter(
			(e) =>
				e.title.toLowerCase().includes(q) ||
				e.categoryName.toLowerCase().includes(q)
		);
	}, [availableEquipment, search]);

	const toggleEquip = (id: string) => {
		setSelectedEquipIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const newTariffTotal = selectedTariff
		? selectedTariff.pricePerHour * booking.durationHours
		: 0;

	const equipTotal = [...selectedEquipIds].reduce((sum, id) => {
		const eq = availableEquipment.find((e) => e.id === id);
		return sum + (eq?.priceStudio ?? 0);
	}, 0);

	// Также учитываем технику из текущего заказа, которой нет в availableEquipment
	const currentItemsTotal = booking.items
		.filter(
			(item) => !availableEquipment.find((e) => e.id === item.equipmentId)
		)
		.filter((item) => selectedEquipIds.has(item.equipmentId))
		.reduce((s, i) => s + i.priceAtBooking, 0);

	const newTotal = newTariffTotal + equipTotal + currentItemsTotal;

	const hasChanges = useMemo(() => {
		if (selectedTariffId !== booking.tariffId) return true;
		const currentIds = new Set(booking.items.map((i) => i.equipmentId));
		if (selectedEquipIds.size !== currentIds.size) return true;
		for (const id of selectedEquipIds) if (!currentIds.has(id)) return true;
		return false;
	}, [selectedTariffId, selectedEquipIds, booking.tariffId, booking.items]);

	const handleSave = async () => {
		if (!hasChanges) return;
		setIsSubmitting(true);
		try {
			const result = await updateStudioBookingTariffAction({
				bookingId: booking.id,
				tariffId: selectedTariffId,
				equipmentIds: [...selectedEquipIds],
			});
			if (result.success) {
				toast.success("Заказ обновлён. Менеджер подтвердит изменения.");
				router.push(`/dashboard/studio-bookings/${booking.id}`);
			} else {
				toast.error(result.error ?? "Ошибка при обновлении");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const status = booking.status as BookingStatus;
	const shortId = booking.id.split("-")[0]?.toUpperCase();

	return (
		<div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300 pb-16">
			<DashboardBreadcrumb
				items={[
					{ label: "Мои заказы студии", href: "/dashboard/studio-bookings" },
					{
						label: `Заказ ${shortId}`,
						href: `/dashboard/studio-bookings/${booking.id}`,
					},
					{ label: "Изменить тариф" },
				]}
			/>

			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Link
						href={`/dashboard/studio-bookings/${booking.id}`}
						className="w-10 h-10 rounded-xl border border-foreground/10 flex items-center justify-center hover:bg-foreground/5 transition-colors shrink-0"
					>
						<ArrowLeft size={18} />
					</Link>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
							Редактирование
						</p>
						<h1 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">
							Заказ № {shortId}
						</h1>
					</div>
				</div>
				<span
					className={cn(
						"text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border shrink-0 self-start sm:self-auto",
						BOOKING_STATUS_STYLES[status] ??
							"bg-foreground/5 text-muted-foreground"
					)}
				>
					{BOOKING_STATUS_LABELS[status] ?? status}
				</span>
			</div>

			{/* Period info */}
			<div className="px-5 py-4 rounded-2xl border border-foreground/8 bg-foreground/3 flex items-center gap-3 text-sm text-muted-foreground">
				<ClientTime iso={booking.startDate} fmt="datetime" />
				<span className="opacity-30">→</span>
				<ClientTime iso={booking.endDate} fmt="datetime" />
				<span className="opacity-30">·</span>
				<span className="font-medium">{booking.durationHours} ч.</span>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				{/* Left: tariff + equipment */}
				<div className="lg:col-span-8 space-y-6">
					{/* Тарифы */}
					<div className="space-y-3">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							Тариф
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{tariffs.map((tariff) => {
								const isSelected = selectedTariffId === tariff.id;
								return (
									<button
										key={tariff.id}
										type="button"
										onClick={() => setSelectedTariffId(tariff.id)}
										className={cn(
											"text-left p-4 rounded-2xl border transition-all",
											isSelected
												? "border-primary/40 bg-primary/8 shadow-sm shadow-primary/10"
												: "border-foreground/8 hover:border-foreground/20 hover:bg-foreground/3"
										)}
									>
										<div className="flex items-center justify-between mb-1">
											<p className="font-bold text-sm">{tariff.name}</p>
											{isSelected && (
												<Check size={14} className="text-primary shrink-0" />
											)}
										</div>
										<p className="text-lg font-black text-primary">
											{fmtRub(tariff.pricePerHour)}
											<span className="text-xs font-normal text-muted-foreground ml-1">
												/ч
											</span>
										</p>
										{tariff.description && (
											<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
												{tariff.description}
											</p>
										)}
									</button>
								);
							})}
						</div>
					</div>

					{/* Техника */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
								Дополнительная техника
							</p>
							{selectedEquipIds.size > 0 && (
								<span className="text-xs text-muted-foreground">
									Выбрано: {selectedEquipIds.size}
								</span>
							)}
						</div>

						{/* Поиск */}
						<div className="relative">
							<Search
								size={14}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40"
							/>
							<input
								type="text"
								placeholder="Поиск техники…"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="w-full h-10 pl-9 pr-4 rounded-xl border border-foreground/10 bg-foreground/3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
							/>
						</div>

						{/* Список */}
						{filteredEquip.length === 0 ? (
							<div className="py-8 text-center text-sm text-muted-foreground/50">
								<Package size={24} className="mx-auto mb-2 opacity-30" />
								{search ? "Ничего не найдено" : "Нет доступной техники"}
							</div>
						) : (
							<div className="space-y-2">
								{filteredEquip.map((eq) => {
									const isSelected = selectedEquipIds.has(eq.id);
									return (
										<button
											key={eq.id}
											type="button"
											onClick={() => toggleEquip(eq.id)}
											className={cn(
												"w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
												isSelected
													? "border-primary/30 bg-primary/5"
													: "border-foreground/8 hover:border-foreground/20 hover:bg-foreground/3"
											)}
										>
											<div className="w-10 h-10 rounded-lg overflow-hidden bg-foreground/5 shrink-0">
												{eq.imageUrl ? (
													<Image
														src={eq.imageUrl}
														alt={eq.title}
														width={40}
														height={40}
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<Package
															size={14}
															className="text-muted-foreground/30"
														/>
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-semibold truncate">
													{eq.title}
												</p>
												<p className="text-xs text-muted-foreground">
													{eq.categoryName}
												</p>
											</div>
											<div className="shrink-0 flex items-center gap-2">
												<span className="text-sm font-mono font-bold">
													{fmtRub(eq.priceStudio)}
												</span>
												<div
													className={cn(
														"w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
														isSelected
															? "border-primary bg-primary text-white"
															: "border-foreground/20"
													)}
												>
													{isSelected && <Check size={12} strokeWidth={3} />}
												</div>
											</div>
										</button>
									);
								})}
							</div>
						)}

						{/* Техника из текущего заказа, которой нет в доступных */}
						{booking.items.some(
							(item) =>
								!availableEquipment.find((e) => e.id === item.equipmentId)
						) && (
							<div className="space-y-2 pt-2 border-t border-foreground/5">
								<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
									Текущая техника в заказе
								</p>
								{booking.items
									.filter(
										(item) =>
											!availableEquipment.find((e) => e.id === item.equipmentId)
									)
									.map((item) => (
										<div
											key={item.id}
											className="flex items-center gap-3 p-3 rounded-xl border border-foreground/8 bg-foreground/3"
										>
											<div className="w-10 h-10 rounded-lg overflow-hidden bg-foreground/5 shrink-0">
												{item.equipmentImageUrl ? (
													<Image
														src={item.equipmentImageUrl}
														alt={item.equipmentTitle}
														width={40}
														height={40}
														className="w-full h-full object-cover"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<Package
															size={14}
															className="text-muted-foreground/30"
														/>
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-semibold truncate">
													{item.equipmentTitle}
												</p>
												<p className="text-xs text-muted-foreground/50">
													Уже в заказе
												</p>
											</div>
											<span className="text-sm font-mono font-bold shrink-0">
												{fmtRub(item.priceAtBooking)}
											</span>
										</div>
									))}
							</div>
						)}
					</div>
				</div>

				{/* Right: summary */}
				<div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
					<div className="card-surface rounded-2xl border border-foreground/8 p-5 space-y-4">
						<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							Итог
						</p>

						<div className="space-y-2 text-sm">
							{selectedTariff && (
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										{selectedTariff.name} × {booking.durationHours} ч.
									</span>
									<span className="font-mono font-bold">
										{fmtRub(newTariffTotal)}
									</span>
								</div>
							)}
							{[...selectedEquipIds].map((id) => {
								const eq = availableEquipment.find((e) => e.id === id);
								const fromBooking = booking.items.find(
									(i) => i.equipmentId === id
								);
								const title = eq?.title ?? fromBooking?.equipmentTitle ?? id;
								const price =
									eq?.priceStudio ?? fromBooking?.priceAtBooking ?? 0;
								return (
									<div key={id} className="flex justify-between">
										<span className="text-muted-foreground truncate max-w-35">
											{title}
										</span>
										<span className="font-mono font-bold">{fmtRub(price)}</span>
									</div>
								);
							})}
						</div>

						<div className="border-t border-foreground/5 pt-3 flex justify-between items-center">
							<span className="font-bold">Итого</span>
							<span className="text-xl font-black">{fmtRub(newTotal)}</span>
						</div>

						{booking.totalAmount !== newTotal && (
							<p className="text-xs text-muted-foreground/60">
								Текущая сумма: {fmtRub(booking.totalAmount)}
							</p>
						)}
					</div>

					<BookingButton
						onClick={handleSave}
						disabled={!hasChanges}
						loading={isSubmitting}
						mode="update"
					/>
					{!hasChanges && (
						<p className="text-[11px] text-muted-foreground/40 text-center">
							Измените тариф или технику для сохранения
						</p>
					)}

					<Button variant="outline" asChild className="w-full rounded-2xl">
						<Link href={`/dashboard/studio-bookings/${booking.id}`}>
							Отмена
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
