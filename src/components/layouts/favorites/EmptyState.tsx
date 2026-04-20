import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
	action: { label: string; href?: string; onClick?: () => void };
}) {
	const router = useRouter();
	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<div className="w-20 h-20 rounded-3xl bg-foreground/5 flex items-center justify-center mb-5">
				<Icon size={36} className="text-muted-foreground/30" />
			</div>
			<h3 className="font-bold text-base mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground max-w-xs mb-6">
				{description}
			</p>
			<Button
				variant="brand"
				className="rounded-xl"
				onClick={
					action.onClick ?? (() => action.href && router.push(action.href))
				}
			>
				{action.label}
			</Button>
		</div>
	);
}
