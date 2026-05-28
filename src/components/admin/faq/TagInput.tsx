"use client";

import { XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { InlineEditField } from "@/components/shared";

export function TagInput({
	tags,
	onChange,
}: {
	tags: string[];
	onChange: (tags: string[]) => void;
}) {
	const [input, setInput] = useState("");

	const addTag = (raw: string) => {
		const val = raw.trim().toLowerCase();
		if (!val || tags.includes(val)) return;
		onChange([...tags, val]);
	};

	const removeTag = (tag: string) => {
		onChange(tags.filter((t) => t !== tag));
	};

	return (
		<InlineEditField
			mode="create"
			value={input}
			onChange={setInput}
			onAdd={(val) => {
				addTag(val);
			}}
			placeholder={
				tags.length === 0 ? "оплата, доставка... (Enter или пробел)" : ""
			}
			renderInput={(draft, onChangeDraft, onKeyDown) => (
				<div className="flex flex-wrap gap-1.5 flex-1 px-2 min-h-11 items-center border-b">
					{tags.map((tag) => (
						<span
							key={tag}
							className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-foreground/8 text-foreground/70 border border-foreground/10 shrink-0"
						>
							#{tag}
							<button
								type="button"
								onClick={() => removeTag(tag)}
								className="hover:text-red-400 transition-colors"
							>
								<XIcon size={10} />
							</button>
						</span>
					))}
					<input
						value={draft}
						onChange={(e) => onChangeDraft(e.target.value)}
						onKeyDown={(e) => {
							// Запятая и пробел — добавляем тег, не пробрасываем в InlineEditField
							if (e.key === "," || e.key === " ") {
								e.preventDefault();
								if (draft.trim()) {
									addTag(draft);
									onChangeDraft("");
								}
								return;
							}
							const lastTag = tags.at(-1);
							// Проверяем, что нажали Backspace, инпут пустой
							if (e.key === "Backspace" && !draft && lastTag) {
								e.preventDefault();
								removeTag(lastTag);
								return;
							}
							onKeyDown(e);
						}}
						placeholder={
							tags.length === 0
								? "Запятая, Пробел, Enter - для добавления тега. BackSpace, Delete - для удаления"
								: ""
						}
						className="flex-1 min-w-20 bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
					/>
				</div>
			)}
		/>
	);
}
