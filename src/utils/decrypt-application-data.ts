"server-only";

import { decrypt } from "@/lib/crypto";
import type { ClientFormValues } from "@/schemas";

export function decryptApplicationDataForClient(
	data: ClientFormValues | null
): ClientFormValues | null {
	if (!data) return null;
	try {
		const clone = JSON.parse(JSON.stringify(data));
		const appData = clone.applicationData || {};
		const personalData = appData.personalData || {};

		// 1. Нормализация даты рождения (вытягиваем из старых форматов)
		if (!personalData.birth && personalData.birthDate) {
			personalData.birth = personalData.birthDate;
		}

		// 2. Нормализация паспорта (если он застрял внутри personalData)
		let passport = appData.passport;
		if (!passport || Object.keys(passport).length === 0) {
			passport = personalData.passport || {};
			appData.passport = passport;
		}

		// 3. Нормализация issueDate (из старого issuedAt)
		if (!passport.issueDate && passport.issuedAt) {
			passport.issueDate = passport.issuedAt;
		}

		// 4. МИГРАЦИЯ: если данные хранятся как единая строка name → разбить на три поля
		if (
			personalData.name &&
			!personalData.lastName &&
			!personalData.firstName
		) {
			const parts = (personalData.name as string).trim().split(/\s+/);
			personalData.lastName = parts[0] ?? "";
			personalData.firstName = parts[1] ?? "";
			personalData.middleName = parts.slice(2).join(" ") || undefined;
			// Удаляем старое поле чтобы не путало форму
			delete personalData.name;
		}

		// 5. Расшифровка
		if (passport?.seriesAndNumber) {
			passport.seriesAndNumber = decrypt(passport.seriesAndNumber);
		}
		if (passport?.issuedBy) {
			passport.issuedBy = decrypt(passport.issuedBy);
		}
		if (personalData?.inn) {
			personalData.inn = decrypt(personalData.inn);
		}
		if (personalData?.snils) {
			personalData.snils = decrypt(personalData.snils);
		}

		// Чистим дубликаты старой структуры
		delete personalData.birthDate;
		delete personalData.passport;
		delete passport.issuedAt;

		clone.applicationData = appData;
		return clone as ClientFormValues;
	} catch (e) {
		console.error("Ошибка при подготовке данных клиента:", e);
		return data;
	}
}
