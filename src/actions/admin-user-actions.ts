"use server";

import type { ApplicationStatus, DiscountType, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { fmtRub } from "@/lib/utils";
import {
	cleanUndefined,
	extractEnrichedUserData,
	getSearchVariations,
} from "@/utils";

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface CreateUserPayload {
	name?: string;
	email?: string;
	phone?: string;
	role?: "USER" | "MANAGER" | "PARTNER";
	passwordMode: "auto" | "manual" | "invite";
	manualPassword?: string;
	note?: string;
}

// Дубли, которые нашлись при проверке перед созданием
export interface DuplicateCandidate {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
	createdAt: string;
	isAdminCreated: boolean;
	matchedBy: ("email" | "phone" | "name")[];
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
		if (!appData.passport || Object.keys(appData.passport).length === 0) {
			appData.passport = appData.personalData.passport || {};
		}

		const p = appData.passport;

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

// ─── Поиск дублей (вызывается до создания, данные идут на фронт) ─────────────

export async function adminFindDuplicatesAction(params: {
	email?: string;
	phone?: string;
	name?: string;
}): Promise<{ success: boolean; data?: DuplicateCandidate[]; error?: string }> {
	try {
		await requireAdmin();

		const { email, phone, name } = params;

		// Нет ни одного поля — дублей быть не может
		if (!email && !phone && !name) {
			return { success: true, data: [] };
		}

		const conditions: Prisma.UserWhereInput[] = [];

		if (email?.trim()) {
			conditions.push({
				email: { equals: email.trim() },
			});
		}
		if (phone?.trim()) {
			// Нормализуем: оставляем только цифры для сравнения
			const digitsOnly = phone.replace(/\D/g, "");
			if (digitsOnly.length >= 7) {
				// Ищем по оригинальному значению и по digits — MySQL не поддерживает regex,
				// поэтому ищем contains с частью номера (последние 7 цифр)
				const tail = digitsOnly.slice(-7);
				conditions.push({ phone: { contains: tail } });
			}
		}
		if (name?.trim()) {
			// Ищем по первому слову (фамилия или имя)
			const firstWord = name.trim().split(/\s+/)[0];
			if (firstWord && firstWord.length >= 2) {
				conditions.push({
					name: { contains: firstWord },
				});
			}
		}

		if (conditions.length === 0) return { success: true, data: [] };

		const users = await prisma.user.findMany({
			where: {
				OR: conditions,
				// Не показываем пользователей помеченных к удалению
				deletionScheduledAt: null,
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				createdAt: true,
				isAdminCreated: true,
			},
			take: 10,
		});

		// Аннотируем — по какому полю совпало
		const candidates: DuplicateCandidate[] = users.map((u) => {
			const matchedBy: DuplicateCandidate["matchedBy"] = [];
			if (email && u.email?.toLowerCase() === email.toLowerCase())
				matchedBy.push("email");
			if (phone && u.phone) {
				const uDigits = u.phone.replace(/\D/g, "").slice(-7);
				const qDigits = phone.replace(/\D/g, "").slice(-7);
				if (uDigits === qDigits) matchedBy.push("phone");
			}

			if (name) {
				const searchFirstWord = name.trim().split(/\s+/)[0] ?? "";
				const normalizedName = u.name?.toLowerCase();
				if (
					searchFirstWord &&
					normalizedName?.includes(searchFirstWord.toLowerCase())
				) {
					matchedBy.push("name");
				}
			}

			return {
				id: u.id,
				name: u.name,
				email: u.email,
				phone: u.phone,
				createdAt: u.createdAt.toISOString(),
				isAdminCreated: u.isAdminCreated ?? false,
				matchedBy,
			};
		});

		return { success: true, data: candidates };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка поиска",
		};
	}
}

// ─── Создание пользователя администратором ────────────────────────────────────

function generatePassword(length = 12): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!";
	return Array.from({ length }, () =>
		chars.charAt(Math.floor(Math.random() * chars.length))
	).join("");
}

export async function adminCreateUserAction(
	data: CreateUserPayload,
	opts?: { force?: boolean } // force=true — создать даже если найдены дубли
): Promise<{
	success: boolean;
	user?: object;
	generatedPassword?: string;
	inviteUrl?: string;
	duplicates?: DuplicateCandidate[]; // возвращаем если нашли и force не передан
	error?: string;
}> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Нет прав доступа" };
		}

		// Хотя бы одно поле идентификации обязательно
		const hasIdentifier =
			data.email?.trim() || data.phone?.trim() || data.name?.trim();
		if (!hasIdentifier) {
			return {
				success: false,
				error: "Укажите хотя бы один из: email, телефон, имя",
			};
		}

		// ── Дедупликация ──────────────────────────────────────────────────────
		if (!opts?.force) {
			const dupResult = await adminFindDuplicatesAction(
				cleanUndefined({
					email: data.email,
					phone: data.phone,
					name: data.name,
				})
			);

			if (dupResult.success && dupResult.data && dupResult.data.length > 0) {
				return {
					success: false,
					error: "duplicate_found",
					duplicates: dupResult.data,
				};
			}
		}

		// ── Проверка уникальности email (если указан) ─────────────────────────
		if (data.email?.trim()) {
			const existing = await prisma.user.findUnique({
				where: { email: data.email.trim() },
			});
			if (existing) {
				return {
					success: false,
					error: "Пользователь с таким email уже существует",
				};
			}
		}

		// ── Пароль ────────────────────────────────────────────────────────────
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
		// invite — пароль не задаём, доступ через InviteToken

		// ── Создание пользователя ─────────────────────────────────────────────
		const user = await prisma.user.create({
			data: {
				name: data.name?.trim() || null,
				// Если email не указан — оставляем null (поле nullable в схеме)
				email: data.email?.trim() || null,
				phone: data.phone?.trim() || null,
				role: data.role ?? "USER",
				password: passwordHash,
				isAdminCreated: true,
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
				isAdminCreated: true,
			},
		});

		// ── Внутренняя заметка ────────────────────────────────────────────────
		if (data.note?.trim()) {
			await prisma.userAdminNote.create({
				data: {
					userId: user.id,
					authorId: session.user.id,
					note: data.note.trim(),
				},
			});
		}

		// ── Invite-токен ──────────────────────────────────────────────────────
		let inviteUrl: string | undefined;

		if (data.passwordMode === "invite") {
			const token = await prisma.inviteToken.create({
				data: {
					userId: user.id,
					expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 дней
				},
			});
			inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite?token=${token.token}`;
		}

		// ── Аудит ─────────────────────────────────────────────────────────────
		await writeUserAuditLog(
			user.id,
			session.user.id,
			session.user.name ?? null,
			{
				action: "Создан администратором",
				meta: {
					passwordMode: data.passwordMode,
					hasEmail: !!data.email,
					hasPhone: !!data.phone,
				},
			}
		);

		revalidatePath("/admin/users");

		return {
			success: true,
			generatedPassword: generatedPassword || "",
			...(inviteUrl && { inviteUrl }),
			user: {
				...user,
				avatarUrl: user.image ?? null,
				application: null,
				isAdminCreated: true,
			},
		};
	} catch (error: unknown) {
		console.error("adminCreateUserAction error:", error);
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка создания пользователя" };
	}
}

// ─── Merge двух профилей ──────────────────────────────────────────────────────

export async function adminMergeUsersAction(
	keepId: string, // основной профиль — остаётся
	deleteId: string // дубль — soft-delete через 2 дня
): Promise<{ success: boolean; error?: string }> {
	try {
		const { adminId, adminName } = await requireAdmin();

		if (keepId === deleteId) {
			return { success: false, error: "Нельзя объединить профиль с собой" };
		}

		const [keepUser, deleteUser] = await Promise.all([
			prisma.user.findUnique({ where: { id: keepId } }),
			prisma.user.findUnique({ where: { id: deleteId } }),
		]);

		if (!keepUser || !deleteUser) {
			return { success: false, error: "Один из профилей не найден" };
		}

		// Переносим все связанные сущности с deleteId на keepId
		await prisma.$transaction([
			// Брони
			prisma.booking.updateMany({
				where: { userId: deleteId },
				data: { userId: keepId },
			}),
			// Корзина — удаляем дубли по equipment если совпадает
			prisma.cartItem.deleteMany({
				where: {
					userId: deleteId,
					equipmentId: {
						in: (
							await prisma.cartItem.findMany({
								where: { userId: keepId },
								select: { equipmentId: true },
							})
						).map((i) => i.equipmentId),
					},
				},
			}),
			prisma.cartItem.updateMany({
				where: { userId: deleteId },
				data: { userId: keepId },
			}),
			// Избранное
			prisma.favorite.deleteMany({
				where: {
					userId: deleteId,
					equipmentId: {
						in: (
							await prisma.favorite.findMany({
								where: { userId: keepId },
								select: { equipmentId: true },
							})
						).map((f) => f.equipmentId),
					},
				},
			}),
			prisma.favorite.updateMany({
				where: { userId: deleteId },
				data: { userId: keepId },
			}),
			// Скидки — переносим только если у keepId нет активных
			prisma.userDiscount.updateMany({
				where: { userId: deleteId },
				data: { userId: keepId },
			}),
			// Заметки и комментарии
			prisma.userAdminNote.updateMany({
				where: { userId: deleteId },
				data: { userId: deleteId }, // оставляем как архив, помечаем ниже
			}),
		]);

		// Переносим анкету — если у keepId нет своей, берём от deleteId
		const keepApp = await prisma.clientApplication.findUnique({
			where: { userId: keepId },
		});
		if (!keepApp) {
			const deleteApp = await prisma.clientApplication.findUnique({
				where: { userId: deleteId },
			});
			if (deleteApp) {
				// Переносим анкету: меняем userId
				await prisma.clientApplication.update({
					where: { id: deleteApp.id },
					data: { userId: keepId },
				});
			}
		}

		// Email: если у keepId нет email, но у deleteId есть — переносим
		if (!keepUser.email && deleteUser.email) {
			await prisma.user.update({
				where: { id: keepId },
				data: { email: deleteUser.email },
			});
		}

		// Помечаем дубль к мягкому удалению через 2 дня
		const scheduledAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
		await prisma.user.update({
			where: { id: deleteId },
			data: {
				mergedIntoId: keepId,
				deletionScheduledAt: scheduledAt,
			},
		});

		// Аудит на обоих профилях
		await writeUserAuditLog(keepId, adminId, adminName, {
			action: "Профили объединены",
			meta: { mergedFromId: deleteId, mergedFromEmail: deleteUser.email },
		});
		await writeUserAuditLog(deleteId, adminId, adminName, {
			action: "Профиль помечен как дубль",
			meta: { mergedIntoId: keepId, scheduledDeletion: scheduledAt },
		});

		revalidatePath("/admin/users");
		return { success: true };
	} catch (e) {
		console.error("adminMergeUsersAction error:", e);
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ─── Отмена merge (до истечения 2 дней) ──────────────────────────────────────

export async function adminCancelMergeAction(
	userId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { adminId, adminName } = await requireAdmin();

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { mergedIntoId: true, deletionScheduledAt: true },
		});

		if (!user?.deletionScheduledAt) {
			return { success: false, error: "Профиль не помечен к удалению" };
		}

		await prisma.user.update({
			where: { id: userId },
			data: {
				mergedIntoId: null,
				deletionScheduledAt: null,
			},
		});

		await writeUserAuditLog(userId, adminId, adminName, {
			action: "Объединение отменено",
			meta: { cancelledMergeInto: user.mergedIntoId },
		});

		revalidatePath("/admin/users");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ─── Генерация ссылки-приглашения для уже существующего пользователя ─────────

export async function adminCreateInviteTokenAction(
	userId: string
): Promise<{ success: boolean; inviteUrl?: string; error?: string }> {
	try {
		await requireAdmin();

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true },
		});
		if (!user) return { success: false, error: "Пользователь не найден" };

		// Инвалидируем предыдущие неиспользованные токены
		await prisma.inviteToken.updateMany({
			where: { userId, usedAt: null },
			data: { expiresAt: new Date() }, // мгновенно истекают
		});

		const token = await prisma.inviteToken.create({
			data: {
				userId,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});

		const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite?token=${token.token}`;

		return { success: true, inviteUrl };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ─── Использование инвайт-токена (вызывается в /auth/invite route handler) ───

export async function consumeInviteTokenAction(token: string): Promise<{
	success: boolean;
	userId?: string;
	error?: string;
}> {
	try {
		const inviteToken = await prisma.inviteToken.findUnique({
			where: { token },
			include: { user: { select: { id: true, isBlocked: true } } },
		});

		if (!inviteToken)
			return { success: false, error: "Ссылка недействительна" };
		if (inviteToken.usedAt)
			return { success: false, error: "Ссылка уже использована" };
		if (inviteToken.expiresAt < new Date())
			return { success: false, error: "Срок действия ссылки истёк" };
		if (inviteToken.user.isBlocked)
			return { success: false, error: "Аккаунт заблокирован" };

		// Помечаем токен использованным
		await prisma.inviteToken.update({
			where: { token },
			data: { usedAt: new Date() },
		});

		return { success: true, userId: inviteToken.userId };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ─── Остальные экшены (без изменений) ────────────────────────────────────────

export async function adminGetUserApplicationAction(userId: string): Promise<{
	success: boolean;
	data?: ApplicationDataFull;
	clientData?: ApplicationDataFull;
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

		const decryptedClient = decryptClientData(
			(clientRaw || {}) as DbClientJson
		);
		const clientDataFlat = mapClientDataToFlat(decryptedClient);

		const hasOverrides = overridesRaw && Object.keys(overridesRaw).length > 0;
		const activeAdminRaw = hasOverrides ? overridesRaw : clientRaw;

		const decryptedAdmin = decryptClientData(
			(activeAdminRaw || {}) as DbClientJson
		);
		const adminDataFlat = mapClientDataToFlat(decryptedAdmin);

		return {
			success: true,
			data: adminDataFlat,
			clientData: clientDataFlat,
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
		const currentFlatData = mapClientDataToFlat(currentOverridesDecrypted);
		const flatPatch = flattenPatch(patch as Record<string, unknown>);

		const updated = applyPatchToClientData(currentOverridesDecrypted, patch);
		const encrypted = encryptInClientData(updated);

		await prisma.clientApplication.update({
			where: { id: app.id },
			data: { adminOverrides: encrypted as Prisma.JsonObject },
		});

		const sensitiveKeys = new Set([
			"seriesAndNumber",
			"series",
			"number",
			"issuedBy",
			"inn",
			"snils",
		]);

		const getVal = (obj: Record<string, unknown>, path: string): unknown => {
			return path
				.split(".")
				.reduce(
					(acc, k) =>
						acc && typeof acc === "object"
							? (acc as Record<string, unknown>)[k]
							: undefined,
					obj as unknown
				);
		};

		for (const [fieldPath, valAfter] of Object.entries(flatPatch)) {
			const isSensitive = sensitiveKeys.has(fieldPath.split(".").pop() || "");
			const valBeforeRaw = getVal(
				currentFlatData as unknown as Record<string, unknown>,
				fieldPath
			);

			let actionLabel = "Редактирование поля";
			let displayBefore = isSensitive ? "*** скрыто ***" : valBeforeRaw;
			let displayAfter = isSensitive ? "*** обновлено (скрыто) ***" : valAfter;

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
			} else if (
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
			} else {
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

		// Синхронизируем базовые поля User, чтобы поиск по таблице работал корректно
		const userUpdateData: Prisma.UserUpdateInput = {};

		if (
			patch.firstName !== undefined ||
			patch.lastName !== undefined ||
			patch.middleName !== undefined
		) {
			const appData = updated.applicationData?.personalData || {};
			const newFullName = [
				appData.lastName,
				appData.firstName,
				appData.middleName,
			]
				.filter(Boolean)
				.join(" ");

			if (newFullName) userUpdateData.name = newFullName;
		}

		if (patch.contacts?.phone !== undefined) {
			userUpdateData.phone = patch.contacts.phone;
		}

		if (Object.keys(userUpdateData).length > 0) {
			await prisma.user.update({
				where: { id: userId },
				data: userUpdateData,
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
		if (data.type === "FIXED") valAfter = `${fmtRub(data.value)}`;
		if (data.type === "PROMO") {
			actionText = "Добавлен промокод";
			valAfter = `${data.promoCode} (-${fmtRub(data.value)})`;
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

export async function getPaginatedUsersAction(params: FetchUsersParams) {
	try {
		await requireAdmin();

		const where: Prisma.UserWhereInput = {
			// Скрываем профили помеченные к удалению (дубли после merge)
			deletionScheduledAt: null,
		};

		if (params.search) {
			const searchTerm = params.search.trim();
			const variations = getSearchVariations(searchTerm);
			const searchWords = searchTerm.split(/\s+/).filter(Boolean);
			const phoneDigits = searchTerm.replace(/\D/g, "");

			const orConditions: Prisma.UserWhereInput[] = [];

			// 1. Ищем по всем вариациям раскладки (email, nickname, точное совпадение name)
			variations.forEach((v) => {
				orConditions.push(
					{ email: { contains: v, mode: "insensitive" } },
					{ nickname: { contains: v, mode: "insensitive" } },
					{ name: { contains: v, mode: "insensitive" } }
				);
			});

			// 2. Умный поиск по частям ФИО (ищем только оригинальный запрос без транслитерации,
			// чтобы не перегружать БД сложными AND-условиями для каждой раскладки)
			if (searchWords.length > 0) {
				orConditions.push({
					AND: searchWords.map((word) => ({
						name: { contains: word, mode: "insensitive" },
					})),
				});
			}

			// 3. Поиск по телефону
			if (phoneDigits.length > 0) {
				orConditions.push(
					{ phone: { contains: phoneDigits } },
					{ extraPhone: { contains: phoneDigits } },
					{ phone: { contains: searchTerm } }
				);
			}

			where.OR = orConditions;
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
							applicationData: true,
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

		const enriched = users.map((u) => {
			const appData = u.clientApplication?.applicationData as Record<
				string,
				unknown
			> | null;
			const overrides = u.clientApplication?.adminOverrides as Record<
				string,
				unknown
			> | null;

			const hasOverrides = overrides && Object.keys(overrides).length > 0;
			const activeData = hasOverrides ? overrides : appData;

			const { fullName, phone, labels } = extractEnrichedUserData(activeData, {
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
				isAdminCreated: u.isAdminCreated ?? false,
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
			where: {
				...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
				deletionScheduledAt: null,
			},
			include: {
				clientApplication: {
					select: { status: true, adminOverrides: true, applicationData: true },
				},
			},
		});

		return users.map((u) => {
			const appData = u.clientApplication?.applicationData as Record<
				string,
				unknown
			> | null;
			const overrides = u.clientApplication?.adminOverrides as Record<
				string,
				unknown
			> | null;

			const hasOverrides = overrides && Object.keys(overrides).length > 0;
			const activeData = hasOverrides ? overrides : appData;

			const { fullName, phone, labels } = extractEnrichedUserData(activeData, {
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
				isAdminCreated: u.isAdminCreated ? "Да" : "Нет",
				createdAt: u.createdAt.toISOString(),
				labels: labels,
			};
		});
	} catch {
		throw new Error("Ошибка экспорта");
	}
}
