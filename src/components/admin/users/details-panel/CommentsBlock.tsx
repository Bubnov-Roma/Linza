import { TrashIcon, UserIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Button, Textarea } from "@/components/ui";

export interface UserComment {
	id: string;
	text: string;
	author: string;
	createdAt: string;
}

export function CommentsBlock({
	comments,
	onAdd,
	onRemove,
}: {
	comments: UserComment[];
	onAdd: (text: string) => void;
	onRemove: (id: string) => void;
}) {
	const [text, setText] = useState("");
	const [loading, setLoading] = useState(false);

	const handleAdd = async () => {
		if (!text.trim()) return;
		setLoading(true);
		await onAdd(text.trim());
		setText("");
		setLoading(false);
	};

	return (
		<div className="space-y-3">
			{comments.length > 0 && (
				<div className="space-y-2">
					{comments.map((c) => (
						<div key={c.id} className="flex gap-2.5 group">
							<div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
								<UserIcon size={11} className="text-muted-foreground" />
							</div>
							<div className="flex-1">
								<div className="flex items-baseline gap-2 mb-0.5">
									<span className="text-xs font-semibold">{c.author}</span>
									<span className="text-[10px] text-muted-foreground">
										{new Date(c.createdAt).toLocaleString("ru-RU", {
											day: "numeric",
											month: "short",
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
									<button
										type="button"
										onClick={() => onRemove(c.id)}
										className="opacity-20 sm:opacity-0 group-hover:opacity-100 ml-auto text-red-500/70 hover:text-red-500 transition-opacity"
									>
										<TrashIcon size={12} weight="duotone" />
									</button>
								</div>
								<p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
									{c.text}
								</p>
							</div>
						</div>
					))}
				</div>
			)}
			<div className="space-y-1.5">
				<Textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Внутренний комментарий..."
					rows={10}
					className="text-xs resize-none glass-input h-16"
					onKeyDown={(e) => {
						if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
					}}
				/>
				<div className="flex items-center justify-between">
					<span className="text-[10px] text-muted-foreground">Ctrl+Enter</span>
					<Button
						size="sm"
						variant="outline"
						className="h-7 text-xs"
						onClick={handleAdd}
						disabled={!text.trim() || loading}
					>
						Отправить
					</Button>
				</div>
			</div>
		</div>
	);
}
