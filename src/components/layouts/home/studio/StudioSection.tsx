import Link from "next/link";
import type { Banner } from "@/actions/admin-banner-actions";
import { EventsBanner } from "@/components/layouts/home/events-banner/EventsBanner";
import { Button } from "@/components/ui";

interface StudioSectionProps {
	banners: Banner[];
}

export const StudioSection = ({ banners }: StudioSectionProps) => {
	return (
		<section className="container mx-auto px-4">
			<div className="relative overflow-hidden rounded-3xl bg-foreground text-background">
				{/* Декоративный фон */}
				<div className="grid grid-cols-1 lg:grid-cols-2">
					<div className="relative flex flex-col items-start justify-between ">
						<div className="flex flex-col justify-between h-full px-6 pt-8">
							<p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">
								Фотостудия Linza
							</p>
							<h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight leading-tight">
								<span>Идеальное место для вашего проекта</span>
							</h2>
							<p className="text-sm opacity-70 pt-auto">
								Циклорама, фоны, хромакеи, постоянный / импульсный свет,
								спец-эффекты, готовые сетапы для трансляций мк, подкастов и не
								только
							</p>
						</div>
						<div className="container m-4 w-full">
							<Button
								asChild
								variant="outline"
								size="xl"
								className="bg-transparent border-background/30 text-background hover:bg-background/10 font-bold rounded-3xl w-100%"
							>
								<Link href="/studio">Забронировать студию</Link>
							</Button>
						</div>
					</div>
					{banners.length > 0 && <EventsBanner banners={banners} />}
				</div>
			</div>
		</section>
	);
};
