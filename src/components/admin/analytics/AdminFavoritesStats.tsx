import { HeartIcon } from "@phosphor-icons/react";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { fmtRub } from "@/lib/utils";

export async function AdminFavoritesStats({ limit = 10 }: { limit?: number }) {
	// Prisma умеет сортировать по количеству связанных записей (relation count)!
	const equipment = await prisma.equipment.findMany({
		select: {
			id: true,
			title: true,
			pricePerDay: true,
			isAvailable: true,
			_count: {
				select: { favorites: true }, // Считаем сколько раз добавили в избранное
			},
		},
		orderBy: {
			favorites: { _count: "desc" },
		},
		take: limit,
	});

	const rows = equipment.filter((eq) => eq._count.favorites > 0);
	const totalFavorites = rows.reduce((s, r) => s + r._count.favorites, 0);

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-base font-bold flex items-center gap-2">
						<HeartIcon size={16} className="text-red-400" />
						Топ избранного
					</CardTitle>
					<Badge variant="outline" className="text-[10px]">
						{totalFavorites} всего
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{rows.length === 0 ? (
					<p className="text-sm text-muted-foreground px-4 pb-4">
						Пока никто ничего не добавил в избранное
					</p>
				) : (
					<div className="divide-y divide-foreground/5">
						{rows.map((row, i) => {
							const maxFavorites = rows[0]?._count.favorites ?? 0;
							const width =
								maxFavorites > 0
									? `${Math.min(100, (row._count.favorites / maxFavorites) * 100)}%`
									: "0%";

							return (
								<div
									key={row.id}
									className="flex items-center gap-3 px-4 py-2.5"
								>
									<span className="w-5 text-xs text-muted-foreground font-mono shrink-0">
										{i + 1}
									</span>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">{row.title}</p>
										<p className="text-xs text-muted-foreground">
											{fmtRub(row.pricePerDay)}/сутки
										</p>
									</div>
									{!row.isAvailable && (
										<Badge
											variant="outline"
											className="text-[10px] text-muted-foreground border-foreground/10 shrink-0"
										>
											Недоступно
										</Badge>
									)}
									<div className="flex items-center gap-1 shrink-0">
										<HeartIcon
											size={12}
											className="text-red-400 fill-red-400"
										/>
										<span className="text-sm font-bold tabular-nums">
											{row._count.favorites}
										</span>
									</div>
									<div className="w-16 h-1.5 rounded-full bg-foreground/8 overflow-hidden shrink-0">
										<div
											className="h-full bg-red-400 rounded-full"
											style={{ width }}
										/>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
