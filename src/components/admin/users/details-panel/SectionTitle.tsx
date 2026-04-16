export function SectionTitle({
	icon: Icon,
	children,
}: {
	icon: React.ElementType;
	children: React.ReactNode;
}) {
	return (
		<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
			<Icon size={11} /> {children}
		</p>
	);
}
