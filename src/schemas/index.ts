import { z } from "zod";

const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
export const phoneRegex = /^\+\d+\(\d{3}\)\d{3}-\d{2}-\d{2}$/;

export const emailSchema = z.email("Введите корректный email").toLowerCase();

export const loginSchema = z.object({
	email: z.email("Введите корректный email").toLowerCase(),
	password: z.string().min(1, "Введите пароль"),
});

export const updatePasswordSchema = z
	.object({
		password: z.string().min(8, "Пароль должен быть не менее 8 символов"),
		confirmPassword: z.string().min(1, "Повторите пароль"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Пароли не совпадают",
		path: ["confirmPassword"],
	});

const dateSchema = z
	.string()
	.min(10, "Укажите дату")
	.regex(dateRegex, "ДД.ММ.ГГГГ")
	.refine(
		(val) => {
			const [day, month, year] = val.split(".").map(Number);
			if (!year || !month || !day) return false;
			const birthDate = new Date(year, month - 1, day);
			const today = new Date();
			let age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();
			if (
				monthDiff < 0 ||
				(monthDiff === 0 && today.getDate() < birthDate.getDate())
			) {
				age--;
			}
			return age >= 16 && age <= 100;
		},
		{ message: "Введите корректную дату" }
	);

const phoneSchema = z
	.string()
	.min(1, "Укажите номер телефона")
	.transform((val) => val.replace(/\s/g, ""))
	.pipe(z.string().regex(phoneRegex, "Укажите полный номер"));

export const socialMediaObjectSchema = z.object({
	url: z
		.string()
		.min(2, "Минимум 2 символа")
		.refine(
			(val) =>
				z.string().url().safeParse(val).success ||
				/^@[a-zA-Z0-9._]{1,32}$/.test(val),
			{ message: "Введите корректную ссылку или @username" }
		),
});

// ── personalData: три отдельных поля вместо единой строки name ───────────────
const personalDataSchema = z.object({
	lastName: z.string().min(2, "Введите фамилию"),
	firstName: z.string().min(2, "Введите имя"),
	middleName: z.string().optional(),
	birth: dateSchema,
	email: emailSchema,
	phone: phoneSchema,
});

// Вспомогательный тип для получения полного ФИО из personalData
export type PersonalData = z.infer<typeof personalDataSchema>;

/** Собирает полное ФИО из трёх полей */
export function buildFullName(pd: {
	lastName?: string;
	firstName?: string;
	middleName?: string;
}): string {
	return [pd.lastName, pd.firstName, pd.middleName]
		.filter((s) => typeof s === "string" && s.trim() !== "")
		.join(" ");
}

const passportSchema = z.object({
	seriesAndNumber: z
		.string()
		.transform((val) => val.replace(/\D/g, ""))
		.pipe(z.string().length(10, "Серия и номер - 10 цифр")),
	issueDate: dateSchema,
	issuedBy: z.string().min(10, "Укажите кем выдан документ"),
});

const promoAndAgreementsSchema = z.object({
	comment: z.string().optional(),
	newsletter: z.boolean().optional(),
	personalDataConsent: z.boolean().refine((val) => val === true, {
		message: "необходимо ваше согласие",
	}),
});

const bankDetailsSchema = z.object({
	accountNumber: z.string().min(20, "20 символов"),
	bankName: z.string().min(2, "Название банка"),
	bik: z.string().length(9, "БИК: 9 цифр"),
	corrAccount: z.string().min(20, "20 символов"),
});

const addressSchema = z.object({
	index: z.string().regex(/^\d{6}$/, "6 цифр"),
	country: z.string().min(2, "Укажите страну"),
	region: z.string().min(2, "Укажите регион"),
	city: z.string().min(2, "Укажите город"),
	address: z.string().min(2, "Укажите улицу, номер дома и квартиру"),
});
export type Address = z.infer<typeof addressSchema>;

const addressesBlockSchema = z
	.object({
		registration: addressSchema,
		actual: addressSchema.partial(),
		isSame: z.boolean(),
	})
	.superRefine((data, ctx) => {
		if (!data.isSame) {
			const actual = data.actual;
			const requiredFields: (keyof Address)[] = [
				"index",
				"region",
				"city",
				"country",
				"address",
			];
			requiredFields.forEach((field) => {
				if (!actual[field] || actual[field]?.trim() === "") {
					ctx.addIssue({
						code: "custom",
						message: "Обязательное поле",
						path: ["actual", field],
					});
				}
			});
			if (actual.index && actual.index.length !== 6) {
				ctx.addIssue({
					code: "custom",
					message: "6 цифр",
					path: ["actual", "index"],
				});
			}
		}
	});

const additionalSchema = z.object({
	referralSource: z.enum(
		["search_engine", "vk", "website", "friends", "photo_school", "other"],
		{ error: "Выберите вариант" }
	),
	recommendation: z.string().optional(),
	photoSchool: z.string().optional(),
	referralSourceOther: z.string().optional(),
});

export const equipmentSchema = z.object({
	title: z.string().min(2, "Название позиции"),
	description: z.string().min(10, "Описание позиции"),
	inventoryNumber: z.string().min(1, "Инвентарный номер"),
	estimatedValue: z.number().min(0, "Оценочная стоимость"),
	configuration: z.string().min(1, "Комплектация (или пробел)"),
	defects: z.string().min(1, "Дефекты (или пробел)"),
	photo: z.url("Загрузите фото"),
	category: z.string().min(1, "Категория"),
	dailyRate: z.number().min(0, "Ориентировочная стоимость в сутки").optional(),
});
export type EquipmentSchemaType = z.infer<typeof equipmentSchema>;

export const individualContactsSchema = z.object({
	socials: z
		.array(socialMediaObjectSchema)
		.min(1, "Добавьте хотя бы одну соцсеть")
		.max(5, "Максимум 5 ссылок"),
});

// ── INDIVIDUAL CLIENT ─────────────────────────────────────────────────────────
export const individualClientSchema = z.object({
	clientType: z.literal("individual"),
	applicationData: z.object({
		personalData: personalDataSchema,
		passport: passportSchema,
		contacts: individualContactsSchema,
		addresses: addressesBlockSchema,
		additional: additionalSchema,
	}),
	agreements: promoAndAgreementsSchema.optional(),
});

// ── INDIVIDUAL PARTNER ────────────────────────────────────────────────────────
export const individualPartnerSchema = individualClientSchema.extend({
	clientType: z.literal("individual_partner"),
	isPartner: z.literal(true),
	partnerEquipment: z
		.array(equipmentSchema)
		.min(1, "Добавьте минимум 1 единицу техники"),
	partnerAgreement: z.boolean().refine((val) => val === true, {
		message: "Необходимо подтверждение согласия с условиями партнерства",
	}),
});

// ── LEGAL CLIENT ──────────────────────────────────────────────────────────────
export const legalClientSchema = z.object({
	clientType: z.literal("legal"),
	company: z.object({
		companyName: z.string().min(2, "Наименование организации"),
		companyType: z.enum(["ip", "ooo", "nko", "ao"]),
		companyPhone: phoneSchema,
		companyEmail: emailSchema,
		companyWebsite: z.url().optional().or(z.literal("")),
	}),
	director: z.object({
		name: z.string().min(1, "ФИО руководителя"),
		nameGenitive: z.string().min(5, "ФИО в родительном падеже"),
		position: z.enum(["director", "general_director", "manager", "custom"]),
		customPosition: z.string().optional(),
		basedOn: z.enum(["charter", "power_of_attorney", "custom"]),
		customBasedOn: z.string().optional(),
	}),
	details: z.object({
		inn: z.string().regex(/^\d{10}$|^\d{12}$/, "ИНН: 10 или 12 цифр"),
		ogrn: z.string().min(13, "ОГРН/ОГРНИП"),
		kpp: z.string().min(9, "КПП"),
		okpo: z.string().optional(),
	}),
	address: addressesBlockSchema,
	bankDetails: bankDetailsSchema,
	contactPerson: z.object({
		personalData: personalDataSchema,
		passport: passportSchema,
		registrationAddress: addressSchema,
		residentialAddress: addressSchema,
		sameAsRegistration: z.boolean().optional(),
		email: emailSchema,
		phone: phoneSchema,
	}),
	agreements: promoAndAgreementsSchema,
});

// ── LEGAL PARTNER ─────────────────────────────────────────────────────────────
export const legalPartnerSchema = legalClientSchema.extend({
	clientType: z.literal("legal_partner"),
	isPartner: z.literal(true),
	partnerEquipment: z
		.array(equipmentSchema)
		.min(1, "Добавьте минимум 1 единицу техники"),
	partnerAgreement: z.boolean().refine((val) => val === true, {
		message: "Необходимо подтверждение согласия с условиями партнерства",
	}),
});

// ── Active union ──────────────────────────────────────────────────────────────
export const clientFormSchema = individualClientSchema;

export type SocialsList = z.infer<typeof individualContactsSchema>["socials"];
export type SocialItem = SocialsList[number];

export type IndividualClient = z.infer<typeof individualClientSchema>;
export type LegalClient = z.infer<typeof legalClientSchema>;
export type IndividualPartner = z.infer<typeof individualPartnerSchema>;
export type LegalPartner = z.infer<typeof legalPartnerSchema>;
export type ClientFormValues = z.infer<typeof clientFormSchema>;
