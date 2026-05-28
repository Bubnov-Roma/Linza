"use client";

import {
	CheckIcon,
	DotsNineIcon,
	FilmSlateIcon,
	ImageIcon,
	InfoIcon,
	LinkIcon,
	PlusIcon,
	UploadSimpleIcon,
	XIcon,
} from "@phosphor-icons/react";
import { DialogDescription } from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { BannerImage } from "@/actions/admin-banner-actions";
import {
	addBannerImageAction,
	addBannerVideoAction,
	deleteBannerImageAction,
	reorderBannerImagesAction,
} from "@/actions/admin-banner-actions";
import { MediaUploader, VideoEmbed } from "@/components/shared"; // Предполагаем, что MarkdownEditor здесь не нужен
import {
	Button,
	CardContent,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getEmbedUrl, getMediaType } from "@/utils";

type MediaTab = "photo" | "photo-url" | "video-s3" | "video-url";

interface BannerMediaManagerProps {
	bannerId: string | null;
	images: BannerImage[];
	onChange: (imgs: BannerImage[]) => void;
}

export function BannerMediaManager({
	bannerId,
	images,
	onChange,
}: BannerMediaManagerProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<MediaTab>("photo");
	const [uploaderKey, setUploaderKey] = useState(0);

	const [externalPhotoUrl, setExternalPhotoUrl] = useState("");
	const [videoUrl, setVideoUrl] = useState("");
	const [videoThumbnail, setVideoThumbnail] = useState("");
	const [isPending, start] = useTransition();

	const dragIndex = useRef<number | null>(null);
	const dragOverIndex = useRef<number | null>(null);

	const requireBannerId = () => {
		if (!bannerId) {
			toast.error("Сначала сохраните баннер, затем добавляйте медиа");
			return false;
		}
		return true;
	};

	// 1. Загрузка фото в S3
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
			setUploaderKey((k) => k + 1);
			setUploadOpen(false);
			setUploadOpen(false);
			toast.success("Фото добавлено");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Ошибка");
		} finally {
			setIsUploading(false);
			setProgress(0);
		}
	};

	// 2. Добавление внешнего фото по URL
	const handleExternalPhotoAdd = async () => {
		if (!requireBannerId()) return;
		const url = externalPhotoUrl.trim();
		if (!url) {
			toast.error("Введите URL изображения");
			return;
		}
		if (images.length >= 10) {
			toast.error("Максимум 10 медиа-элементов");
			return;
		}

		start(async () => {
			if (bannerId === null) return;
			const result = await addBannerImageAction(bannerId, url);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			if (result.image) {
				onChange([...images, result.image]);
			}
			setExternalPhotoUrl("");
			setUploadOpen(false);
			toast.success("Внешнее фото успешно привязано");
		});
	};

	// 3. Загрузка видео-файла в S3
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

	// 4. Добавить сторонний видео-ресурс по ссылке
	const handleVideoUrlAdd = async () => {
		if (!requireBannerId()) return;
		const rawUrl = videoUrl.trim();
		if (!rawUrl) {
			toast.error("Введите URL или код виджета");
			return;
		}
		if (images.length >= 10) {
			toast.error("Максимум 10 медиа-элементов");
			return;
		}

		let finalUrl = rawUrl;
		const mediaType = getMediaType(rawUrl);

		if (mediaType === "image") {
			toast.error("Это ссылка на картинку. Используйте вкладку 'Фото URL'");
			return;
		}

		if (mediaType === "vk-post") {
			const parsed = getEmbedUrl(rawUrl);
			if (!parsed) {
				toast.error("Не удалось извлечь рабочую ссылку из кода виджета ВК");
				return;
			}
			finalUrl = parsed;
		}

		start(async () => {
			if (bannerId === null) return;
			const thumb = videoThumbnail.trim() || undefined;
			const result = await addBannerVideoAction(bannerId, finalUrl, thumb);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			if (result.image) onChange([...images, result.image]);
			setVideoUrl("");
			setVideoThumbnail("");
			setUploadOpen(false);
			toast.success("Медиа-ресурс добавлен");
		});
	};

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

			{images.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{images.map((img, i) => {
						const isVideo = !!img.videoUrl;
						return (
							<CardContent
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
											{getMediaType(img.videoUrl)}
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

								<div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
									#{i + 1}
								</div>

								<div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<DotsNineIcon
										weight="bold"
										size={12}
										className="text-white drop-shadow"
									/>
								</div>

								<Button
									type="button"
									variant="destructive"
									size="icon"
									onClick={(e) => {
										e.stopPropagation();
										handleDelete(img.id);
									}}
									className="absolute top-1 right-1 h-4 w-4 rounded bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<XIcon weight="bold" size={10} className="text-white" />
								</Button>

								{i === 0 && (
									<div className="absolute bottom-5 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
										<span className="bg-primary text-primary-foreground text-[9px] font-black px-1 rounded">
											обложка
										</span>
									</div>
								)}
							</CardContent>
						);
					})}
				</div>
			)}

			{images.length < 10 && (
				<Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="w-full"
						onClick={() => {
							if (requireBannerId()) setUploadOpen(true);
						}}
					>
						<PlusIcon size={13} />
						Добавить медиа
					</Button>

					<DialogContent className="max-w-md sm:max-w-lg p-6 card-surface max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col justify-between">
						<DialogHeader>
							<DialogTitle className="text-base font-black italic uppercase">
								Добавить медиа к баннеру
							</DialogTitle>
							<DialogDescription className="hidden">
								Выгрузка медиа-контента
							</DialogDescription>
						</DialogHeader>

						<Tabs
							value={activeTab}
							onValueChange={(v) => setActiveTab(v as MediaTab)}
							className="mt-2"
						>
							<TabsList className="w-full grid grid-cols-4">
								<TabsTrigger value="photo" className="text-[11px] gap-1 px-1">
									<ImageIcon size={12} /> Файл
								</TabsTrigger>
								<TabsTrigger
									value="photo-url"
									className="text-[11px] gap-1 px-1"
								>
									<LinkIcon size={12} /> Фото URL
								</TabsTrigger>
								<TabsTrigger
									value="video-s3"
									className="text-[11px] gap-1 px-1"
								>
									<UploadSimpleIcon size={12} /> Видео файл
								</TabsTrigger>
								<TabsTrigger
									value="video-url"
									className="text-[11px] gap-1 px-1"
								>
									<FilmSlateIcon size={12} /> Видео URL
								</TabsTrigger>
							</TabsList>

							{/* Таб 1: Загрузка фото в S3 */}
							<TabsContent value="photo" className="space-y-3 pt-3">
								<MediaUploader
									key={uploaderKey}
									acceptType="image"
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

							{/* Таб 2: Вставка внешней ссылки фото */}
							<TabsContent value="photo-url" className="space-y-4 pt-3">
								<div className="space-y-1.5">
									<Label>Прямая ссылка на изображение из </Label>
									<Input
										value={externalPhotoUrl}
										onChange={(e) => setExternalPhotoUrl(e.target.value)}
										placeholder="https://i.ibb.co/XYZ/image.png"
									/>
									<p className="text-[10px] text-muted-foreground/60">
										Ссылка должна вести напрямую на изображение (jpg, png,
										webp).
									</p>
								</div>
								{externalPhotoUrl.trim() && (
									<div className="relative w-full aspect-video rounded-xl overflow-hidden border border-foreground/10 bg-black/5">
										<Image
											src={externalPhotoUrl}
											alt="Превью"
											fill
											className="object-cover"
										/>
									</div>
								)}
								<Button
									type="button"
									className="w-full gap-2"
									onClick={handleExternalPhotoAdd}
									disabled={isPending || !externalPhotoUrl.trim()}
								>
									<CheckIcon size={13} />
									Привязать изображение
								</Button>
							</TabsContent>

							{/* Таб 3: Видео файл в S3 */}
							<TabsContent value="video-s3" className="space-y-3 pt-3">
								<MediaUploader
									acceptType="video"
									onFileSelect={handleVideoS3Upload}
									aspectRatio={16 / 9}
								/>
								{isUploading && (
									<div className="space-y-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
										<div className="flex justify-between text-[10px] font-bold uppercase">
											<span className="animate-pulse">Загрузка видео...</span>
											<span>{progress}%</span>
										</div>
										<Progress value={progress} className="h-1" />
									</div>
								)}
							</TabsContent>

							{/* Таб 4: Потоковое видео (YouTube, ВК Скрипты/Ссылки) */}
							<TabsContent value="video-url" className="space-y-4 pt-3">
								<div className="space-y-1.5">
									<Label>Ссылка или код виджета ВК/YouTube *</Label>
									<Input
										value={videoUrl}
										onChange={(e) => setVideoUrl(e.target.value)}
										placeholder="vk.com/wall... или <div id='vk_post_'></div>..."
									/>
								</div>

								{videoUrl.trim() && (
									<div className="space-y-1">
										<Label className="text-[10px] uppercase tracking-wider opacity-60">
											Предпросмотр:
										</Label>
										<div className="max-h-70 overflow-y-auto rounded-xl border border-foreground/10 bg-black/40 flex items-center justify-center custom-scrollbar">
											<VideoEmbed url={videoUrl} className="w-full h-full" />
										</div>
									</div>
								)}

								<div className="space-y-1.5 gap-2">
									<Label>
										Заставка (необязательно) — URL картинки
										<Tooltip>
											<TooltipTrigger>
												<InfoIcon size={12} weight="bold" />
											</TooltipTrigger>
											<TooltipContent>
												<p>
													Поддерживаются прямые ссылки на изображения с
													фотохостинга{" "}
													<Link
														href="https://imgbb.com/"
														target="_blank"
														className="uppercase hover:underline"
													>
														{" "}
														imgbb.com{" "}
													</Link>{" "}
												</p>
											</TooltipContent>
										</Tooltip>
									</Label>
									<Input
										value={videoThumbnail}
										onChange={(e) => setVideoThumbnail(e.target.value)}
										placeholder="https://i.ibb.co/... (jpg, png, webp)"
									/>
								</div>

								<Button
									type="button"
									className="w-full gap-2"
									onClick={handleVideoUrlAdd}
									disabled={isPending || !videoUrl.trim()}
								>
									<FilmSlateIcon size={13} />
									Добавить медиа-ресурс
								</Button>
							</TabsContent>
						</Tabs>
					</DialogContent>
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
