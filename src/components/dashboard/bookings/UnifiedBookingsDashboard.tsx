"use client";

import {
	CalendarIcon,
	CameraIcon,
	CaretRightIcon,
	CheckCircleIcon,
	ClockIcon,
	FilmSlateIcon,
	LightningIcon,
	PackageIcon,
	TagChevronIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { differenceInHours } from "date-fns";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClientStudioBookingRow } from "@/actions/client-studio-actions";
import { BookingQuickDialog } from "@/components/dashboard/bookings/BookingQuickDialog";
import { StatusPill } from "@/components/dashboard/bookings/StatusPill";
import { ClientTime } from "@/components/shared";
import { Button, Dialog, DialogTrigger } from "@/components/ui";
import type {
	BookingStatus,
	DashboardBooking,
} from "@/core/domain/entities/Booking";
import { cn, fmtRub } from "@/lib/utils";

type BookingKind = "equipment" | "studio";

export interface UnifiedBooking {
	id: string;
	kind: BookingKind;
	startDate: Date;
	endDate: Date;
	totalAmount: number;
	status: string;
	createdAt: Date;
	bookingItems?: DashboardBooking["bookingItems"];
	promoCode?: string | null;
	discountAmount?: number | null;
	tariffName?: string;
	tariffPriceAtBooking?: number;
	durationHours?: number;
	itemsCount?: number;
}

type TabKey =
	| "recent"
	| "upcoming"
	| "active"
	| "completed"
	| "cancelled"
	| "all";

interface Tab {
	key: TabKey;
	label: string;
	icon: React.ReactNode;
	filterFn?: (b: UnifiedBooking) => boolean;
}

export interface DashboardStats {
	totalBookings: number;
	upcomingBookings: number;
	activeBookings: number;
	completedBookings: number;
	cancelledBookings: number;
	totalSpent: number;
}

interface Props {
	equipmentBookings: DashboardBooking[];
	studioBookings: ClientStudioBookingRow[];
	stats: DashboardStats;
}

function toUnified(b: DashboardBooking): UnifiedBooking {
	return {
		id: b.id,
		kind: "equipment",
		startDate: new Date(b.startDate),
		endDate: new Date(b.endDate),
		totalAmount: b.totalAmount,
		status: b.status,
		createdAt: new Date(b.createdAt),
		bookingItems: b.bookingItems,
		promoCode: b.promoCode || "",
		discountAmount: b.discountAmount || null,
	};
}

function studioToUnified(b: ClientStudioBookingRow): UnifiedBooking {
	return {
		id: b.id,
		kind: "studio",
		startDate: new Date(b.startDate),
		endDate: new Date(b.endDate),
		totalAmount: b.totalAmount,
		status: b.status,
		createdAt: new Date(b.createdAt),
		tariffName: b.tariffName,
		tariffPriceAtBooking: b.tariffPriceAtBooking,
		durationHours: b.durationHours,
		itemsCount: b.itemsCount,
	};
}

const ACTIVE_STATUSES: BookingStatus[] = ["ACTIVE"];
const UPCOMING_STATUSES: BookingStatus[] = [
	"PENDING_REVIEW",
	"WAIT_PAYMENT",
	"READY_TO_RENT",
];
const COMPLETED_STATUSES: BookingStatus[] = ["COMPLETED"];
const CANCELLED_STATUSES: BookingStatus[] = ["CANCELLED", "EXPIRED"];

function BookingCard({ booking }: { booking: UnifiedBooking }) {
	const hours = Math.ceil(
		differenceInHours(booking.endDate, booking.startDate)
	);
	const isEquipment = booking.kind === "equipment";
	const firstItem = booking.bookingItems?.[0];
	const extraCount = (booking.bookingItems?.length ?? 0) - 1;
	const href = isEquipment
		? `/dashboard/bookings/${booking.id}`
		: `/dashboard/studio-bookings/${booking.id}`;

	return (
		<Dialog>
			<DialogTrigger asChild>
				<button
					type="button"
					className="w-full flex items-center gap-3 px-4 py-3.5 bg-card/30 hover:bg-foreground/5 active:scale-[0.98] transition-all duration-200 rounded-2xl border border-foreground/3 text-left group"
				>
					<div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted-foreground/10 shrink-0 shadow-sm">
						{isEquipment ? (
							firstItem?.imageUrl ? (
								<Image
									src={firstItem.imageUrl}
									alt={firstItem.equipment.title}
									fill
									sizes="48px"
									className="object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center">
									<CameraIcon size={18} className="text-muted-foreground/40" />
								</div>
							)
						) : (
							<div className="w-full h-full flex items-center justify-center bg-secondary">
								<FilmSlateIcon
									size={22}
									className="text-foreground"
									weight="duotone"
								/>
							</div>
						)}
						{isEquipment && extraCount > 0 && (
							<div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
								<span className="text-foreground text-[14px] font-black">
									+{extraCount}
								</span>
							</div>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<span className="font-mono text-[10px] font-bold text-muted-foreground/70">
								№ {booking.id.split("-")[0]?.toUpperCase()}
							</span>
							<StatusPill status={booking.status} />
						</div>
						<p className="text-sm font-semibold leading-tight truncate text-foreground/90">
							{isEquipment
								? (firstItem?.equipment.title ?? "—")
								: (booking.tariffName ?? "Студия")}
						</p>
						<div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
							<ClientTime
								iso={booking.startDate.toISOString()}
								fmt="date"
								fallback="..."
							/>
							<span className="opacity-40">→</span>
							<ClientTime
								iso={booking.endDate.toISOString()}
								fmt="date"
								fallback="..."
							/>
							<span className="opacity-40">·</span>
							<span>{hours} ч.</span>
						</div>
					</div>

					<div className="flex flex-col items-end justify-between gap-1 shrink-0 h-full">
						{booking.promoCode && (
							<div className="flex items-center gap-0.5 bg-green-500/10 px-1.5 py-0.5 rounded-md">
								<TagChevronIcon
									size={10}
									className="text-green-600 dark:text-green-400"
								/>
								<span className="text-[9px] font-mono text-green-700 dark:text-green-400 font-bold">
									{booking.promoCode}
								</span>
							</div>
						)}
						<p className="text-[15px] font-black tabular-nums pt-auto">
							{fmtRub(booking.totalAmount)}
						</p>
					</div>
				</button>
			</DialogTrigger>
			<BookingQuickDialog booking={booking} hours={hours} href={href} />
		</Dialog>
	);
}

function EmptyState({ tab }: { tab: TabKey }) {
	const messages: Record<TabKey, { icon: React.ReactNode; text: string }> = {
		upcoming: {
			icon: <ClockIcon size={32} weight="duotone" />,
			text: "Нет предстоящих заказов",
		},
		active: {
			icon: <LightningIcon size={32} weight="duotone" />,
			text: "Нет активных заказов",
		},
		completed: {
			icon: <CheckCircleIcon size={32} weight="duotone" />,
			text: "Нет завершённых заказов",
		},
		cancelled: {
			icon: <XCircleIcon size={32} weight="duotone" />,
			text: "Нет отменённых заказов",
		},
		recent: {
			icon: <CalendarIcon size={32} weight="duotone" />,
			text: "Нет последних заказов",
		},
		all: {
			icon: <PackageIcon size={32} weight="duotone" />,
			text: "Заказов пока нет",
		},
	};
	const { icon, text } = messages[tab];
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground/40 bg-card/20 rounded-3xl border border-dashed border-foreground/10">
			<div className="mb-4 text-muted-foreground/30">{icon}</div>
			<p className="text-sm font-medium text-foreground/50">{text}</p>
		</div>
	);
}

function TabButton({
	tab,
	active,
	count,
	onClick,
}: {
	tab: Tab;
	active: boolean;
	count: number;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"relative overflow-hidden flex flex-col justify-center text-left transition-all duration-300 rounded-2xl border shrink-0 snap-start",
				"w-32.5 sm:w-35 p-3 sm:p-4",
				active
					? "bg-foreground border-foreground text-background shadow-lg shadow-foreground/10 ring-1 ring-foreground/20"
					: "bg-card/60 border-foreground/10 text-muted-foreground hover:text-foreground hover:bg-card/80 backdrop-blur-md"
			)}
		>
			<span
				className={cn(
					"text-[9px] sm:text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 opacity-70",
					active && "opacity-90 font-black"
				)}
			>
				{tab.label}
			</span>
			<div className="flex items-center gap-2 mt-1.5">
				<span
					className={cn("opacity-40", active && "text-background opacity-70")}
				>
					{tab.icon}
				</span>
				<span className="text-2xl sm:text-3xl font-black font-mono tracking-tighter tabular-nums leading-none">
					{count}
				</span>
			</div>
		</button>
	);
}

export function UnifiedBookingsDashboard({
	equipmentBookings,
	studioBookings,
	stats,
}: Props) {
	const [activeTab, setActiveTab] = useState<TabKey>("recent");

	const allUnified = useMemo(() => {
		return [
			...equipmentBookings.map(toUnified),
			...studioBookings.map(studioToUnified),
		].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	}, [equipmentBookings, studioBookings]);

	const tabs: Tab[] = useMemo(
		() => [
			{
				key: "recent",
				label: "Последние",
				icon: <CalendarIcon size={18} weight="duotone" />,
				filterFn: () => true,
			},
			{
				key: "upcoming",
				label: "Предстоящие",
				icon: <ClockIcon size={18} weight="duotone" />,
				filterFn: (b) => UPCOMING_STATUSES.includes(b.status as BookingStatus),
			},
			{
				key: "active",
				label: "Активные",
				icon: <LightningIcon size={18} weight="duotone" />,
				filterFn: (b) => ACTIVE_STATUSES.includes(b.status as BookingStatus),
			},
			{
				key: "completed",
				label: "Завершенные",
				icon: <CheckCircleIcon size={18} weight="duotone" />,
				filterFn: (b) => COMPLETED_STATUSES.includes(b.status as BookingStatus),
			},
			{
				key: "cancelled",
				label: "Отмененные",
				icon: <XCircleIcon size={18} weight="duotone" />,
				filterFn: (b) => CANCELLED_STATUSES.includes(b.status as BookingStatus),
			},
			{
				key: "all",
				label: "Все",
				icon: <PackageIcon size={18} weight="duotone" />,
				filterFn: () => true,
			},
		],
		[]
	);

	const getTabCount = (tabKey: TabKey): number => {
		switch (tabKey) {
			case "all":
				return stats.totalBookings;
			case "upcoming":
				return stats.upcomingBookings;
			case "active":
				return stats.activeBookings;
			case "completed":
				return stats.completedBookings;
			case "cancelled":
				return stats.cancelledBookings;
			default:
				return allUnified.length;
		}
	};

	const activeBookings = useMemo(() => {
		const filterFn =
			tabs.find((t) => t.key === activeTab)?.filterFn ?? (() => true);
		const limit =
			activeTab === "all" ||
			activeTab === "completed" ||
			activeTab === "cancelled"
				? 50
				: 20;
		return allUnified.filter(filterFn).slice(0, limit);
	}, [allUnified, tabs, activeTab]);

	const tabToStatusParam: Record<TabKey, string> = {
		upcoming: "PENDING_REVIEW",
		active: "ACTIVE",
		completed: "COMPLETED",
		cancelled: "CANCELLED",
		recent: "",
		all: "",
	};

	const seeAllHref = tabToStatusParam[activeTab]
		? `/dashboard/bookings?status=${tabToStatusParam[activeTab]}`
		: "/dashboard/bookings";

	// Настройки анимации для родительского контейнера
	const containerVariants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.05,
			},
		},
	};

	// Настройки анимации для каждой отдельной карточки
	const itemVariants: Variants = {
		hidden: { opacity: 0, y: 15, scale: 0.98 },
		show: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: { type: "spring", stiffness: 300, damping: 24 },
		},
	};

	return (
		<div className="flex flex-col w-full relative">
			<div className="sticky top-16 z-5 pt-2 pb-4 -mx-4 px-4 sm:-mx-8 sm:px-8 bg-background/60 backdrop-blur-lg shadow-[0_4px_30px_transparent] mb-6">
				<div className="flex flex-row overflow-x-auto no-scrollbar gap-3 snap-x snap-mandatory">
					{tabs.map((tab) => (
						<TabButton
							key={tab.key}
							tab={tab}
							active={activeTab === tab.key}
							count={getTabCount(tab.key)}
							onClick={() => setActiveTab(tab.key)}
						/>
					))}
				</div>
			</div>

			<div className="w-full min-h-100">
				<AnimatePresence mode="wait">
					{activeBookings.length === 0 ? (
						<motion.div
							key="empty-state"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.2 }}
						>
							<EmptyState tab={activeTab} />
						</motion.div>
					) : (
						<motion.div
							key={activeTab}
							variants={containerVariants}
							initial="hidden"
							animate="show"
							className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4"
						>
							{activeBookings.map((b) => (
								<motion.div key={`${b.kind}-${b.id}`} variants={itemVariants}>
									<BookingCard booking={b} />
								</motion.div>
							))}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Footer CTA */}
				{activeBookings.length > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
						className="mt-8 flex justify-center lg:justify-start"
					>
						<Button
							size="lg"
							variant="secondary"
							className="rounded-xl px-8"
							asChild
						>
							<Link href={seeAllHref}>
								Показать всю историю{" "}
								<CaretRightIcon weight="bold" className="ml-2" />
							</Link>
						</Button>
					</motion.div>
				)}
			</div>
		</div>
	);
}
