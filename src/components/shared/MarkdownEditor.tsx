"use client";

import { EyeIcon, PencilSimpleLineIcon } from "@phosphor-icons/react";
import Link from "next/link";
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

function HighlightText({ text, query }: { text: string; query: string }) {
	if (!query || !query.trim()) return <>{text}</>;
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

const RE_LINK = /^\[([^\]]+)\]\(([^)]+)\)/;
const RE_COLOR = /^\[([^\]]+)\]\{([^}]+)\}/;
const RE_BOLD = /^\*\*([^*]+)\*\*/;
const RE_UNDERLINE = /^__([^_]+)__/;
const RE_ITALIC = /^\*([^*]+)\*/;
const RE_STRIKE = /^~~([^~]+)~~/;
const RE_CODE = /^`([^`]+)`/;

function parseLine(line: string, lineIdx: number, query: string) {
	const parts: React.ReactNode[] = [];
	let rest = line;
	let i = 0;

	while (rest.length > 0) {
		const colorMatch = rest.match(RE_COLOR);
		if (colorMatch) {
			const text = colorMatch[1];
			const colorVal = colorMatch[2] ?? "primary";
			const isHex = colorVal.startsWith("#");
			parts.push(
				<span
					key={`${lineIdx}-${i++}`}
					className={cn(
						!isHex &&
							(colorVal.startsWith("text-") ? colorVal : `text-${colorVal}`)
					)}
					style={isHex ? { color: colorVal } : undefined}
				>
					<HighlightText text={text || ""} query={query} />
				</span>
			);
			rest = rest.slice(colorMatch[0].length);
			continue;
		}

		const linkMatch = rest.match(RE_LINK);
		if (linkMatch) {
			parts.push(
				<Link
					key={`${lineIdx}-${i++}`}
					href={linkMatch[2] ?? ""}
					target="_blank"
					rel="noopener noreferrer"
					className="underline underline-offset-4 hover:opacity-80 transition-opacity font-bold"
				>
					<HighlightText text={linkMatch[1] || ""} query={query} />
				</Link>
			);
			rest = rest.slice(linkMatch[0].length);
			continue;
		}

		const boldMatch = rest.match(RE_BOLD);
		if (boldMatch) {
			parts.push(
				<strong
					key={`${lineIdx}-${i++}`}
					className="font-black text-foreground"
				>
					<HighlightText text={boldMatch[1] || ""} query={query} />
				</strong>
			);
			rest = rest.slice(boldMatch[0].length);
			continue;
		}

		const underlineMatch = rest.match(RE_UNDERLINE);
		if (underlineMatch) {
			parts.push(
				<span
					key={`${lineIdx}-${i++}`}
					className="underline underline-offset-4 decoration-foreground/40"
				>
					<HighlightText text={underlineMatch[1] || ""} query={query} />
				</span>
			);
			rest = rest.slice(underlineMatch[0].length);
			continue;
		}

		const italicMatch = rest.match(RE_ITALIC);
		if (italicMatch) {
			parts.push(
				<em key={`${lineIdx}-${i++}`} className="italic text-foreground/90">
					<HighlightText text={italicMatch[1] || ""} query={query} />
				</em>
			);
			rest = rest.slice(italicMatch[0].length);
			continue;
		}

		const strikeMatch = rest.match(RE_STRIKE);
		if (strikeMatch) {
			parts.push(
				<span key={`${lineIdx}-${i++}`} className="line-through opacity-50">
					<HighlightText text={strikeMatch[1] || ""} query={query} />
				</span>
			);
			rest = rest.slice(strikeMatch[0].length);
			continue;
		}

		const codeMatch = rest.match(RE_CODE);
		if (codeMatch) {
			parts.push(
				<code
					key={`${lineIdx}-${i++}`}
					className="text-xs bg-foreground/10 rounded px-1.5 py-0.5 font-mono text-primary-accent"
				>
					<HighlightText text={codeMatch[1] || ""} query={query} />
				</code>
			);
			rest = rest.slice(codeMatch[0].length);
			continue;
		}

		const nextSpecial = rest.search(/\[|\*|_|~|`/);
		if (nextSpecial === -1) {
			parts.push(
				<HighlightText key={`${lineIdx}-${i++}`} text={rest} query={query} />
			);
			rest = "";
		} else if (nextSpecial === 0) {
			parts.push(
				<HighlightText
					key={`${lineIdx}-${i++}`}
					text={rest[0] || ""}
					query={query}
				/>
			);
			rest = rest.slice(1);
		} else {
			parts.push(
				<HighlightText
					key={`${lineIdx}-${i++}`}
					text={rest.slice(0, nextSpecial)}
					query={query}
				/>
			);
			rest = rest.slice(nextSpecial);
		}
	}
	return parts;
}

export function SimpleMarkdown({
	text,
	query = "",
	className,
}: {
	text: string;
	query?: string;
	className?: string;
}) {
	const nodes = useMemo(() => {
		if (!text) return null;
		const lines = text.split("\n");
		const result: React.ReactNode[] = [];
		let currentList: React.ReactNode[] = [];

		const flushList = (key: number) => {
			if (currentList.length > 0) {
				result.push(
					<ul key={`list-${key}`} className="list-none space-y-2 mb-4">
						{currentList}
					</ul>
				);
				currentList = [];
			}
		};

		lines.forEach((line, i) => {
			const trimmed = line.trim();
			if (trimmed.startsWith("# ")) {
				flushList(i);
				result.push(
					<h1
						key={i}
						className="text-3xl sm:text-4xl font-black uppercase italic mb-4 text-foreground tracking-tight mt-6 first:mt-0"
					>
						{parseLine(trimmed.slice(2), i, query)}
					</h1>
				);
			} else if (trimmed.startsWith("## ")) {
				flushList(i);
				result.push(
					<h2
						key={i}
						className="text-xl sm:text-2xl font-black uppercase italic mb-3 text-foreground tracking-tight mt-4 first:mt-0"
					>
						{parseLine(trimmed.slice(3), i, query)}
					</h2>
				);
			} else if (trimmed.startsWith("### ")) {
				flushList(i);
				result.push(
					<h3
						key={i}
						className="text-base sm:text-lg font-black uppercase italic mb-2 text-foreground mt-3 first:mt-0"
					>
						{parseLine(trimmed.slice(4), i, query)}
					</h3>
				);
			} else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
				currentList.push(
					<li
						key={i}
						className="flex items-start gap-2.5 text-sm sm:text-base text-foreground/80 leading-relaxed"
					>
						<span className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground/70 shrink-0" />
						<span>{parseLine(trimmed.slice(2), i, query)}</span>
					</li>
				);
			} else if (trimmed === "---" || trimmed === "***") {
				flushList(i);
				result.push(<hr key={i} className="border-foreground/5 my-4" />);
			} else if (trimmed === "") {
				flushList(i);
			} else {
				flushList(i);
				result.push(
					<p
						key={i}
						className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-4 last:mb-0 font-medium"
					>
						{parseLine(trimmed, i, query)}
					</p>
				);
			}
		});

		flushList(lines.length);
		return result;
	}, [text, query]);

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
	rows = 6,
	className,
}: MarkdownEditorProps) {
	const [tab, setTab] = useState<"write" | "preview">("write");
	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex items-center justify-between">
				{label && (
					<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
						{label}
					</Label>
				)}
				<div className="flex items-center gap-0.5 rounded-xl border border-foreground/5 bg-foreground/3 p-1 ml-auto">
					{(["write", "preview"] as const).map((t, i) => (
						<Tooltip key={`${t}-${i}`}>
							<TooltipTrigger asChild>
								<Button
									size="xs"
									variant={tab === t ? "default" : "ghost"}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setTab(t);
									}}
									className={cn(
										"rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all",
										tab === t &&
											"bg-background text-foreground shadow-xs border border-foreground/5"
									)}
								>
									{t === "write" ? (
										<PencilSimpleLineIcon size={12} weight="bold" />
									) : (
										<EyeIcon size={12} weight="bold" />
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
					placeholder={placeholder ?? "Поддерживается форматирование..."}
					className="font-mono text-xs p-4 rounded-2xl bg-foreground/1 border-foreground/10 focus-visible:ring-primary/20 resize-none leading-relaxed"
				/>
			) : (
				<div
					className="rounded-2xl border border-foreground/10 bg-background/50 p-4 overflow-auto min-h-37.5"
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
