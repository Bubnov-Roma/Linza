import Link from "next/link";
import { TabBadge } from "@/components/layouts/MobileNavBar/TabBadge";
import { cn } from "@/lib/utils";

interface NavTabProps {
	title: string;
	icon: React.ElementType;
	isActive: boolean;
	badge?: number | string;
	href?: string;
	onClick?: () => void;
}

export function NavTab({
	title,
	icon: Icon,
	isActive,
	badge,
	href,
	onClick,
}: NavTabProps) {
	const tabClass = cn(
		"flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative raw-button",
		isActive ? "text-foreground/80" : "text-muted-foreground"
	);
	const iconWeight = isActive ? "fill" : "duotone";

	const content = (
		<>
			<Icon size={22} weight={iconWeight} />
			<span className="text-[10px] font-medium">{title}</span>
			{badge !== undefined && <TabBadge value={badge} />}
		</>
	);

	if (href) {
		return (
			<Link href={href} className={tabClass}>
				{content}
			</Link>
		);
	}

	return (
		<button type="button" onClick={onClick} className={tabClass}>
			{content}
		</button>
	);
}
