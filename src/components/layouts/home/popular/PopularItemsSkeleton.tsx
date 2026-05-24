"use client";

import { Skeleton } from "@/components/ui";

export function PopularItemsSkeleton() {
	return (
		<section className="container mx-auto space-y-4">
			<div className="flex items-baseline justify-between px-4">
				<h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase italic tracking-tight select-none opacity-20">
					Популярное
				</h2>
				<Skeleton className="h-5 w-24 rounded-md bg-foreground/5" />
			</div>

			{/* Лента карточек-скелетонов */}
			<div className="flex gap-4 overflow-x-auto pb-6 px-4 no-scrollbar">
				{Array.from({ length: 4 }).map((_, i) => (
					<div
						key={i}
						className="shrink-0 w-[50vw] xs:w-[280px] sm:w-72.5 md:w-75 lg:w-77.5 xl:w-78.75 flex flex-col gap-2.5"
					>
						{/* Картинка */}
						<Skeleton className="aspect-4/3 w-full rounded-xl bg-foreground/5" />
						{/* Текст и цена */}
						<div className="px-0.5 space-y-1.5">
							<Skeleton className="h-3.5 w-5/6 rounded bg-foreground/5" />
							<Skeleton className="h-3 w-3/5 rounded bg-foreground/5" />
							<div className="flex items-center justify-between pt-1">
								<Skeleton className="h-4 w-16 rounded-lg bg-foreground/5" />
								<Skeleton className="h-8 w-24 rounded-xl bg-foreground/5" />
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
