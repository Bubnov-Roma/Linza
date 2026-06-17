import {
	FilmSlateIcon,
	VideoIcon,
	YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Label, Textarea } from "@/components/ui";

const getProviderIcon = (url: string) => {
	if (url.includes("youtube") || url.includes("youtu.be"))
		return <YoutubeLogoIcon size={14} className="text-red-500" />;
	if (url.includes("vk.com") || url.includes("vkvideo.ru"))
		return <FilmSlateIcon size={14} className="text-blue-500" />;
	if (url.includes("rutube"))
		return <VideoIcon size={14} className="text-emerald-500" />;
	return <VideoIcon size={14} className="text-muted-foreground" />;
};

export function VideoUrlsEditor({
	value,
	onChange,
}: {
	value: string[];
	onChange: (urls: string[]) => void;
}) {
	return (
		<div className="space-y-3">
			<Label className="flex items-center gap-2">
				✅ Видеообзоры
				<span className="font-normal text-muted-foreground text-[10px] uppercase tracking-wider">
					(YouTube, VK, RuTube)
				</span>
			</Label>

			<div className="relative group">
				<Textarea
					value={value.join("\n")}
					onChange={(e) => {
						const urls = e.target.value
							.split("\n")
							.map((u) => u.trim())
							.filter(Boolean);
						onChange(urls);
					}}
					placeholder="Вставьте ссылку на видео..."
					rows={4}
					className="font-mono text-xs resize-none glass-input"
				/>
			</div>

			{value.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{value.map((url, i) => (
						<div
							key={i}
							className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/50 border border-white/5 text-[10px] text-muted-foreground"
						>
							{getProviderIcon(url)}
							<span className="truncate max-w-37.5">{url}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
