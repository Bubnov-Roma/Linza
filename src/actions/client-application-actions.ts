"use server";

import {
	ApplicationStatus,
	DiscountType,
	type Prisma,
	type Role,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
	type ClientFormValues,
	clientFormSchema,
	individualClientSchema,
} from "@/schemas";
import type { AllowedUpdateField } from "@/types";

type ActionResponse = {
	success: boolean;
	message?: string;
	errors?: Record<string, string[]>;
};

export async function submitClientApplicationAction(
	data: ClientFormValues
): Promise<ActionResponse> {
	const result = clientFormSchema.safeParse(data);

	if (!result.success) {
		const formattedErrors = result.error.issues.reduce(
			(acc, issue) => {
				const path = issue.path.join(".");
				acc[path] = [issue.message];
				return acc;
			},
			{} as Record<string, string[]>
		);

		return {
			success: false,
			message: "Ошибка валидации данных",
			errors: formattedErrors,
		};
	}

	try {
		const session = await auth();
		if (!session?.user?.id)
			return { success: false, message: "Не авторизован" };

		const personalData = data.applicationData.personalData;
		const fullName = personalData.name;
		const phone = personalData.phone;

		await prisma.user.upsert({
			where: { id: session.user.id },
			update: {
				name: (fullName || session.user.name) ?? "",
				phone: (phone || session.user.phone) ?? "",
			},
			create: {
				id: session.user.id,
				email: session.user.email ?? null,
				name: (fullName || session.user.name) ?? null,
				phone: phone || null,
			},
		});

		await prisma.clientApplication.upsert({
			where: { userId: session.user.id },
			update: {
				clientType: data.clientType,
				applicationData: data as unknown as Prisma.InputJsonValue,
				adminOverrides: data as unknown as Prisma.InputJsonValue,
				status: ApplicationStatus.PENDING,
			},
			create: {
				userId: session.user.id,
				clientType: data.clientType,
				applicationData: data as unknown as Prisma.InputJsonValue,
				adminOverrides: data as unknown as Prisma.InputJsonValue,
				status: ApplicationStatus.PENDING,
			},
		});

		revalidatePath("/dashboard/profile");
		return { success: true, message: "Анкета успешно отправлена ✔️" };
	} catch (error: unknown) {
		console.error(error);
		return { success: false, message: "Ошибка сохранения в БД" };
	}
}

export async function updateApplicationDataAction(payload: {
	field: AllowedUpdateField;
	value: unknown;
}): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		const row = await prisma.clientApplication.findUnique({
			where: { userId: session.user.id },
			select: { applicationData: true, status: true },
		});

		if (!row) return { success: false, error: "Анкета не найдена" };

		const allowedStatuses = [
			ApplicationStatus.APPROVED,
			ApplicationStatus.STANDARD,
			ApplicationStatus.REVIEWING,
			ApplicationStatus.CLARIFICATION,
			ApplicationStatus.PENDING,
			ApplicationStatus.REJECTED,
			ApplicationStatus.LOADING,
			ApplicationStatus.BLOCKED,
			ApplicationStatus.DRAFT,
			ApplicationStatus.NO_APPLICATION,
		];

		if (!allowedStatuses.includes(row.status)) {
			return {
				success: false,
				error: "Статус анкеты не позволяет вносить изменения",
			};
		}

		const current = (row.applicationData as Record<string, unknown>) || {};
		const updated = deepSet(current, payload.field, payload.value);

		const updateSchema = individualClientSchema.extend({
			agreements: z
				.object({
					comment: z.string().optional(),
					newsletter: z.boolean().optional(),
					personalDataConsent: z.boolean().optional(),
				})
				.optional(),
		});
		const parsed = updateSchema.safeParse(updated);
		if (!parsed.success) {
			return {
				success: false,
				error: parsed.error.issues[0]?.message ?? "Ошибка валидации",
			};
		}

		await prisma.$transaction([
			prisma.clientApplication.update({
				where: { userId: session.user.id },
				data: {
					applicationData: parsed.data as unknown as Prisma.InputJsonValue,
				},
			}),
			prisma.adminNotification.create({
				data: {
					type: "application_dataUpdated",
					userId: session.user.id,
					payload: { field: payload.field } as Prisma.InputJsonValue,
				},
			}),
		]);

		revalidatePath("/dashboard/profile");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка обновления" };
	}
}

function deepSet(
	obj: Record<string, unknown>,
	path: string,
	value: unknown
): Record<string, unknown> {
	const keys = path.split(".");
	const [head, ...rest] = keys;
	if (!head) return obj;
	if (rest.length === 0) return { ...obj, [head]: value };
	return {
		...obj,
		[head]: deepSet(
			(obj[head] as Record<string, unknown>) ?? {},
			rest.join("."),
			value
		),
	};
}

export async function saveDraftAction(
	data: Partial<ClientFormValues>
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { success: false, error: "Не авторизован" };

		await prisma.user.upsert({
			where: { id: session.user.id },
			update: {},
			create: { id: session.user.id, email: session.user.email ?? null },
		});

		const existing = await prisma.clientApplication.findUnique({
			where: { userId: session.user.id },
		});

		const draftOnlyStatuses: ApplicationStatus[] = [
			ApplicationStatus.DRAFT,
			ApplicationStatus.NO_APPLICATION,
		];

		if (existing && !draftOnlyStatuses.includes(existing.status)) {
			return { success: true };
		} else {
			await prisma.clientApplication.upsert({
				where: { userId: session.user.id },
				update: {
					clientType: data.clientType ?? "individual",
					applicationData: data as Prisma.InputJsonValue,
					status: ApplicationStatus.DRAFT,
				},
				create: {
					userId: session.user.id,
					clientType: data.clientType ?? "individual",
					applicationData: data as Prisma.InputJsonValue,
					status: ApplicationStatus.DRAFT,
				},
			});
		}

		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Server error" };
	}
}

export async function loadDraftAction(): Promise<{
	data: Partial<ClientFormValues> | null;
	status: ApplicationStatus | null;
}> {
	try {
		const session = await auth();
		if (!session?.user?.id) return { data: null, status: null };

		const app = await prisma.clientApplication.findUnique({
			where: { userId: session.user.id },
			select: { applicationData: true, status: true },
		});

		if (!app) return { data: null, status: null };

		return {
			data: app.applicationData as Partial<ClientFormValues>,
			status: app.status,
		};
	} catch {
		return { data: null, status: null };
	}
}

// ─── User admin actions ───────────────────────────────────────────────────────

export async function updateUserRoleAction(
	userId: string,
	role: Role,
	permissions?: Record<string, boolean>
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();

		// 1. Проверка прав (только ADMIN)
		if (session?.user?.role !== "ADMIN") {
			return {
				success: false,
				error: "Только администратор может изменять роли",
			};
		}

		// 2. Защита от потери доступа (админ не может понизить сам себя)
		if (session.user.id === userId) {
			return {
				success: false,
				error: "Вы не можете изменить роль самому себе",
			};
		}

		await prisma.user.update({
			where: { id: userId },
			data: {
				role,
				...(permissions !== undefined && {
					permissions: permissions as Prisma.InputJsonValue,
				}),
			},
		});

		revalidatePath("/admin/users");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка обновления" };
	}
}

export async function toggleUserBlockAction(
	userId: string,
	isBlocked: boolean,
	reason?: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await prisma.user.update({
			where: { id: userId },
			data: {
				isBlocked,
				blockedReason: isBlocked ? (reason ?? null) : null,
			},
		});
		revalidatePath("/admin/users");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка блокировки" };
	}
}

export async function addUserAdminNoteAction(
	userId: string,
	note: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		await prisma.userAdminNote.create({
			data: {
				userId,
				authorId: session?.user?.id ?? null,
				note: note.trim(),
			},
		});
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка сохранения" };
	}
}

export async function getUserAdminNotesAction(userId: string) {
	const notes = await prisma.userAdminNote.findMany({
		where: { userId },
		include: { author: { select: { name: true } } },
		orderBy: { createdAt: "desc" },
	});
	return notes;
}

export async function updateApplicationStatusAction(
	applicationId: string,
	status: string,
	rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Нет прав доступа" };
		}

		await prisma.clientApplication.update({
			where: { id: applicationId },
			data: {
				status: status as ApplicationStatus,
				rejectionReason: status === "REJECTED" ? rejectionReason || null : null,
			},
		});

		revalidatePath("/admin/users");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка обновления статуса" };
	}
}

export async function createUserDiscountAction(data: {
	userId: string;
	type: "percent" | "fixed" | "promo";
	value: number;
	promoCode?: string;
	description?: string;
}): Promise<{ success: boolean; error?: string }> {
	try {
		const session = await auth();
		if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
			return { success: false, error: "Нет прав" };
		}

		const typeMap: Record<string, DiscountType> = {
			percent: DiscountType.PERCENT,
			fixed: DiscountType.FIXED,
			promo: DiscountType.PROMO,
		};

		const discountType = typeMap[data.type];
		if (!discountType) {
			return { success: false, error: "Некорректный тип скидки" };
		}

		await prisma.userDiscount.create({
			data: {
				userId: data.userId,
				type: discountType,
				value: data.value,
				promoCode: data.type === "promo" ? (data.promoCode ?? null) : null,
				description: data.description ?? null,
				createdBy: session.user.id,
			},
		});

		revalidatePath("/admin/users");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Ошибка при добавлении скидки" };
	}
}
