export const PLURAL_FORMS = {
	equipment: ["позиция", "позиции", "позиций"],
	days: ["день", "дня", "дней"],
	reviews: ["отзыв", "отзыва", "отзывов"],
	items: ["товар", "товара", "товаров"],
	unavailable: ["недоступен", "недоступны", "недоступны"],
	users: ["пользователь", "пользователя", "пользователей"],
	new: ["новый", "новых", "новых"],
} as const;

export type PluralType = keyof typeof PLURAL_FORMS;
