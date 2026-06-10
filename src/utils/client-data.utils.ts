import type { ClientFormValues, IndividualClient } from "@/schemas";

function isIndividualClient(
	data: ClientFormValues | null
): data is IndividualClient {
	return data?.clientType === "individual";
}

// ── Display data ──────────────────────────────────────────────────────────────

export type ClientDisplayData = {
	name: string;
	email: string;
	phone: string;
	birth: string;
	passport: string;
	isPartner: false;
	socials: Array<{ url: string }>;
};

export function getClientDisplayData(
	data: ClientFormValues | null
): ClientDisplayData | null {
	if (!data || !isIndividualClient(data)) return null;

	const { personalData, passport, contacts } = data.applicationData;

	return {
		name: personalData?.name ?? "",
		email: personalData?.email ?? "",
		phone: personalData?.phone ?? "",
		birth: personalData?.birth ?? "",
		passport: passport?.seriesAndNumber ?? "",
		isPartner: false,
		socials: contacts?.socials ?? [],
	};
}
