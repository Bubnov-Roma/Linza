"server-only";

import { decrypt } from "@/lib/crypto";
import type { ClientFormValues } from "@/schemas";

export function decryptApplicationDataForClient(
	data: ClientFormValues | null
): ClientFormValues | null {
	if (!data) return null;
	try {
		// Делаем глубокую копию, чтобы не мутировать исходный объект
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
			appData.passport = passport; // Переносим на правильный уровень для Zod-схемы
		}

		// 3. Расшифровка
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

		// Подчищаем дубликаты старой структуры, чтобы не засорять стейт формы
		delete personalData.birthDate;
		delete personalData.passport;

		clone.applicationData = appData;
		return clone as ClientFormValues;
	} catch (e) {
		console.error("Ошибка при подготовке данных клиента:", e);
		return data;
	}
}
