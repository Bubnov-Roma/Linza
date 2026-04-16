"use client";

import {
	DotsSixVerticalIcon,
	EyeClosedIcon,
	EyeIcon,
	MegaphoneIcon,
	PencilSimpleIcon,
	PlusIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { Banner, BannerType } from "@/actions/admin-banner-actions";
import {
	deleteBannerAction,
	reorderBannersAction,
	updateBannerAction,
} from "@/actions/admin-banner-actions";
import { BannerFormDialog } from "@/components/admin/banner/BannerFormDialog";
import { Button, CardContent } from "@/components/ui";
import { TYPE_COLORS, TYPE_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";

export function BannerManager({
	initialBanners,
}: {
	initialBanners: Banner[];
}) {
	const [banners, setBanners] = useState<Banner[]>(initialBanners);
	const [editTarget, setEditTarget] = useState<Banner | null>(null);
	const [showCreate, setShowCreate] = useState(false);
	const [, start] = useTransition();

	const dragIndex = useRef<number | null>(null);
	const dragOverIndex = useRef<number | null>(null);

	// Перезагружаем список после изменений
	const refresh = () => {
		window.location.reload(); // простой способ; можно заменить на router.refresh()
	};

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
		<div className="card-surface space-y-4 flex flex-col items-center">
			<div className="flex flex-col items-center justify-between">
				<h2 className="text-lg font-black uppercase italic tracking-tight">
					Баннеры главной страницы
				</h2>
			</div>

			<div className="space-y-2">
				{banners.map((banner, index) => (
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
						className="flex items-center gap-3 p-3 cursor-grab active:cursor-grabbing group"
					>
						<DotsSixVerticalIcon
							size={14}
							className="text-muted-foreground/30 group-hover:text-muted-foreground shrink-0"
						/>

						{/* Превью */}
						{banner.imageUrl ? (
							<div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
								<Image
									src={banner.imageUrl}
									alt={banner.title}
									fill
									sizes="768px"
									className="object-cover"
								/>
							</div>
						) : (
							<div className="w-12 h-12 rounded-lg bg-foreground/8 shrink-0 flex items-center justify-center">
								<span className="text-muted-foreground text-xs">Нет</span>
							</div>
						)}

						{/* Инфо */}
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-sm truncate">{banner.title}</p>
							<p
								className={cn(
									"text-[11px] font-bold",
									TYPE_COLORS[banner.type as BannerType]
								)}
							>
								{TYPE_OPTIONS.find((t) => t.value === banner.type)?.label}
								{banner.eventDate &&
									` · ${new Date(banner.eventDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`}
							</p>
						</div>

						{/* Действия */}
						<div className="flex items-center gap-1 shrink-0">
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
									<EyeClosedIcon size={13} className="text-muted-foreground" />
								)}
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => setEditTarget(banner)}
							>
								<PencilSimpleIcon size={13} />
							</Button>
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
				))}

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
				onClick={() => setShowCreate(true)}
				className="gap-2 mx-auto"
			>
				<PlusIcon size={14} />
				Добавить новый баннер
			</Button>
		</div>
	);
}
