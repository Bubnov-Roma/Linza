import Link from "next/link";
import type { Banner } from "@/actions/admin/admin-banner-actions";
import { BannerCarousel } from "@/components/layouts/home/events-banner/BannerCarousel";
import { Button } from "@/components/ui";

interface StudioSectionProps {
	banners: Banner[];
	isAdmin: boolean;
}

const STUDIO_FEATURES = [
	"Просторная циклорама, топовый свет и огромный xромакей",
	"Любое оборудование из каталога доступно прямо в зале",
	"Готовые сетапы для подкастов, стримов, трансляций",
	"Воркшопы, мастер-классы и открытые съёмки",
];

export const StudioSection = async ({
	banners,
	isAdmin,
}: StudioSectionProps) => {
	return (
		<section className="w-full pt-4 md:pt-10 px-4">
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,480px)] xl:grid-cols-[1fr_minmax(0,540px)] gap-8 items-center bg-muted/30 dark:bg-muted/5 rounded-3xl p-2 md:p-8 md:border md:border-foreground/5 backdrop-blur-xs card-surface transition-all duration-300">
				{/* Левая колонка — Текст и УТП студии */}
				<div className="space-y-6 pt-1 md:pr-4">
					<div className="space-y-4 xl:space-y-10 ">
						<span className="inline-flex items-center justify-center text-center gap-2 px-3 py-1 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-wider bg-muted-foreground/5 dark:bg-primary/10 text-foreground dark:text-primary border border-foreground/10 dark:border-primary/20">
							Профессиональная студия в Самаре
						</span>
						<h2 className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black leading-[0.85] uppercase italic text-foreground tracking-tighter">
							STUDIO
						</h2>
						<h3 className="italic text-lg sm:text-xl md:text-2xl font-black text-muted-foreground tracking-wide mt-1">
							Пространство для ваших съемок
						</h3>
					</div>

					<ul className="space-y-2 pt-1">
						{STUDIO_FEATURES.map((f) => (
							<li
								key={f}
								className="flex items-start gap-2 text-sm opacity-75 leading-snug"
							>
								<span className="mt-2 w-1 h-1 rounded-full bg-muted-foreground/60 shrink-0" />
								{f}
							</li>
						))}
					</ul>

					<div className="flex flex-wrap gap-2 pt-2">
						<Button asChild size="lg" className="rounded-2xl font-bold flex-1">
							<Link href="/studio">Забронировать зал</Link>
						</Button>
						<Button
							asChild
							size="lg"
							variant="secondary"
							className="rounded-2xl font-bold flex-1"
						>
							<Link href="/equipment">Подобрать технику</Link>
						</Button>
					</div>
				</div>

				{/* Правая колонка — Иммерсивный слайдер студии */}
				<div className="w-full h-full min-h-80 md:min-h-100">
					{banners.length > 0 ? (
						<BannerCarousel banners={banners} variant="studio" />
					) : isAdmin ? (
						<div className="h-full flex flex-col justify-center items-center rounded-3xl border border-dashed border-foreground/15 p-8 text-center text-sm text-muted-foreground bg-background/50">
							<p className="font-bold mb-1">Баннеры студии не добавлены</p>
							<p className="text-xs mb-4">
								Создайте баннер для студии в панели управления
							</p>
							<Button
								asChild
								size="sm"
								variant="outline"
								className="rounded-xl"
							>
								<Link href="/admin">В админку</Link>
							</Button>
						</div>
					) : null}
				</div>
			</div>
		</section>
	);
};
