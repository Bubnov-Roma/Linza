export const RU_TO_EN: Record<string, string> = {
	й: "q",
	ц: "w",
	у: "e",
	к: "r",
	е: "t",
	н: "y",
	г: "u",
	ш: "i",
	щ: "o",
	з: "p",
	х: "[",
	ъ: "]",
	ф: "a",
	ы: "s",
	в: "d",
	а: "f",
	п: "g",
	р: "h",
	о: "j",
	л: "k",
	д: "l",
	ж: ";",
	э: "'",
	я: "z",
	ч: "x",
	с: "c",
	м: "v",
	и: "b",
	т: "n",
	ь: "m",
	б: ",",
	ю: ".",
};

// Автоматически генерируем обратный маппинг
export const EN_TO_RU: Record<string, string> = Object.entries(RU_TO_EN).reduce(
	(acc, [ru, en]) => {
		acc[en] = ru;
		return acc;
	},
	{} as Record<string, string>
);

export function getSearchVariations(str: string): string[] {
	if (!str) return [];

	const lowerStr = str.toLowerCase();

	// Перевод в английскую раскладку
	const toEn = lowerStr
		.split("")
		.map((ch) => RU_TO_EN[ch] ?? ch)
		.join("");

	// Перевод в русскую раскладку
	const toRu = lowerStr
		.split("")
		.map((ch) => EN_TO_RU[ch] ?? ch)
		.join("");

	// Возвращаем только уникальные варианты (Set уберет дубли, если слово было набрано правильно)
	return Array.from(new Set([str, toEn, toRu]));
}
