"use client";

import { CalendarBlankIcon, GearIcon, VideoIcon } from "@phosphor-icons/react";
import { useCallback, useState, useTransition } from "react";
import {
	getStudioTariffsAction,
	type StudioTariffData,
} from "@/actions/admin-studio-actions";
import { AdminStudioTariffsPanel } from "@/components/admin/studio/AdminStudioTariffsPanel";
import { StudioBookingTable } from "@/components/admin/studio/StudioBookingTable";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminStudioPageClientProps {
	tariffs: StudioTariffData[];
	pendingCount: number;
	isAdmin: boolean;
}

type TabId = "bookings" | "tariffs";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
	{ id: "bookings", label: "Заказы", icon: CalendarBlankIcon },
	{ id: "tariffs", label: "Тарифы", icon: GearIcon },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminStudioPageClient({
	tariffs: initialTariffs,
	pendingCount,
	isAdmin,
}: AdminStudioPageClientProps) {
	const [activeTab, setActiveTab] = useState<TabId>("bookings");
	const [tariffs, setTariffs] = useState(initialTariffs);
	const [_isRefreshing, startRefreshTransition] = useTransition();

	const refreshTariffs = useCallback(() => {
		startRefreshTransition(async () => {
			const fresh = await getStudioTariffsAction();
			setTariffs(fresh);
		});
	}, []);

	return (
		<div className="flex flex-col h-full min-h-0">
			{/* ── Header ── */}
			<div className="px-6 pt-6 pb-4 border-b border-foreground/5 flex items-start justify-between gap-4">
				<div>
					<div className="flex items-center gap-2.5">
						<VideoIcon size={20} className="text-primary" weight="duotone" />
						<h1 className="text-2xl font-black italic uppercase tracking-tighter">
							Студия
						</h1>
						{pendingCount > 0 && (
							<Badge className="h-5 px-2 text-[10px] font-bold bg-primary text-primary-foreground animate-pulse">
								{pendingCount} новых
							</Badge>
						)}
					</div>
				</div>

				{/* Link to public studio page */}
				<Button
					variant="outline"
					size="sm"
					className="h-8 text-xs shrink-0"
					asChild
				>
					<a href="/studio" target="_blank" rel="noopener noreferrer">
						Страница студии ↗
					</a>
				</Button>
			</div>

			{/* ── Tabs ── */}
			<div className="flex border-b border-foreground/5 px-6">
				{TABS.map(({ id, label, icon: Icon }) => (
					<button
						key={id}
						type="button"
						onClick={() => setActiveTab(id)}
						className={cn(
							"flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-all relative shrink-0",
							activeTab === id
								? "text-primary"
								: "text-foreground/50 hover:text-foreground"
						)}
					>
						<Icon size={15} />
						{label}
						{id === "bookings" && pendingCount > 0 && (
							<span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1">
								{pendingCount}
							</span>
						)}
						{activeTab === id && (
							<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
						)}
					</button>
				))}
			</div>

			{/* ── Tab content ── */}
			<div className="flex-1 min-h-0 overflow-auto">
				{activeTab === "bookings" && (
					<div className="p-2 xs:p-6">
						<StudioBookingTable tariffs={tariffs} isAdmin={isAdmin} />
					</div>
				)}

				{activeTab === "tariffs" && (
					<div className="p-6 max-w-2xl">
						<AdminStudioTariffsPanel
							tariffs={tariffs}
							onRefresh={refreshTariffs}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
