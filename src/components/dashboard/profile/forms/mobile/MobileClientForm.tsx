"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { get, useFormContext, useWatch } from "react-hook-form";
import { AddressFieldsGroup } from "@/components/forms/client-forms/client-types/sections/individual/address/AddressFieldsGroup";
import { FinalsSection } from "@/components/forms/client-forms/client-types/sections/individual/contacts/FinalsSection";
import { SocialsSection } from "@/components/forms/client-forms/client-types/sections/individual/contacts/SocialsSection";
import { FioInput } from "@/components/forms/client-forms/client-types/sections/individual/id/FioInput";
import { FormCheckbox, SubmitButton } from "@/components/forms/shared";
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

interface MobileClientFormProps {
	isSubmitting: boolean;
	isValid: boolean;
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

export function MobileClientForm({
	isSubmitting,
	isValid,
}: MobileClientFormProps) {
	const [mounted, setMounted] = useState(false);
	const [openPanels, setOpenPanels] = useState<string[]>(["personal"]);
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

	useEffect(() => {
		setMounted(true);
	}, []);

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
					{/* Checkbox inside form body — works correctly on mobile */}
					<div
						onClick={(e) => e.stopPropagation()}
						onKeyDown={(e) => e.stopPropagation()}
						role="none"
					>
						<FormCheckbox
							name="applicationData.addresses.isSame"
							label="Совпадает с фактическим адресом"
						/>
					</div>
				</div>
			),
		},
		...(isSame
			? []
			: [
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
							<AddressFieldsGroup prefix="applicationData.addresses.actual" />
						),
					} as SectionDef,
				]),
		{
			id: "contacts",
			title: "Соцсети и контакты",
			dotColor: "bg-sky-400",
			fields: [
				"applicationData.contacts.socials",
				"applicationData.additional.referralSource",
			],
			content: (
				<div className="space-y-6">
					<SocialsSection />
					<div className="border-t border-foreground/5 pt-5">
						<FinalsSection />
					</div>
				</div>
			),
		},
	];

	const handleValueChange = (values: string[]) => {
		const closed = openPanels.filter((id) => !values.includes(id));
		for (const id of closed) {
			const sec = sections.find((s) => s.id === id);
			if (sec) trigger(sec.fields as Parameters<typeof trigger>[0]);
			setVisitedSections((prev) => {
				const n = new Set(prev);
				n.add(id);
				return n;
			});
		}
		for (const id of values) {
			setVisitedSections((prev) => {
				const n = new Set(prev);
				n.add(id);
				return n;
			});
		}
		setOpenPanels(values);
	};

	const toggleDot = (id: string) => {
		setOpenPanels((prev) =>
			prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
		);
		setVisitedSections((prev) => {
			const n = new Set(prev);
			n.add(id);
			return n;
		});
	};

	return (
		<>
			<div className="py-4 pb-10">
				<h1 className="text-3xl font-black tracking-tight uppercase italic text-center pb-4">
					Анкета
				</h1>
				<Accordion
					type="multiple"
					value={openPanels}
					onValueChange={handleValueChange}
					className="space-y-2"
				>
					{sections.map((section) => {
						const isOpen = openPanels.includes(section.id);
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
										"flex items-center gap-3 px-4 py-4",
										"hover:no-underline hover:bg-transparent [&>svg:last-child]:hidden"
									)}
								>
									<div
										className={cn(
											"w-2 h-2 rounded-full shrink-0 transition-colors duration-300",
											isOpen ? section.dotColor : DOT_COLOR[status]
										)}
									/>
									<span
										className={cn(
											"flex-1 text-sm font-bold text-left transition-colors",
											isOpen ? "text-foreground" : "text-foreground/70"
										)}
									>
										{section.title}
									</span>
									{!isOpen && status !== "untouched" && (
										<span
											className={cn(
												"text-[10px] font-bold mr-1",
												status === "error"
													? "text-orange-400"
													: "text-emerald-500"
											)}
										>
											{status === "error" ? "Проверьте" : "✓"}
										</span>
									)}
								</AccordionTrigger>
								<AccordionContent className="px-4 pb-5 pt-1 overflow-visible">
									{section.content}
								</AccordionContent>
							</AccordionItem>
						);
					})}
				</Accordion>
			</div>

			{mounted &&
				createPortal(
					<div
						className="fixed inset-x-0 z-45 md:hidden pointer-events-none"
						style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
					>
						<div className="mx-3 pointer-events-auto">
							<div className="flex items-center gap-2 p-2 rounded-2xl bg-background/80 backdrop-blur-xl border border-foreground/10 shadow-lg">
								<div className="flex items-center gap-1.5 flex-1 pl-1 overflow-x-auto no-scrollbar">
									{sections.map((section, idx) => {
										const status = getSectionStatus(
											section.fields,
											errors,
											allValues,
											visitedSections,
											section.id
										);
										const isOpen = openPanels.includes(section.id);
										return (
											<button
												key={`dot-${section.id}-${idx}`}
												type="button"
												title={section.title}
												onClick={() => toggleDot(section.id)}
												className={cn(
													"w-2.5 h-2.5 rounded-full transition-all shrink-0 hover:scale-125",
													DOT_COLOR[status],
													isOpen &&
														"ring-2 ring-offset-1 ring-offset-background ring-foreground/40"
												)}
											/>
										);
									})}
								</div>
								<SubmitButton isSubmitting={isSubmitting} disabled={!isValid} />
							</div>
						</div>
					</div>,
					document.body
				)}
		</>
	);
}
