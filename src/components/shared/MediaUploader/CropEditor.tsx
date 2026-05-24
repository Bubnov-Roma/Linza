import {
	Maximize,
	Monitor,
	RectangleHorizontal,
	RotateCwSquare,
	Square,
} from "lucide-react";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { getCroppedImg } from "@/lib/crop-image";

const PRESET_ASPECTS = [
	{ label: "1:1", value: 1, icon: Square },
	{ label: "4:3", value: 4 / 3, icon: RectangleHorizontal },
	{ label: "16:9", value: 16 / 9, icon: Monitor },
];

interface CropEditorProps {
	image: string;
	initialAspect: number;
	onClose: () => void;
	onSave: (blob: Blob, type: string) => void;
}

export function CropEditor({
	image,
	initialAspect,
	onClose,
	onSave,
}: CropEditorProps) {
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [activeAspect, setActiveAspect] = useState(initialAspect);
	const [bgColor, setBgColor] = useState("#ffffff");
	const [pixels, setPixels] = useState<Area | null>(null);

	const handleResetPosition = () => {
		setCrop({ x: 0, y: 0 });
		setZoom(1);
	};

	const handleApply = async () => {
		if (!pixels) return;
		const originalType = image.split(";")[0]?.split(":")[1] ?? "image/jpeg";
		const targetType =
			originalType === "image/png" && bgColor === "transparent"
				? "image/png"
				: "image/webp";

		const blob = await getCroppedImg(image, pixels, bgColor, targetType);
		onSave(blob, targetType);
	};

	return (
		<Dialog open onOpenChange={onClose}>
			<DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-background border-white/10">
				<DialogHeader className="p-6 pb-0">
					<DialogTitle className="text-xl italic uppercase tracking-tighter">
						Редактор
					</DialogTitle>
				</DialogHeader>
				<DialogDescription
					asChild
					className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar"
				>
					<div className="px-6 py-4 flex flex-wrap gap-2 items-center border-b border-white/5">
						{PRESET_ASPECTS.map((p) => (
							<Button
								key={p.label}
								variant={activeAspect === p.value ? "outline" : "secondary"}
								size="sm"
								className="rounded-full px-4 h-8 text-[10px]"
								onClick={() => setActiveAspect(p.value)}
							>
								<p.icon size={12} className="mr-2" /> {p.label}
							</Button>
						))}
						<Button
							variant="outline"
							size="sm"
							className="rounded-full px-4 h-8 text-[10px]"
							onClick={() => setActiveAspect(1 / activeAspect)}
						>
							<RotateCwSquare size={12} className="mr-2" /> Поворот
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleResetPosition}
							className="rounded-full h-9 px-4 text-xs font-bold uppercase"
						>
							<Maximize size={14} />
							<span className="text-[10px] font-bold uppercase">
								Центрировать
							</span>
						</Button>
						<div className="flex items-center gap-3 ml-auto pl-4 border-l border-white/10">
							<span className="text-[10px] font-bold opacity-40">Фон:</span>
							<input
								type="color"
								value={bgColor === "transparent" ? "#000000" : bgColor}
								onChange={(e) => setBgColor(e.target.value)}
								className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0"
							/>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-[9px] hover:bg-white/5"
								onClick={() => setBgColor("transparent")}
							>
								Прозрачный
							</Button>
						</div>
					</div>
				</DialogDescription>
				<div className="relative w-full aspect-video bg-muted-foreground/40">
					<Cropper
						image={image}
						crop={crop}
						zoom={zoom}
						aspect={activeAspect}
						onCropChange={setCrop}
						onZoomChange={setZoom}
						onCropComplete={(_, p) => setPixels(p)}
						showGrid={true}
						restrictPosition={false}
						minZoom={0.1}
						zoomWithScroll={true}
						objectFit="contain"
						classes={{
							containerClassName: "cursor-move",
							cropAreaClassName:
								"border-2 border-primary shadow-[0_0_0_1000px_rgba(0,0,0,0.7)]",
						}}
					/>
				</div>

				<div className="p-6 space-y-6">
					<div className="flex items-center gap-6">
						<Slider
							value={[zoom]}
							min={0.1}
							max={3}
							step={0.01}
							onValueChange={([v]) => setZoom(v ?? 1)}
							className="flex-1"
						/>
						<span className="text-[10px] font-mono opacity-50">
							{Math.round(zoom * 100)}%
						</span>
					</div>
					<DialogFooter>
						<Button variant="ghost" onClick={onClose} className="rounded-xl">
							Отмена
						</Button>
						<Button
							onClick={handleApply}
							className="rounded-xl px-12 bg-primary"
						>
							Применить
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
