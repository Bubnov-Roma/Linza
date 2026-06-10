"use client";

import { CaretRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { CategoryFlyout } from "@/components/layouts/AppSidebar/CategoryFlyout";
import { menuBtnClass } from "@/components/layouts/AppSidebar/menuBtnClass";
import { RenderIcon } from "@/components/layouts/AppSidebar/RenderIcon";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui";
import { getCategoryIcon } from "@/constants";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

interface CategoryNavItemProps {
	category: DbCategory;
	isCollapsed: boolean;
	isMobile: boolean;
	currentCategory: string | null;
	currentSubcategory: string | null;
}

export function CategoryNavItem({
	category,
	isCollapsed,
	currentCategory,
	currentSubcategory,
}: CategoryNavItemProps) {
	const Icon = getCategoryIcon(category.iconName);
	const inCat = currentCategory === category.slug;
	const catHref = `/equipment?category=${category.slug}`;
	const hasSub = category.subcategories.length > 0;

	const [hoveredCat, setHoveredCat] = useState<string | null>(null);
	const debouncedHide = useDebounceCallback(() => setHoveredCat(null), 250);

	// ── COLLAPSED (MD3 Navigation Rail Hover Mode) ──
	if (isCollapsed) {
		return (
			<fieldset
				className="relative"
				onMouseEnter={() => {
					debouncedHide.cancel();
					setHoveredCat(category.id);
				}}
				onMouseLeave={debouncedHide}
			>
				<SidebarMenuItem>
					<SidebarMenuButton
						asChild
						isActive={inCat}
						className={menuBtnClass(inCat, true)}
						tooltip={category.name}
					>
						<Link
							href={catHref}
							className="flex flex-col items-center justify-center gap-1 w-full h-full active:scale-95 active:shadow-none group/btn"
						>
							{/* Унифицированная пилюля-подсветка для иконки категории */}
							<div
								className={cn(
									"flex items-center justify-center shrink-0 transition-all duration-300 text-muted-foreground group-hover/btn:text-foreground w-12 h-7 rounded-full group-hover/btn:bg-foreground/10 group-hover/btn:scale-110",
									inCat && "bg-muted-foreground/10 text-foreground"
								)}
							>
								<RenderIcon icon={Icon} isActive={inCat} />
							</div>
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
				<CategoryFlyout
					category={category}
					isOpen={hoveredCat === category.id}
					onMouseEnter={() => {
						debouncedHide.cancel();
						setHoveredCat(category.id);
					}}
					onMouseLeave={debouncedHide}
					currentCategory={currentCategory}
					currentSubcategory={currentSubcategory}
				/>
			</fieldset>
		);
	}

	// ── EXPANDED (С кнопкой-триггером на всю строку) ──
	if (hasSub) {
		return (
			<Collapsible defaultOpen={inCat} className="group/collapsible" asChild>
				<SidebarMenuItem>
					<CollapsibleTrigger asChild>
						<SidebarMenuButton
							isActive={inCat}
							className={cn(
								menuBtnClass(inCat, false),
								"w-full flex items-center justify-between pr-4 select-none cursor-pointer"
							)}
						>
							<div className="flex items-center min-w-0 flex-1">
								<div className="flex items-center justify-center shrink-0 w-6">
									<RenderIcon icon={Icon} isActive={inCat} />
								</div>
								<span className="font-medium text-base truncate ml-3 text-left">
									{category.name}
								</span>
							</div>
							<CaretRightIcon
								size={16}
								className="transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 shrink-0 text-muted-foreground/70 group-hover/btn:text-foreground"
							/>
						</SidebarMenuButton>
					</CollapsibleTrigger>

					<CollapsibleContent className="w-full">
						<SidebarMenuSub className="mr-0 pr-0 mt-1 space-y-0.5">
							<SidebarMenuSubItem>
								<SidebarMenuSubButton
									asChild
									isActive={inCat && !currentSubcategory}
									className={cn(
										"h-10 rounded-xl pl-4 text-sm transition-colors",
										inCat && !currentSubcategory
											? "bg-primary/10 text-primary font-semibold"
											: "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
									)}
								>
									<Link href={catHref}>
										<span>Все позиции</span>
									</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>

							{category.subcategories.map((sub) => {
								const subActive = currentSubcategory === sub.slug;
								return (
									<SidebarMenuSubItem key={sub.id}>
										<SidebarMenuSubButton
											asChild
											isActive={subActive}
											className={cn(
												"h-10 rounded-xl pl-4 text-sm transition-colors",
												subActive
													? "bg-primary/10 text-primary font-semibold"
													: "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
											)}
										>
											<Link
												href={`/equipment?category=${category.slug}&subcategory=${sub.slug}`}
											>
												<span>{sub.name}</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								);
							})}
						</SidebarMenuSub>
					</CollapsibleContent>
				</SidebarMenuItem>
			</Collapsible>
		);
	}

	// Категория без подкатегорий
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				asChild
				isActive={inCat}
				className={menuBtnClass(inCat, false)}
			>
				<Link href={catHref}>
					<div className="flex items-center justify-center shrink-0 w-6">
						<RenderIcon icon={Icon} isActive={inCat} />
					</div>
					<span className="font-medium text-base truncate ml-3 flex-1 text-left">
						{category.name}
					</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
