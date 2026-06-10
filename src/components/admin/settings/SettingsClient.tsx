"use client";

import { ru } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type SiteSettingsInfo,
	updateSiteSettingsAction,
} from "@/actions/admin-settings-actions";
import { AdminManagementSection } from "@/components/admin/settings/AdminManagementSection";
import { NotificationsSoundSection } from "@/components/admin/settings/NotificationsSoundSection";
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
								Влияет на автоматическое форматирование срока аренды при
								оформлении заказов клиентом
							</CardDescription>
						</CardHeader>
						<CardContent className="flex gap-4 pt-6">
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
								Заблокированы на сайте для оформления заказов
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col items-center pt-6">
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

				<div className="space-y-6">
					{/* Контакты */}
					<Card className="py-6">
						<CardHeader>
							<CardTitle>Контактная информация</CardTitle>
							<CardDescription>
								Отображается клиентам на сайте для связи с поддержкой
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
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
								<Label>Telegram (ссылка)</Label>
								<Input
									value={formData.telegram}
									onChange={(e) =>
										setFormData({ ...formData, telegram: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>ВКонтакте (ссылка)</Label>
								<Input
									value={formData.vk}
									onChange={(e) =>
										setFormData({ ...formData, vk: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Адрес офиса</Label>
								<Input
									value={formData.address}
									onChange={(e) =>
										setFormData({ ...formData, address: e.target.value })
									}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Юридические реквизиты */}
					<Card className="py-6">
						<CardHeader>
							<CardTitle>Юридические реквизиты</CardTitle>
							<CardDescription>
								Используются для подстановки в договоры и оферту
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
							<div className="space-y-2">
								<Label>Наименование (ИП / ООО)</Label>
								<Input
									value={formData.companyName}
									onChange={(e) =>
										setFormData({ ...formData, companyName: e.target.value })
									}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>ИНН</Label>
									<Input
										value={formData.inn}
										onChange={(e) =>
											setFormData({ ...formData, inn: e.target.value })
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>ОГРН / ОГРНИП</Label>
									<Input
										value={formData.ogrn}
										onChange={(e) =>
											setFormData({ ...formData, ogrn: e.target.value })
										}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label>Юридический адрес</Label>
								<Input
									value={formData.legalAddress}
									onChange={(e) =>
										setFormData({ ...formData, legalAddress: e.target.value })
									}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Промокоды и управление */}
				<PromoCodesSection />
				<AdminManagementSection />

				{/* Звуки уведомлений — вне формы, управляется через Zustand/localStorage */}
				<NotificationsSoundSection />

				{/* Юридические документы */}
				<Card className="lg:col-span-2 py-6">
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
