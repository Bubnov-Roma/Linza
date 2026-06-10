"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinIcon, ShieldCheckIcon, UserIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateFullApplicationDataAction } from "@/actions/client-application-actions";
import { AddressFieldsGroup } from "@/components/forms/client-forms/client-types/sections/individual/address/AddressFieldsGroup";
import { FioInput } from "@/components/forms/client-forms/client-types/sections/individual/id/FioInput";
import {
	DateInput,
	FormCheckbox,
	FormTextarea,
	PassportInput,
	PhoneInput,
} from "@/components/forms/shared";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { type ClientFormValues, individualClientSchema } from "@/schemas";
import { useApplicationStore } from "@/store";

export function ApplicationDataEditor({
	data,
}: {
	data: ClientFormValues | null;
}) {
	const { setFormDraft } = useApplicationStore();
	const [openSection, setOpenSection] = useState<string | null>("personal");
	const [isSaving, setIsSaving] = useState(false);

	// Инициализируем форму существующими данными
	const methods = useForm<ClientFormValues>(
		data
			? {
					resolver: zodResolver(individualClientSchema),
					defaultValues: data,
					mode: "onBlur",
				}
			: {
					resolver: zodResolver(individualClientSchema),
					mode: "onBlur",
				}
	);

	if (!data) return null;

	const isSameAddress = methods.watch("applicationData.addresses.isSame");

	const onSubmit = async (formValues: ClientFormValues) => {
		// Если адреса совпадают, копируем регистрацию в факт
		if (formValues.applicationData.addresses.isSame) {
			formValues.applicationData.addresses.actual = {
				...formValues.applicationData.addresses.registration,
			};
		}

		setIsSaving(true);
		try {
			const res = await updateFullApplicationDataAction(formValues);
			if (res.success) {
				toast.success("Данные успешно обновлены");
				setFormDraft(formValues); // Оптимистичное обновление UI профиля
				methods.reset(formValues); // Сбрасываем isDirty
			} else {
				toast.error(res.error || "Ошибка сохранения");
			}
		} catch {
			toast.error("Критическая ошибка сохранения");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<FormProvider {...methods}>
			<form
				onSubmit={methods.handleSubmit(onSubmit)}
				className="space-y-4 animate-in fade-in duration-200"
			>
				{/* ── Личные данные ── */}
				<AccordionSection
					icon={
						<UserIcon
							size={14}
							weight={openSection === "personal" ? "duotone" : "regular"}
						/>
					}
					title="Личные данные"
					open={openSection === "personal"}
					onToggle={() =>
						setOpenSection((s) => (s === "personal" ? null : "personal"))
					}
				>
					<div className="p-5 space-y-4">
						<FioInput
							name="applicationData.personalData.name"
							label="ФИО полностью"
							required
						/>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<PhoneInput
								name="applicationData.personalData.phone"
								label="Телефон"
								required
							/>
							<DateInput
								name="applicationData.personalData.birth"
								label="Дата рождения"
								required
							/>
						</div>
					</div>
				</AccordionSection>

				{/* ── Паспорт ── */}
				<AccordionSection
					icon={
						<ShieldCheckIcon
							size={14}
							weight={openSection === "passport" ? "duotone" : "regular"}
						/>
					}
					title="Паспортные данные"
					open={openSection === "passport"}
					onToggle={() =>
						setOpenSection((s) => (s === "passport" ? null : "passport"))
					}
				>
					<div className="p-5 space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<PassportInput
								name="applicationData.passport.seriesAndNumber"
								label="Серия и номер"
								required
							/>
							<DateInput
								name="applicationData.passport.issueDate"
								label="Дата выдачи"
								required
							/>
						</div>
						<FormTextarea
							name="applicationData.passport.issuedBy"
							label="Кем выдан"
							rows={2}
							required
						/>
					</div>
				</AccordionSection>

				{/* ── Адреса ── */}
				<AccordionSection
					icon={
						<MapPinIcon
							size={14}
							weight={openSection === "addresses" ? "duotone" : "regular"}
						/>
					}
					title="Адреса"
					open={openSection === "addresses"}
					onToggle={() =>
						setOpenSection((s) => (s === "addresses" ? null : "addresses"))
					}
				>
					<div className="p-5 space-y-6">
						<div>
							<p className="text-sm font-bold mb-3 text-emerald-500">
								Адрес регистрации
							</p>
							<AddressFieldsGroup prefix="applicationData.addresses.registration" />
						</div>

						<FormCheckbox
							name="applicationData.addresses.isSame"
							label="Совпадает с фактическим адресом проживания"
						/>

						{!isSameAddress && (
							<div className="pt-2 animate-in fade-in slide-in-from-top-2">
								<p className="text-sm font-bold mb-3 text-purple-500">
									Фактический адрес
								</p>
								<AddressFieldsGroup prefix="applicationData.addresses.actual" />
							</div>
						)}
					</div>
				</AccordionSection>

				{/* ── Предупреждение ── */}
				<p
					className={cn(
						"text-xs text-muted-foreground/60 leading-relaxed text-center font-mono",
						methods.formState.isDirty &&
							"text-foreground/80 font-black tracking-wide"
					)}
				>
					После обновления персональных данных менеджер может запросить
					подтверждающие документы
				</p>
				<Button
					type="submit"
					disabled={!methods.formState.isDirty || isSaving}
					className={cn(
						"w-full h-12 text-md rounded-2xl",
						!methods.formState.isDirty &&
							"bg-muted-foreground/5 text-muted-foreground"
					)}
				>
					{isSaving
						? "Сохранение..."
						: !methods.formState.isDirty
							? "Данные сохранены"
							: "Сохранить изменения"}
				</Button>
			</form>
		</FormProvider>
	);
}

// Вспомогательный компонент аккордеона
function AccordionSection({
	icon,
	title,
	open,
	onToggle,
	children,
}: {
	icon: React.ReactNode;
	title: string;
	open: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"card-surface transition-all",
				open && "ring-1 ring-primary/10"
			)}
		>
			<button
				type="button"
				onClick={onToggle}
				className="w-full card-section-header flex items-center justify-between hover:bg-foreground/5 transition-colors cursor-pointer"
			>
				<div className="flex items-center gap-2">
					<span className="text-foreground">{icon}</span>
					<p className="card-section-label">{title}</p>
				</div>
				<span
					className={cn(
						"text-muted-foreground/40 transition-transform duration-200 text-xs",
						open && "rotate-180"
					)}
				>
					▾
				</span>
			</button>
			{open && (
				<div className="divide-y divide-foreground/5 animate-in fade-in slide-in-from-top-1 duration-150">
					{children}
				</div>
			)}
		</div>
	);
}
