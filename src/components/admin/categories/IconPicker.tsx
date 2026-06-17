"use client";

import { CaretDownIcon, type Icon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui";
import { PHOSPHOR_ICON_MAP } from "@/constants/phosphor-icon-client.config";
import { cn } from "@/lib/utils";

export function IconPicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const ref = useRef<HTMLDivElement>(null);

	const SelectedIcon = (PHOSPHOR_ICON_MAP[value] ||
		PHOSPHOR_ICON_MAP.Package) as Icon;
	const filtered = Object.keys(PHOSPHOR_ICON_MAP).filter((name) =>
		name.toLowerCase().includes(search.toLowerCase())
	);

	// Закрываем по клику снаружи
	useEffect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open]);

	return (
		<div className="relative w-full" ref={ref}>
			{/* Trigger */}
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="flex flex-1 items-center gap-2 h-9 px-3 rounded-xl border border-foreground/10 bg-foreground/5 text-sm hover:border-primary/40 transition-colors w-full cursor-pointer"
			>
				<SelectedIcon
					size={16}
					weight="fill"
					className="text-primary shrink-0"
				/>
				<span className="text-xs text-muted-foreground font-mono">{value}</span>
				<CaretDownIcon
					size={12}
					className={cn(
						"text-muted-foreground ml-auto transition-transform duration-200",
						open && "rotate-180"
					)}
				/>
			</button>

			{/* Dropdown */}
			{open && (
				<div className="absolute left-0 top-full mt-1 z-40 bg-popover border border-foreground/10 rounded-2xl shadow-2xl p-3 w-72 space-y-2 animate-in slide-in-from-top-1 duration-150 backdrop-blur-2xl">
					{/* Поиск */}
					<Input
						autoFocus
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Поиск иконки..."
						className="w-full h-7 px-2.5 rounded-lg text-xs bg-foreground/5 border border-foreground/10 outline-none focus:border-primary/40 transition-colors glass-input"
					/>

					{/* Сетка иконок */}
					<div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto custom-scrollbar pr-1">
						{filtered.map((name) => {
							const IconComp = (PHOSPHOR_ICON_MAP[name] ||
								PHOSPHOR_ICON_MAP.Package) as Icon;
							const isSelected = value === name;
							return (
								<button
									key={name}
									type="button"
									title={name}
									onClick={() => {
										onChange(name);
										setOpen(false);
										setSearch("");
									}}
									className={cn(
										"flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-xl transition-all",
										"hover:bg-primary/10 hover:text-primary",
										isSelected
											? "bg-primary/15 text-primary ring-1 ring-primary/30"
											: "text-muted-foreground"
									)}
								>
									<IconComp
										size={18}
										weight={isSelected ? "fill" : "regular"}
									/>
									<span className="text-[7px] truncate w-full text-center leading-none opacity-60">
										{name.slice(0, 6)}
									</span>
								</button>
							);
						})}
						{filtered.length === 0 && (
							<p className="col-span-7 text-center text-xs text-muted-foreground py-4">
								Ничего не найдено
							</p>
						)}
					</div>

					{/* Текущий выбор */}
					<div className="flex items-center gap-2 pt-1 border-t border-foreground/5">
						<SelectedIcon size={14} weight="fill" className="text-primary" />
						<span className="text-[10px] text-muted-foreground font-mono">
							{value}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
