"use client";

import {
	DotsSixVerticalIcon,
	EyeClosedIcon,
	EyeIcon,
	MegaphoneIcon,
	MonitorIcon,
	PencilSimpleIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { Banner, BannerType } from "@/actions/admin/admin-banner-actions";
import {
	deleteBannerAction,
	reorderBannersAction,
	updateBannerAction,
} from "@/actions/admin/admin-banner-actions";
import { BannerFormDialog } from "@/components/admin/banner/BannerFormDialog";
import { BannerCarousel } from "@/components/layouts/home/events-banner/BannerCarousel";
import { Button, CardContent } from "@/components/ui";
import { PLACEMENT_OPTIONS, TYPE_COLORS, TYPE_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";

// ── Превью-панель (client view mode) ─────────────────────────────────────────

function BannerPreviewPanel({
	banner,
	onClose,
}: {
	banner: Banner;
	onClose: () => void;
}) {
	const [previewPlacement, setPreviewPlacement] = useState<"hero" | "studio">(
		banner.placement === "studio" ? "studio" : "hero"
	);

	// Определяем в каких секциях баннер вообще показывается
	const showsInHero =
		banner.placement === "hero" || banner.placement === "both";
	const showsInStudio =
		banner.placement === "studio" || banner.placement === "both";

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
			{/* Backdrop */}
			<CardContent
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			<div className="relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background border border-foreground/8 shadow-2xl no-scrollbar">
				{/* Заголовок */}
				<div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-foreground/5">
					<div>
						<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
							Предпросмотр
						</p>
						<h3 className="font-black italic truncate max-w-64">
							{banner.title}
						</h3>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="h-8 w-8 rounded-full border border-foreground/10 flex items-center justify-center hover:bg-foreground/8 transition-colors shrink-0"
					>
						<XIcon size={14} />
					</button>
				</div>

				{/* Переключатель секции */}
				{banner.placement === "both" && (
					<div className="px-5 pt-3">
						<div className="flex gap-2 p-1 bg-foreground/5 rounded-xl">
							{(["hero", "studio"] as const).map((p) => (
								<button
									key={p}
									type="button"
									onClick={() => setPreviewPlacement(p)}
									className={cn(
										"flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
										previewPlacement === p
											? "bg-background shadow-sm text-foreground"
											: "text-muted-foreground hover:text-foreground"
									)}
								>
									{p === "hero" ? "Главный экран" : "Студия"}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Инфо о размещении если только одно место */}
				{banner.placement !== "both" && (
					<div className="px-5 pt-3">
						<p className="text-[11px] text-muted-foreground">
							Баннер отображается только в:{" "}
							<span className="font-bold text-foreground">
								{banner.placement === "hero" ? "Главном экране" : "Студии"}
							</span>
						</p>
					</div>
				)}

				{/* Карусель-превью */}
				<div
					className={cn(
						"mx-5 my-4 rounded-2xl overflow-hidden",
						previewPlacement === "studio"
							? "bg-foreground p-4"
							: "bg-background/50 border border-foreground/8 p-4"
					)}
				>
					<p
						className={cn(
							"text-[10px] font-bold uppercase tracking-wider mb-3 opacity-50",
							previewPlacement === "studio"
								? "text-background"
								: "text-foreground"
						)}
					>
						{previewPlacement === "hero" ? "Hero секция" : "Студия"}
					</p>
					<BannerCarousel
						banners={[banner]}
						variant={previewPlacement}
						autoplayMs={0}
					/>
				</div>

				{/* Мета-информация */}
				<div className="px-5 pb-5 space-y-3 border-t border-foreground/5 pt-4">
					<div className="grid grid-cols-2 gap-3 text-xs">
						<div className="space-y-0.5">
							<p className="text-muted-foreground font-medium">Тип</p>
							<p className="font-bold">
								{TYPE_OPTIONS.find((t) => t.value === banner.type)?.label ??
									banner.type}
							</p>
						</div>
						<div className="space-y-0.5">
							<p className="text-muted-foreground font-medium">Размещение</p>
							<p className="font-bold">
								{PLACEMENT_OPTIONS.find((p) => p.value === banner.placement)
									?.label ?? banner.placement}
							</p>
						</div>
						<div className="space-y-0.5">
							<p className="text-muted-foreground font-medium">Статус</p>
							<p
								className={cn(
									"font-bold",
									banner.isActive ? "text-green-500" : "text-muted-foreground"
								)}
							>
								{banner.isActive ? "Активен" : "Скрыт"}
							</p>
						</div>
						<div className="space-y-0.5">
							<p className="text-muted-foreground font-medium">Медиа</p>
							<p className="font-bold">
								{banner.images.length > 0
									? `${banner.images.length} эл.`
									: banner.imageUrl || banner.videoUrl
										? "1 эл."
										: "Нет"}
							</p>
						</div>
					</div>

					{/* Предупреждения */}
					{!showsInHero && previewPlacement === "hero" && (
						<div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600">
							<span>⚠</span>
							<span>Этот баннер не отображается в Hero — только в Студии</span>
						</div>
					)}
					{!showsInStudio && previewPlacement === "studio" && (
						<div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600">
							<span>⚠</span>
							<span>Этот баннер не отображается в Студии — только в Hero</span>
						</div>
					)}
					{!banner.isActive && (
						<div className="flex gap-2 p-3 bg-foreground/5 border border-foreground/10 rounded-xl text-xs text-muted-foreground">
							<span>👁</span>
							<span>Баннер скрыт — клиенты его не видят</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// ── BannerManager ─────────────────────────────────────────────────────────────

export function BannerManager({
	initialBanners,
}: {
	initialBanners: Banner[];
}) {
	const [banners, setBanners] = useState<Banner[]>(initialBanners);
	const [editTarget, setEditTarget] = useState<Banner | null>(null);
	const [previewTarget, setPreviewTarget] = useState<Banner | null>(null);
	const [showCreate, setShowCreate] = useState(false);
	const [, start] = useTransition();

	const dragIndex = useRef<number | null>(null);
	const dragOverIndex = useRef<number | null>(null);

	const refresh = () => window.location.reload();

	const handleDelete = (id: string, title: string) => {
		if (!confirm(`Удалить баннер «${title}»?`)) return;
		start(async () => {
			const r = await deleteBannerAction(id);
			if (!r.success) toast.error(r.error);
			else {
				toast.success("Удалён");
				setBanners((prev) => prev.filter((b) => b.id !== id));
			}
		});
	};

	const handleToggle = (banner: Banner) => {
		start(async () => {
			const r = await updateBannerAction(banner.id, {
				isActive: !banner.isActive,
			});
			if (!r.success) toast.error(r.error);
			else {
				setBanners((prev) =>
					prev.map((b) =>
						b.id === banner.id ? { ...b, isActive: !b.isActive } : b
					)
				);
			}
		});
	};

	const handleDrop = async () => {
		const from = dragIndex.current;
		const to = dragOverIndex.current;
		if (from === null || to === null || from === to) return;

		const reordered = [...banners];
		const [moved] = reordered.splice(from, 1);
		if (!moved) return;
		reordered.splice(to, 0, moved);
		setBanners(reordered);

		dragIndex.current = null;
		dragOverIndex.current = null;

		const r = await reorderBannersAction(reordered.map((b) => b.id));
		if (!r.success) toast.error("Ошибка сортировки");
	};

	return (
		<>
			<div className="card-surface space-y-4 flex flex-col items-center p-4 w-full">
				<div className="flex flex-col items-center justify-between w-full">
					<h2 className="text-lg font-black uppercase italic tracking-tight">
						Баннеры главной страницы
					</h2>
				</div>

				<div className="space-y-2 w-full">
					{banners.map((banner, index) => {
						const placementLabel =
							PLACEMENT_OPTIONS.find((p) => p.value === banner.placement)
								?.label ?? "Везде";

						return (
							<CardContent
								key={banner.id}
								draggable
								onDragStart={() => {
									dragIndex.current = index;
								}}
								onDragOver={(e) => {
									e.preventDefault();
									dragOverIndex.current = index;
								}}
								onDrop={handleDrop}
								className="flex items-center gap-3 p-3 cursor-grab active:cursor-grabbing group hover:bg-secondary/50 rounded-2xl transition-colors hover:shadow-md shadow-secondary"
							>
								<DotsSixVerticalIcon
									size={14}
									className="text-muted-foreground/30 group-hover:text-muted-foreground shrink-0"
								/>

								{/* Превью */}
								{banner.imageUrl ? (
									<div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
										<Image
											src={banner.imageUrl}
											alt={banner.title}
											fill
											sizes="40px"
											className="object-cover"
										/>
									</div>
								) : (
									<div className="w-10 h-10 rounded-lg bg-foreground/8 shrink-0 flex items-center justify-center">
										<MegaphoneIcon
											size={14}
											className="text-muted-foreground/40"
										/>
									</div>
								)}

								{/* Инфо */}
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-sm truncate">
										{banner.title}
									</p>
									<div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
										<span
											className={cn(
												"text-[10px] font-bold",
												TYPE_COLORS[banner.type as BannerType]
											)}
										>
											{TYPE_OPTIONS.find((t) => t.value === banner.type)?.label}
										</span>
										<span className="text-[10px] text-muted-foreground/40">
											·
										</span>
										<span className="text-[10px] text-muted-foreground">
											{placementLabel}
										</span>
										{banner.eventDate && (
											<>
												<span className="text-[10px] text-muted-foreground/40">
													·
												</span>
												<span className="text-[10px] text-muted-foreground">
													{new Date(banner.eventDate).toLocaleDateString(
														"ru-RU",
														{
															day: "numeric",
															month: "short",
														}
													)}
												</span>
											</>
										)}
									</div>
								</div>

								{/* Действия */}
								<div className="flex items-center gap-1 shrink-0">
									{/* Превью (client view) */}
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => setPreviewTarget(banner)}
										title="Предпросмотр"
									>
										<MonitorIcon size={13} className="text-muted-foreground" />
									</Button>

									{/* Скрыть / показать */}
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => handleToggle(banner)}
										title={banner.isActive ? "Скрыть" : "Показать"}
									>
										{banner.isActive ? (
											<EyeIcon size={13} className="text-green-500" />
										) : (
											<EyeClosedIcon
												size={13}
												className="text-muted-foreground"
											/>
										)}
									</Button>

									{/* Редактировать */}
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={() => setEditTarget(banner)}
									>
										<PencilSimpleIcon size={13} />
									</Button>

									{/* Удалить */}
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 hover:text-red-500 hover:bg-red-500/10"
										onClick={() => handleDelete(banner.id, banner.title)}
									>
										<TrashIcon size={13} />
									</Button>
								</div>
							</CardContent>
						);
					})}

					{banners.length === 0 && (
						<div className="py-12 text-center text-muted-foreground">
							<MegaphoneIcon size={32} className="mx-auto mb-3 opacity-20" />
							<p className="text-sm">Баннеров ещё нет. Создайте первый.</p>
						</div>
					)}
				</div>

				{/* Диалог создания */}
				<BannerFormDialog
					open={showCreate}
					onOpenChange={setShowCreate}
					onSaved={refresh}
				/>

				{/* Диалог редактирования */}
				{editTarget && (
					<BannerFormDialog
						open={!!editTarget}
						onOpenChange={(v) => !v && setEditTarget(null)}
						initial={editTarget}
						bannerId={editTarget.id}
						onSaved={refresh}
					/>
				)}

				<Button
					size="md"
					variant="ghost"
					className="w-full"
					onClick={() => setShowCreate(true)}
				>
					<PlusIcon size={14} />
					Добавить новый баннер
				</Button>
			</div>

			{/* Client view mode — превью поверх всего */}
			{previewTarget && (
				<BannerPreviewPanel
					banner={previewTarget}
					onClose={() => setPreviewTarget(null)}
				/>
			)}
		</>
	);
}
