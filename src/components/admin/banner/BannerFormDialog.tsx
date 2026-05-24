"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type {
	Banner,
	BannerImage,
	BannerPlacement,
	BannerType,
} from "@/actions/admin-banner-actions";
import {
	createBannerAction,
	updateBannerAction,
} from "@/actions/admin-banner-actions";
import { BannerMediaManager } from "@/components/admin/banner/BannerMediaManager";
import { MarkdownEditor } from "@/components/shared";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import { PLACEMENT_OPTIONS, TYPE_OPTIONS } from "@/constants";

// ─── BannerFormDialog ─────────────────────────────────────────────────────────

interface BannerFormValues {
	title: string;
	subtitle: string;
	body: string;
	linkUrl: string;
	linkLabel: string;
	type: BannerType;
	placement: BannerPlacement;
	isActive: boolean;
	eventDate: string;
}

const emptyForm = (): BannerFormValues => ({
	title: "",
	subtitle: "",
	body: "",
	linkUrl: "",
	linkLabel: "",
	type: "info",
	placement: "both",
	isActive: true,
	eventDate: "",
});

function bannerToForm(b: Banner): BannerFormValues {
	return {
		title: b.title,
		subtitle: b.subtitle ?? "",
		body: b.body ?? "",
		linkUrl: b.linkUrl ?? "",
		linkLabel: b.linkLabel ?? "",
		type: b.type as BannerType,
		placement: (b.placement ?? "both") as BannerPlacement,
		isActive: b.isActive,
		eventDate: b.eventDate
			? new Date(b.eventDate).toISOString().slice(0, 10)
			: "",
	};
}

export function BannerFormDialog({
	open,
	onOpenChange,
	initial,
	bannerId: initialBannerId,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	initial?: Banner;
	bannerId?: string;
	onSaved: () => void;
}) {
	const [form, setForm] = useState<BannerFormValues>(
		initial ? bannerToForm(initial) : emptyForm()
	);
	const [savedBannerId, setSavedBannerId] = useState<string | null>(
		initialBannerId ?? null
	);
	const [images, setImages] = useState<BannerImage[]>(initial?.images ?? []);
	const [isPending, start] = useTransition();

	const set = (k: keyof BannerFormValues, v: string | boolean) =>
		setForm((prev) => ({ ...prev, [k]: v }));

	const handleSave = () => {
		if (!form.title.trim()) {
			toast.error("Введите заголовок");
			return;
		}

		start(async () => {
			const payload = {
				title: form.title,
				subtitle: form.subtitle || "",
				body: form.body || "",
				linkUrl: form.linkUrl || "",
				linkLabel: form.linkLabel || "",
				type: form.type,
				placement: form.placement,
				isActive: form.isActive,
				eventDate: form.eventDate || "",
			};

			const result = savedBannerId
				? await updateBannerAction(savedBannerId, payload)
				: await createBannerAction(payload);

			if (!result.success) {
				toast.error(result.error ?? "Ошибка");
				return;
			}

			if (!savedBannerId && result.id) {
				setSavedBannerId(result.id);
				toast.success("Баннер создан. Теперь можно добавить медиа.");
				return;
			}

			toast.success(savedBannerId ? "Баннер обновлён" : "Баннер создан");
			onSaved();
			onOpenChange(false);
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-black italic uppercase tracking-tight">
						{initialBannerId ? "Изменить баннер" : "Новый баннер"}
					</DialogTitle>
					<DialogDescription className="hidden">
						{initialBannerId ? "Обновление баннера" : "Создание нового баннера"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5 col-span-1 w-full">
							<Label>Тип</Label>
							<Select
								value={form.type}
								onValueChange={(v) => set("type", v as BannerType)}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TYPE_OPTIONS.map((t) => (
										<SelectItem key={t.value} value={t.value}>
											<div className="flex items-center gap-2">
												{t.icon}
												{t.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5 col-span-1 w-full">
							<Label>Размещение</Label>
							<Select
								value={form.placement}
								onValueChange={(v) => set("placement", v as BannerPlacement)}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PLACEMENT_OPTIONS.map((p) => (
										<SelectItem key={p.value} value={p.value}>
											<div className="flex items-center gap-2">
												{p.icon}
												{p.label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label>Заголовок *</Label>
						<Input
							value={form.title}
							onChange={(e) => set("title", e.target.value)}
							placeholder="Встреча с фотографами | Скидка 20% на свет..."
						/>
					</div>

					<div className="space-y-1.5">
						<Label>Подзаголовок</Label>
						<Input
							value={form.subtitle}
							onChange={(e) => set("subtitle", e.target.value)}
							placeholder="Краткое описание, видное на слайде"
						/>
					</div>

					<MarkdownEditor
						label="Описание"
						value={form.body}
						onChange={(v) => set("body", v)}
						rows={6}
						placeholder={
							"# Заголовок\n\n- Пункт 1\n- Пункт 2\n\n[Ссылка](https://...)"
						}
					/>

					{/* Управление медиа-файлами баннера */}
					<BannerMediaManager
						bannerId={savedBannerId}
						images={images}
						onChange={setImages}
					/>

					<div className="space-y-1.5">
						<Label>Дата события</Label>
						<Input
							type="date"
							value={form.eventDate}
							onChange={(e) => set("eventDate", e.target.value)}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label>URL ссылки</Label>
							<Input
								value={form.linkUrl}
								onChange={(e) => set("linkUrl", e.target.value)}
								placeholder="https://..."
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Текст кнопки</Label>
							<Input
								value={form.linkLabel}
								onChange={(e) => set("linkLabel", e.target.value)}
								placeholder="Зарегистрироваться"
							/>
						</div>
					</div>

					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							checked={form.isActive}
							onChange={(e) => set("isActive", e.target.checked)}
							className="accent-primary w-4 h-4"
						/>
						<span className="text-sm">Отображать на сайте</span>
					</label>
				</div>

				<div className="flex gap-2 pt-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="flex-1"
					>
						{savedBannerId && !initialBannerId ? "Готово" : "Отмена"}
					</Button>
					<Button
						onClick={handleSave}
						disabled={isPending}
						className="flex-1 gap-2"
					>
						<CheckIcon size={14} />
						{savedBannerId ? "Сохранить" : "Создать"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
