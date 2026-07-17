"use client";

import { DownloadSimpleIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { type ChangeEvent, type DragEvent, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
	preview: string | null;
	isPreviewVideo?: boolean;
	aspectRatio: number;
	onFileSelect: (file: File) => void;
	onClear: () => void;
	acceptType?: "image" | "video" | "both";
}

export function FileDropzone({
	preview,
	isPreviewVideo = false,
	aspectRatio,
	onFileSelect,
	onClear,
	acceptType = "both",
}: FileDropzoneProps) {
	const [isDragging, setIsDragging] = useState(false);

	const processFile = (file: File): void => {
		if (acceptType === "image" && !file.type.startsWith("image/")) return;
		if (acceptType === "video" && !file.type.startsWith("video/")) return;
		if (
			acceptType === "both" &&
			!file.type.startsWith("image/") &&
			!file.type.startsWith("video/")
		)
			return;
		onFileSelect(file);
	};

	const handleDragOver = (e: DragEvent<HTMLLabelElement>): void => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (): void => {
		setIsDragging(false);
	};

	const handleDrop = (e: DragEvent<HTMLLabelElement>): void => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files?.[0]) {
			processFile(e.dataTransfer.files[0]);
		}
	};

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
		if (e.target.files?.[0]) {
			processFile(e.target.files[0]);
			e.target.value = ""; // Сброс инпута
		}
	};

	const getAcceptAttribute = (): string => {
		if (acceptType === "image") return "image/*";
		if (acceptType === "video") return "video/*";
		return "image/*,video/*";
	};

	return (
		<label
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className={cn(
				"relative group block overflow-hidden border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer hover:bg-muted-foreground/5",
				isDragging
					? "border-primary bg-primary/5 scale-[1.02]"
					: "border-foreground/10 hover:border-foreground/20",
				preview ? "border-transparent" : ""
			)}
		>
			<AspectRatio ratio={aspectRatio}>
				{preview ? (
					isPreviewVideo ? (
						<video
							src={preview}
							className="w-full h-full object-cover"
							muted
							playsInline
						/>
					) : preview.startsWith("blob:") ? (
						// biome-ignore lint/performance/noImgElement: <for preview>
						<img
							src={preview}
							alt="Превью"
							className="w-full h-full object-cover"
						/>
					) : (
						<Image src={preview} alt="Превью" fill className="object-cover" />
					)
				) : (
					<span className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground group-hover:text-foreground/80 group-hover:scale-102 transition-all duration-300">
						<DownloadSimpleIcon
							size={30}
							className={cn(
								"bg-muted-foreground/5 group-hover:bg-muted-foreground/20 hover:text-foreground rounded-full p-2 transition-colors duration-300",
								isDragging && "text-primary bg-primary/30"
							)}
						/>
						<span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">
							{acceptType === "image" && "Загрузить фото"}
							{acceptType === "video" && "Загрузить видео"}
							{acceptType === "both" && "Загрузить фото или видео"}
						</span>
					</span>
				)}
				<input
					type="file"
					accept={getAcceptAttribute()}
					className="hidden"
					onChange={handleInputChange}
				/>
			</AspectRatio>

			{preview && (
				<Button
					variant="destructive"
					size="icon"
					type="button"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onClear();
					}}
					className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
				>
					<XIcon size={12} />
				</Button>
			)}
		</label>
	);
}
