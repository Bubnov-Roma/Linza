"use client";

import {
	CheckIcon,
	DotsNineIcon,
	FilmSlateIcon,
	ImageIcon,
	LinkIcon,
	PlusIcon,
	UploadSimpleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { DialogDescription } from "@radix-ui/react-dialog";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type {
	Banner,
	BannerImage,
	BannerPlacement,
	BannerType,
} from "@/actions/admin-banner-actions";
import {
	addBannerImageAction,
	addBannerVideoAction,
	createBannerAction,
	deleteBannerImageAction,
	reorderBannerImagesAction,
	updateBannerAction,
} from "@/actions/admin-banner-actions";
import { ImageUploader, MarkdownEditor } from "@/components/shared";
import {
	Button,
	Card,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLACEMENT_OPTIONS, TYPE_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";
import { getMediaType } from "@/utils/admin-banner-helpers";

// ─── Медиа-менеджер баннера ───────────────────────────────────────────────────

type MediaTab = "photo" | "video-s3" | "video-url";

function BannerMediaManager({
	bannerId,
	images,
	onChange,
}: {
	bannerId: string | null;
	images: BannerImage[];
	onChange: (imgs: BannerImage[]) => void;
}) {
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<MediaTab>("photo");
	const [videoUrl, setVideoUrl] = useState("");
	const [videoThumbnail, setVideoThumbnail] = useState("");
	const [, start] = useTransition();

	const dragIndex = useRef<number | null>(null);
	const dragOverIndex = useRef<number | null>(null);

	const requireBannerId = () => {
		if (!bannerId) {
			toast.error("Сначала сохраните баннер, затем добавляйте медиа");
			return false;
		}
		return true;
	};

	// ── Загрузка фото в S3 ────────────────────────────────────────────────────
	const handlePhotoUpload = async (file: File | null) => {
		if (!file || !requireBannerId()) return;
		if (images.length >= 10) {
			toast.error("Максимум 10 медиа-элементов");
			return;
		}

		setIsUploading(true);
		setProgress(20);

		try {
			if (bannerId === null) return;
			const formData = new FormData();
			formData.append("file", file);
			formData.append("folder", "banners");

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			if (!res.ok) throw new Error("Ошибка загрузки");
			const { url } = await res.json();
			setProgress(70);

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

	// ── Загрузка видео в S3 ───────────────────────────────────────────────────
	const handleVideoS3Upload = async (file: File | null) => {
		if (!file || !requireBannerId()) return;
		if (images.length >= 10) {
			toast.error("Максимум 10 медиа-элементов");
			return;
		}

		setIsUploading(true);
		setProgress(10);

		try {
			if (bannerId === null) return;
			const formData = new FormData();
			formData.append("file", file);
			formData.append("folder", "banners/video");

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			if (!res.ok) throw new Error("Ошибка загрузки видео");
			const { url } = await res.json();
			setProgress(70);

			const result = await addBannerVideoAction(bannerId, url);
			if (!result.success) throw new Error(result.error);

			if (result.image) onChange([...images, result.image]);
			setUploadOpen(false);
			toast.success("Видео добавлено");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Ошибка");
		} finally {
			setIsUploading(false);
			setProgress(0);
		}
	};

	// ── Добавить видео по URL (YouTube / прямая ссылка) ──────────────────────
	const handleVideoUrlAdd = async () => {
		if (!requireBannerId()) return;
		const url = videoUrl.trim();
		if (!url) {
			toast.error("Введите URL видео");
			return;
		}
		if (images.length >= 10) {
			toast.error("Максимум 10 медиа-элементов");
			return;
		}

		const type = getMediaType(url);
		if (type === "image") {
			toast.error(
				"Это не похоже на видео-ссылку. Используйте YouTube или прямую ссылку на mp4/webm."
			);
			return;
		}

		start(async () => {
			if (bannerId === null) return;
			const thumb = videoThumbnail.trim() || undefined;
			const result = await addBannerVideoAction(bannerId, url, thumb);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			if (result.image) onChange([...images, result.image]);
			setVideoUrl("");
			setVideoThumbnail("");
			setUploadOpen(false);
			toast.success("Видео добавлено");
		});
	};

	// ── Удалить элемент ───────────────────────────────────────────────────────
	const handleDelete = (imgId: string) => {
		if (!confirm("Удалить медиа-элемент?")) return;
		start(async () => {
			const r = await deleteBannerImageAction(imgId);
			if (!r.success) {
				toast.error(r.error);
				return;
			}
			onChange(images.filter((i) => i.id !== imgId));
			toast.success("Удалено");
		});
	};

	// ── Drag-and-drop сортировка ──────────────────────────────────────────────
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
			<div className="flex items-center justify-between flex-1">
				<Label>Медиа ({images.length}/10)</Label>
				{!bannerId && (
					<span className="text-[10px] text-muted-foreground italic">
						Сохраните баннер для добавления медиа
					</span>
				)}
			</div>

			{/* Сетка превью */}
			{images.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{images.map((img, i) => {
						const isVideo = !!img.videoUrl;
						return (
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
									"relative group w-16 h-16 rounded-xl overflow-hidden border border-foreground/10",
									"cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all"
								)}
							>
								{isVideo && img.videoUrl ? (
									<div className="w-full h-full bg-black/70 flex flex-col items-center justify-center gap-1">
										<FilmSlateIcon size={18} className="text-white/60" />
										<span className="text-[8px] text-white/40 font-bold uppercase">
											{getMediaType(img.videoUrl) === "youtube" ? "YT" : "MP4"}
										</span>
									</div>
								) : (
									<Image
										src={img.url}
										alt={`медиа ${i + 1}`}
										fill
										sizes="64px"
										className="object-cover"
									/>
								)}

								{/* Порядковый номер */}
								<div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
									#{i + 1}
								</div>

								{/* Drag-иконка */}
								<div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<DotsNineIcon
										weight="bold"
										size={12}
										className="text-white drop-shadow"
									/>
								</div>

								{/* Удалить */}
								<Button
									asChild
									variant="destructive"
									size="icon"
									onClick={() => handleDelete(img.id)}
									className="absolute top-1 right-1 h-4 w-4 rounded bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<XIcon weight="bold" size={10} className="text-white" />
								</Button>

								{/* Обложка */}
								{i === 0 && (
									<div className="absolute bottom-5 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
										<span className="bg-primary text-primary-foreground text-[9px] font-black px-1 rounded">
											облoжка
										</span>
									</div>
								)}
							</button>
						);
					})}
				</div>
			)}

			{/* Кнопка добавления */}
			{images.length < 10 && (
				<Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-2 border-dashed"
						onClick={() => {
							if (!requireBannerId()) return;
							setUploadOpen(true);
						}}
					>
						<PlusIcon size={13} />
						Добавить медиа
					</Button>
					<Card>
						<DialogContent className="sm:max-w-md p-6 card-surface">
							<DialogHeader>
								<DialogTitle className="text-base font-black italic uppercase">
									Добавить медиа к баннеру
								</DialogTitle>
								<DialogDescription className="hidden">
									Добавение медиа файлов к баннеру
								</DialogDescription>
							</DialogHeader>

							<Tabs
								value={activeTab}
								onValueChange={(v) => setActiveTab(v as MediaTab)}
								className="mt-2"
							>
								<TabsList className="w-full grid grid-cols-3">
									<TabsTrigger value="photo" className="gap-1.5 text-xs">
										<ImageIcon size={13} />
										Фото
									</TabsTrigger>
									<TabsTrigger value="video-s3" className="gap-1.5 text-xs">
										<UploadSimpleIcon size={13} />
										Видео (файл)
									</TabsTrigger>
									<TabsTrigger value="video-url" className="gap-1.5 text-xs">
										<LinkIcon size={13} />
										Видео (URL)
									</TabsTrigger>
								</TabsList>

								{/* Фото через S3 */}
								<TabsContent value="photo" className="space-y-3 pt-3">
									<ImageUploader
										onFileSelect={handlePhotoUpload}
										aspectRatio={16 / 9}
									/>
									{isUploading && (
										<div className="space-y-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
											<div className="flex justify-between text-[10px] font-bold uppercase">
												<span className="animate-pulse">Загрузка...</span>
												<span>{progress}%</span>
											</div>
											<Progress value={progress} className="h-1" />
										</div>
									)}
								</TabsContent>

								{/* Видео через S3 */}
								<TabsContent value="video-s3" className="space-y-3 pt-3">
									<div className="rounded-2xl border-2 border-dashed border-foreground/10 p-6 flex flex-col items-center gap-3 text-center hover:border-foreground/20 transition-colors">
										<FilmSlateIcon
											size={32}
											className="text-muted-foreground/40"
										/>
										<div>
											<p className="text-sm font-bold">Загрузить видео-файл</p>
											<p className="text-xs text-muted-foreground mt-0.5">
												MP4, WebM · до 100 МБ
											</p>
										</div>
										<label className="cursor-pointer">
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="gap-2 pointer-events-none"
											>
												<UploadSimpleIcon size={13} />
												Выбрать файл
											</Button>
											<input
												type="file"
												accept="video/mp4,video/webm,video/quicktime"
												className="hidden"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file) handleVideoS3Upload(file);
													e.target.value = "";
												}}
											/>
										</label>
									</div>

									{isUploading && (
										<div className="space-y-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
											<div className="flex justify-between text-[10px] font-bold uppercase">
												<span className="animate-pulse">Загрузка видео...</span>
												<span>{progress}%</span>
											</div>
											<Progress value={progress} className="h-1" />
										</div>
									)}

									<p className="text-[10px] text-muted-foreground/50 italic text-center">
										Видео будет автоматически воспроизводиться без звука как фон
										карточки
									</p>
								</TabsContent>

								{/* Видео по URL */}
								<TabsContent value="video-url" className="space-y-4 pt-3">
									<div className="space-y-1.5">
										<Label>URL видео *</Label>
										<Input
											value={videoUrl}
											onChange={(e) => setVideoUrl(e.target.value)}
											placeholder="https://youtube.com/watch?v=... или https://..."
										/>
										<p className="text-[10px] text-muted-foreground/60">
											YouTube, прямая ссылка на mp4/webm
										</p>
									</div>

									<div className="space-y-1.5">
										<Label>
											Превью (необязательно){" "}
											<span className="text-muted-foreground font-normal">
												— URL картинки
											</span>
										</Label>
										<Input
											value={videoThumbnail}
											onChange={(e) => setVideoThumbnail(e.target.value)}
											placeholder="https://... (jpg, png, webp)"
										/>
										<p className="text-[10px] text-muted-foreground/60">
											Показывается пока видео не загрузилось. Для YouTube
											подставится автоматически.
										</p>
									</div>

									<Button
										type="button"
										className="w-full gap-2"
										onClick={handleVideoUrlAdd}
										disabled={!videoUrl.trim()}
									>
										<FilmSlateIcon size={13} />
										Добавить видео
									</Button>
								</TabsContent>
							</Tabs>
						</DialogContent>
					</Card>
				</Dialog>
			)}

			{images.length > 1 && (
				<p className="text-[10px] text-muted-foreground/40 italic">
					Перетащите для сортировки. Первый элемент — обложка баннера.
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
	placement: BannerPlacement;
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
	placement: "both",
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
		placement: (b.placement ?? "both") as BannerPlacement,
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
				placement: form.placement,
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
				setSavedBannerId(result.id);
				toast.success("Баннер создан. Теперь можно добавить медиа.");
				return;
			}

			toast.success(savedBannerId ? "Баннер обновлён" : "Баннер создан");
			onSaved();
			onOpenChange(false);
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-black italic uppercase tracking-tight">
						{initialBannerId ? "Изменить баннер" : "Новый баннер"}
					</DialogTitle>
					<DialogDescription className="ршввут">
						{initialBannerId ? "Обновление баннера" : "Создание нового баннера"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Тип + Размещение */}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5 col-span-1 w-full">
							<Label>Тип</Label>
							<Select
								value={form.type}
								onValueChange={(v) => set("type", v as BannerType)}
							>
								<SelectTrigger className="space-y-1.5 col-span-1 w-full">
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

						<div className="space-y-1.5 col-span-1 w-full">
							<Label>Размещение</Label>
							<Select
								value={form.placement}
								onValueChange={(v) => set("placement", v as BannerPlacement)}
							>
								<SelectTrigger className="space-y-1.5 col-span-1 w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PLACEMENT_OPTIONS.map((p) => (
										<SelectItem key={p.value} value={p.value}>
											<div className="flex items-center gap-2">
												{p.icon}
												{p.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
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
						label="Описание"
						value={form.body}
						onChange={(v) => set("body", v)}
						rows={6}
						placeholder={
							"# Заголовок\n\n- Пункт 1\n- Пункт 2\n\n[Ссылка](https://...)"
						}
					/>

					{/* Медиа */}
					<BannerMediaManager
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
