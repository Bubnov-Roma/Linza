"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createAdminNotification } from "@/actions/admin-notification-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type AllowedUserField = "nickname" | "email" | "phone" | "extraPhone";

export async function updateUserFieldAction(
	field: AllowedUserField,
	value: string | null
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		if (field === "email" && value) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(value) || value.length > 254) {
				return { success: false, error: "Некорректный email" };
			}
		}

		await prisma.user.update({
			where: { id: session.user.id },
			data: { [field]: value },
		});

		revalidatePath("/dashboard/profile");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка обновления профиля" };
	}
}

export async function updateUserAvatarAction(
	url: string | null
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		await prisma.user.update({
			where: { id: session.user.id },
			data: { image: url },
		});

		revalidatePath("/dashboard/profile");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка обновления аватара" };
	}
}

export async function scheduleAccountDeletionAction(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const deletionDate = new Date();
		deletionDate.setDate(deletionDate.getDate() + 7);

		await prisma.user.update({
			where: { id: session.user.id },
			data: { deletionScheduledAt: deletionDate },
		});

		await createAdminNotification({
			type: "userDeletionRequested",
			userId: session.user.id,
			entityType: "user",
			payload: { scheduledAt: deletionDate.toISOString() },
		});

		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка удаления аккаунта" };
	}
}

export async function updateClientSocialsAction(
	socials: { url: string }[]
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const app = await prisma.clientApplication.findUnique({
			where: { userId: session.user.id },
			select: { applicationData: true },
		});

		if (!app) return { success: false, error: "Анкета не найдена" };

		const currentData = (app.applicationData as Record<string, unknown>) || {};
		const currentAppData =
			(currentData.applicationData as Record<string, unknown>) || {};
		const currentContacts =
			(currentAppData.contacts as Record<string, unknown>) || {};

		const updatedData = {
			...currentData,
			applicationData: {
				...currentAppData,
				contacts: {
					...currentContacts,
					socials,
				},
			},
		};

		await prisma.clientApplication.update({
			where: { userId: session.user.id },
			data: { applicationData: updatedData },
		});

		revalidatePath("/dashboard/profile");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка сохранения соцсетей" };
	}
}

/**
 * Обновляет пароль пользователя.
 *
 * field === "password"           → просто хэшируем и сохраняем (первичная установка)
 * field === "verifyAndChange"    → value = "oldPass|||newPass", сначала проверяем старый
 */
export async function updateUserPasswordAction(
	field: "password" | "verifyAndChange",
	value: string
): Promise<{ success: boolean; error?: string }> {
	const session = await auth();
	if (!session?.user?.id) return { success: false, error: "Not authorized" };

	try {
		if (field === "password") {
			// Первичная установка пароля (через invite или из профиля впервые)
			if (value.length < 8) {
				return { success: false, error: "Минимум 8 символов" };
			}
			const hashedPassword = await bcrypt.hash(value, 10);
			await prisma.user.update({
				where: { id: session.user.id },
				data: { password: hashedPassword },
			});
			return { success: true };
		}

		if (field === "verifyAndChange") {
			// Смена пароля: проверяем текущий перед сохранением нового
			const [currentPass, newPass] = value.split("|||");

			if (!currentPass || !newPass) {
				return { success: false, error: "Некорректные данные" };
			}
			if (newPass.length < 8) {
				return { success: false, error: "Минимум 8 символов" };
			}

			const user = await prisma.user.findUnique({
				where: { id: session.user.id },
				select: { password: true },
			});

			if (!user?.password) {
				return { success: false, error: "Пароль не установлен" };
			}

			const isValid = await bcrypt.compare(currentPass, user.password);
			if (!isValid) {
				return { success: false, error: "Неверный текущий пароль" };
			}

			const hashedPassword = await bcrypt.hash(newPass, 10);
			await prisma.user.update({
				where: { id: session.user.id },
				data: { password: hashedPassword },
			});
			return { success: true };
		}

		return { success: false, error: "Неизвестный тип операции" };
	} catch (error) {
		console.error("Update password error:", error);
		return { success: false, error: "Ошибка при обновлении пароля" };
	}
}
