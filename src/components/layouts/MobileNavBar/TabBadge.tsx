export function TabBadge({ value }: { value?: number | string }) {
	if (!value) return null;
	return (
		<span className="absolute top-1 right-2 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border border-background animate-in zoom-in-50 duration-200">
			{value}
		</span>
	);
}
