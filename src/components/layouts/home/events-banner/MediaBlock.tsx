import Image from "next/image";
import { VideoEmbed } from "@/components/shared";
import { cn } from "@/lib/utils";
import { getMediaType } from "@/utils";

export function MediaBlock({
	url,
	alt,
	className,
	isFull = false,
	thumbnail,
}: {
	url: string;
	alt: string;
	className?: string;
	isFull?: boolean;
	thumbnail?: string | null;
}) {
	const type = getMediaType(url);

	if (
		["youtube", "video", "vk-video", "vk-post", "rutube", "vimeo"].includes(
			type
		)
	) {
		return (
			<VideoEmbed
				url={url}
				{...(thumbnail && { thumbnail })}
				className={cn(
					isFull
						? "h-full rounded-none"
						: "aspect-video rounded-t-3xl md:rounded-t-3xl",
					className
				)}
			/>
		);
	}

	return (
		<div
			className={cn(
				"relative w-full",
				isFull ? "h-full" : "aspect-video",
				className
			)}
		>
			<Image
				src={url}
				alt={alt}
				fill
				priority
				sizes={isFull ? "100vw" : "(max-width: 768px) 100vw, 670px"}
				className={cn(
					isFull
						? "object-contain"
						: "object-cover sm:rounded-t-3xl rounded-none"
				)}
			/>
		</div>
	);
}
