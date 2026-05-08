import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { M3NavItem } from "@/components/layouts/AppSidebar/M3NavItem";
import { getCategoryIcon } from "@/constants";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { cn } from "@/lib/utils";

interface CategoryFlyoutProps {
	category: DbCategory;
	isOpen: boolean;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
	currentCategory: string | null;
	currentSubcategory: string | null;
}

export function CategoryFlyout({
	category,
	isOpen,
	onMouseEnter,
	onMouseLeave,
	currentCategory,
	currentSubcategory,
}: CategoryFlyoutProps) {
	const Icon = getCategoryIcon(category.iconName);
	const inCat = currentCategory === category.slug;

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
					initial={{ opacity: 0, x: -12, scale: 0.97 }}
					animate={{ opacity: 1, x: 0, scale: 1 }}
					exit={{
						opacity: 0,
						x: -8,
						scale: 0.97,
						transition: { duration: 0.18 },
					}}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
					className={cn(
						"fixed left-20 top-0 bottom-0 w-72 z-90 bg-sidebar border-r border-foreground/8 flex flex-col shadow-md shadow-foreground/10 space-y-6"
					)}
				>
					<Link
						href={`/equipment?category=${category.slug}`}
						className="flex items-center gap-4 px-8 pt-8 pb-6 justify-between bg-muted-foreground/5 hover:bg-muted-foreground/10 group/header"
					>
						<div className="flex flex-col">
							<p className="font-black text-xl tracking-tight leading-none transition-colors">
								{category.name}
							</p>
						</div>
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 group-hover/header:bg-primary/60">
							<Icon
								weight="duotone"
								className="text-foreground group-hover/"
								size={24}
								strokeWidth={inCat ? 2.5 : 2}
							/>
						</div>
					</Link>
					<div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 space-y-0.5">
						{category.subcategories.map((sub) => (
							<M3NavItem
								key={sub.id}
								href={`/equipment?category=${category.slug}&subcategory=${sub.slug}`}
								isActive={currentSubcategory === sub.slug}
								label={sub.name}
							/>
						))}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
