"use client";

import { EyeIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import type React from "react";
import { useMemo, useState } from "react";
import {
	Button,
	Label,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const RE_LINK = /^\[([^\]]+)\]\(([^)]+)\)/;
const RE_BOLD = /^\*\*([^*]+)\*\*/;
const RE_ITALIC = /^\*([^*]+)\*/;
const RE_CODE = /^`([^`]+)`/;

function parseLine(line: string, lineIdx: number) {
	const parts: React.ReactNode[] = [];
	let rest = line;
	let i = 0;

	while (rest.length > 0) {
		const linkMatch = rest.match(RE_LINK);
		if (linkMatch) {
			parts.push(
				<a
					key={`${lineIdx}-${i++}`}
					href={linkMatch[2]}
					target="_blank"
					rel="noopener noreferrer"
					className="text-purple-500 underline underline-offset-2 hover:opacity-80"
				>
					{linkMatch[1]}
				</a>
			);
			rest = rest.slice(linkMatch[0].length);
			continue;
		}

		const boldMatch = rest.match(RE_BOLD);
		if (boldMatch) {
			parts.push(
				<strong key={`${lineIdx}-${i++}`} className="font-bold text-foreground">
					{boldMatch[1]}
				</strong>
			);
			rest = rest.slice(boldMatch[0].length);
			continue;
		}

		const italicMatch = rest.match(RE_ITALIC);
		if (italicMatch) {
			parts.push(
				<em key={`${lineIdx}-${i++}`} className="italic text-foreground/70">
					{italicMatch[1]}
				</em>
			);
			rest = rest.slice(italicMatch[0].length);
			continue;
		}

		const codeMatch = rest.match(RE_CODE);
		if (codeMatch) {
			parts.push(
				<code
					key={`${lineIdx}-${i++}`}
					className="text-xs bg-foreground/10 rounded px-1 py-0.5 font-mono"
				>
					{codeMatch[1]}
				</code>
			);
			rest = rest.slice(codeMatch[0].length);
			continue;
		}

		const nextSpecial = rest.search(/\[|\*|`/);
		if (nextSpecial === -1) {
			// Спецсимволов больше нет, забираем весь остаток
			parts.push(<span key={`${lineIdx}-${i++}`}>{rest}</span>);
			rest = "";
		} else if (nextSpecial === 0) {
			// Спецсимвол стоит прямо сейчас, но регулярки выше его не распознали
			// (например, одиночная звездочка). Отрезаем ровно один этот символ как обычный текст!
			parts.push(<span key={`${lineIdx}-${i++}`}>{rest[0]}</span>);
			rest = rest.slice(1);
		} else {
			// Спецсимвол где-то дальше. Забираем обычный текст до него
			parts.push(
				<span key={`${lineIdx}-${i++}`}>{rest.slice(0, nextSpecial)}</span>
			);
			rest = rest.slice(nextSpecial);
		}
	}
	return parts;
}

export function SimpleMarkdown({
	text,
	className,
}: {
	text: string;
	className?: string;
}) {
	const nodes = useMemo(() => {
		if (!text) return null;

		const lines = text.split("\n");
		const result: React.ReactNode[] = [];

		// Вспомогательная переменная для группировки списков
		let currentList: React.ReactNode[] = [];

		const flushList = (key: number) => {
			if (currentList.length > 0) {
				result.push(
					<ul key={`list-${key}`} className="list-none space-y-1 mb-2">
						{currentList}
					</ul>
				);
				currentList = [];
			}
		};

		lines.forEach((line, i) => {
			const trimmed = line.trim();

			// Заголовки (стиль как в вашем старом MD)
			if (trimmed.startsWith("# ")) {
				flushList(i);
				result.push(
					<h1
						key={i}
						className="text-lg font-black uppercase italic mb-2 text-foreground mt-4 first:mt-0"
					>
						{parseLine(trimmed.slice(2), i)}
					</h1>
				);
			} else if (trimmed.startsWith("## ")) {
				flushList(i);
				result.push(
					<h2
						key={i}
						className="text-base font-black uppercase italic mb-2 text-foreground mt-3 first:mt-0"
					>
						{parseLine(trimmed.slice(3), i)}
					</h2>
				);
			} else if (trimmed.startsWith("### ")) {
				flushList(i);
				result.push(
					<h3
						key={i}
						className="text-sm font-black uppercase italic mb-1.5 text-foreground mt-3 first:mt-0"
					>
						{parseLine(trimmed.slice(4), i)}
					</h3>
				);
			}
			// Списки
			else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
				currentList.push(
					<li
						key={i}
						className="flex items-start gap-3 text-sm text-foreground/80 "
					>
						<span className="mt-0.5 shrink-0">•</span>
						<span>{parseLine(trimmed.slice(2), i)}</span>
					</li>
				);
			}
			// Разделитель
			else if (trimmed === "---" || trimmed === "***") {
				flushList(i);
				result.push(<hr key={i} className="border-white/10 my-3" />);
			}
			// Пустая строка
			else if (trimmed === "") {
				flushList(i);
			}
			// Обычный текст
			else {
				flushList(i);
				result.push(
					<p
						key={i}
						className="text-sm leading-relaxed text-foreground/80 mb-2 last:mb-0"
					>
						{parseLine(trimmed, i)}
					</p>
				);
			}
		});

		flushList(lines.length);
		return result;
	}, [text]);

	return (
		<div className={cn("animate-in fade-in duration-300", className)}>
			{nodes}
		</div>
	);
}

interface MarkdownEditorProps {
	label?: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	rows?: number;
	className?: string;
}

export function MarkdownEditor({
	label,
	value,
	onChange,
	placeholder,
	rows = 5,
	className,
}: MarkdownEditorProps) {
	const [tab, setTab] = useState<"write" | "preview">("write");

	return (
		<div className={cn("space-y-1.5", className)}>
			<div className="flex items-center justify-between">
				{label && <Label>{label}</Label>}
				<div className="flex items-center gap-0.5 rounded-md border border-foreground/10 bg-foreground/10 p-0.5 ml-auto">
					{(["write", "preview"] as const).map((t: "write" | "preview", i) => (
						<Tooltip key={`${t}` + `${i}`}>
							<TooltipTrigger key={`${t}` + `${i}`}>
								<Button
									asChild
									key={`${t}` + `${i}`}
									size="icon-xs"
									variant="tab"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setTab(t);
									}}
									className={cn(
										"flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors hover:bg-muted-foreground/20",
										tab === t
											? "bg-muted-foreground/20 text-foreground shadow-md hover:bg-muted-foreground/40"
											: "text-muted-foreground hover:text-foreground"
									)}
								>
									{t === "write" ? (
										<PencilSimpleLineIcon
											size={9}
											weight={tab === t ? "fill" : "regular"}
										/>
									) : (
										<EyeIcon size={9} weight={tab === t ? "fill" : "regular"} />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t === "write" ? "Редактор" : "Просмотр"}
							</TooltipContent>
						</Tooltip>
					))}
				</div>
			</div>

			{tab === "write" ? (
				<Textarea
					rows={rows}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={
						placeholder ??
						"Поддерживается **markdown**:\n# Заголовок\n- список\n[ссылка](https://...)"
					}
					className="font-mono text-xs resize-none"
				/>
			) : (
				<div
					className="rounded-md border border-foreground/10 card-surface p-3 overflow-auto"
					style={{ minHeight: `${rows * 24}px` }}
				>
					{value ? (
						<SimpleMarkdown text={value} />
					) : (
						<span className="text-muted-foreground text-xs italic">
							Нет содержимого
						</span>
					)}
				</div>
			)}
		</div>
	);
}
