"use client";

import {
	MagnifyingGlassIcon,
	QuestionIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import type { DbFaqItem } from "@/actions/admin-faq-actions";
import { AskForm } from "@/components/layouts/Faq/AskForm";
import { FaqChip } from "@/components/layouts/Faq/FaqChip";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── FLIP ANIMATION HOOK ──────────────────────────────────────────────────────
// Реализует FLIP (First–Last–Invert–Play) для плавной перестановки чипов

function useFlipAnimation(deps: unknown) {
	const ref = useRef<HTMLDivElement>(null);
	const positions = useRef<Map<string, DOMRect>>(new Map());

	// Снимаем позиции ДО перерисовки
	useLayoutEffect(() => {
		const container = ref.current;
		if (!container) return;
		const chips = container.querySelectorAll<HTMLElement>("[data-flip-id]");
		chips.forEach((el) => {
			const newElId = el.dataset.flipId;
			if (newElId) {
				const id = newElId;
				positions.current.set(id, el.getBoundingClientRect());
			}
		});
	});

	// После перерисовки — играем анимацию из старой позиции в новую
	// biome-ignore lint/correctness/useExhaustiveDependencies: <react-hooks/exhaustive-deps>
	useEffect(() => {
		const container = ref.current;
		if (!container) return;
		const chips = container.querySelectorAll<HTMLElement>("[data-flip-id]");

		chips.forEach((el) => {
			const prevElId = el.dataset.flipId;
			if (!prevElId) return;
			const id = prevElId;
			const prev = positions.current.get(id);

			if (!prev) return;

			const next = el.getBoundingClientRect();
			const dx = prev.left - next.left;
			const dy = prev.top - next.top;

			if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

			el.animate(
				[
					{ transform: `translate(${dx}px, ${dy}px)`, opacity: 0.6 },
					{ transform: "translate(0, 0)", opacity: 1 },
				],
				{
					duration: 320,
					easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
					fill: "none",
				}
			);
		});
	}, [deps]);

	return ref;
}

// ─── SEARCH LOGIC ─────────────────────────────────────────────────────────────

function scoreItem(item: DbFaqItem, query: string): number {
	if (!query.trim()) return 1;
	const q = query.toLowerCase();
	const tokens = q.split(/\s+/).filter(Boolean);

	let score = 0;
	const questionLow = item.question.toLowerCase();
	const answerLow = item.answer.toLowerCase();
	const tags = (item.tags ?? []).map((t) => t.toLowerCase());

	for (const token of tokens) {
		if (questionLow.startsWith(token)) score += 5;
		else if (questionLow.includes(token)) score += 3;
		if (answerLow.includes(token)) score += 1;
		if (tags.some((t) => t === token)) score += 6;
		else if (tags.some((t) => t.includes(token))) score += 4;
	}

	return score;
}

function filterAndSort(items: DbFaqItem[], query: string): DbFaqItem[] {
	if (!query.trim()) return items;
	return items
		.map((item) => ({ item, score: scoreItem(item, query) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.map(({ item }) => item);
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function FaqClientPage({ items }: { items: DbFaqItem[] }) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const initialQuery = searchParams.get("q") ?? "";
	const initialOpen = searchParams.get("id") ?? null;

	const [query, setQuery] = useState(initialQuery);
	const [openId, setOpenId] = useState<string | null>(initialOpen);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// TanStack Query — реактивный локальный поиск с кешем
	const { data: filtered = items } = useQuery({
		queryKey: ["faq-search", query, items.length],
		queryFn: () => filterAndSort(items, query),
		staleTime: Infinity,
		placeholderData: (prev) => prev,
	});

	// FLIP-анимация — триггерится при смене filtered
	const gridRef = useFlipAnimation(filtered.map((i) => i.id).join(","));

	// URL-синхронизация
	const syncUrl = useCallback(
		(q: string, id: string | null) => {
			const params = new URLSearchParams();
			if (q) params.set("q", q);
			if (id) params.set("id", id);
			const qs = params.toString();
			router.replace(qs ? `/faq?${qs}` : "/faq", { scroll: false });
		},
		[router]
	);

	const handleQueryChange = (val: string) => {
		setQuery(val);
		setOpenId(null);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => syncUrl(val, null), 300);
	};

	const handleToggle = (id: string) => {
		const next = openId === id ? null : id;
		setOpenId(next);
		syncUrl(query, next);
	};

	const noResults = query.trim() !== "" && filtered.length === 0;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto max-w-4xl px-4 py-20">
				{/* Header */}
				<div className="mb-12 text-center">
					<h1 className="text-5xl font-black uppercase italic tracking-tight mb-4">
						Вопросы и ответы
					</h1>
					{/* Search bar */}
					<div className="relative max-w-xl mx-auto">
						<MagnifyingGlassIcon
							size={16}
							className="z-1 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
						/>
						<Input
							type="text"
							value={query}
							onChange={(e) => handleQueryChange(e.target.value)}
							placeholder="Начните печатать свой вопрос"
							className={cn(
								"w-full rounded-full border border-input",
								"pl-10 pr-10 py-3 text-sm transition-all duration-200",
								"ring-primary focus:outline-none focus:ring-1 focus:ring-ring",
								"placeholder:text-muted-foreground/40"
							)}
						/>
						{query && (
							<Button
								size="icon"
								variant="ghost"
								onClick={() => handleQueryChange("")}
								className="z-1 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
							>
								<XIcon size={16} weight="bold" />
							</Button>
						)}
					</div>

					{query && !noResults && (
						<p className="text-xs text-muted-foreground/50 mt-3 animate-in fade-in duration-200">
							{filtered.length}{" "}
							{filtered.length % 10 === 1 && filtered.length !== 11
								? "результат"
								: filtered.length % 10 <= 4 &&
										filtered.length !== 12 &&
										filtered.length !== 13 &&
										filtered.length !== 14
									? "результата"
									: "результатов"}
						</p>
					)}
				</div>

				{/* Chips grid */}
				{!noResults && (
					<div ref={gridRef} className="grid gap-2">
						{filtered.map((item) => (
							<FaqChip
								key={item.id}
								item={item}
								query={query}
								isOpen={openId === item.id}
								onToggle={() => handleToggle(item.id)}
							/>
						))}
					</div>
				)}

				{/* Not found */}
				{noResults && (
					<div className="max-w-xl mx-auto rounded-2xl border border-foreground/8 bg-foreground/2 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-300">
						<div className="text-center space-y-2">
							<QuestionIcon
								size={32}
								weight="duotone"
								className="mx-auto text-muted-foreground/30 mb-3"
							/>
							<p className="font-semibold">Ничего не нашли</p>
							<p className="text-sm text-muted-foreground">
								По запросу{" "}
								<span className="text-foreground font-medium">«{query}»</span>{" "}
								ответа пока нет — но вы можете спросить напрямую
							</p>
						</div>
						<AskForm defaultQuestion={query} />
					</div>
				)}

				{/* Ask form at bottom */}
				{!noResults && items.length > 0 && (
					<div className="mt-16 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
						<div className="rounded-2xl border border-foreground/8 bg-foreground/2 p-6">
							<p className="text-sm font-semibold mb-1">Не нашли ответ?</p>
							<p className="text-xs text-muted-foreground mb-4">
								Задайте вопрос — мы добавим его в FAQ
							</p>
							<AskForm defaultQuestion="" />
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
