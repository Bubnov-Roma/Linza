"use client";

import {
	CaretDownIcon,
	CheckIcon,
	DotsThreeIcon,
	ExclamationMarkIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { get, useFormContext, useWatch } from "react-hook-form";
import { AddressFieldsGroup } from "@/components/forms/client-forms/client-types/sections/individual/address/AddressFieldsGroup";
import { FinalBlock } from "@/components/forms/client-forms/client-types/sections/individual/contacts/FinalBlock";
import { ReferralsBlock } from "@/components/forms/client-forms/client-types/sections/individual/contacts/ReferralsBlock";
import { SocialsBlock } from "@/components/forms/client-forms/client-types/sections/individual/contacts/SocialsBlock";
import { FioInput } from "@/components/forms/client-forms/client-types/sections/individual/id/FioInput";
import { FormCheckbox } from "@/components/forms/shared";
import { DateInput } from "@/components/forms/shared/DateInput";
import { FormTextarea } from "@/components/forms/shared/FormTextarea";
import { PassportInput } from "@/components/forms/shared/PassportInput";
import { PhoneInput } from "@/components/forms/shared/PhoneInput";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { ClientFormValues } from "@/schemas";
import { isValueFilled } from "@/utils";

interface SectionDef {
	id: string;
	title: string;
	dotColor: string;
	fields: string[];
	content: React.ReactNode;
}

function getSectionStatus(
	fields: string[],
	errors: object,
	allValues: object,
	visited: Set<string>,
	id: string
): "completed" | "error" | "untouched" {
	const hasError = fields.some((path) => !!get(errors, path));
	const isFilled = fields.every((path) => isValueFilled(get(allValues, path)));
	const isVisited = visited.has(id);
	if (hasError && isVisited) return "error";
	if (isFilled && !hasError) return "completed";
	return "untouched";
}

const DOT_COLOR: Record<ReturnType<typeof getSectionStatus>, string> = {
	completed: "bg-emerald-500",
	error: "bg-orange-400",
	untouched: "bg-foreground/20",
};

export function MobileClientForm() {
	const [openPanel, setOpenPanel] = useState<string>("personal");
	const [visitedSections, setVisitedSections] = useState<Set<string>>(
		new Set(["personal"])
	);

	const {
		trigger,
		control,
		formState: { errors },
	} = useFormContext<ClientFormValues>();
	const allValues = useWatch({ control });
	const isSame = useWatch({
		control,
		name: "applicationData.addresses.isSame",
	});

	const registrationAddress = useWatch({
		control,
		name: "applicationData.addresses.registration",
	});
	const { setValue } = useFormContext<ClientFormValues>();

	useEffect(() => {
		if (isSame) {
			setValue("applicationData.addresses.actual", registrationAddress, {
				shouldValidate: true,
			});
		} else {
			setValue(
				"applicationData.addresses.actual",
				{ address: "", index: "", country: "", region: "", city: "" },
				{ shouldValidate: false }
			);
		}
	}, [isSame, registrationAddress, setValue]);

	const sections: SectionDef[] = [
		{
			id: "personal",
			title: "Личные данные",
			dotColor: "bg-blue-500",
			fields: [
				"applicationData.personalData.name",
				"applicationData.personalData.birth",
				"applicationData.personalData.phone",
			],
			content: (
				<div className="space-y-4">
					<FioInput
						required
						name="applicationData.personalData.name"
						label="ФИО полностью"
					/>
					<div className="grid grid-cols-2 gap-3">
						<DateInput
							required
							name="applicationData.personalData.birth"
							label="Дата рождения"
						/>

						<PhoneInput
							required
							name="applicationData.personalData.phone"
							label="Телефон"
						/>
					</div>
				</div>
			),
		},
		{
			id: "passport",
			title: "Паспортные данные",
			dotColor: "bg-cyan-400",
			fields: [
				"applicationData.passport.seriesAndNumber",
				"applicationData.passport.issueDate",
				"applicationData.passport.issuedBy",
			],
			content: (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<PassportInput
							required
							name="applicationData.passport.seriesAndNumber"
							label="Серия и номер"
						/>
						<DateInput
							required
							name="applicationData.passport.issueDate"
							label="Дата выдачи"
						/>
					</div>
					<FormTextarea
						required
						name="applicationData.passport.issuedBy"
						label="Кем выдан"
						placeholder="Наименование органа, выдавшего документ"
						rows={3}
						className="min-h-25"
					/>
				</div>
			),
		},
		{
			id: "registration",
			title: "Адрес регистрации",
			dotColor: "bg-emerald-400",
			fields: [
				"applicationData.addresses.registration.address",
				"applicationData.addresses.registration.country",
				"applicationData.addresses.registration.city",
				"applicationData.addresses.registration.region",
				"applicationData.addresses.registration.index",
			],
			content: (
				<div className="space-y-4">
					<AddressFieldsGroup prefix="applicationData.addresses.registration" />
					<div
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
						role="none"
					></div>
				</div>
			),
		},
		{
			id: "actual",
			title: "Фактическое проживание",
			dotColor: "bg-purple-400",
			fields: [
				"applicationData.addresses.actual.address",
				"applicationData.addresses.actual.country",
				"applicationData.addresses.actual.city",
				"applicationData.addresses.actual.region",
				"applicationData.addresses.actual.index",
			],
			content: (
				<div className="space-y-4">
					<FormCheckbox
						name="applicationData.addresses.isSame"
						label="Совпадает с адресом регистрации"
					/>
					<AddressFieldsGroup prefix="applicationData.addresses.actual" />
				</div>
			),
		} as SectionDef,
		{
			id: "contacts",
			title: "Соцсети и согласие",
			dotColor: "bg-sky-400",
			fields: [
				"applicationData.contacts.socials",
				"applicationData.additional.referralSource",
				"agreements.personalDataConsent",
			],
			content: (
				<div className="space-y-6">
					<SocialsBlock />
					<ReferralsBlock />
					<div className="border-t border-foreground/5 pt-5">
						<FinalBlock />
					</div>
				</div>
			),
		},
	];

	// handleValueChange — было (values: string[]):
	const handleValueChange = (value: string) => {
		const wasOpen = openPanel;
		// Валидируем секцию когда закрываем
		if (wasOpen && wasOpen !== value) {
			const sec = sections.find((s) => s.id === wasOpen);
			if (sec) trigger(sec.fields as Parameters<typeof trigger>[0]);
			setVisitedSections((prev) => {
				const n = new Set(prev);
				n.add(wasOpen);
				return n;
			});
		}
		if (value) {
			setVisitedSections((prev) => {
				const n = new Set(prev);
				n.add(value);
				return n;
			});
		}
		setOpenPanel(value);
	};

	return (
		<div className="py-4 pb-10">
			<h1 className="text-3xl font-black tracking-tight uppercase italic text-center pb-4">
				Анкета
			</h1>
			<Accordion
				type="single"
				collapsible
				value={openPanel}
				onValueChange={handleValueChange}
				className="space-y-2"
			>
				{sections.map((section) => {
					const isOpen = openPanel.includes(section.id);
					const status = getSectionStatus(
						section.fields,
						errors,
						allValues,
						visitedSections,
						section.id
					);

					return (
						<AccordionItem
							key={section.id}
							value={section.id}
							className={cn(
								"rounded-2xl overflow-hidden transition-colors duration-200 border-b-0 shadow-sm shadow-foreground/10",
								isOpen ? "bg-muted-foreground/5 " : "bg-foreground/5"
							)}
						>
							<AccordionTrigger
								className={cn(
									"flex items-center gap-3 px-4 py-4 cursor-pointer shadow-md shadow-muted-foreground/20 rounded-2xl",
									"hover:no-underline hover:bg-transparent [&>svg:last-child]:hidden "
								)}
							>
								<span
									className={cn(
										"flex-1 text-sm font-bold text-left transition-colors",
										isOpen ? "text-foreground" : "text-foreground/70"
									)}
								>
									{section.title}
								</span>
								<span
									className={cn(
										"text-[20px] font-bold mr-1 rounded-full",
										isOpen ? section.dotColor : DOT_COLOR[status]
									)}
								>
									{status === "error" ? (
										<ExclamationMarkIcon
											size={18}
											className="text-background"
										/>
									) : status === "untouched" ? (
										<DotsThreeIcon size={18} className="text-background" />
									) : isOpen ? (
										<CaretDownIcon size={18} className="text-background" />
									) : (
										<CheckIcon size={18} className="text-background" />
									)}
								</span>
							</AccordionTrigger>
							<AccordionContent className="p-4 overflow-visible">
								{section.content}
							</AccordionContent>
						</AccordionItem>
					);
				})}
			</Accordion>
		</div>
	);
}
