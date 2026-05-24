"use client";

import { DotsNineIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
	deleteImageAction,
	linkImageToEquipmentAction,
	reorderImagesAction,
} from "@/actions/upload-actions";
import { MediaUploader } from "@/components/shared";
import {
	Card,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ImageItem {
	id: string; // image.id из БД
	url: string;
}

interface ImageCellProps {
	equipmentId: string;
	equipmentSlug?: string; // slug isPrimary позиции → папка в S3
	initialImages: ImageItem[];
}

export function ImageCell({
	equipmentId,
	equipmentSlug,
	initialImages,
}: ImageCellProps) {
	const [images, setImages] = useState<ImageItem[]>(initialImages);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [open, setOpen] = useState(false);

	// ── Drag & drop ────────────────────────────────────────────────────────────
	const dragIndex = useRef<number | null>(null);
	const dragOverIndex = useRef<number | null>(null);

	const handleDragStart = useCallback((index: number) => {
		dragIndex.current = index;
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
		e.preventDefault();
		dragOverIndex.current = index;
	}, []);

	const handleDrop = useCallback(async () => {
		const from = dragIndex.current;
		const to = dragOverIndex.current;
		if (from === null || to === null || from === to) return;

		const reordered = [...images];
		const [moved] = reordered.splice(from, 1);
		if (!moved) return;
		reordered.splice(to, 0, moved);

		setImages(reordered);
		dragIndex.current = null;
		dragOverIndex.current = null;

		// Сохраняем новый порядок в БД
		const result = await reorderImagesAction(
			equipmentId,
			reordered.map((img) => img.id)
		);
		if (!result.success) {
			toast.error("Не удалось сохранить порядок");
			setImages(images); // откатываем
		}
	}, [images, equipmentId]);

	// ── Upload ─────────────────────────────────────────────────────────────────
	const handleUpload = async (file: File | null) => {
		if (!file) return;
		setIsUploading(true);
		setUploadProgress(0);

		try {
			const formData = new FormData();
			formData.append("file", file);
			// Папка = slug позиции если есть, иначе equipment
			formData.append(
				"folder",
				equipmentSlug ? `equipment/${equipmentSlug}` : "equipment"
			);

			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Ошибка загрузки");
			}

			const { url } = await res.json();
			setUploadProgress(50);

			const newImageData = await linkImageToEquipmentAction(equipmentId, url);
			setUploadProgress(100);

			// Новое фото добавляем в конец (порядок сохраняется)
			setImages((prev) => [...prev, newImageData]);
			setOpen(false);
			toast.success("Фото загружено");
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(
				error instanceof Error ? error.message : "Не удалось загрузить фото"
			);
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	// ── Delete ─────────────────────────────────────────────────────────────────
	const handleDelete = async (
		imageId: string,
		imageUrl: string,
		e: React.MouseEvent
	) => {
		e.stopPropagation();
		if (!confirm("Удалить фото?")) return;

		try {
			const result = await deleteImageAction(imageId, imageUrl);
			if (!result.success) {
				toast.error(result.error || "Ошибка удаления");
				return;
			}
			setImages((prev) => prev.filter((img) => img.id !== imageId));
			toast.success("Фото удалено");
		} catch {
			toast.error("Ошибка удаления");
		}
	};

	return (
		<div className="space-y-3">
			{/* Ряд всех загруженных фото с drag & drop */}

			<div className="flex flex-wrap gap-2 items-center justify-start">
				{images.length > 0 && (
					<div className="flex flex-wrap gap-2 items-center justify-between">
						{images.map((img, index) => (
							<Card
								key={img.id}
								draggable
								onDragStart={() => handleDragStart(index)}
								onDragOver={(e) => handleDragOver(e, index)}
								onDrop={handleDrop}
								className={cn(
									"relative group w-20 h-20 rounded-xl overflow-hidden border border-foreground/10",
									"cursor-grab active:cursor-grabbing transition-all duration-150",
									"hover:border-primary/40 hover:shadow-md"
								)}
							>
								<Image
									src={img.url}
									alt={`Фото ${index + 1}`}
									fill
									sizes="80px"
									className="object-cover"
									onError={(e) => {
										(e.target as HTMLImageElement).src =
											"/placeholder-equipment.png";
									}}
								/>

								{/* Порядковый номер */}
								<div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
									#{index + 1}
								</div>

								{/* Иконка перетаскивания */}
								<div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
									<DotsNineIcon
										weight="bold"
										size={16}
										className="text-primary drop-shadow"
									/>
								</div>

								<button
									type="button"
									onClick={(e) => handleDelete(img.id, img.url, e)}
									className="absolute rounded-md top-1 right-1 h-4 w-4 bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-0"
								>
									<XIcon weight="bold" size={16} className="text-white" />
								</button>
							</Card>
						))}
					</div>
				)}
				{/* Кнопка добавления */}
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Card
							className={cn(
								"flex text-center items-center justify-center gap-2 group w-20 h-20 p-0 rounded-xl overflow-hidden border border-dotted border-foreground/10",
								"cursor-pointer transition-all duration-150",
								"hover:border-foreground hover:shadow-md"
							)}
						>
							<p className="font-black text-[10px] uppercase m-auto text-muted-foreground group-hover:text-foreground duration-150">
								Добавить новую картинку
							</p>
						</Card>
					</DialogTrigger>
					<DialogContent className="sm:max-w-md p-6">
						<DialogHeader>
							<DialogTitle className="text-lg font-bold italic uppercase tracking-tighter">
								Добавить фото
							</DialogTitle>
						</DialogHeader>
						<DialogDescription asChild>
							<div className="space-y-4">
								<MediaUploader
									onFileSelect={handleUpload}
									aspectRatio={1.5}
									acceptType="image"
									className="h-full"
								/>
								{isUploading && (
									<div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
										<div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
											<span className="animate-pulse">
												Отправка в облако...
											</span>
											<span>{uploadProgress}%</span>
										</div>
										<Progress value={uploadProgress} className="h-1.5" />
									</div>
								)}
							</div>
						</DialogDescription>
					</DialogContent>
				</Dialog>
			</div>
			{images.length === 0 && (
				<p className="text-xs text-muted-foreground/50 italic">
					Нет фотографий. Нажмите «+» чтобы добавить.
				</p>
			)}

			{images.length > 1 && (
				<p className="text-[10px] text-muted-foreground/40 italic">
					Перетащите фото для изменения порядка. Первое фото — обложка.
				</p>
			)}
		</div>
	);
}
