"use server";

import type { ApplicationStatus, DiscountType, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface CreateUserPayload {
	name?: string;
	email: string;
	phone?: string;
	role?: "USER" | "MANAGER" | "PARTNER";
	passwordMode: "auto" | "manual" | "invite";
	manualPassword?: string;
	note?: string;
}

export interface ApplicationDataFull {
	firstName?: string;
	lastName?: string;
	middleName?: string;
	birthDate?: string;
	passport?: {
		seriesAndNumber?: string;
		series?: string;
		number?: string;
		issuedBy?: string;
		issuedAt?: string;
		divisionCode?: string;
		registrationAddress?: string;
	};
	contacts?: {
		phone?: string;
		extraPhone?: string;
		email?: string;
		socials?: { url: string }[];
	};
	address?: {
		registrationAddress?: string;
		residentialAddress?: string;
	};
	recommendedBy?: string;
	inn?: string;
	snils?: string;
	clientType?: string;
	labels?: Array<{
		id: string;
		text: string;
		color: string;
		dueDate?: string;
		shift?: string;
	}>;
}

export interface ClientDataBlocks {
	clientType?: string;
	personalData?: {
		name?: string;
		firstName?: string;
		lastName?: string;
		middleName?: string;
		birth?: string;
		birthDate?: string;
		inn?: string;
		snils?: string;
		email?: string;
		phone?: string;
		passport?: {
			seriesAndNumber?: string;
			series?: string;
			number?: string;
			issuedBy?: string;
			issueDate?: string;
			issuedAt?: string;
			divisionCode?: string;
			registrationAddress?: string;
		};
	};
	contacts?: {
		phone?: string;
		extraPhone?: string;
		email?: string;
		socials?: { url: string }[];
	};
	addresses?: {
		registration?: { address?: string };
		actual?: { address?: string };
	};
	address?: {
		registrationAddress?: string;
		residentialAddress?: string;
	};
	passport?: {
		seriesAndNumber?: string;
		series?: string;
		number?: string;
		issuedBy?: string;
		issueDate?: string;
		issuedAt?: string;
		divisionCode?: string;
		registrationAddress?: string;
	};
	additional?: {
		recommendation?: string;
		labels?: ApplicationDataFull["labels"];
	};
	labels?: ApplicationDataFull["labels"];
}

export interface DbClientJson extends ClientDataBlocks {
	clientType?: string;
	applicationData?: ClientDataBlocks;
	firstName?: string;
	lastName?: string;
	middleName?: string;
	birthDate?: string;
	inn?: string;
	snils?: string;
	phone?: string;
	extraPhone?: string;
	email?: string;
	recommendedBy?: string;
}

export interface DiscountData {
	id: string;
	createdAt: Date;
	userId: string;
	type: DiscountType;
	description: string | null;
	value: number;
	promoCode: string | null;
	validFrom: Date | null;
	validUntil: Date | null;
	isActive: boolean;
	createdBy: string | null;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function requireAdmin() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Не авторизован");
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true, permissions: true, name: true },
	});
	if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
		throw new Error("Недостаточно прав");
	}
	return { adminId: session.user.id, adminName: user.name ?? "Администратор" };
}

export async function writeUserAuditLog(
	targetUserId: string,
	authorId: string | null,
	authorName: string | null,
	entry: {
		action: string;
		fieldName?: string;
		valueBefore?: string;
		valueAfter?: string;
		meta?: Record<string, unknown>;
	}
) {
	try {
		const model = prisma.userAuditLog;
		if (!model) return;

		await model.create({
			data: {
				targetUserId,
				authorId,
				authorName,
				action: entry.action,
				fieldName: entry.fieldName ?? null,
				valueBefore: entry.valueBefore ?? null,
				valueAfter: entry.valueAfter ?? null,
				meta: entry.meta ? (entry.meta as Prisma.JsonObject) : {},
			},
		});
	} catch {
		console.warn("[UserAuditLog] Не удалось записать лог:", entry.action);
	}
}

function flattenPatch(
	patch: Record<string, unknown>,
	prefix = ""
): Record<string, unknown> {
	return Object.keys(patch).reduce(
		(acc, k) => {
			const pre = prefix.length ? `${prefix}.` : "";
			const val = patch[k];
			if (typeof val === "object" && val !== null && !Array.isArray(val)) {
				Object.assign(
					acc,
					flattenPatch(val as Record<string, unknown>, pre + k)
				);
			} else {
				acc[pre + k] = val;
			}
			return acc;
		},
		{} as Record<string, unknown>
	);
}

function decryptClientData(data: DbClientJson): DbClientJson {
	const result = JSON.parse(JSON.stringify(data)) as DbClientJson;
	const appData = result.applicationData ? result.applicationData : result;

	const personalData = appData.personalData || {};
	if (personalData.inn) personalData.inn = decrypt(personalData.inn);
	if (personalData.snils) personalData.snils = decrypt(personalData.snils);

	const passport =
		appData.passport && Object.keys(appData.passport).length > 0
			? appData.passport
			: personalData.passport;

	if (passport) {
		if (passport.seriesAndNumber)
			passport.seriesAndNumber = decrypt(passport.seriesAndNumber);
		if (passport.series) passport.series = decrypt(passport.series);
		if (passport.number) passport.number = decrypt(passport.number);
		if (passport.issuedBy) passport.issuedBy = decrypt(passport.issuedBy);
	}

	return result;
}

function mapClientDataToFlat(root: DbClientJson): ApplicationDataFull {
	const raw = root.applicationData ? root.applicationData : root;

	const personal = raw.personalData || {};
	const contacts = raw.contacts || {};
	const addresses = raw.addresses || {};
	const address = raw.address || {};
	const additional = raw.additional || {};
	const passport = raw.passport || personal.passport || {};

	const nameParts = (personal.name || "").split(" ").filter(Boolean);
	const lastName = nameParts[0] || personal.lastName || root.lastName || "";
	const firstName = nameParts[1] || personal.firstName || root.firstName || "";
	const middleName =
		nameParts.slice(2).join(" ") ||
		personal.middleName ||
		root.middleName ||
		"";

	const result: ApplicationDataFull = {
		clientType: root.clientType || raw.clientType || "individual",
	};

	if (firstName) result.firstName = firstName;
	if (lastName) result.lastName = lastName;
	if (middleName) result.middleName = middleName;

	const birthDate = personal.birth || personal.birthDate || root.birthDate;
	if (birthDate) result.birthDate = birthDate;

	const inn = personal.inn || root.inn;
	if (inn) result.inn = inn;

	const snils = personal.snils || root.snils;
	if (snils) result.snils = snils;

	const hasPassport = Object.keys(passport).length > 0;
	if (hasPassport) {
		result.passport = {};
		if (passport.seriesAndNumber)
			result.passport.seriesAndNumber = passport.seriesAndNumber;
		if (passport.series) result.passport.series = passport.series;
		if (passport.number) result.passport.number = passport.number;
		if (passport.issuedBy) result.passport.issuedBy = passport.issuedBy;

		const issuedAt = passport.issueDate || passport.issuedAt;
		if (issuedAt) result.passport.issuedAt = issuedAt;

		if (passport.divisionCode)
			result.passport.divisionCode = passport.divisionCode;

		const regAddr =
			addresses.registration?.address ||
			address.registrationAddress ||
			passport.registrationAddress;
		if (regAddr) result.passport.registrationAddress = regAddr;
	}

	result.contacts = {};
	const phone = personal.phone || contacts.phone || root.phone;
	if (phone) result.contacts.phone = phone;

	const extraPhone = contacts.extraPhone || root.extraPhone;
	if (extraPhone) result.contacts.extraPhone = extraPhone;

	const email = personal.email || contacts.email || root.email;
	if (email) result.contacts.email = email;

	if (contacts.socials && contacts.socials.length > 0)
		result.contacts.socials = contacts.socials;

	result.address = {};
	const regAddress =
		addresses.registration?.address || address.registrationAddress;
	if (regAddress) result.address.registrationAddress = regAddress;

	const resAddress = addresses.actual?.address || address.residentialAddress;
	if (resAddress) result.address.residentialAddress = resAddress;

	const recBy = additional.recommendation || root.recommendedBy;
	if (recBy) result.recommendedBy = recBy;

	result.labels = additional.labels || raw.labels || [];

	return result;
}

function applyPatchToClientData(
	current: DbClientJson,
	patch: Partial<ApplicationDataFull>
): DbClientJson {
	const result = JSON.parse(JSON.stringify(current)) as DbClientJson;

	if (!result.applicationData) result.applicationData = {};
	const appData = result.applicationData;

	if (!appData.personalData) appData.personalData = {};
	if (!appData.contacts) appData.contacts = {};
	if (!appData.addresses) appData.addresses = {};
	if (!appData.passport) appData.passport = {};
	if (!appData.additional) appData.additional = {};

	if (
		patch.firstName !== undefined ||
		patch.lastName !== undefined ||
		patch.middleName !== undefined
	) {
		const currentNameParts = (appData.personalData.name || "").split(" ");
		const last =
			patch.lastName !== undefined
				? patch.lastName
				: currentNameParts[0] || appData.personalData.lastName || "";
		const first =
			patch.firstName !== undefined
				? patch.firstName
				: currentNameParts[1] || appData.personalData.firstName || "";
		const middle =
			patch.middleName !== undefined
				? patch.middleName
				: currentNameParts.slice(2).join(" ") ||
					appData.personalData.middleName ||
					"";

		if (appData.personalData.name !== undefined) {
			appData.personalData.name = [last, first, middle]
				.filter(Boolean)
				.join(" ");
		} else {
			if (patch.firstName !== undefined)
				appData.personalData.firstName = patch.firstName;
			if (patch.lastName !== undefined)
				appData.personalData.lastName = patch.lastName;
			if (patch.middleName !== undefined)
				appData.personalData.middleName = patch.middleName;
		}
	}

	if (patch.birthDate !== undefined) {
		if (appData.personalData.birth !== undefined)
			appData.personalData.birth = patch.birthDate;
		else appData.personalData.birthDate = patch.birthDate;
	}

	if (patch.passport) {
		// Находим существующий паспорт или создаем новый и сразу привязываем к дереву
		if (!appData.passport || Object.keys(appData.passport).length === 0) {
			appData.passport = appData.personalData.passport || {};
		}

		const p = appData.passport; // Теперь мы точно мутируем объект внутри appData

		if (patch.passport.seriesAndNumber !== undefined)
			p.seriesAndNumber = patch.passport.seriesAndNumber;
		if (patch.passport.series !== undefined) p.series = patch.passport.series;
		if (patch.passport.number !== undefined) p.number = patch.passport.number;
		if (patch.passport.issuedBy !== undefined)
			p.issuedBy = patch.passport.issuedBy;
		if (patch.passport.issuedAt !== undefined) {
			if (p.issueDate !== undefined) p.issueDate = patch.passport.issuedAt;
			else p.issuedAt = patch.passport.issuedAt;
		}
		if (patch.passport.divisionCode !== undefined)
			p.divisionCode = patch.passport.divisionCode;
		if (patch.passport.registrationAddress !== undefined)
			p.registrationAddress = patch.passport.registrationAddress;
	}

	if (patch.contacts) {
		if (patch.contacts.phone !== undefined) {
			if (appData.personalData.phone !== undefined)
				appData.personalData.phone = patch.contacts.phone;
			else appData.contacts.phone = patch.contacts.phone;
		}
		if (patch.contacts.extraPhone !== undefined)
			appData.contacts.extraPhone = patch.contacts.extraPhone;
		if (patch.contacts.email !== undefined) {
			if (appData.personalData.email !== undefined)
				appData.personalData.email = patch.contacts.email;
			else appData.contacts.email = patch.contacts.email;
		}
		if (patch.contacts.socials !== undefined)
			appData.contacts.socials = patch.contacts.socials;
	}

	if (patch.address) {
		if (patch.address.registrationAddress !== undefined) {
			if (!appData.addresses.registration) appData.addresses.registration = {};
			appData.addresses.registration.address =
				patch.address.registrationAddress;
			if (appData.address)
				appData.address.registrationAddress = patch.address.registrationAddress;
		}
		if (patch.address.residentialAddress !== undefined) {
			if (!appData.addresses.actual) appData.addresses.actual = {};
			appData.addresses.actual.address = patch.address.residentialAddress;
			if (appData.address)
				appData.address.residentialAddress = patch.address.residentialAddress;
		}
	}

	if (patch.labels !== undefined) appData.additional.labels = patch.labels;
	if (patch.recommendedBy !== undefined)
		appData.additional.recommendation = patch.recommendedBy;

	return result;
}

function encryptInClientData(data: DbClientJson): DbClientJson {
	const result = JSON.parse(JSON.stringify(data)) as DbClientJson;
	const appData = result.applicationData ? result.applicationData : result;

	const personalData = appData.personalData || {};
	if (personalData.inn) personalData.inn = encrypt(personalData.inn);
	if (personalData.snils) personalData.snils = encrypt(personalData.snils);

	const passport =
		appData.passport && Object.keys(appData.passport).length > 0
			? appData.passport
			: personalData.passport;

	if (passport) {
		if (passport.seriesAndNumber)
			passport.seriesAndNumber = encrypt(passport.seriesAndNumber);
		if (passport.series) passport.series = encrypt(passport.series);
		if (passport.number) passport.number = encrypt(passport.number);
		if (passport.issuedBy) passport.issuedBy = encrypt(passport.issuedBy);
	}

	return result;
}

export async function adminGetUserApplicationAction(userId: string): Promise<{
	success: boolean;
	data?: ApplicationDataFull; // Данные админа (adminOverrides)
	clientData?: ApplicationDataFull; // Оригинальные данные клиента (applicationData)
	applicationId?: string;
	error?: string;
}> {
	try {
		await requireAdmin();

		const app = await prisma.clientApplication.findUnique({
			where: { userId },
		});
		if (!app || (!app.applicationData && !app.adminOverrides)) {
			return { success: false, error: "Анкета не найдена" };
		}
		const clientRaw = (
			typeof app.applicationData === "string"
				? JSON.parse(app.applicationData)
				: app.applicationData
		) as Record<string, unknown>;
		const overridesRaw = (
			typeof app.adminOverrides === "string"
				? JSON.parse(app.adminOverrides)
				: app.adminOverrides
		) as Record<string, unknown>;

		// 1. Формируем чистую версию клиента
		const decryptedClient = decryptClientData(
			(clientRaw || {}) as DbClientJson
		);
		const clientDataFlat = mapClientDataToFlat(decryptedClient);

		// 2. Формируем версию админа.
		// Если adminOverrides пустой (для старых анкет), берем clientRaw за основу.
		const hasOverrides = overridesRaw && Object.keys(overridesRaw).length > 0;
		const activeAdminRaw = hasOverrides ? overridesRaw : clientRaw;

		const decryptedAdmin = decryptClientData(
			(activeAdminRaw || {}) as DbClientJson
		);
		const adminDataFlat = mapClientDataToFlat(decryptedAdmin);

		return {
			success: true,
			data: adminDataFlat,
			clientData: clientDataFlat, // <-- Передаем на клиент для подсветки изменений
			applicationId: app.id,
		};
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка загрузки",
		};
	}
}

export async function adminUpdateApplicationFieldAction(
	userId: string,
	patch: Partial<ApplicationDataFull>
): Promise<{ success: boolean; error?: string }> {
	try {
		const { adminId, adminName } = await requireAdmin();

		const app = await prisma.clientApplication.findUnique({
			where: { userId },
			select: { id: true, adminOverrides: true, applicationData: true },
		});

		if (!app) return { success: false, error: "Анкета не найдена" };

		let currentOverridesRaw = (
			typeof app.adminOverrides === "string"
				? JSON.parse(app.adminOverrides)
				: app.adminOverrides
		) as Record<string, unknown>;

		const clientRaw = (
			typeof app.applicationData === "string"
				? JSON.parse(app.applicationData)
				: app.applicationData
		) as Record<string, unknown>;

		if (!currentOverridesRaw || Object.keys(currentOverridesRaw).length === 0) {
			currentOverridesRaw = clientRaw;
		}

		const currentOverridesDecrypted = decryptClientData(
			(currentOverridesRaw || {}) as DbClientJson
		);

		// Получаем плоскую версию старых данных для сравнения
		const currentFlatData = mapClientDataToFlat(currentOverridesDecrypted);

		const updatedOverridesDecrypted = applyPatchToClientData(
			currentOverridesDecrypted,
			patch
		);
		const encryptedOverrides = encryptInClientData(updatedOverridesDecrypted);

		await prisma.clientApplication.update({
			where: { userId },
			data: {
				adminOverrides: encryptedOverrides as unknown as Prisma.InputJsonValue,
			},
		});

		const sensitiveKeys = new Set([
			"inn",
			"snils",
			"seriesAndNumber",
			"series",
			"number",
			"issuedBy",
		]);
		const flatPatch = flattenPatch(patch as Record<string, unknown>);
		const getVal = (obj: unknown, path: string) =>
			path
				.split(".")
				.reduce((acc, part) => (acc as Record<string, unknown>)?.[part], obj);

		// Умный генератор логов
		for (const [fieldPath, valAfter] of Object.entries(flatPatch)) {
			const isSensitive = sensitiveKeys.has(fieldPath.split(".").pop() || "");
			const valBeforeRaw = getVal(currentFlatData, fieldPath);

			let actionLabel = "Редактирование поля";
			let displayBefore = isSensitive ? "*** скрыто ***" : valBeforeRaw;
			let displayAfter = isSensitive ? "*** обновлено (скрыто) ***" : valAfter;

			// Обработка массивов (Метки)
			if (
				fieldPath === "labels" &&
				Array.isArray(valBeforeRaw) &&
				Array.isArray(valAfter)
			) {
				if (valAfter.length > valBeforeRaw.length) {
					actionLabel = "Добавлена метка";
					const added = valAfter.find(
						(a) => !valBeforeRaw.some((b) => b.id === a.id)
					);
					displayAfter = added ? added.text : "Метка";
					displayBefore = "";
				} else if (valBeforeRaw.length > valAfter.length) {
					actionLabel = "Удалена метка";
					const removed = valBeforeRaw.find(
						(b) => !valAfter.some((a) => a.id === b.id)
					);
					displayBefore = removed ? removed.text : "Метка";
					displayAfter = "";
				} else {
					actionLabel = "Изменение меток";
					displayAfter = valAfter.map((l) => l.text).join(", ");
					displayBefore = valBeforeRaw.map((l) => l.text).join(", ");
				}
			}
			// Обработка массивов (Соцсети)
			else if (
				fieldPath === "contacts.socials" &&
				Array.isArray(valBeforeRaw) &&
				Array.isArray(valAfter)
			) {
				if (valAfter.length > valBeforeRaw.length) {
					actionLabel = "Добавлена соцсеть";
					const added = valAfter.find(
						(a) => !valBeforeRaw.some((b) => b.url === a.url)
					);
					displayAfter = added ? added.url : "Ссылка";
					displayBefore = "";
				} else if (valBeforeRaw.length > valAfter.length) {
					actionLabel = "Удалена соцсеть";
					const removed = valBeforeRaw.find(
						(b) => !valAfter.some((a) => a.url === b.url)
					);
					displayBefore = removed ? removed.url : "Ссылка";
					displayAfter = "";
				} else {
					actionLabel = "Изменение соцсетей";
					displayAfter = valAfter.map((s) => s.url).join(", ");
					displayBefore = valBeforeRaw.map((s) => s.url).join(", ");
				}
			}
			// Защита от объектов (чтобы не выводилось [object Object])
			else {
				if (typeof displayAfter === "object" && displayAfter !== null)
					displayAfter = JSON.stringify(displayAfter);
				if (typeof displayBefore === "object" && displayBefore !== null)
					displayBefore = JSON.stringify(displayBefore);
			}

			await writeUserAuditLog(userId, adminId, adminName, {
				action: actionLabel,
				fieldName: fieldPath,
				valueBefore: String(displayBefore ?? ""),
				valueAfter: String(displayAfter ?? ""),
			});
		}

		revalidatePath("/admin/users");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function adminGetUserDiscountAction(userId: string) {
	try {
		await requireAdmin();
		const discount = await prisma.userDiscount.findFirst({
			where: { userId, isActive: true },
			orderBy: { createdAt: "desc" },
		});
		return { success: true, data: discount };
	} catch {
		return { success: false, error: "Ошибка загрузки скидки" };
	}
}

export async function adminAssignDiscountAction(data: {
	userId: string;
	type: "PERCENT" | "FIXED" | "PROMO";
	value: number;
	promoCode?: string;
	description?: string;
}): Promise<{ success: boolean; error?: string; data?: DiscountData }> {
	try {
		const { adminId, adminName } = await requireAdmin();

		await prisma.userDiscount.updateMany({
			where: { userId: data.userId, isActive: true },
			data: { isActive: false },
		});

		const discount = await prisma.userDiscount.create({
			data: {
				userId: data.userId,
				type: data.type,
				value: data.value,
				promoCode: data.type === "PROMO" ? (data.promoCode ?? null) : null,
				description: data.description ?? null,
				createdBy: adminId,
				isActive: true,
			},
		});

		let actionText = "Назначена скидка";
		let valAfter = `${data.value} %`;
		if (data.type === "FIXED") valAfter = `${data.value} ₽`;
		if (data.type === "PROMO") {
			actionText = "Добавлен промокод";
			valAfter = `${data.promoCode} (-${data.value} ₽)`;
		}

		await writeUserAuditLog(data.userId, adminId, adminName, {
			action: actionText,
			fieldName: "discount",
			valueAfter: `${valAfter}${data.description ? ` (${data.description})` : ""}`,
		});

		revalidatePath("/admin/users");
		return { success: true, data: discount };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка",
		};
	}
}

export async function adminAddUserCommentAction(userId: string, note: string) {
	try {
		const { adminId, adminName } = await requireAdmin();
		const created = await prisma.userAdminNote.create({
			data: { userId, authorId: adminId, note: note.trim() },
		});

		await writeUserAuditLog(userId, adminId, adminName, {
			action: "Добавлен комментарий",
			valueAfter: note.trim(),
		});
		revalidatePath("/admin/users");
		return { success: true, data: created };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function adminDeleteUserCommentAction(
	userId: string,
	commentId: string
) {
	try {
		const { adminId, adminName } = await requireAdmin();
		const note = await prisma.userAdminNote.findUnique({
			where: { id: commentId },
		});
		if (!note) return { success: false, error: "Комментарий не найден" };

		await prisma.userAdminNote.delete({ where: { id: commentId } });

		await writeUserAuditLog(userId, adminId, adminName, {
			action: "Удален комментарий",
			valueBefore: note.note,
		});
		revalidatePath("/admin/users");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function getAdminUserCommentsAction(userId: string) {
	const notes = await prisma.userAdminNote.findMany({
		where: { userId },
		include: { author: { select: { name: true } } },
		orderBy: { createdAt: "desc" },
	});
	return { success: true, data: notes };
}

export async function getUserAuditLogAction(userId: string) {
	try {
		await requireAdmin();
		const model = prisma.userAuditLog;
		if (!model) return { success: true, data: [], migrationPending: true };

		const logs = await model.findMany({
			where: { targetUserId: userId },
			orderBy: { createdAt: "desc" },
			take: 100,
		});

		return {
			success: true,
			data: logs.map((l) => ({
				id: l.id,
				action: l.action,
				fieldName: l.fieldName,
				valueBefore: l.valueBefore,
				valueAfter: l.valueAfter,
				authorName: l.authorName,
				createdAt: l.createdAt.toISOString(),
				meta: l.meta as Record<string, unknown> | null,
			})),
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

function generatePassword(length = 12): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!";
	return Array.from({ length }, () =>
		chars.charAt(Math.floor(Math.random() * chars.length))
	).join("");
}

export async function adminCreateUserAction(data: CreateUserPayload): Promise<{
	success: boolean;
	user?: object;
	generatedPassword?: string;
	error?: string;
}> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Нет прав доступа" };
		}

		// Проверяем уникальность email
		const existing = await prisma.user.findUnique({
			where: { email: data.email },
		});
		if (existing) {
			return {
				success: false,
				error: "Пользователь с таким email уже существует",
			};
		}

		// Определяем пароль
		let passwordHash: string | null = null;
		let generatedPassword: string | undefined;

		if (data.passwordMode === "auto") {
			generatedPassword = generatePassword();
			passwordHash = await bcrypt.hash(generatedPassword, 10);
		} else if (data.passwordMode === "manual" && data.manualPassword) {
			if (data.manualPassword.length < 8) {
				return {
					success: false,
					error: "Пароль должен содержать минимум 8 символов",
				};
			}
			passwordHash = await bcrypt.hash(data.manualPassword, 10);
		}
		// invite mode — пароль не задаём, логин через magic link (будущая фича)

		const user = await prisma.user.create({
			data: {
				name: data.name ?? null,
				email: data.email,
				phone: data.phone ?? null,
				role: data.role ?? "USER",
				password: passwordHash,
				// adminCreated: true — раскомментируй если добавишь это поле в схему
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				role: true,
				image: true,
				isBlocked: true,
				blockedReason: true,
				createdAt: true,
				permissions: true,
			},
		});

		// Если есть заметка — сохраняем
		if (data.note?.trim()) {
			await prisma.userAdminNote.create({
				data: {
					userId: user.id,
					authorId: session.user.id,
					note: data.note.trim(),
				},
			});
		}

		revalidatePath("/admin/users");

		return {
			success: true,
			generatedPassword: generatedPassword || "",
			user: {
				...user,
				avatarUrl: user.image ?? null,
				application: null,
			},
		};
	} catch (error: unknown) {
		console.error("adminCreateUserAction error:", error);
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка создания пользователя" };
	}
}
// ─── PAGINATION & EXPORT ──────────────────────────────────────────────────────

export type FetchUsersParams = {
	search?: string;
	appFilter?: string;
	blockFilter?: string;
	discountFilter?: string;
	regFrom?: string;
	regTo?: string;
	sortField?: "createdAt" | "name";
	sortDir?: "asc" | "desc";
	limit?: number;
	offset?: number;
};

// Вспомогательная функция для безопасного извлечения данных из JSON
function extractEnrichedUserData(
	overrides: Record<string, unknown> | null | undefined,
	baseUser: { name: string | null; phone: string | null }
) {
	if (!overrides)
		return { fullName: baseUser.name, phone: baseUser.phone, labels: [] };

	const getObj = (obj: unknown, key: string) =>
		typeof obj === "object" && obj !== null
			? (obj as Record<string, unknown>)[key]
			: undefined;

	const pd = getObj(overrides, "personalData");
	const contacts = getObj(overrides, "contacts");
	const addit = getObj(overrides, "additional");

	const ln = overrides.lastName ?? getObj(pd, "lastName");
	const fn = overrides.firstName ?? getObj(pd, "firstName");
	const mn = overrides.middleName ?? getObj(pd, "middleName");

	let fullName = baseUser.name;
	if (ln || fn || mn) {
		fullName = [ln, fn, mn]
			.filter((part) => typeof part === "string" && part.trim() !== "")
			.join(" ");
	}

	const ph = getObj(contacts, "phone") ?? getObj(pd, "phone");
	const phone = typeof ph === "string" ? ph : baseUser.phone;

	const labels = (getObj(addit, "labels") ?? overrides.labels ?? []) as {
		id: string;
		text: string;
		color: string;
		dueDate?: string;
	}[];

	return { fullName, phone, labels };
}

export async function getPaginatedUsersAction(params: FetchUsersParams) {
	try {
		await requireAdmin();

		const where: Prisma.UserWhereInput = {};

		// Фильтры
		if (params.search) {
			where.OR = [
				{ name: { contains: params.search } },
				{ email: { contains: params.search } },
				{ phone: { contains: params.search } },
			];
		}

		if (params.appFilter && params.appFilter !== "all") {
			if (params.appFilter === "none") {
				where.clientApplication = { is: null };
			} else {
				where.clientApplication = {
					status: params.appFilter as ApplicationStatus,
				};
			}
		}

		if (params.blockFilter && params.blockFilter !== "all") {
			where.isBlocked = params.blockFilter === "blocked";
		}

		if (params.discountFilter && params.discountFilter !== "all") {
			if (params.discountFilter === "has_discount") {
				where.userDiscounts = { some: { isActive: true } };
			} else {
				where.userDiscounts = { none: { isActive: true } };
			}
		}

		if (params.regFrom) {
			where.createdAt = {
				...(typeof where.createdAt === "object" && where.createdAt !== null
					? where.createdAt
					: {}),
				gte: new Date(params.regFrom),
			};
		}
		if (params.regTo) {
			where.createdAt = {
				...(typeof where.createdAt === "object" && where.createdAt !== null
					? where.createdAt
					: {}),
				lte: new Date(params.regTo),
			};
		}

		// Пагинация и сортировка
		const limit = params.limit ?? 25;
		const offset = params.offset ?? 0;
		const sortField = params.sortField ?? "createdAt";
		const sortDir = params.sortDir ?? "desc";

		const [users, totalCount] = await Promise.all([
			prisma.user.findMany({
				where,
				orderBy: { [sortField]: sortDir },
				take: limit,
				skip: offset,
				include: {
					clientApplication: {
						select: {
							id: true,
							userId: true,
							status: true,
							clientType: true,
							createdAt: true,
							updatedAt: true,
							rejectionReason: true,
							adminOverrides: true,
						},
					},
					userDiscounts: {
						where: { isActive: true },
						orderBy: { createdAt: "desc" },
						take: 1,
						select: { type: true, value: true, promoCode: true },
					},
				},
			}),
			prisma.user.count({ where }),
		]);

		// Обогащаем данные
		const enriched = users.map((u) => {
			const overrides = u.clientApplication?.adminOverrides as Record<
				string,
				unknown
			> | null;

			const { fullName, phone, labels } = extractEnrichedUserData(overrides, {
				name: u.name,
				phone: u.phone,
			});

			return {
				id: u.id,
				name: fullName,
				email: u.email,
				phone: phone,
				avatarUrl: u.image,
				role: u.role,
				entityType: u.entityType,
				companyName: u.companyName,
				tin: u.tin,
				createdAt: u.createdAt.toISOString(),
				isBlocked: u.isBlocked,
				blockedReason: u.blockedReason,
				permissions: (u.permissions ?? {}) as Record<string, boolean>,
				isVerified: u.isVerified,
				labels,
				discount: u.userDiscounts?.[0] ?? null,
				application: u.clientApplication
					? {
							id: u.clientApplication.id,
							userId: u.clientApplication.userId,
							status: u.clientApplication.status,
							clientType: u.clientApplication.clientType,
							createdAt: u.clientApplication.createdAt.toISOString(),
							updatedAt: u.clientApplication.updatedAt.toISOString(),
							rejectionReason: u.clientApplication.rejectionReason,
						}
					: null,
			};
		});

		return { success: true, data: enriched, count: totalCount };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function exportAdminUsersAction(ids?: string[]) {
	try {
		await requireAdmin();
		const users = await prisma.user.findMany({
			where: ids && ids.length > 0 ? { id: { in: ids } } : {},
			include: {
				clientApplication: { select: { status: true, adminOverrides: true } },
			},
		});

		return users.map((u) => {
			const overrides = u.clientApplication?.adminOverrides as Record<
				string,
				unknown
			> | null;
			const { fullName, phone } = extractEnrichedUserData(overrides, {
				name: u.name,
				phone: u.phone,
			});

			return {
				id: u.id,
				name: fullName ?? "",
				email: u.email ?? "",
				phone: phone ?? "",
				status: u.clientApplication?.status ?? "NO_APPLICATION",
				isBlocked: u.isBlocked ? "Да" : "Нет",
				createdAt: u.createdAt.toISOString(),
			};
		});
	} catch {
		throw new Error("Ошибка экспорта");
	}
}
