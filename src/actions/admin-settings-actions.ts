"use server";

import type { PrismaPromise } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
	SUPPORT_ADDRESS_DEFAULT,
	SUPPORT_PHONE_DEFAULT,
	SUPPORT_TELEGRAM_DEFAULT,
	type SupportInfo,
} from "@/constants";

import { prisma } from "@/lib/prisma";
import { WORK_END, WORK_START } from "@/lib/utils";

export interface SiteSettingsInfo {
	phone: string;
	telegram: string;
	address: string;
	workStart: number;
	workEnd: number;
	disabledDates: string[];
}

export async function getSiteSettings(): Promise<SiteSettingsInfo> {
	const data = await prisma.siteSetting.findMany({
		where: {
			key: {
				in: [
					"supportPhone",
					"supportTelegram",
					"supportAddress",
					"workStart",
					"workEnd",
					"disabledDates",
				],
			},
		},
		select: { key: true, value: true },
	});

	const map = Object.fromEntries(data.map((r) => [r.key, r.value]));

	let parsedDates: string[] = [];
	try {
		parsedDates = map.disabledDates ? JSON.parse(map.disabledDates) : [];
	} catch {
		parsedDates = [];
	}

	return {
		phone: map.supportPhone ?? SUPPORT_PHONE_DEFAULT,
		telegram: map.supportTelegram ?? SUPPORT_TELEGRAM_DEFAULT,
		address: map.supportAddress ?? SUPPORT_ADDRESS_DEFAULT,
		workStart: map.workStart ? Number(map.work_start) : WORK_START,
		workEnd: map.workEnd ? Number(map.work_end) : WORK_END,
		disabledDates: parsedDates,
	};
}

export async function updateSiteSettingsAction(
	patch: Partial<SiteSettingsInfo>
): Promise<{ success: boolean; error?: string }> {
	try {
		const promises: PrismaPromise<unknown>[] = [];

		// Функция-хелпер для upsert
		const addPromise = (key: string, value: string) => {
			promises.push(
				prisma.siteSetting.upsert({
					where: { key },
					update: { value },
					create: { key, value },
				})
			);
		};

		if (patch.phone !== undefined) addPromise("supportPhone", patch.phone);
		if (patch.telegram !== undefined)
			addPromise("supportTelegram", patch.telegram);
		if (patch.address !== undefined)
			addPromise("supportAddress", patch.address);
		if (patch.workStart !== undefined)
			addPromise("workStart", String(patch.workStart));
		if (patch.workEnd !== undefined)
			addPromise("workEnd", String(patch.workEnd));
		if (patch.disabledDates !== undefined)
			addPromise("disabledDates", JSON.stringify(patch.disabledDates));

		if (promises.length === 0) return { success: true };

		await prisma.$transaction(promises);
		revalidatePath("/", "layout");
		return { success: true };
	} catch {
		return { success: false, error: "Ошибка обновления" };
	}
}

export async function getSupportInfo(): Promise<SupportInfo> {
	const data = await prisma.siteSetting.findMany({
		where: {
			key: { in: ["support_phone", "support_telegram", "support_address"] },
		},

		select: { key: true, value: true },
	});

	const map = Object.fromEntries(data.map((r) => [r.key, r.value]));

	return {
		phone: map.support_phone ?? SUPPORT_PHONE_DEFAULT,

		telegram: map.support_telegram ?? SUPPORT_TELEGRAM_DEFAULT,

		address: map.support_address ?? SUPPORT_ADDRESS_DEFAULT,
	};
}

export async function updateSupportInfoAction(
	patch: Partial<SupportInfo>
): Promise<{ success: boolean; error?: string }> {
	try {
		const mapping: Record<keyof SupportInfo, string> = {
			phone: "support_phone",
			telegram: "support_telegram",
			address: "support_address",
		};

		const promises = (Object.keys(patch) as (keyof SupportInfo)[])

			.filter((k) => patch[k] !== undefined)

			.map((k) =>
				prisma.siteSetting.upsert({
					where: { key: mapping[k] },

					update: { value: patch[k] as string },

					create: { key: mapping[k], value: patch[k] as string },
				})
			);

		if (promises.length === 0) return { success: true };

		await prisma.$transaction(promises);

		revalidatePath("/", "layout");

		return { success: true };
	} catch (error: unknown) {
		if (error instanceof Error) return { success: false, error: error.message };

		return { success: false, error: "Ошибка обновления" };
	}
}
