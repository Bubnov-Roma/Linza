"use server";
import { revalidatePath } from "next/cache";
import { createAdminNotification } from "@/actions/notification-actions";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type DbFaqItem = {
	id: string;
	question: string;
	answer: string;
	sortOrder: number;
	category: string | null;
	tags: string[];
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type DbFaqQuestion = {
	id: string;
	text: string;
	email: string | null;
	createdAt: Date;
	isRead: boolean;
};

export async function getFaqItemsAction(): Promise<DbFaqItem[]> {
	return prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createFaqItemAction(data: {
	question: string;
	answer: string;
	category?: string;
	tags?: string[];
}): Promise<{ success: boolean; item?: DbFaqItem; error?: string }> {
	const { userId } = await requireAdmin();

	try {
		const last = await prisma.faqItem.findFirst({
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		const created = await prisma.faqItem.create({
			data: {
				question: data.question.trim(),
				answer: data.answer.trim(),
				category: data.category?.trim() || null,
				tags: data.tags ?? [],
				sortOrder: (last?.sortOrder ?? 0) + 1,
				createdBy: userId,
			},
		});

		revalidatePath("/faq");
		revalidatePath("/admin");
		return { success: true, item: created };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function updateFaqItemAction(
	id: string,
	data: Partial<
		Pick<
			DbFaqItem,
			"question" | "answer" | "category" | "tags" | "isActive" | "sortOrder"
		>
	>
): Promise<{ success: boolean; error?: string }> {
	const { userId } = await requireAdmin();

	try {
		await prisma.faqItem.update({
			where: { id },
			data: { ...data, updatedBy: userId },
		});
		revalidatePath("/faq");
		revalidatePath("/admin");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function deleteFaqItemAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	await requireAdmin();

	try {
		await prisma.faqItem.delete({ where: { id } });
		revalidatePath("/faq");
		revalidatePath("/admin");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

export async function reorderFaqItemsAction(
	orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
	await requireAdmin();

	try {
		await prisma.$transaction(
			orderedIds.map((id, index) =>
				prisma.faqItem.update({ where: { id }, data: { sortOrder: index + 1 } })
			)
		);
		revalidatePath("/faq");
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

// ─── CLIENT FAQ QUESTION ──────────────────────────────────────────────────────

export async function submitFaqQuestionAction(data: {
	text: string;
	email?: string;
}): Promise<{ success: boolean; error?: string }> {
	if (!data.text.trim()) return { success: false, error: "Текст вопроса пуст" };

	try {
		await prisma.faqQuestion.create({
			data: {
				text: data.text.trim(),
				email: data.email?.trim() || null,
			},
		});

		await createAdminNotification({
			type: "faqQuestionSubmitted",
			entityType: "faqQuestion",
			payload: { preview: data.text.slice(0, 80) },
		});

		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}

// ─── ADMIN: READ FAQ QUESTIONS ────────────────────────────────────────────────

export async function getFaqQuestionsAction(): Promise<DbFaqQuestion[]> {
	await requireAdmin();
	return prisma.faqQuestion.findMany({ orderBy: { createdAt: "desc" } });
}

export async function markFaqQuestionReadAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	await requireAdmin();

	try {
		await prisma.faqQuestion.update({ where: { id }, data: { isRead: true } });
		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };
		return { success: false, error: "Неизвестная ошибка" };
	}
}
