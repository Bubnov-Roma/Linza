import type { BookingDocData, DocTemplateType } from "@/types";

export const TEMPLATE_VARIABLES: {
	key: keyof BookingDocData;
	label: string;
	example: string;
}[] = [
	{ key: "bookingNumber", label: "Номер заказа", example: "A1B2C3D4" },
	{
		key: "bookingDate",
		label: "Дата создания заказа",
		example: "15 января 2025 г.",
	},
	{ key: "startDate", label: "Дата начала аренды", example: "20.01.2025" },
	{ key: "endDate", label: "Дата окончания аренды", example: "22.01.2025" },
	{
		key: "startDatetime",
		label: "Дата и время начала",
		example: "20.01.2025 10:00",
	},
	{
		key: "endDatetime",
		label: "Дата и время окончания",
		example: "22.01.2025 20:00",
	},
	{ key: "totalAmount", label: "Сумма аренды", example: "5 000 ₽" },
	{
		key: "totalAmountWords",
		label: "Сумма прописью",
		example: "пять тысяч рублей 00 копеек",
	},
	{ key: "depositAmount", label: "Залог", example: "10 000 ₽" },
	{ key: "insurance", label: "Страховка", example: "включена" },
	{ key: "clientName", label: "Имя клиента", example: "Иванов Иван Иванович" },
	{ key: "clientEmail", label: "Email клиента", example: "ivan@example.com" },
	{
		key: "clientPhone",
		label: "Телефон клиента",
		example: "+7 900 123 45 67",
	},
	{ key: "clientType", label: "Тип клиента", example: "Физическое лицо" },
	{ key: "companyName", label: "Название компании", example: "ООО Ромашка" },
	{ key: "tin", label: "ИНН", example: "7712345678" },
	{
		key: "equipmentList",
		label: "Список техники (строкой)",
		example: "Камера Sony, Штатив",
	},
	{
		key: "equipmentListNumbered",
		label: "Список техники (нумер.)",
		example: "1. Камера Sony — 3 000 ₽\n2. Штатив — 500 ₽",
	},
	{ key: "equipmentCount", label: "Кол-во позиций техники", example: "3" },
];

export const TEMPLATE_TYPE_LABELS: Record<DocTemplateType, string> = {
	CONTRACT_INDIVIDUAL: "Договор (физ. лицо)",
	CONTRACT_LEGAL: "Договор (юр. лицо)",
	ACT: "Акт выполненных работ",
	INVOICE: "Счёт на оплату",
	RECEIPT: "Квитанция",
	CUSTOM: "Произвольный",
};

export const FORMAT_COLORS: Record<string, string> = {
	docx: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
	xlsx: "bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400",
	pdf: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400",
};
