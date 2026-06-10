"use server";

import type { PrismaPromise } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
	DEFAULT_PRIVACY,
	DEFAULT_TERMS,
	SUPPORT_ADDRESS_DEFAULT,
	SUPPORT_EMAIL_DEFAULT,
	SUPPORT_PHONE_DEFAULT,
	SUPPORT_TELEGRAM_DEFAULT,
	SUPPORT_VK_DEFAULT,
	type SupportInfo,
} from "@/constants";

import { prisma } from "@/lib/prisma";
import { WORK_END, WORK_START } from "@/lib/utils";

export interface SiteSettingsInfo {
	phone: string;
	telegram: string;
	vk: string;
	address: string;
	supportEmail: string;
	privacyPolicy: string;
	termsOfService: string;
	workStart: number;
	workEnd: number;
	disabledDates: string[];
	companyName: string;
	inn: string;
	ogrn: string;
	legalAddress: string;
	legalDocsUpdatedAt: string;
}

export async function getSiteSettings(): Promise<SiteSettingsInfo> {
	const data = await prisma.siteSetting.findMany({
		where: {
			key: {
				in: [
					"supportPhone",
					"supportTelegram",
					"supportVk",
					"supportAddress",
					"supportEmail",
					"privacyPolicy",
					"termsOfService",
					"workStart",
					"workEnd",
					"disabledDates",
					"companyName",
					"inn",
					"ogrn",
					"legalAddress",
					"legalDocsUpdatedAt",
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
		vk: map.supportVk ?? SUPPORT_VK_DEFAULT,
		address: map.supportAddress ?? SUPPORT_ADDRESS_DEFAULT,
		supportEmail: map.supportEmail ?? SUPPORT_EMAIL_DEFAULT,
		privacyPolicy: map.privacyPolicy ?? DEFAULT_PRIVACY,
		termsOfService: map.termsOfService ?? DEFAULT_TERMS,
		workStart: map.workStart ? Number(map.workStart) : WORK_START,
		workEnd: map.workEnd ? Number(map.workEnd) : WORK_END,
		disabledDates: parsedDates,
		companyName: map.companyName ?? "",
		inn: map.inn ?? "",
		ogrn: map.ogrn ?? "",
		legalAddress: map.legalAddress ?? "",
		legalDocsUpdatedAt: map.legalDocsUpdatedAt ?? new Date().toISOString(),
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
		if (patch.vk !== undefined) addPromise("supportVk", patch.vk);
		if (patch.address !== undefined)
			addPromise("supportAddress", patch.address);
		if (patch.supportEmail !== undefined)
			addPromise("supportEmail", patch.supportEmail);
		if (patch.privacyPolicy !== undefined)
			addPromise("privacyPolicy", patch.privacyPolicy);
		if (patch.termsOfService !== undefined)
			addPromise("termsOfService", patch.termsOfService);
		if (patch.workStart !== undefined)
			addPromise("workStart", String(patch.workStart));
		if (patch.workEnd !== undefined)
			addPromise("workEnd", String(patch.workEnd));
		if (patch.disabledDates !== undefined)
			addPromise("disabledDates", JSON.stringify(patch.disabledDates));
		if (patch.companyName !== undefined)
			addPromise("companyName", patch.companyName);
		if (patch.inn !== undefined) addPromise("inn", patch.inn);
		if (patch.ogrn !== undefined) addPromise("ogrn", patch.ogrn);
		if (patch.legalAddress !== undefined)
			addPromise("legalAddress", patch.legalAddress);
		if (
			patch.privacyPolicy !== undefined ||
			patch.termsOfService !== undefined
		) {
			addPromise("legalDocsUpdatedAt", new Date().toISOString());
		}
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
			key: {
				in: [
					"supportPhone",
					"supportTelegram",
					"supportVk",
					"supportAddress",
					"supportEmail",
				],
			},
		},
		select: { key: true, value: true },
	});

	const map = Object.fromEntries(data.map((r) => [r.key, r.value]));

	return {
		phone: map.supportPhone ?? SUPPORT_PHONE_DEFAULT,
		telegram: map.supportTelegram ?? SUPPORT_TELEGRAM_DEFAULT,
		vk: map.supportVk ?? SUPPORT_VK_DEFAULT,
		address: map.supportAddress ?? SUPPORT_ADDRESS_DEFAULT,
		email: map.supportEmail ?? SUPPORT_EMAIL_DEFAULT,
	};
}
