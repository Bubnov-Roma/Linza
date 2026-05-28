export function Highlight({ text, query }: { text: string; query: string }) {
	if (!query.trim()) return <>{text}</>;
	const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const parts = text.split(new RegExp(`(${escaped})`, "gi"));
	return (
		<>
			{parts.map((part, i) =>
				part.toLowerCase() === query.toLowerCase() ? (
					<mark
						key={i}
						className="bg-primary/20 text-foreground rounded-sm px-0.5 not-italic"
					>
						{part}
					</mark>
				) : (
					<span key={i}>{part}</span>
				)
			)}
		</>
	);
}
