"use client";

import { ru } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type SiteSettingsInfo,
	updateSiteSettingsAction,
} from "@/actions/admin-settings-actions";
import { AdminManagementSection } from "@/components/admin/settings/AdminManagementSection";
import { PromoCodesSection } from "@/components/admin/settings/PromoCodesSection";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { MarkdownEditor } from "@/components/shared/MarkdownEditor";
import {
	Button,
	Calendar,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Skeleton,
} from "@/components/ui";

export function SettingsClient({
	initialSettings,
}: {
	initialSettings: SiteSettingsInfo;
}) {
	const [formData, setFormData] = useState(initialSettings);
	const [isSaving, setIsSaving] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const selectedDates = formData.disabledDates.map((d) => new Date(d));

	const handleDatesChange = (dates: Date[] | undefined) => {
		if (!dates) return;
		const strings = dates.map((d) => {
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			return `${year}-${month}-${day}`;
		});
		setFormData({ ...formData, disabledDates: strings });
	};

	const handleSave = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			const result = await updateSiteSettingsAction(formData);

			if (result.success) {
				toast.success("Настройки успешно обновлены");
			} else {
				toast.error(result.error || "Ошибка при сохранении");
			}
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto space-y-6 pb-20 px-2 md:px-6">
			<DashboardBreadcrumb items={[{ label: "Настройки сайта" }]} />

			<div>
				<h1 className="text-3xl font-black italic uppercase tracking-tight">
					Настройки
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Глобальные параметры, контакты и юридические документы.
				</p>
			</div>

			<form
				onSubmit={handleSave}
				className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
			>
				{/* График и выходные */}
				<div className="space-y-6">
					<Card className="py-6">
						<CardHeader>
							<CardTitle>Часы работы</CardTitle>
							<CardDescription>
								Влияет на автоматический перенос аренды
							</CardDescription>
						</CardHeader>
						<CardContent className="flex gap-4">
							<div className="space-y-2 flex-1">
								<Label>Открытие (ч)</Label>
								<Input
									type="number"
									min={0}
									max={23}
									value={formData.workStart}
									onChange={(e) =>
										setFormData({
											...formData,
											workStart: Number(e.target.value),
										})
									}
								/>
							</div>
							<div className="space-y-2 flex-1">
								<Label>Закрытие (ч)</Label>
								<Input
									type="number"
									min={1}
									max={24}
									value={formData.workEnd}
									onChange={(e) =>
										setFormData({
											...formData,
											workEnd: Number(e.target.value),
										})
									}
								/>
							</div>
						</CardContent>
					</Card>

					<Card className="py-6">
						<CardHeader>
							<CardTitle>Нерабочие дни</CardTitle>
							<CardDescription>
								Заблокированы для выдачи и возврата
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col items-center">
							{mounted ? (
								<Calendar
									mode="multiple"
									locale={ru}
									selected={selectedDates}
									onSelect={handleDatesChange}
									className="rounded-xl mt-4"
								/>
							) : (
								<Skeleton className="h-85.5 w-69" />
							)}
						</CardContent>
					</Card>
				</div>

				{/* Контакты */}
				<div className="space-y-6">
					<Card className="py-6">
						<CardHeader>
							<CardTitle>Контактная информация</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>Email поддержки</Label>
								<Input
									type="email"
									value={formData.supportEmail}
									onChange={(e) =>
										setFormData({ ...formData, supportEmail: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Телефон поддержки</Label>
								<Input
									value={formData.phone}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Telegram (@username или ссылка)</Label>
								<Input
									value={formData.telegram}
									onChange={(e) =>
										setFormData({ ...formData, telegram: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Адрес самовывоза</Label>
								<Input
									value={formData.address}
									onChange={(e) =>
										setFormData({ ...formData, address: e.target.value })
									}
								/>
							</div>
						</CardContent>
					</Card>
					{/* Юридические документы */}

					<Card className="py-6 lg:col-span-1">
						<CardHeader>
							<CardTitle>Юридические документы</CardTitle>
							<CardDescription>Редактор в формате Markdown</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<MarkdownEditor
								label="Политика конфиденциальности"
								value={formData.privacyPolicy}
								onChange={(val) =>
									setFormData({ ...formData, privacyPolicy: val })
								}
								rows={12}
							/>
							<MarkdownEditor
								label="Договор оферты (Terms of Service)"
								value={formData.termsOfService}
								onChange={(val) =>
									setFormData({ ...formData, termsOfService: val })
								}
								rows={12}
							/>
						</CardContent>
					</Card>
				</div>

				<PromoCodesSection />
				<AdminManagementSection />

				<div className="lg:col-span-2 flex justify-end">
					<Button
						type="submit"
						disabled={isSaving}
						size="lg"
						className="w-full sm:w-auto h-12 rounded-xl"
					>
						{isSaving ? "Сохранение..." : "Сохранить настройки"}
					</Button>
				</div>
			</form>
		</div>
	);
}
