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
import { menuBtnClass } from "@/components/layouts/AppSidebar/menuBtnClass";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── Shared icon (hydration-safe) ────────────────────────────────────────────

function ThemeIcon({ className }: { className?: string }) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!mounted) return <SunHorizonIcon className={className} />;
	return resolvedTheme === "dark" ? (
		<MoonIcon className={className} weight="duotone" />
	) : (
		<SunIcon className={className} weight="duotone" />
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

// ─── Variant: "toggle" ────────

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
				"flex w-full items-center gap-3 transition-colors rounded-xl text-muted-foreground text-md flex-1 font-medium",
				className
			)}
		>
			<ThemeIcon
				className={cn("shrink-0", `w-${iconSize / 4} h-${iconSize / 4}`)}
			/>
			{showLabel && (
				<span className="flex-1 text-left pl-1">
					{!mounted ? "Тема" : isDark ? "Тёмная тема" : "Светлая тема"}
				</span>
			)}
			{/* Toggle pill */}
			<div
				className={cn(
					"w-10 h-5 rounded-full relative transition-colors shrink-0",
					mounted && isDark ? "bg-primary/40" : "bg-foreground/10"
				)}
			>
				<div
					className={cn(
						"absolute top-1 left-1 w-3 h-3 rounded-full bg-foreground transition-all",
						mounted && isDark && "translate-x-5 bg-primary"
					)}
				/>
			</div>
		</button>
	);
}

interface ThemeIconButtonProps {
	size?: number;
	className?: string;
	weight?: IconWeight;
	isSidebar?: boolean;
	isCollapsed?: boolean;
	CollapseLabel?: React.ComponentType<{ text: string }>;
}

export function ThemeIconButton({
	size = 20,
	className,
	weight = "duotone",
	isSidebar = false,
	isCollapsed = false,
	CollapseLabel,
}: ThemeIconButtonProps) {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const isDark = resolvedTheme === "dark";

	const toggleTheme = () => {
		setTheme(isDark ? "light" : "dark");
		if (typeof navigator !== "undefined" && navigator.vibrate) {
			navigator.vibrate(5);
		}
	};

	const iconContent = !mounted ? (
		<SpinnerIcon
			size={size}
			weight={weight}
			className="animate-spin text-muted-foreground"
		/>
	) : isDark ? (
		<SunIcon size={size} weight={weight} />
	) : (
		<MoonIcon size={size} weight={weight} />
	);

	// AppSidebar
	if (isSidebar) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					className={menuBtnClass(false, isCollapsed)}
					tooltip={!isCollapsed ? "Сменить тему" : ""}
					onClick={toggleTheme}
				>
					<div
						className={cn(
							"flex items-center w-full h-full group/btn",
							isCollapsed ? "flex-col justify-center gap-1" : ""
						)}
					>
						<div
							className={cn(
								"flex items-center justify-center shrink-0 transition-all duration-300 text-muted-foreground group-hover/btn:text-foreground",
								isCollapsed
									? "w-12 h-7 rounded-full group-hover/btn:bg-foreground/10 group-hover/btn:scale-110"
									: "w-6"
							)}
						>
							{iconContent}
						</div>

						{!isCollapsed && (
							<span className="font-medium text-base truncate ml-3 flex-1 text-left">
								{!mounted ? "Тема" : isDark ? "Светлая тема" : "Тёмная тема"}
							</span>
						)}

						{isCollapsed && CollapseLabel && <CollapseLabel text="Тема" />}
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		// biome-ignore lint/a11y/useSemanticElements: <for span>
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
				toggleTheme();
			}}
			className={cn(
				"text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all p-2 hover:bg-foreground/10 group/theme",
				className
			)}
			aria-label="Переключить тему"
		>
			<div className="transition-transform duration-300 group-hover/theme:scale-125">
				{iconContent}
			</div>
		</span>
	);
}
