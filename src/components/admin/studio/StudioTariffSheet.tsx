"use client";

import { CheckIcon, ImageIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { StudioTariffData } from "@/actions/admin-studio-actions";
import {
	createStudioTariffAction,
	deleteStudioTariffAction,
	updateStudioTariffAction,
} from "@/actions/admin-studio-actions";
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
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudioTariffSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tariff?: StudioTariffData | undefined;
	onSuccess: (action: "save" | "delete", data?: StudioTariffData) => void;
}

// ─── Image upload helper ──────────────────────────────────────────────────────

async function uploadTariffImage(file: File): Promise<string> {
	const formData = new FormData();
	formData.append("file", file);
	formData.append("folder", "studio/tariffs");
	const res = await fetch("/api/upload", { method: "POST", body: formData });
	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || "Ошибка загрузки");
	}
	const { url } = await res.json();
	return url as string;
}

// ─── ImageUploadSlot ─────────────────────────────────────────────────────────

function ImageUploadSlot({
	url,
	index,
	onUpload,
	onRemove,
	uploading,
}: {
	url?: string;
	index: number;
	onUpload: (file: File) => void;
	onRemove: () => void;
	uploading: boolean;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="relative group">
			{url ? (
				<div className="relative aspect-video rounded-xl overflow-hidden border border-foreground/10">
					<Image
						src={url}
						alt={`Фото ${index + 1}`}
						fill
						className="object-cover"
					/>
					<button
						type="button"
						onClick={onRemove}
						className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
					>
						<XIcon size={12} className="text-white" />
					</button>
					<div className="absolute bottom-1.5 left-1.5 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity">
						#{index + 1}
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					disabled={uploading}
					className={cn(
						"w-full aspect-video rounded-xl border-2 border-dashed border-foreground/15 flex flex-col items-center justify-center gap-1.5",
						"hover:border-primary/40 hover:bg-primary/5 transition-all duration-200",
						uploading && "opacity-50 cursor-not-allowed"
					)}
				>
					{uploading ? (
						<div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
					) : (
						<>
							<ImageIcon size={18} className="text-muted-foreground/40" />
							<span className="text-[10px] text-muted-foreground/50 font-medium">
								Добавить фото
							</span>
						</>
					)}
				</button>
			)}
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (file) onUpload(file);
					e.target.value = "";
				}}
			/>
		</div>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudioTariffSheet({
	open,
	onOpenChange,
	tariff,
	onSuccess,
}: StudioTariffSheetProps) {
	const isEdit = !!tariff;

	// ── Form state ─────────────────────────────────────────────────────────────
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [details, setDetails] = useState("");
	const [pricePerHour, setPricePerHour] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [sortOrder, setSortOrder] = useState("0");
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const [isSaving, startSaveTransition] = useTransition();
	const [isDeleting, startDeleteTransition] = useTransition();

	// ── Sync state on open/tariff change ───────────────────────────────────────
	useEffect(() => {
		if (!open) return;
		if (tariff) {
			setName(tariff.name);
			setDescription(tariff.description ?? "");
			setDetails(tariff.details ?? "");
			setPricePerHour(String(tariff.pricePerHour));
			setIsActive(tariff.isActive);
			setSortOrder(String(tariff.sortOrder));
			setImageUrls(tariff.imageUrls);
		} else {
			setName("");
			setDescription("");
			setDetails("");
			setPricePerHour("");
			setIsActive(true);
			setSortOrder("0");
			setImageUrls([]);
		}
	}, [open, tariff]);

	// ── Image handlers ─────────────────────────────────────────────────────────
	const handleImageUpload = async (file: File, index: number) => {
		setUploadingIndex(index);
		try {
			const url = await uploadTariffImage(file);
			setImageUrls((prev) => {
				const next = [...prev];
				next[index] = url;
				return next;
			});
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
		} finally {
			setUploadingIndex(null);
		}
	};

	const handleImageRemove = (index: number) => {
		setImageUrls((prev) => prev.filter((_, i) => i !== index));
	};

	// ── Save ───────────────────────────────────────────────────────────────────
	const handleSave = (): void => {
		const price = parseFloat(pricePerHour);
		if (!name.trim()) {
			toast.error("Введите название тарифа");
			return;
		}
		if (!price || price <= 0) {
			toast.error("Введите корректную цену");
			return;
		}

		const basePayload = {
			name: name.trim(),
			pricePerHour: price,
			isActive,
			sortOrder: parseInt(sortOrder, 10) || 0,
			imageUrls: imageUrls.filter(Boolean),
		};

		const payload = {
			...basePayload,
			...(description.trim() && { description: description.trim() }),
			...(details.trim() && { details: details.trim() }),
		};

		startSaveTransition(async () => {
			const result = isEdit
				? await updateStudioTariffAction({ id: tariff.id, ...payload })
				: await createStudioTariffAction(payload);

			if (result.success) {
				toast.success(isEdit ? "Тариф обновлён" : "Тариф создан");

				// ОПТИМИСТИЧНЫЕ ДАННЫЕ ДЛЯ МГНОВЕННОГО ОБНОВЛЕНИЯ UI
				const optimisticData: StudioTariffData = {
					id: isEdit ? tariff.id : (result.id ?? `temp-${Date.now()}`),
					name: payload.name,
					description: payload.description ?? null,
					details: payload.details ?? null,
					pricePerHour: payload.pricePerHour,
					isActive: payload.isActive,
					sortOrder: payload.sortOrder,
					imageUrls: payload.imageUrls,
					createdAt: isEdit ? tariff.createdAt : new Date(),
					updatedAt: new Date(),
				};
				onSuccess("save", optimisticData);
				onOpenChange(false);
			} else {
				toast.error(result.error ?? "Ошибка сохранения");
			}
		});
	};

	// ── Delete ─────────────────────────────────────────────────────────────────
	const handleDelete = () => {
		if (!tariff) return;
		startDeleteTransition(async () => {
			const result = await deleteStudioTariffAction(tariff.id);
			if (result.success) {
				toast.success("Тариф удалён");
				onSuccess("delete", tariff);
				onOpenChange(false);
			} else {
				toast.error(result.error ?? "Ошибка удаления");
			}
			setDeleteDialogOpen(false);
		});
	};

	// ── Slots for images (always show filled + 1 empty) ───────────────────────
	const filledImages = imageUrls.filter(Boolean);
	const imageSlots = [...filledImages, ""]; // +1 empty slot

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
					<SheetHeader className="px-6 py-5 border-b border-foreground/5">
						<SheetTitle className="text-xl font-black italic uppercase tracking-tighter">
							{isEdit ? "Редактировать тариф" : "Новый тариф"}
						</SheetTitle>
					</SheetHeader>

					<div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
						{/* ── Основные поля ── */}
						<div className="space-y-4">
							<div className="space-y-1.5">
								<Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
									Название *
								</Label>
								<Input
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Например: База, Интервью, Хромакей"
									className="h-10"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
									Цена в час *
								</Label>
								<div className="relative">
									<Input
										type="number"
										min={0}
										step={100}
										value={pricePerHour}
										onChange={(e) => setPricePerHour(e.target.value)}
										placeholder="1500"
										className="h-10 pr-8"
									/>
									<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">
										₽
									</span>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
									Краткое описание
								</Label>
								<Textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Что включает этот тариф в двух словах…"
									rows={2}
									className="resize-none text-sm"
								/>
							</div>

							<div className="space-y-1.5">
								<Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
									Детализация
									<span className="font-normal normal-case ml-1 text-muted-foreground/50">
										(каждая строка — отдельный пункт)
									</span>
								</Label>
								<Textarea
									value={details}
									onChange={(e) => setDetails(e.target.value)}
									placeholder={
										"Постоянный свет 3 прибора\nИмпульсный свет\nЦиклорама"
									}
									rows={4}
									className="resize-none text-sm font-mono"
								/>
							</div>
						</div>

						{/* ── Изображения ── */}
						<div className="space-y-3">
							<Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
								<span>Фотографии</span>
								{filledImages.length > 0 && (
									<span className="font-normal normal-case text-muted-foreground/50">
										{filledImages.length} фото
									</span>
								)}
							</Label>
							<div className="grid grid-cols-2 gap-2">
								{imageSlots.map((url, index) => (
									<ImageUploadSlot
										key={`slot-${index}`}
										url={url || ""}
										index={index}
										uploading={uploadingIndex === index}
										onUpload={(file) => handleImageUpload(file, index)}
										onRemove={() => handleImageRemove(index)}
									/>
								))}
							</div>
							{filledImages.length === 0 && (
								<p className="text-xs text-muted-foreground/40 italic">
									Фотографии будут показаны на странице студии
								</p>
							)}
						</div>
					</div>

					<SheetFooter className="px-6 py-4 border-t border-foreground/5 flex flex-row items-center gap-2">
						<Button onClick={handleSave} disabled={isSaving} className="flex-1">
							{isSaving ? (
								<span className="flex items-center gap-2">
									<div className="w-3 h-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
									Сохраняем…
								</span>
							) : (
								<span className="flex items-center gap-2">
									<CheckIcon size={14} />
									{isEdit ? "Сохранить" : "Создать"}
								</span>
							)}
						</Button>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSaving}
							className="flex-1"
						>
							Отмена
						</Button>
						{isEdit && (
							<Button
								variant="destructive"
								size="sm"
								className="hover:text-red-500 hover:bg-red-500/10 mr-auto"
								onClick={() => setDeleteDialogOpen(true)}
								disabled={isSaving || isDeleting}
							>
								<TrashIcon size={14} className="mr-1.5" />
								Удалить
							</Button>
						)}
					</SheetFooter>
				</SheetContent>
			</Sheet>

			{/* Delete confirmation */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить тариф?</AlertDialogTitle>
						<AlertDialogDescription>
							Тариф "<strong>{tariff?.name}</strong>" будет удалён. Это действие
							нельзя отменить. Если есть активные заказы с этим тарифом —
							удаление будет запрещено.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex justify-end gap-5">
						<AlertDialogCancel
							disabled={isDeleting}
							className="px-2 py-1 border rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Отмена
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-red-500 hover:bg-red-600 px-2 py-1 text-white rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isDeleting ? "Удаляем…" : "Удалить"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
