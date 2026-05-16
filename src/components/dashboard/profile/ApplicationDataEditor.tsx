"use client";

import {
	FileMagnifyingGlassIcon,
	MapPinIcon,
	ShieldCheckIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { updateApplicationDataAction } from "@/actions/client-application-actions";
import { InlineEditField } from "@/components/shared";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { type ClientFormValues, phoneRegex } from "@/schemas";
import { useApplicationStore } from "@/store";
import { deepSetClient } from "@/utils";
import { getClientDisplayData } from "@/utils/client-data.utils";

// ── Per-field Zod validators (slices of the main schema) ─────────────────────

const nameSchema = z.string().min(6, "Введите полное ФИО");
const phoneSchema = z
	.string()
	.min(1, "Укажите номер")
	.transform((v) => v.replace(/\s/g, ""))
	.pipe(z.string().regex(phoneRegex, "Формат: +X(XXX)XXX-XX-XX"));

const passportNumberSchema = z
	.string()
	.transform((v) => v.replace(/\D/g, ""))
	.pipe(z.string().length(10, "Серия и номер — 10 цифр"));

const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
const dateSchema = z.string().regex(dateRegex, "ДД.ММ.ГГГГ");

const issuedBySchema = z.string().min(10, "Укажите кем выдан документ");

const addressLineSchema = z.string().min(5, "Укажите адрес");

// ─────────────────────────────────────────────────────────────────────────────

interface ApplicationDataEditorProps {
	data: ClientFormValues | null;
}

type Section = "personal" | "passport" | "addresses";

export function ApplicationDataEditor({ data }: ApplicationDataEditorProps) {
	const [openSection, setOpenSection] = useState<Section | null>(null);
	const [showConfirm, setShowConfirm] = useState(false);
	const [pendingField, setPendingField] = useState<{
		field: string;
		value: unknown;
		label: string;
	} | null>(null);

	const { setFormDraft } = useApplicationStore();
	const display = getClientDisplayData(data);

	if (!display || !data) return null;

	// After successful server save, patch the store so the profile tab
	// reflects the new value immediately without a full page reload.
	const applyOptimisticUpdate = (field: string, value: unknown) => {
		// Re-use the existing deep-merge by rebuilding applicationData manually
		const current = data as Record<string, unknown>;
		const keys = field.split(".");
		const patched = deepSetClient(current, keys, value);
		setFormDraft(patched as Partial<ClientFormValues>);
	};

	// Queue a save — show confirmation dialog first
	const requestSave = (field: string, value: unknown, label: string) => {
		setPendingField({ field, value, label });
		setShowConfirm(true);
	};

	const confirmSave = async () => {
		if (!pendingField) return;
		const result = await updateApplicationDataAction({
			field: pendingField.field as Parameters<
				typeof updateApplicationDataAction
			>[0]["field"],
			value: pendingField.value,
		});
		if (result.success) {
			applyOptimisticUpdate(pendingField.field, pendingField.value);
			toast.success(`${pendingField.label} обновлено`);
		} else {
			toast.error(result.error);
		}
		setShowConfirm(false);
		setPendingField(null);
	};

	// Validate + queue
	const makeFieldSaver =
		(field: string, label: string, schema: z.ZodTypeAny) =>
		async (raw: string) => {
			const parsed = schema.safeParse(raw);
			if (!parsed.success) {
				throw new Error(parsed.error.issues[0]?.message ?? "Ошибка");
			}
			requestSave(field, parsed.data, label);
		};

	const { applicationData: ad } = data;

	return (
		<>
			<div className="space-y-3 animate-in fade-in duration-200">
				{/* ── Personal data ── */}
				<AccordionSection
					icon={<UserIcon size={14} />}
					title="Личные данные"
					open={openSection === "personal"}
					onToggle={() =>
						setOpenSection((s) => (s === "personal" ? null : "personal"))
					}
				>
					<FieldRow label="ФИО">
						<InlineEditField
							value={ad.personalData.name}
							placeholder="Фамилия Имя Отчество"
							onSave={makeFieldSaver(
								"applicationData.personalData.name",
								"ФИО",
								nameSchema
							)}
							onCancel={() => {}}
						/>
					</FieldRow>
					<FieldRow label="Телефон">
						<InlineEditField
							value={ad.personalData.phone}
							placeholder="+7(___) ___-__-__"
							type="tel"
							onSave={makeFieldSaver(
								"applicationData.personalData.phone",
								"Телефон",
								phoneSchema
							)}
							onCancel={() => {}}
						/>
					</FieldRow>
				</AccordionSection>

				{/* ── Passport ── */}
				<AccordionSection
					icon={<ShieldCheckIcon size={14} />}
					title="Паспортные данные"
					open={openSection === "passport"}
					onToggle={() =>
						setOpenSection((s) => (s === "passport" ? null : "passport"))
					}
				>
					<FieldRow label="Серия и номер">
						<InlineEditField
							value={ad.passport.seriesAndNumber}
							placeholder="0000 000000"
							onSave={makeFieldSaver(
								"applicationData.passport.seriesAndNumber",
								"Серия и номер",
								passportNumberSchema
							)}
							onCancel={() => {}}
						/>
					</FieldRow>
					<FieldRow label="Дата выдачи">
						<InlineEditField
							value={ad.passport.issueDate}
							placeholder="ДД.ММ.ГГГГ"
							onSave={makeFieldSaver(
								"applicationData.passport.issueDate",
								"Дата выдачи",
								dateSchema
							)}
							onCancel={() => {}}
						/>
					</FieldRow>
					<FieldRow label="Кем выдан">
						<InlineEditField
							value={ad.passport.issuedBy}
							placeholder="Наименование органа"
							onSave={makeFieldSaver(
								"applicationData.passport.issuedBy",
								"Орган выдачи",
								issuedBySchema
							)}
							onCancel={() => {}}
						/>
					</FieldRow>
				</AccordionSection>

				{/* ── Addresses ── */}
				<AccordionSection
					icon={<MapPinIcon size={14} />}
					title="Адреса"
					open={openSection === "addresses"}
					onToggle={() =>
						setOpenSection((s) => (s === "addresses" ? null : "addresses"))
					}
				>
					<p className="card-section-label px-5 pt-3 pb-1">Адрес регистрации</p>
					<FieldRow label="Индекс">
						<InlineEditField
							value={ad.addresses.registration.index}
							placeholder="000000"
							onSave={makeFieldSaver(
								"applicationData.addresses.registration.index",
								"Индекс регистрации",
								z.string().regex(/^\d{6}$/, "6 цифр")
							)}
							onCancel={() => {}}
						/>
					</FieldRow>
					<FieldRow label="Страна">
						<InlineEditField
							value={ad.addresses.registration.country}
							placeholder="Россия"
							onSave={makeFieldSaver(
								"applicationData.addresses.registration.country",
								"Страна регистрации",
								addressLineSchema
							)}
							onCancel={() => {}}
						/>
					</FieldRow>
					<FieldRow label="Регион">
						<InlineEditField
							value={ad.addresses.registration.region}
							placeholder="Московская область"
							onSave={makeFieldSaver(
								"applicationData.addresses.registration.region",
								"Регион регистрации",
								addressLineSchema
							)}
							onCancel={() => {}}
						/>
					</FieldRow>
					<FieldRow label="Город">
						<InlineEditField
							value={ad.addresses.registration.city}
							placeholder="Самара"
							onSave={makeFieldSaver(
								"applicationData.addresses.registration.city",
								"Город регистрации",
								addressLineSchema
							)}
							onCancel={() => {}}
						/>
					</FieldRow>
					<FieldRow label="Улица, дом">
						<InlineEditField
							value={ad.addresses.registration.address}
							placeholder="ул. Пушкина, д. 1, кв. 2"
							onSave={makeFieldSaver(
								"applicationData.addresses.registration.address",
								"Адрес регистрации",
								addressLineSchema
							)}
							onCancel={() => {}}
						/>
					</FieldRow>

					{!ad.addresses.isSame && (
						<>
							<p className="card-section-label px-5 pt-4 pb-1">
								Фактический адрес
							</p>
							<FieldRow label="Улица, дом">
								<InlineEditField
									value={ad.addresses.actual?.address ?? ""}
									placeholder="ул. Пушкина, д. 1, кв. 2"
									onSave={makeFieldSaver(
										"applicationData.addresses.actual.address",
										"Фактический адрес",
										addressLineSchema
									)}
									onCancel={() => {}}
								/>
							</FieldRow>
						</>
					)}
				</AccordionSection>

				{/* ── Warning banner ── */}
				<div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-amber-500/50 bg-secondary/60">
					<FileMagnifyingGlassIcon
						size={14}
						className="text-amber-400 shrink-0 mt-0.5"
					/>
					<p className="text-xs text-muted-foreground leading-relaxed">
						После обновления персональных данных наш менеджер может запросить
						подтверждающие документы.
					</p>
				</div>
			</div>

			{/* ── Confirmation dialog ── */}
			<AlertDialog
				open={showConfirm}
				onOpenChange={(o) => {
					if (!o) {
						setShowConfirm(false);
						setPendingField(null);
					}
				}}
			>
				<AlertDialogContent className="border-amber-500/20 bg-background/90 backdrop-blur-xl flex">
					<AlertDialogHeader>
						<AlertDialogTitle>Сохранить изменение?</AlertDialogTitle>
						<AlertDialogDescription>
							Данные в поле <strong>{pendingField?.label}</strong> будут
							обновлены. Администратор получит уведомление о внесённом изменении
							— это необходимо для поддержания актуальности верифицированных
							данных.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							<Button variant="outline">Отменить</Button>
						</AlertDialogCancel>
						<AlertDialogAction onClick={confirmSave}>
							<Button>Сохранить</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

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
				className="w-full card-section-header flex items-center justify-between hover:bg-foreground/2 transition-colors"
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

function FieldRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="px-5 py-3 space-y-1.5">
			<p className="text-[11px] text-muted-foreground/50 font-medium">
				{label}
			</p>
			{children}
		</div>
	);
}
