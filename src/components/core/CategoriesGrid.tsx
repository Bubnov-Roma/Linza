import type { Icon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import { PHOSPHOR_SSR_ICON_MAP } from "@/constants/phosphor-icon-server.config";
import type { DbCategory } from "@/core/domain/entities/Equipment";

interface CategoriesGridProps {
	categories: DbCategory[];
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
	return (
		<section className="container mx-auto px-4 space-y-6">
			<div className="flex items-baseline justify-between">
				<h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase italic tracking-tight select-none">
					Категории
				</h2>
				<Button
					asChild
					variant="link"
					size="xl"
					className="text-sm text-foreground/80 px-2 uppercase font-black italic"
				>
					<Link href="/equipment">Весь каталог</Link>
				</Button>
			</div>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
				{categories.map((cat) => {
					let IconComp = PHOSPHOR_SSR_ICON_MAP[
						cat.iconName as keyof typeof PHOSPHOR_SSR_ICON_MAP
					] as Icon;

					if (!IconComp) {
						IconComp = PHOSPHOR_SSR_ICON_MAP.Package as Icon;
					}
					return (
						<Link
							key={cat.id}
							href={`/equipment?category=${cat.slug}`}
							className="group relative h-48 rounded-3xl bg-foreground/5 border border-muted-foreground/20 overflow-hidden"
						>
							{cat.imageUrl ? (
								<>
									<Image
										src={cat.imageUrl}
										alt={cat.name}
										fill
										sizes="(max-width: 768px) 50vw, 25vw"
										className="object-cover opacity-90"
									/>
									<div className="absolute inset-0 bg-black/20 opacity-100" />
								</>
							) : (
								<div className="absolute inset-0 bg-linear-to-b from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out" />
							)}
							<div className="relative h-full flex flex-col items-center justify-center px-4 py-2 text-center">
								{!cat.imageUrl && (
									<div className="mb-4 text-primary group-hover:scale-110 transition-transform text-4xl">
										<IconComp weight="duotone" />
									</div>
								)}
								<div className="absolute inset-0 bg-linear-to-t from-background/40 to-transparent opacity-0 md:opacity-100 group-hover:opacity-0 transition-opacity duration-500 ease-in-out" />
								<h3 className="relative font-semibold text-xl bg-background/80 uppercase italic tracking-[0.2em] mt-auto transition-all group-hover:backdrop-brightness-180 backdrop-blur-xl dark:group-hover:backdrop-brightness-90 py-3 px-5 rounded-2xl duration-500">
									{cat.name}
								</h3>
							</div>
						</Link>
					);
				})}
			</div>
		</section>
	);
}
