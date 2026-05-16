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

	// ── COLLAPSED (MD3 Navigation Rail) ──
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
							className="flex flex-col items-center justify-center gap-1 w-full h-full hover:shadow-sm active:scale-95 active:shadow-none"
						>
							<div
								className={cn(
									"flex items-center justify-center w-full h-full rounded-xl transition-colors text-muted-foreground",
									inCat
										? "bg-muted-foreground/10"
										: "group-hover/btn:bg-muted-foreground/5 group-hover/btn:shadow-sm"
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

	// ── EXPANDED ──
	if (hasSub) {
		return (
			<Collapsible defaultOpen={inCat} className="group/collapsible" asChild>
				<SidebarMenuItem>
					<div className="flex items-center w-full">
						<SidebarMenuButton
							asChild
							isActive={inCat}
							className={cn(menuBtnClass(inCat, false), "flex-1 pr-2")}
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
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="h-14 w-10 flex items-center justify-center rounded-xl shrink-0 transition-colors hover:bg-muted-foreground/5"
							>
								<CaretRightIcon
									size={16}
									className="transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90"
								/>
							</button>
						</CollapsibleTrigger>
					</div>
					<CollapsibleContent>
						<SidebarMenuSub className="mr-0 pr-0 mt-1">
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
