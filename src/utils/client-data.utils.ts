import type { ClientFormValues, IndividualClient } from "@/schemas";
import { buildFullName } from "@/schemas";

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
		// Собираем ФИО из трёх отдельных полей
		// Avoid passing an explicit `middleName: undefined` which is incompatible
		// with exactOptionalPropertyTypes — only include middleName when present.
		name: buildFullName({
			lastName: personalData.lastName,
			firstName: personalData.firstName,
			...(personalData.middleName
				? { middleName: personalData.middleName }
				: {}),
		}),
		email: personalData?.email ?? "",
		phone: personalData?.phone ?? "",
		birth: personalData?.birth ?? "",
		passport: passport?.seriesAndNumber ?? "",
		isPartner: false,
		socials: contacts?.socials ?? [],
	};
}

export function extractEnrichedUserData(
	rawData: Record<string, unknown> | null | undefined,
	baseUser: { name: string | null; phone: string | null }
) {
	if (!rawData)
		return { fullName: baseUser.name, phone: baseUser.phone, labels: [] };

	// Разворачиваем возможную обертку applicationData
	const raw = (rawData.applicationData as Record<string, unknown>) || rawData;

	const getObj = (obj: unknown, key: string) =>
		typeof obj === "object" && obj !== null
			? ((obj as Record<string, unknown>)[key] as Record<string, unknown>)
			: undefined;

	const pd = getObj(raw, "personalData");
	const contacts = getObj(raw, "contacts");
	const addit = getObj(raw, "additional");

	// ── Сборка полного имени ──────────────────────────────────────────────────
	// Приоритет: отдельные поля на уровне raw (adminOverrides) →
	//            отдельные поля в personalData (новый формат) →
	//            единая строка personalData.name (legacy) →
	//            User.name из БД
	const ln = raw.lastName ?? pd?.lastName;
	const fn = raw.firstName ?? pd?.firstName;
	const mn = raw.middleName ?? pd?.middleName;

	let fullName: string | null = baseUser.name;

	if (ln || fn || mn) {
		// Новый формат: три отдельных поля
		fullName =
			[ln, fn, mn]
				.filter((part) => typeof part === "string" && part.trim() !== "")
				.join(" ") || baseUser.name;
	} else {
		// Legacy fallback: единая строка name
		const legacyName = typeof pd?.name === "string" ? pd.name.trim() : "";
		if (legacyName) fullName = legacyName;
	}

	// ── Телефон ───────────────────────────────────────────────────────────────
	const ph = getObj(contacts, "phone") ?? getObj(pd, "phone") ?? raw.phone;
	const phone = typeof ph === "string" ? ph : baseUser.phone;

	// ── Метки ─────────────────────────────────────────────────────────────────
	const labels = (getObj(addit, "labels") ?? raw.labels ?? []) as {
		id: string;
		text: string;
		color: string;
		dueDate?: string;
	}[];

	return { fullName: fullName || baseUser.name, phone, labels };
}
