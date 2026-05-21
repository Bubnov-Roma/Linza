import { cookies } from "next/headers";
import Link from "next/link";
import type { Banner } from "@/actions/admin-banner-actions";
import { BannerCarousel } from "@/components/layouts/home/events-banner/BannerCarousel";
import { Button } from "@/components/ui";

interface HeroSectionProps {
	banners: Banner[];
	isAdmin: boolean;
}

export const HeroSection = async ({ banners, isAdmin }: HeroSectionProps) => {
	const cookieStore = await cookies();
	const savedPlayingState = cookieStore.get("banner_playing_hero")?.value;

	const initialIsPlaying =
		savedPlayingState !== undefined ? savedPlayingState === "true" : true;
	return (
		<section className="container mx-auto pt-6 md:pt-10">
			<div className="grid grid-cols-1 px-2 md:px-4 lg:grid-cols-[1fr_440px] items-start">
				{/* Левая колонка — текст */}
				<div className="max-w-2xl space-y-6">
					<h1 className="text-xs font-bold uppercase tracking-wider sm:tracking-[0.2em] text-primary-accent/70">
						Прокат фото- видеооборудования в Самаре
					</h1>

					<div className="flex flex-row gap-4 md:flex-col items-center md:items-start">
						<h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] uppercase italic text-primary tracking-tighter">
							LINZA
						</h2>
						<p className="italic text-base sm:text-lg md:text-2xl font-black text-foreground tracking-wider">
							Готовые решения
							<br className="md:hidden" /> для вашей съёмки
						</p>
					</div>

					<p className="hidden lg:block text-muted-foreground text-sm sm:text-base max-w-md leading-relaxed">
						Более 500 позиций фототехники и видеооборудования от проверенных
						брендов + студия с готовыми сетапами.
					</p>
				</div>

				{/* Правая колонка — баннеры */}
				<div className="w-full">
					{banners.length > 0 ? (
						<BannerCarousel
							banners={banners}
							variant="hero"
							initialIsPlaying={initialIsPlaying}
						/>
					) : isAdmin ? (
						<div className="rounded-2xl border border-dashed border-foreground/15 p-6 text-center text-sm text-muted-foreground">
							<p className="font-bold mb-1">Баннеры не добавлены</p>
							<p className="text-xs mb-3">
								Создайте баннер с размещением «Главный экран» или «Везде»
							</p>
							<Button asChild size="sm" variant="outline">
								<Link href="/admin">Перейти в админку</Link>
							</Button>
						</div>
					) : null}
				</div>
			</div>
		</section>
	);
};
