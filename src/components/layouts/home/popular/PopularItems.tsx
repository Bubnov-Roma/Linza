import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EquipmentCard } from "@/components/shared";
import { Button } from "@/components/ui";
import type { GroupedEquipment } from "@/core/domain/entities/Equipment";

export const PopularItems = ({ popular }: { popular: GroupedEquipment[] }) => {
	if (popular.length === 0) return null;

	return (
		<section className="container mx-auto px-4 space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-black uppercase italic tracking-tight">
					Популярное
				</h2>
				<Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
					<Link href="/equipment">
						Все позиции <ArrowRightIcon size={12} />
					</Link>
				</Button>
			</div>
			<div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar md:grid xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible">
				{popular.map((item) => (
					<div key={item.id} className="shrink-0 w-55 md:w-auto">
						<EquipmentCard item={item} />
					</div>
				))}
			</div>
		</section>
	);
};
