"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FioInput } from "@/components/forms/client-forms/client-types/sections/individual/id/FioInput";
import {
	SectionColumn,
	SectionWrapper,
} from "@/components/forms/client-forms/shared";
import { DateInput } from "@/components/forms/shared/DateInput";
import { FormTextarea } from "@/components/forms/shared/FormTextarea";
import { PassportInput } from "@/components/forms/shared/PassportInput";
import { PhoneInput } from "@/components/forms/shared/PhoneInput";
import { cn } from "@/lib/utils";

interface AccordionColumnProps {
	title: string;
	indicatorColor: string;
	children: React.ReactNode;
	isLast?: boolean;
	headerRight?: React.ReactNode;
	defaultOpen?: boolean;
}

function AccordionColumn({
	title,
	indicatorColor,
	children,
	isLast,
	headerRight,
	defaultOpen = false,
}: AccordionColumnProps) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<>
			{/* Mobile accordion */}
			<div className="md:hidden rounded-2xl border border-foreground/5 overflow-hidden">
				<button
					type="button"
					onClick={() => setOpen((p) => !p)}
					className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
				>
					<div
						className={cn("w-1.5 h-5 rounded-full shrink-0", indicatorColor)}
					/>
					<span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/70 flex-1">
						{title}
					</span>
					{headerRight && (
						<button type="button" onClick={(e) => e.stopPropagation()}>
							{headerRight}
						</button>
					)}
					<ChevronDown
						size={15}
						className={cn(
							"text-muted-foreground transition-transform duration-200 shrink-0",
							open && "rotate-180"
						)}
					/>
				</button>

				<AnimatePresence initial={false}>
					{open && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ type: "spring", stiffness: 380, damping: 36 }}
							className="overflow-hidden"
						>
							<div className="px-4 pb-5 pt-1 space-y-4">{children}</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Desktop SectionColumn */}
			<div className="hidden md:block">
				<SectionColumn
					title={title}
					indicatorColor={indicatorColor}
					isLast={!!isLast}
					headerRight={headerRight}
				>
					{children}
				</SectionColumn>
			</div>
		</>
	);
}

export const IdentitySection = () => {
	return (
		<SectionWrapper className="lg:grid-cols-2">
			<AccordionColumn
				title="Личные данные"
				indicatorColor="bg-blue-500"
				defaultOpen={true}
			>
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
			</AccordionColumn>

			<AccordionColumn
				title="Паспортные данные"
				indicatorColor="bg-cyan-400"
				isLast
			>
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
					placeholder="Наименование органа выдавшего документ"
					rows={3}
				/>
			</AccordionColumn>
		</SectionWrapper>
	);
};
