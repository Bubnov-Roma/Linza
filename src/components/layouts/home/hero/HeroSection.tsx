import Link from "next/link";
import type { Banner } from "@/actions/admin-banner-actions";
import { BannerCarousel } from "@/components/layouts/home/events-banner/BannerCarousel";
import { Button } from "@/components/ui";

interface HeroSectionProps {
	banners: Banner[];
	isAdmin: boolean;
}

export const HeroSection = async ({ banners, isAdmin }: HeroSectionProps) => {
	return (
		<section className="container mx-auto pt-4 md:pt-10 px-4">
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_540px] gap-8 items-center bg-muted/30 dark:bg-muted/5 rounded-3xl p-2 md:p-8 md:border md:border-foreground/5 backdrop-blur-xs card-surface">
				{/* Левая колонка — Текст и УТП */}
				<div className="space-y-6 md:pr-4">
					<div className="space-y-4 xl:space-y-10">
						<span className="inline-flex items-center justify-center text-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-muted-foreground/5 dark:bg-primary/10 text-foreground dark:text-primary border border-foreground/10 dark:border-primary/20">
							Прокат фото- видеооборудования в Самаре
						</span>
						<h1 className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black leading-[0.85] uppercase italic text-foreground tracking-tighter">
							LINZA
						</h1>
						<h2 className="italic text-lg sm:text-xl md:text-2xl font-black text-muted-foreground tracking-wide mt-1">
							Готовые решения для вашей съёмки
						</h2>
					</div>

					<p className="hidden md:block text-muted-foreground text-sm sm:text-base max-w-md leading-relaxed">
						Более 500 позиций фототехники и видеооборудования от проверенных
						брендов + студия с готовыми сетапами.
					</p>

					{/* Быстрые ссылки под УТП в стиле Telegram-интерфейсов */}
					<div className="flex flex-wrap gap-2 pt-2">
						<Button asChild size="lg" className="rounded-xl font-bold flex-1">
							<Link href="/equipment">Смотреть каталог</Link>
						</Button>
						<Button
							asChild
							size="lg"
							variant="secondary"
							className="rounded-xl font-bold flex-1"
						>
							<Link href="/studio">Смотреть студию</Link>
						</Button>
					</div>
				</div>

				{/* Правая колонка — Обновленный иммерсивный слайдер */}
				<div className="w-full h-full min-h-80 md:min-h-100">
					{banners.length > 0 ? (
						<BannerCarousel banners={banners} variant="hero" />
					) : isAdmin ? (
						<div className="h-full flex flex-col justify-center items-center rounded-3xl border border-dashed border-foreground/15 p-8 text-center text-sm text-muted-foreground bg-background/50">
							<p className="font-bold mb-1">Баннеры не добавлены</p>
							<p className="text-xs mb-4">
								Создайте баннер в панели управления
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
