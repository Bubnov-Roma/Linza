"use client";

import {
	CalendarBlankIcon,
	CameraIcon,
	CheckIcon,
	ClockIcon,
	ImageIcon,
	LightningIcon,
	SparkleIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import type { StudioTariffData } from "@/actions/admin/admin-studio-actions";
import { Lightbox } from "@/components/core/Lightbox";
import { StudioBookingSheet } from "@/components/studio/StudioBookingSheet";
import { Button, CardContent } from "@/components/ui";
import { cn, fmtRub } from "@/lib/utils";

// ─── Studio images ─────────────────────────────────────────────────────────────
// Используем изображения из тарифов + fallback
function collectStudioImages(tariffs: StudioTariffData[]): string[] {
	return tariffs.flatMap((t) => t.imageUrls).slice(0, 12);
}

// ─── TariffBadge ──────────────────────────────────────────────────────────────

const TARIFF_ICONS: Record<string, React.ReactNode> = {
	default: <CameraIcon weight="duotone" size={28} />,
	база: <LightningIcon weight="duotone" size={28} />,
	интервью: <SparkleIcon weight="duotone" size={28} />,
	хромакей: <ImageIcon weight="duotone" size={28} />,
};

function getTariffIcon(name: string) {
	const lower = name.toLowerCase();
	for (const key of Object.keys(TARIFF_ICONS)) {
		if (lower.includes(key)) return TARIFF_ICONS[key];
	}
	return TARIFF_ICONS.default;
}

// ─── TariffCard ───────────────────────────────────────────────────────────────

function PublicTariffCard({
	tariff,
	onBook,
}: {
	tariff: StudioTariffData;
	onBook: (tariffId: string) => void;
}) {
	const detailLines = tariff.details
		? tariff.details.split("\n").filter(Boolean)
		: [];

	return (
		<div className="group flex flex-col h-full rounded-3xl border border-foreground/8 bg-card/50 overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
			{/* Image or gradient header */}
			{tariff.imageUrls[0] ? (
				<div className="relative aspect-video overflow-hidden">
					<Image
						src={tariff.imageUrls[0]}
						alt={tariff.name}
						fill
						sizes="(max-width:768px) 100vw, 33vw"
						className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
					/>
					<div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />
					<div className="absolute bottom-4 left-4">
						<span className="text-2xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
							{tariff.name}
						</span>
					</div>
				</div>
			) : (
				<div className="aspect-video bg-linear-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center gap-3">
					<div className="text-primary/60">{getTariffIcon(tariff.name)}</div>
					<span className="text-xl font-black italic uppercase tracking-tighter text-foreground">
						{tariff.name}
					</span>
				</div>
			)}

			{/* Content */}
			<div className="flex flex-col flex-1 p-6 gap-4">
				{tariff.description && (
					<p className="text-sm text-muted-foreground leading-relaxed">
						{tariff.description}
					</p>
				)}

				{/* Price */}
				<div className="flex items-baseline gap-1.5">
					<span className="text-3xl font-black text-primary">
						{fmtRub(tariff.pricePerHour)}
					</span>
					<span className="text-sm text-muted-foreground font-medium">
						/час
					</span>
				</div>

				{/* Details checklist */}
				{detailLines.length > 0 && (
					<ul className="space-y-1.5">
						{detailLines.map((line, i) => (
							<li key={i} className="flex items-start gap-2 text-sm">
								<CheckIcon
									size={14}
									weight="bold"
									className="text-primary shrink-0 mt-0.5"
								/>
								<span className="text-muted-foreground">{line}</span>
							</li>
						))}
					</ul>
				)}

				<Button
					onClick={() => onBook(tariff.id)}
					className="mt-auto w-full h-12 rounded-2xl font-bold shadow-sm shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-200"
				>
					Выбрать тариф
				</Button>
			</div>
		</div>
	);
}

// ─── HeroGallery ─────────────────────────────────────────────────────────────

function HeroGallery({
	images,
	onImageClick,
}: {
	images: string[];
	onImageClick: (src: string) => void;
}) {
	if (images.length === 0) {
		return (
			<div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-linear-to-br from-primary/30 via-primary/10 to-background flex items-center justify-center">
				<div className="text-center space-y-2">
					<CameraIcon size={64} className="text-primary/30 mx-auto" />
					<p className="text-sm text-muted-foreground">
						Фотографии студии появятся после добавления тарифов
					</p>
				</div>
			</div>
		);
	}

	// Grid layout: 1 большой + несколько маленьких
	const [main, ...rest] = images;
	const thumbs = rest.slice(0, 4);

	return (
		<div className="grid grid-cols-4 grid-rows-2 gap-2 h-120 md:h-135">
			{/* Main image - spans 3 cols x 2 rows */}
			<CardContent
				className="col-span-3 row-span-2 relative rounded-3xl overflow-hidden cursor-zoom-in group"
				onClick={() => main && onImageClick(main)}
			>
				{main && (
					<Image
						src={main}
						alt="Фотостудия Linza"
						fill
						sizes="(max-width:768px) 100vw, 75vw"
						priority
						className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
					/>
				)}
				<div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
			</CardContent>
			{/* Thumbnails - 1 col x 2 rows */}
			<div className="col-span-1 row-span-2 flex flex-col gap-2">
				{thumbs.map((src, i) => (
					<button
						type="button"
						key={src + i}
						className={cn(
							"relative flex-1 rounded-2xl overflow-hidden cursor-zoom-in group",
							i === 3 && rest.length > 4 ? "opacity-80 cursor-pointer" : ""
						)}
						onClick={() => onImageClick(src)}
					>
						<Image
							src={src}
							alt={`Студия ${i + 2}`}
							fill
							sizes="25vw"
							className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
						/>
						{i === 3 && rest.length > 4 && (
							<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
								<span className="text-white font-black text-lg">
									+{rest.length - 3}
								</span>
							</div>
						)}
					</button>
				))}
				{/* Fill empty slots */}
				{Array.from({ length: Math.max(0, 2 - thumbs.length) }).map((_, i) => (
					<div
						key={`empty-${i}`}
						className="flex-1 rounded-2xl bg-foreground/5"
					/>
				))}
			</div>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface StudioPageClientProps {
	tariffs: StudioTariffData[];
}

export function StudioPageClient({ tariffs }: StudioPageClientProps) {
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const [bookingOpen, setBookingOpen] = useState(false);
	const [initialTariffId, setInitialTariffId] = useState<string | undefined>();

	const studioImages = collectStudioImages(tariffs);
	const allImages = studioImages.length > 0 ? studioImages : [];

	const handleBook = (tariffId?: string) => {
		setInitialTariffId(tariffId);
		setBookingOpen(true);
	};

	return (
		<>
			{lightboxSrc && (
				<Lightbox
					src={lightboxSrc}
					title="Фотостудия Linza"
					onClose={() => setLightboxSrc(null)}
				/>
			)}

			<StudioBookingSheet
				open={bookingOpen}
				onOpenChange={setBookingOpen}
				initialTariffId={initialTariffId ?? ""}
			/>

			<div className="max-w-7xl mx-auto px-4 py-8 space-y-20 pb-24">
				{/* ── Hero ── */}
				<section className="space-y-6">
					<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
						<div className="space-y-2">
							<h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
								Студия Linza
							</h1>
						</div>
						<Button
							size="xl"
							onClick={() => handleBook()}
							className="h-14 px-8 rounded-xl font-black text-sm uppercase tracking-wide shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-200 shrink-0"
						>
							<CalendarBlankIcon size={18} className="mr-2" />
							Забронировать
						</Button>
					</div>

					{/* Gallery */}
					<HeroGallery images={allImages} onImageClick={setLightboxSrc} />

					{/* Quick stats */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
						{[
							{
								icon: ClockIcon,
								label: "От 1 часа",
								sub: "Минимальная аренда",
							},
							{
								icon: CameraIcon,
								label: `${tariffs.length} тарифа`,
								sub: "Под любой проект",
							},
							{
								icon: LightningIcon,
								label: "Много света",
								sub: "Постоянного и импульсного",
							},
							{
								icon: SparkleIcon,
								label: "Циклорама",
								sub: "И огромный хромакей",
							},
						].map(({ icon: Icon, label, sub }) => (
							<div
								key={label}
								className="rounded-2xl border border-foreground/8 bg-foreground/3 p-4 flex items-center gap-3"
							>
								<div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
									<Icon size={20} className="text-primary" weight="duotone" />
								</div>
								<div>
									<p className="font-bold text-sm">{label}</p>
									<p className="text-xs text-muted-foreground">{sub}</p>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* ── Тарифы ── */}
				{tariffs.length > 0 && (
					<section className="space-y-6">
						<div className="flex items-baseline gap-3">
							<h2 className="text-2xl font-black italic uppercase tracking-tighter">
								Тарифы
							</h2>
							<span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
								аренда студии
							</span>
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
							{tariffs.map((tariff) => (
								<PublicTariffCard
									key={tariff.id}
									tariff={tariff}
									onBook={handleBook}
								/>
							))}
						</div>
					</section>
				)}

				{/* ── CTA ── */}
				<section>
					<div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-8 md:p-12">
						<div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)),transparent_60%)]" />
						<div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
							<div className="space-y-2">
								<h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight leading-tight">
									Готовы снять
									<br />
									студию?
								</h2>
								<p className="text-sm opacity-70 max-w-sm">
									Выберите тариф, добавьте нужное оборудование и оставьте заявку
									— мы подтвердим в ближайшее время.
								</p>
							</div>
							<Button
								size="lg"
								onClick={() => handleBook()}
								variant="outline"
								className="bg-transparent border-background/30 text-background hover:bg-background/10 font-bold h-14 px-8 rounded-2xl shrink-0"
							>
								<CalendarBlankIcon size={18} className="mr-2" />
								Забронировать студию
							</Button>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
