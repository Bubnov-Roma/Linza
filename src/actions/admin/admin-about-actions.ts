"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export interface UpdateAboutInput {
	heroTitle: string;
	heroSub: string;
	description: string;
	imageUrl: string | null;
}

export async function getAboutSettings() {
	try {
		await requireAdmin();
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
		await requireAdmin();

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
