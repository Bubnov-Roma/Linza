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

	const ln = raw.lastName ?? getObj(pd, "lastName");
	const fn = raw.firstName ?? getObj(pd, "firstName");
	const mn = raw.middleName ?? getObj(pd, "middleName");

	let fullName = baseUser.name;
	if (ln || fn || mn) {
		fullName = [ln, fn, mn]
			.filter((part) => typeof part === "string" && part.trim() !== "")
			.join(" ");
	}

	const ph = getObj(contacts, "phone") ?? getObj(pd, "phone") ?? raw.phone;
	const phone = typeof ph === "string" ? ph : baseUser.phone;

	const labels = (getObj(addit, "labels") ?? raw.labels ?? []) as {
		id: string;
		text: string;
		color: string;
		dueDate?: string;
	}[];

	return { fullName: fullName || baseUser.name, phone, labels };
}
