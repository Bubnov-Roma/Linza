import Link from "next/link";
import type { Banner } from "@/actions/admin-banner-actions";
import { BannerCarousel } from "@/components/home/events-banner/BannerCarousel";
import { Button } from "@/components/ui";

interface HeroSectionProps {
	banners: Banner[];
	isAdmin: boolean;
}

export const HeroSection = ({ banners, isAdmin }: HeroSectionProps) => {
	return (
		<section className="container mx-auto px-4 pt-8 md:pt-12">
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6 items-start">
				{/* Левая колонка — текст + поиск */}
				<div className="space-y-6">
					<div className="space-y-4">
						<p className="text-xs font-bold uppercase tracking-wider sm:tracking-[0.2em] text-primary/70">
							Аренда фото-видео оборудования · Самара
						</p>
						<h1 className="text-5xl lg:text-6xl font-black tracking-tighter leading-[0.95] uppercase italic pb-2">
							<span className="text-primary tracking-wider">LINZA</span>
							<br />
							<span className="text:2xl font-black text-foreground/60">
								техника для профи
							</span>
						</h1>
						<div className="flex flex:col sm:flex-row gap-8 items-baseline">
							<p className="text-muted-foreground text-xs sm:text-base max-w-md leading-relaxed">
								Камеры, объективы, свет, звук и многое другое.
								<br />
								Более 500 позиций от проверенных брендов.
							</p>
						</div>
					</div>
				</div>

				{/* Правая колонка — баннеры */}
				<div className="w-full">
					{banners.length > 0 ? (
						<BannerCarousel banners={banners} />
					) : isAdmin ? (
						<div className="rounded-2xl border border-dashed border-foreground/15 p-8 text-center text-sm text-muted-foreground">
							<p className="font-bold mb-1">Баннеры не добавлены</p>
							<p className="text-xs mb-3">
								Создайте новый баннер в панели администратора
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
