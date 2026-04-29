import Link from "next/link";
import { Button } from "@/components/ui";

export const StudioSection = () => {
	return (
		<section className="container mx-auto px-4">
			<div className="relative overflow-hidden rounded-3xl bg-foreground text-background p-8 md:p-12">
				{/* Декоративный фон */}
				<div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)),transparent_60%)]" />
				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
					<div className="space-y-2">
						<p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">
							Фотостудия Linza
						</p>
						<h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight leading-tight">
							Снять студию
							<br />
							для проекта?
						</h2>
						<p className="text-sm opacity-70 max-w-sm">
							Аренда оборудованной фотостудии с постоянным и импульсным светом,
							циклорамой и зоной ожидания.
						</p>
					</div>
					<div className="flex flex-col gap-3">
						<Button
							asChild
							variant="outline"
							size="lg"
							className="bg-transparent border-background/30 text-background hover:bg-background/10 font-bold"
						>
							<Link href="/equipment?category=studio">
								Студийное оборудование
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
};
