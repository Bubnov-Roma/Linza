import type { Icon } from "@phosphor-icons/react";
import {
	ChatCenteredIcon,
	MapPinIcon,
	UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { FieldPath } from "react-hook-form";
import {
	AddressesSection,
	ContactsSection,
	IdentitySection,
} from "@/components/forms/client-forms/client-types/sections/individual";
import type { ClientFormValues } from "@/schemas";
import type { ClientVariants } from "@/types";

export interface StepConfig {
	id: string;
	label: string;
	title: string;
	icon: Icon;
	component: React.ComponentType;
	fields: FieldPath<ClientFormValues>[];
	availableFor: Array<ClientVariants>;
}

// ── INDIVIDUAL STEPS ──────────────────────────────────────────────────────────
const INDIVIDUAL_STEPS: readonly StepConfig[] = [
	{
		id: "identity",
		label: "Профиль",
		title: "Личные данные и паспорт",
		icon: UserCircleIcon,
		component: IdentitySection,
		fields: [
			"applicationData.personalData.lastName",
			"applicationData.personalData.firstName",
			"applicationData.personalData.middleName",
			"applicationData.personalData.birth",
			"applicationData.personalData.phone",
			"applicationData.passport",
		],
		availableFor: ["individual", "individual_partner"],
	},
	{
		id: "location",
		label: "Адреса",
		title: "Адреса регистрации и проживания",
		icon: MapPinIcon,
		component: AddressesSection,
		fields: ["applicationData.addresses"],
		availableFor: ["individual", "individual_partner"],
	},
	{
		id: "contacts",
		label: "Связь",
		title: "Контактная информация",
		icon: ChatCenteredIcon,
		component: ContactsSection,
		fields: [
			"applicationData.contacts",
			"applicationData.additional.referralSource",
			"applicationData.additional.recommendation",
			"agreements.personalDataConsent",
		],
		availableFor: ["individual", "individual_partner"],
	},
] as const;

export const getStepsForClientType = (
	clientType: ClientFormValues["clientType"]
): readonly StepConfig[] => {
	if (clientType === "individual" || clientType === "individual_partner") {
		return INDIVIDUAL_STEPS;
	}
	return INDIVIDUAL_STEPS;
};
