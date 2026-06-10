"use client";

import { CaretDownIcon, SquaresFourIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui";
import { getCategoryIcon } from "@/constants";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

export function CatalogDrawer({
	open,
	onOpenChange,
	categories,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	categories: DbCategory[];
}) {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Извлекаем текущую категорию и подкатегорию из URL
	const currentCategory = searchParams.get("category");
	const currentSubcategory = searchParams.get("subcategory");

	const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

	// Автоматически раскрываем текущую активную категорию при открытии Drawer
	useEffect(() => {
		if (open && currentCategory) {
			setExpandedCategory(currentCategory);
		}
	}, [open, currentCategory]);

	// "Вся техника" активна только на /equipment И когда нет query-параметров категорий
	const isAllEquipmentActive =
		pathname === "/equipment" && !currentCategory && !currentSubcategory;

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="p-0 flex flex-col">
				<DrawerHeader className="px-6 pt-6 pb-2">
					<DrawerTitle className="text-xl font-black uppercase italic tracking-tight text-left">
						Каталог техники
					</DrawerTitle>
					<DrawerDescription className="hidden">
						Каталог категорий оборудования
					</DrawerDescription>
				</DrawerHeader>

				<div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
					<DrawerClose asChild>
						<Link
							href="/equipment"
							className={cn(
								"flex items-center justify-between w-full h-14 px-4 rounded-2xl transition-all duration-200 text-left",
								isAllEquipmentActive
									? "bg-sidebar text-foreground font-bold shadow-xs shadow-muted-foreground/30"
									: "text-muted-foreground hover:bg-muted-foreground/5 hover:text-foreground"
							)}
						>
							<div className="flex items-center gap-4 truncate">
								<SquaresFourIcon
									size={22}
									weight={isAllEquipmentActive ? "fill" : "duotone"}
								/>
								<span className="text-base font-semibold truncate">
									Вся техника
								</span>
							</div>
						</Link>
					</DrawerClose>

					{categories.map((category) => {
						const hasSub = category.subcategories.length > 0;
						const isExpanded = expandedCategory === category.slug;
						const CatIcon = getCategoryIcon(category.iconName);

						const isCatActive =
							pathname === "/equipment" && currentCategory === category.slug;

						if (hasSub) {
							const isTriggerHighlighted = isCatActive || isExpanded;

							return (
								<Collapsible
									key={category.id}
									open={isExpanded}
									onOpenChange={(isOpen) =>
										setExpandedCategory(isOpen ? category.slug : null)
									}
									className="w-full"
								>
									<CollapsibleTrigger asChild>
										<button
											type="button"
											className={cn(
												"flex items-center justify-between w-full h-14 px-4 rounded-2xl transition-all duration-200 text-left",
												isTriggerHighlighted
													? "bg-sidebar/80 text-foreground font-bold shadow-xs shadow-muted-foreground/30"
													: "text-muted-foreground hover:bg-muted-foreground/5 hover:text-foreground"
											)}
										>
											<div className="flex items-center gap-4 truncate">
												<CatIcon
													size={22}
													weight={isTriggerHighlighted ? "fill" : "duotone"}
												/>
												<span className="text-base font-semibold truncate">
													{category.name}
												</span>
											</div>
											<CaretDownIcon
												size={16}
												className={cn(
													"transition-transform duration-200 text-muted-foreground/60",
													isExpanded && "rotate-180 text-foreground"
												)}
											/>
										</button>
									</CollapsibleTrigger>
									<CollapsibleContent className="pl-4 pr-2 pt-1 pb-2 space-y-1 border-l-2 border-muted-foreground/10 ml-6 mt-1 animate-collapsible-down">
										<DrawerClose asChild>
											<Link
												href={`/equipment?category=${category.slug}`}
												className={cn(
													"flex items-center h-11 px-4 rounded-2xl text-sm font-medium transition-all w-full",
													isCatActive && !currentSubcategory
														? "bg-sidebar text-foreground font-semibold shadow-xs shadow-muted-foreground/30"
														: "text-muted-foreground/80 hover:bg-muted-foreground/5 hover:text-foreground"
												)}
											>
												Все позиции
											</Link>
										</DrawerClose>
										{category.subcategories.map((sub) => {
											const isSubActive =
												isCatActive && currentSubcategory === sub.slug;
											return (
												<DrawerClose asChild key={sub.id}>
													<Link
														href={`/equipment?category=${category.slug}&subcategory=${sub.slug}`}
														className={cn(
															"flex items-center h-11 px-4 rounded-xl text-sm font-medium transition-all truncate w-full",
															isSubActive
																? "bg-sidebar text-foreground font-semibold shadow-xs shadow-muted-foreground/30"
																: "text-muted-foreground/80 hover:bg-muted-foreground/5 hover:text-foreground"
														)}
													>
														{sub.name}
													</Link>
												</DrawerClose>
											);
										})}
									</CollapsibleContent>
								</Collapsible>
							);
						}

						// Категории без подкатегорий (теперь корректно подсвечиваются)
						return (
							<DrawerClose asChild key={category.id}>
								<Link
									href={`/equipment?category=${category.slug}`}
									className={cn(
										"flex items-center h-14 px-4 rounded-2xl transition-all duration-200 w-full",
										isCatActive
											? "bg-sidebar/80 text-foreground font-bold shadow-xs"
											: "text-muted-foreground/80 hover:bg-muted-foreground/5 hover:text-foreground"
									)}
								>
									<div className="flex items-center gap-4">
										<CatIcon
											size={22}
											weight={isCatActive ? "fill" : "duotone"}
										/>
										<span className="text-base font-semibold">
											{category.name}
										</span>
									</div>
								</Link>
							</DrawerClose>
						);
					})}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
