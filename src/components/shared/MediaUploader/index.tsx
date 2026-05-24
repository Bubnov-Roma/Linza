"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { isVideoFileUrl } from "@/utils";
import { CropEditor } from "./CropEditor";
import { FileDropzone } from "./FileDropzone";

interface MediaUploaderProps {
	currentUrl?: string;
	onFileSelect: (file: File | null) => void;
	aspectRatio?: number;
	acceptType?: "image" | "video" | "both";
	className?: string;
}

export function MediaUploader({
	currentUrl,
	onFileSelect,
	aspectRatio = 1,
	acceptType = "both",
	className,
}: MediaUploaderProps) {
	const [imageToCrop, setImageToCrop] = useState<string | null>(null);
	const [preview, setPreview] = useState<string | null>(currentUrl || null);
	const [isVideo, setIsVideo] = useState<boolean>(false);

	// Стейты для окна подтверждения медиа
	const [confirmingBlob, setConfirmingBlob] = useState<Blob | null>(null);
	const [confirmingFile, setConfirmingFile] = useState<File | null>(null);
	const [confirmingPreviewUrl, setConfirmingPreviewUrl] = useState<
		string | null
	>(null);
	const [targetMimeType, setTargetMimeType] = useState("image/webp");

	// Следим за изменением медиа извне
	useEffect(() => {
		if (currentUrl) {
			setIsVideo(isVideoFileUrl(currentUrl));
			setPreview(currentUrl);
		} else {
			setPreview(null);
			setIsVideo(false);
		}
	}, [currentUrl]);

	const handleFileSelect = (file: File): void => {
		if (file.type.startsWith("image/")) {
			const reader = new FileReader();
			reader.onload = () => {
				setImageToCrop(reader.result as string);
			};
			reader.readAsDataURL(file);
		} else if (file.type.startsWith("video/")) {
			// Для видео кроп не нужен — генерируем Blob URL для превью и открываем финальное подтверждение
			const objectUrl = URL.createObjectURL(file);
			setConfirmingFile(file);
			setConfirmingPreviewUrl(objectUrl);
			setTargetMimeType(file.type);
		}
	};

	// Метод вызывается из CropEditor для изображений
	const handleCropDone = (blob: Blob, type: string): void => {
		setConfirmingBlob(blob);
		setConfirmingPreviewUrl(URL.createObjectURL(blob));
		setTargetMimeType(type);
	};

	const handleFinalConfirm = (): void => {
		if (confirmingBlob) {
			const ext = targetMimeType.split("/")[1] || "webp";
			const finalFile = new File(
				[confirmingBlob],
				`upload_${Date.now()}.${ext}`,
				{
					type: targetMimeType,
				}
			);
			setIsVideo(false);
			setPreview(confirmingPreviewUrl);
			onFileSelect(finalFile);
		} else if (confirmingFile) {
			setIsVideo(true);
			setPreview(confirmingPreviewUrl);
			onFileSelect(confirmingFile);
		}

		// Сброс временных стейтов подтверждения
		setConfirmingBlob(null);
		setConfirmingFile(null);
		setConfirmingPreviewUrl(null);
		setImageToCrop(null);
	};

	const handleBackOrCancel = (): void => {
		if (confirmingBlob) {
			// Возврат к обрезке фото
			setConfirmingBlob(null);
			if (confirmingPreviewUrl) URL.revokeObjectURL(confirmingPreviewUrl);
			setConfirmingPreviewUrl(null);
		} else {
			// Сброс для видео
			handleCancelAll();
		}
	};

	const handleCancelAll = (): void => {
		setImageToCrop(null);
		setConfirmingBlob(null);
		setConfirmingFile(null);
		if (confirmingPreviewUrl?.startsWith("blob:")) {
			URL.revokeObjectURL(confirmingPreviewUrl);
		}
		setConfirmingPreviewUrl(null);
	};

	const handleClear = (): void => {
		if (preview?.startsWith("blob:")) {
			URL.revokeObjectURL(preview);
		}
		setPreview(null);
		setIsVideo(false);
		onFileSelect(null);
	};

	return (
		<div className={cn("w-full", className)}>
			<FileDropzone
				preview={preview}
				isPreviewVideo={isVideo}
				aspectRatio={aspectRatio}
				onFileSelect={handleFileSelect}
				onClear={handleClear}
				acceptType={acceptType}
			/>

			{/* Окно Кроппера картинок */}
			{imageToCrop && (
				<CropEditor
					image={imageToCrop}
					initialAspect={aspectRatio}
					onClose={handleCancelAll}
					onSave={handleCropDone}
				/>
			)}

			{/* Универсальное окно финализации превью */}
			<AlertDialog
				open={!!confirmingPreviewUrl}
				onOpenChange={(open) => !open && handleCancelAll()}
			>
				<AlertDialogContent className="max-w-md rounded-2xl p-6 bg-background">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-xs font-black uppercase tracking-wider text-center">
							Проверить превью перед сохранением
						</AlertDialogTitle>
						<AlertDialogDescription className="text-center text-[11px] text-muted-foreground pb-2">
							Так файл будет выглядеть на платформе
						</AlertDialogDescription>

						<div className="relative w-full aspect-video overflow-hidden rounded-xl border border-white/5 bg-black shadow-sm mb-4 flex items-center justify-center">
							{confirmingPreviewUrl &&
								(confirmingFile ? (
									<video
										src={confirmingPreviewUrl}
										autoPlay
										controls
										playsInline
										preload="metadata"
										className="w-full h-full object-contain"
									>
										<track kind="captions" />
									</video>
								) : (
									<Image
										alt="Итоговое превью"
										src={confirmingPreviewUrl}
										fill
										className="object-contain"
									/>
								))}
						</div>
					</AlertDialogHeader>

					<AlertDialogFooter className="flex gap-2 sm:flex-row flex-col">
						<AlertDialogCancel asChild>
							<Button
								variant="ghost"
								onClick={handleBackOrCancel}
								className="rounded-xl flex-1 uppercase text-[10px] font-bold"
							>
								{confirmingFile ? "Отмена" : "Изменить кадрирование"}
							</Button>
						</AlertDialogCancel>

						<AlertDialogAction asChild>
							<Button
								onClick={handleFinalConfirm}
								className="rounded-xl flex-1 bg-primary/60 uppercase text-[10px]"
							>
								Подтвердить
							</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
