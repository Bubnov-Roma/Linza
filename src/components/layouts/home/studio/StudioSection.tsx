import Link from "next/link";
import type { Banner } from "@/actions/admin-banner-actions";
import { BannerCarousel } from "@/components/layouts/home/events-banner/BannerCarousel";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface StudioSectionProps {
	banners: Banner[];
}

const STUDIO_FEATURES = [
	"Циклорама · Хромакей · Импульсный и постоянный свет",
	"Готовые сетапы для подкастов и стримов",
	"Воркшопы, мастер-классы и открытые съёмки",
];

export const StudioSection = async ({ banners }: StudioSectionProps) => {
	const hasBanners = banners.length > 0;

	return (
		<section className="container mx-auto space-y-4 px-2 md:px-4">
			<div className="flex items-baseline justify-between px-2 md:px-0">
				<h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase italic tracking-tight select-none">
					Студия
				</h2>
				<Button
					asChild
					variant="link"
					size="xl"
					className="text-sm text-foreground/80 px-2 uppercase font-black italic"
				>
					<Link href="/studio">Забронировать зал</Link>
				</Button>
			</div>
			<div
				className={cn(
					"relative overflow-hidden rounded-2xl bg-foreground not-first:text-background text-background",
					hasBanners ? "grid grid-cols-1 lg:grid-cols-2" : "flex flex-col"
				)}
			>
				<div className="absolute inset-0 bg-linear-to-t md:bg-linear-to-l from-background/60  to-transparent z-0" />
				{/* ── Левая колонка: текст ── */}
				<div
					className={cn(
						"flex flex-col justify-between gap-6 px-6 sm:px-10 py-8 sm:py-10 rounded-2xl",
						!hasBanners && "md:flex-row"
					)}
				>
					<div className="space-y-4">
						<p className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-50 italic">
							Студия Linza · Самара
						</p>
						<h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase italic tracking-tight leading-tight select-none">
							Включайся в процесс
						</h2>

						{/* Фичи — три строки с акцентом */}
						<ul className="space-y-2 pt-1">
							{STUDIO_FEATURES.map((f) => (
								<li
									key={f}
									className="flex items-start gap-2 text-sm opacity-75 leading-snug"
								>
									{/* Небольшой декоративный маркер */}
									<span className="mt-1.5 w-1 h-1 rounded-full bg-background/60 shrink-0" />
									{f}
								</li>
							))}
						</ul>
					</div>

					<Button
						asChild
						variant="outline"
						size="xl"
						className={cn(
							"z-10 relatives bg-foreground/10 border-background/30 text-background hover:bg-foreground/50 uppercase font-bold rounded-2xl w-full sm:w-auto transition-colors italic",
							!hasBanners ? "self-end" : "self-start"
						)}
					>
						<Link href="/studio">Заглянуть в студию</Link>
					</Button>
				</div>

				{/* ── Правая колонка: баннер как визуальное продолжение блока ── */}
				{hasBanners && (
					<div className="relative w-full min-h-70 lg:h-full flex flex-col">
						<BannerCarousel banners={banners} variant="studio" />
					</div>
				)}
			</div>
		</section>
	);
};
