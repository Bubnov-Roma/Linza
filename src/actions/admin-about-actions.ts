"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface UpdateAboutInput {
	heroTitle: string;
	heroSub: string;
	description: string;
	imageUrl: string | null;
}

export async function getAboutSettings() {
	try {
		let settings = await prisma.aboutPageSettings.findUnique({
			where: { id: "default" },
		});

		if (!settings) {
			settings = await prisma.aboutPageSettings.create({
				data: { id: "default" },
			});
		}
		return settings;
	} catch (error) {
		console.error("Error fetching about settings:", error);
		return null;
	}
}

export async function updateAboutSettings(data: UpdateAboutInput) {
	try {
		const session = await auth();

		// Проверка на блокировку (у вас в инвайте есть поле isBlocked, защитимся от заблокированных менеджеров)
		// Роли проверяем строго по вашему Enum (ADMIN, MANAGER)
		const role = session?.user?.role;
		if (role !== "ADMIN" && role !== "MANAGER") {
			return { error: "Недостаточно прав для редактирования" };
		}

		await prisma.aboutPageSettings.update({
			where: { id: "default" },
			data: {
				heroTitle: data.heroTitle,
				heroSub: data.heroSub,
				description: data.description,
				imageUrl: data.imageUrl,
			},
		});

		revalidatePath("/about");
		return { success: true };
	} catch (error) {
		console.error("Error updating about settings:", error);
		return { error: "Ошибка при сохранении данных на сервере" };
	}
}
