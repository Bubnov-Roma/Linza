"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { EMPTY_PERMISSIONS } from "@/constants";
import { prisma } from "@/lib/prisma";

// ─── Типы ─────────────────────────────────────────────────────────────────────

/**
 * Полный набор прав администратора.
 * Хранится в поле User.permissions (Json).
 * Применяется только к "назначенным" ADMIN (isAdminCreated: true).
 * Изначальные ADMIN (isAdminCreated: false) имеют все права неявно.
 */
export interface AdminPermissions {
	// Заказы — оборудование
	bookings_view: boolean;
	bookings_edit: boolean; // статус, цена, платежи
	bookings_delete: boolean;

	// Заказы — студия
	studio_view: boolean;
	studio_edit: boolean;
	studio_delete: boolean;

	// Клиенты
	users_view: boolean;
	users_edit: boolean; // профиль, блокировка
	users_balance: boolean; // работа с балансом

	// Оборудование и каталог
	equipment_view: boolean;
	equipment_edit: boolean;
	categories_edit: boolean;

	// Финансы
	finance_view: boolean; // суммы, статистика
	finance_export: boolean; // экспорт отчётов

	// Контент
	content_edit: boolean; // баннеры, FAQ

	// Настройки сайта
	settings_view: boolean;
	settings_edit: boolean; // настройки сайта (не права!)

	// Промокоды
	promo_edit: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export interface AdminListItem {
	id: string;
	name: string | null;
	email: string | null;
	isOriginal: boolean; // isAdminCreated === false — неприкосновенный
	permissions: AdminPermissions;
	createdAt: string;
}

/**
 * Требует, чтобы текущий пользователь был изначальным ADMIN.
 * Только они могут управлять правами других.
 */
async function requireOriginalAdmin() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Не авторизован");

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true, isAdminCreated: true, name: true },
	});

	if (!user || user.role !== "ADMIN" || user.isAdminCreated) {
		throw new Error(
			"Только изначальные администраторы могут управлять правами"
		);
	}

	return { actorId: session.user.id, actorName: user.name ?? "Администратор" };
}

function parsePermissions(raw: unknown): AdminPermissions {
	if (!raw || typeof raw !== "object") return { ...EMPTY_PERMISSIONS };
	return { ...EMPTY_PERMISSIONS, ...(raw as Partial<AdminPermissions>) };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** Получить список всех администраторов */
export async function getAdminsListAction(): Promise<{
	success: boolean;
	data?: AdminListItem[];
	error?: string;
}> {
	try {
		await requireOriginalAdmin();

		const admins = await prisma.user.findMany({
			where: { role: "ADMIN" },
			select: {
				id: true,
				name: true,
				email: true,
				isAdminCreated: true,
				permissions: true,
				createdAt: true,
			},
			orderBy: { createdAt: "asc" },
		});

		return {
			success: true,
			data: admins.map((a) => ({
				id: a.id,
				name: a.name,
				email: a.email,
				isOriginal: !a.isAdminCreated,
				permissions: parsePermissions(a.permissions),
				createdAt: a.createdAt.toISOString(),
			})),
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/**
 * Назначить пользователя администратором.
 * Пользователь должен существовать (по email или id).
 * Назначенный получает isAdminCreated: true.
 */
export async function grantAdminAction(
	userIdOrEmail: string,
	permissions: AdminPermissions
): Promise<{ success: boolean; error?: string }> {
	try {
		const { actorId, actorName } = await requireOriginalAdmin();

		const target = await prisma.user.findFirst({
			where: {
				OR: [{ id: userIdOrEmail }, { email: userIdOrEmail.toLowerCase() }],
			},
			select: {
				id: true,
				role: true,
				isAdminCreated: true,
				name: true,
				email: true,
			},
		});

		if (!target) return { success: false, error: "Пользователь не найден" };
		if (target.role === "ADMIN") {
			return {
				success: false,
				error: "Пользователь уже является администратором",
			};
		}

		await prisma.$transaction([
			prisma.user.update({
				where: { id: target.id },
				data: {
					role: "ADMIN",
					isAdminCreated: true,
					permissions: permissions as object,
				},
			}),
			prisma.userAuditLog.create({
				data: {
					targetUserId: target.id,
					authorId: actorId,
					authorName: actorName,
					action: "Назначен администратором",
					fieldName: "role",
					valueBefore: target.role,
					valueAfter: "ADMIN",
					meta: { permissions } as object,
				},
			}),
		]);

		revalidatePath("/admin/settings");
		revalidatePath("/admin/users");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/**
 * Снять права администратора с назначенного ADMIN.
 * Изначальных ADMIN (isAdminCreated: false) снять невозможно.
 */
export async function revokeAdminAction(
	targetUserId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const { actorId, actorName } = await requireOriginalAdmin();

		const target = await prisma.user.findUnique({
			where: { id: targetUserId },
			select: { role: true, isAdminCreated: true, name: true },
		});

		if (!target) return { success: false, error: "Пользователь не найден" };
		if (target.role !== "ADMIN") {
			return {
				success: false,
				error: "Пользователь не является администратором",
			};
		}
		if (!target.isAdminCreated) {
			return {
				success: false,
				error: "Нельзя снять права у изначального администратора",
			};
		}

		await prisma.$transaction([
			prisma.user.update({
				where: { id: targetUserId },
				data: {
					role: "USER",
					isAdminCreated: false,
					permissions: {},
				},
			}),
			prisma.userAuditLog.create({
				data: {
					targetUserId,
					authorId: actorId,
					authorName: actorName,
					action: "Права администратора сняты",
					fieldName: "role",
					valueBefore: "ADMIN",
					valueAfter: "USER",
				},
			}),
		]);

		revalidatePath("/admin/settings");
		revalidatePath("/admin/users");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/**
 * Обновить набор прав назначенного администратора.
 * На изначальных ADMIN не влияет (у них всё разрешено неявно).
 */
export async function updateAdminPermissionsAction(
	targetUserId: string,
	permissions: AdminPermissions
): Promise<{ success: boolean; error?: string }> {
	try {
		const { actorId, actorName } = await requireOriginalAdmin();

		const target = await prisma.user.findUnique({
			where: { id: targetUserId },
			select: { role: true, isAdminCreated: true, permissions: true },
		});

		if (!target) return { success: false, error: "Пользователь не найден" };
		if (target.role !== "ADMIN") {
			return {
				success: false,
				error: "Пользователь не является администратором",
			};
		}
		if (!target.isAdminCreated) {
			return {
				success: false,
				error: "Нельзя ограничивать права изначального администратора",
			};
		}

		await prisma.$transaction([
			prisma.user.update({
				where: { id: targetUserId },
				data: { permissions: permissions as object },
			}),
			prisma.userAuditLog.create({
				data: {
					targetUserId,
					authorId: actorId,
					authorName: actorName,
					action: "Права администратора обновлены",
					fieldName: "permissions",
					valueBefore: JSON.stringify(target.permissions),
					valueAfter: JSON.stringify(permissions),
				},
			}),
		]);

		revalidatePath("/admin/settings");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

/**
 * Найти пользователя по email (для формы назначения).
 * Возвращает только id, name, email, role — без чувствительных данных.
 */
export async function findUserByEmailAction(email: string): Promise<{
	success: boolean;
	user?: {
		id: string;
		name: string | null;
		email: string | null;
		role: string;
	};
	error?: string;
}> {
	try {
		await requireOriginalAdmin();

		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase().trim() },
			select: { id: true, name: true, email: true, role: true },
		});

		if (!user) return { success: false, error: "Пользователь не найден" };
		return { success: true, user };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}
