"use client";

import {
	type IconWeight,
	MonitorIcon,
	MoonIcon,
	SpinnerIcon,
	SunHorizonIcon,
	SunIcon,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Shared icon (hydration-safe) ────────────────────────────────────────────

function ThemeIcon({ className }: { className?: string }) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted) return <SunHorizonIcon className={className} />;
	return resolvedTheme === "dark" ? (
		<MoonIcon className={className} />
	) : (
		<SunIcon className={className} />
	);
}

// ─── Variant: "card" — три кнопки (используется в ProfileDetails) ─────────────

export function ThemeCard() {
	const { theme, setTheme } = useTheme();
	const themes = [
		{ id: "light", label: "Светлая", icon: SunIcon },
		{ id: "dark", label: "Тёмная", icon: MoonIcon },
		{ id: "system", label: "Системная", icon: MonitorIcon },
	] as const;

	return (
		<div className="grid grid-cols-3 gap-2">
			{themes.map(({ id, label, icon: Icon }) => {
				const active = theme === id;
				return (
					<button
						key={id}
						type="button"
						onClick={() => setTheme(id)}
						className={cn(
							"cursor-pointer flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border border-foreground/5 hover:border-foreground/10 transition-all duration-200",
							active
								? "bg-muted-foreground/10 text-foreground brightness-140"
								: "text-muted-foreground hover:text-foreground"
						)}
					>
						<Icon size={18} weight={active ? "fill" : "regular"} />
						<span className="text-[11px] font-semibold">{label}</span>
					</button>
				);
			})}
		</div>
	);
}

// ─── Variant: "toggle" — переключатель с ползунком (для dropdown/меню) ────────

export function ThemeToggle({
	className,
	showLabel = true,
	iconSize = 18,
}: {
	className?: string;
	showLabel?: boolean;
	iconSize?: number;
}) {
	const { setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const isDark = resolvedTheme === "dark";

	const handleToggle = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setTheme(isDark ? "light" : "dark");
		if (typeof navigator !== "undefined" && navigator.vibrate)
			navigator.vibrate(5);
	};

	return (
		<button
			type="button"
			onClick={handleToggle}
			className={cn(
				"flex items-center gap-3 transition-colors rounded-xl",
				className
			)}
		>
			<ThemeIcon
				className={cn(
					"text-muted-foreground shrink-0",
					`w-${iconSize / 4} h-${iconSize / 4}`
				)}
			/>
			{showLabel && (
				<span className="text-sm font-medium flex-1 text-left">
					{!mounted ? "Тема" : isDark ? "Тёмная тема" : "Светлая тема"}
				</span>
			)}
			{/* Toggle pill */}
			<div
				className={cn(
					"w-8 h-4 rounded-full relative transition-colors shrink-0",
					mounted && isDark ? "bg-primary/40" : "bg-foreground/10"
				)}
			>
				<div
					className={cn(
						"absolute top-1 left-1 w-2 h-2 rounded-full bg-foreground transition-all",
						mounted && isDark && "translate-x-4 bg-primary"
					)}
				/>
			</div>
		</button>
	);
}

// ─── Variant: "icon-button" — только иконка (для nav bars) ───────────────────

export function ThemeIconButton({
	size = 22,
	className,
	weight = "duotone",
}: {
	size?: number;
	className?: string;
	weight?: IconWeight;
}) {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const toggleTheme = () => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
		if (typeof navigator !== "undefined" && navigator.vibrate) {
			navigator.vibrate(5);
		}
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: <for SidebarMenuButton>
		<span
			tabIndex={0}
			role="button"
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					toggleTheme();
				}
			}}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setTheme(resolvedTheme === "dark" ? "light" : "dark");
				if (navigator.vibrate) navigator.vibrate(5);
			}}
			className={cn(
				"text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all p-2 hover:bg-foreground/10 group/theme",
				className
			)}
			aria-label="Переключить тему"
		>
			{!mounted ? (
				<SpinnerIcon
					size={size}
					weight={weight}
					className="text-muted-foreground group-hover/theme:scale-120 group-hover/theme:text-foreground  duration-300 animate-spin"
				/>
			) : resolvedTheme === "dark" ? (
				<MoonIcon
					size={size}
					weight={weight}
					className="text-muted-foreground group-hover/theme:scale-120 group-hover/theme:text-foreground  duration-300"
				/>
			) : (
				<SunIcon
					size={size}
					weight={weight}
					className="text-muted-foreground group-hover/theme:scale-120 group-hover/theme:text-foreground   duration-300"
				/>
			)}
		</span>
	);
}
