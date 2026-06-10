export function CollapseLabel({ text }: { text: string }) {
	const words = text.trim().split(/\s+/);
	if (words.length === 1 || text.length <= 6) {
		return (
			<span className="text-[10px] font-black leading-tight text-center text-muted-foreground truncate w-full block px-0.5">
				{text.length > 9 ? `${text.slice(0, 8)}…` : text}
			</span>
		);
	}
	const line1: string = words[0] ?? "";
	const line2: string = words.slice(1).join(" ");
	return (
		<span className="text-[10px] font-black leading-tight text-center text-muted-foreground w-full block px-0.5">
			<span className="block truncate">
				{line1.length > 7 ? `${line1.slice(0, 6)}…` : line1}
			</span>
			<span className="block truncate opacity-80">
				{line2.length > 7 ? `${line2.slice(0, 6)}…` : line2}
			</span>
		</span>
	);
}
