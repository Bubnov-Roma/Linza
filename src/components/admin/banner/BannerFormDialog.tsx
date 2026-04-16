"use client";

import {
	CheckIcon,
	DotsNineIcon,
	PlusIcon,
	XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type {
	Banner,
	BannerImage,
	BannerType,
} from "@/actions/admin-banner-actions";
import {
	addBannerImageAction,
	createBannerAction,
	deleteBannerImageAction,
	reorderBannerImagesAction,
	updateBannerAction,
} from "@/actions/admin-banner-actions";
import { ImageUploader, MarkdownEditor } from "@/components/shared";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import { Progress } from "@/components/ui/progress";
import { TYPE_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";

// ─── Менеджер изображений баннера ────────────────────────────────────────────

function BannerImageManager({
	bannerId,
	images,
	onChange,
}: {
	bannerId: string | null; // null если баннер ещё не создан
	images: BannerImage[];
	onChange: (imgs: BannerImage[]) => void;
}) {
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [, start] = useTransition();

	const dragIndex = useRef<number | null>(null);
	const dragOverIndex = useRef<number | null>(null);

	const handleUpload = async (file: File | null) => {
		if (!file || !bannerId) {
			toast.error("Сначала сохраните баннер, затем добавляйте фото");
			return;
		}
		if (images.length >= 10) {
			toast.error("Максимум 10 фотографий");
			return;
		}

		setIsUploading(true);
		setProgress(0);

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("folder", "banners");

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			if (!res.ok) throw new Error("Ошибка загрузки");
			const { url } = await res.json();
			setProgress(60);

			const result = await addBannerImageAction(bannerId, url);
			if (!result.success) throw new Error(result.error);

			if (result.image) onChange([...images, result.image]);
			setUploadOpen(false);
			toast.success("Фото добавлено");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Ошибка");
		} finally {
			setIsUploading(false);
			setProgress(0);
		}
	};

	const handleDelete = (imgId: string) => {
		if (!confirm("Удалить фото?")) return;
		start(async () => {
			const r = await deleteBannerImageAction(imgId);
			if (!r.success) {
				toast.error(r.error);
				return;
			}
			const next = images.filter((i) => i.id !== imgId);
			onChange(next);
			toast.success("Удалено");
		});
	};

	const handleDrop = async () => {
		const from = dragIndex.current;
		const to = dragOverIndex.current;
		if (from === null || to === null || from === to || !bannerId) return;

		const reordered = [...images];
		const [moved] = reordered.splice(from, 1);
		if (!moved) return;
		reordered.splice(to, 0, moved);

		onChange(reordered);
		dragIndex.current = null;
		dragOverIndex.current = null;

		await reorderBannerImagesAction(
			bannerId,
			reordered.map((i) => i.id)
		);
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label>Фотографии ({images.length}/10)</Label>
				{!bannerId && (
					<span className="text-[10px] text-muted-foreground italic">
						Сохраните баннер для добавления фото
					</span>
				)}
			</div>

			{/* Список фото */}
			{images.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{images.map((img, i) => (
						<button
							type="button"
							key={img.id}
							draggable
							onDragStart={() => {
								dragIndex.current = i;
							}}
							onDragOver={(e) => {
								e.preventDefault();
								dragOverIndex.current = i;
							}}
							onDrop={handleDrop}
							className={cn(
								"relative group w-18 h-18 rounded-xl overflow-hidden border border-foreground/10",
								"cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all"
							)}
						>
							<Image
								src={img.url}
								alt={`фото ${i + 1}`}
								fill
								sizes="72px"
								className="object-cover"
							/>

							{/* Порядок */}
							<div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
								#{i + 1}
							</div>

							{/* Drag icon */}
							<div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<DotsNineIcon
									weight="bold"
									size={14}
									className="text-white drop-shadow"
								/>
							</div>

							{/* Удалить */}
							<button
								type="button"
								onClick={() => handleDelete(img.id)}
								className="absolute top-1 right-1 h-4 w-4 rounded bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<XIcon weight="bold" size={10} className="text-white" />
							</button>

							{/* Обложка */}
							{i === 0 && (
								<div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[7px] font-black px-1 rounded">
									обл
								</div>
							)}
						</button>
					))}
				</div>
			)}

			{/* Добавить */}
			{images.length < 10 && (
				<Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-2 border-dashed"
						onClick={() => {
							if (!bannerId) {
								toast.error("Сначала сохраните баннер");
								return;
							}
							setUploadOpen(true);
						}}
					>
						<PlusIcon size={13} />
						Добавить фото
					</Button>
					<DialogContent className="sm:max-w-md p-6">
						<DialogHeader>
							<DialogTitle className="text-base font-black italic uppercase">
								Добавить фото к баннеру
							</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 mt-2">
							<ImageUploader onFileSelect={handleUpload} aspectRatio={16 / 9} />
							{isUploading && (
								<div className="space-y-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
									<div className="flex justify-between text-[10px] font-bold uppercase">
										<span className="animate-pulse">Загрузка...</span>
										<span>{progress}%</span>
									</div>
									<Progress value={progress} className="h-1" />
								</div>
							)}
						</div>
					</DialogContent>
				</Dialog>
			)}

			{images.length > 1 && (
				<p className="text-[10px] text-muted-foreground/40 italic">
					Перетащите для сортировки. Первое фото — обложка баннера.
				</p>
			)}
		</div>
	);
}

// ─── BannerFormDialog ─────────────────────────────────────────────────────────

interface BannerFormValues {
	title: string;
	subtitle: string;
	body: string;
	linkUrl: string;
	linkLabel: string;
	type: BannerType;
	isActive: boolean;
	eventDate: string;
}

const emptyForm = (): BannerFormValues => ({
	title: "",
	subtitle: "",
	body: "",
	linkUrl: "",
	linkLabel: "",
	type: "info",
	isActive: true,
	eventDate: "",
});

function bannerToForm(b: Banner): BannerFormValues {
	return {
		title: b.title,
		subtitle: b.subtitle ?? "",
		body: b.body ?? "",
		linkUrl: b.linkUrl ?? "",
		linkLabel: b.linkLabel ?? "",
		type: b.type as BannerType,
		isActive: b.isActive,
		eventDate: b.eventDate
			? new Date(b.eventDate).toISOString().slice(0, 10)
			: "",
	};
}

export function BannerFormDialog({
	open,
	onOpenChange,
	initial,
	bannerId: initialBannerId,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	initial?: Banner;
	bannerId?: string;
	onSaved: () => void;
}) {
	const [form, setForm] = useState<BannerFormValues>(
		initial ? bannerToForm(initial) : emptyForm()
	);
	const [savedBannerId, setSavedBannerId] = useState<string | null>(
		initialBannerId ?? null
	);
	const [images, setImages] = useState<BannerImage[]>(initial?.images ?? []);
	const [isPending, start] = useTransition();

	const set = (k: keyof BannerFormValues, v: string | boolean) =>
		setForm((prev) => ({ ...prev, [k]: v }));

	const handleSave = () => {
		if (!form.title.trim()) {
			toast.error("Введите заголовок");
			return;
		}

		start(async () => {
			const payload = {
				title: form.title,
				subtitle: form.subtitle || "",
				body: form.body || "",
				linkUrl: form.linkUrl || "",
				linkLabel: form.linkLabel || "",
				type: form.type,
				isActive: form.isActive,
				eventDate: form.eventDate || "",
			};

			const result = savedBannerId
				? await updateBannerAction(savedBannerId, payload)
				: await createBannerAction(payload);

			if (!result.success) {
				toast.error(result.error ?? "Ошибка");
				return;
			}

			if (!savedBannerId && result.id) {
				// При создании сохраняем ID для последующей загрузки фото
				setSavedBannerId(result.id);
				toast.success("Баннер создан. Теперь можно добавить фото.");
				return; // Не закрываем — даём добавить фото
			}

			toast.success(savedBannerId ? "Баннер обновлён" : "Баннер создан");
			onSaved();
			onOpenChange(false);
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-black italic uppercase tracking-tight">
						{initialBannerId ? "Редактировать баннер" : "Новый баннер"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Тип */}
					<div className="space-y-1.5">
						<Label>Тип</Label>
						<Select
							value={form.type}
							onValueChange={(v) => set("type", v as BannerType)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TYPE_OPTIONS.map((t) => (
									<SelectItem key={t.value} value={t.value}>
										<div className="flex items-center gap-2">
											{t.icon}
											{t.label}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label>Заголовок *</Label>
						<Input
							value={form.title}
							onChange={(e) => set("title", e.target.value)}
							placeholder="Встреча с фотографами | Скидка 20% на свет..."
						/>
					</div>

					<div className="space-y-1.5">
						<Label>Подзаголовок</Label>
						<Input
							value={form.subtitle}
							onChange={(e) => set("subtitle", e.target.value)}
							placeholder="Краткое описание, видное на слайде"
						/>
					</div>

					<MarkdownEditor
						label="Описание (Markdown)"
						value={form.body}
						onChange={(v) => set("body", v)}
						rows={7}
						placeholder={
							"# Заголовок\n\n- Пункт 1\n- Пункт 2\n\n[Ссылка](https://...)"
						}
					/>

					{/* Фото */}
					<BannerImageManager
						bannerId={savedBannerId}
						images={images}
						onChange={setImages}
					/>

					<div className="space-y-1.5">
						<Label>Дата события</Label>
						<Input
							type="date"
							value={form.eventDate}
							onChange={(e) => set("eventDate", e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>URL ссылки</Label>
							<Input
								value={form.linkUrl}
								onChange={(e) => set("linkUrl", e.target.value)}
								placeholder="https://..."
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Текст кнопки</Label>
							<Input
								value={form.linkLabel}
								onChange={(e) => set("linkLabel", e.target.value)}
								placeholder="Зарегистрироваться"
							/>
						</div>
					</div>

					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={form.isActive}
							onChange={(e) => set("isActive", e.target.checked)}
							className="accent-primary w-4 h-4"
						/>
						<span className="text-sm">Отображать на сайте</span>
					</label>
				</div>

				<div className="flex gap-2 pt-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="flex-1"
					>
						{savedBannerId && !initialBannerId ? "Готово" : "Отмена"}
					</Button>
					<Button
						onClick={handleSave}
						disabled={isPending}
						className="flex-1 gap-2"
					>
						<CheckIcon size={14} />
						{savedBannerId ? "Сохранить" : "Создать"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
