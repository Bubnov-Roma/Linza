"use server";

import type { Prisma } from "@prisma/client";
import type { AuditLogEntry } from "@/actions/admin/audit-and-balance-actions";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * Записать одну запись в лог изменений позиции техники.
 * Вызывается из admin-equipment-actions.ts — не напрямую из UI.
 */
export async function writeEquipmentAuditLog(
	equipmentId: string,
	authorId: string | null,
	authorName: string | null,
	entry: {
		action: string;
		fieldName?: string;
		valueBefore?: string;
		valueAfter?: string;
		meta?: Record<string, unknown>;
	}
): Promise<void> {
	await prisma.equipmentAuditLog.create({
		data: {
			equipmentId,
			authorId,
			authorName,
			action: entry.action,
			fieldName: entry.fieldName ?? null,
			valueBefore: entry.valueBefore ?? null,
			valueAfter: entry.valueAfter ?? null,
			meta: entry.meta ? (entry.meta as unknown as Prisma.JsonObject) : {},
		},
	});
}

/**
 * Получить всю историю изменений позиции техники (для отображения в Sheet).
 */
export async function getEquipmentAuditLogAction(
	equipmentId: string
): Promise<{ success: boolean; data?: AuditLogEntry[]; error?: string }> {
	try {
		await requireAdmin();

		const logs = await prisma.equipmentAuditLog.findMany({
			where: { equipmentId },
			orderBy: { createdAt: "desc" },
			take: 200,
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
				authorId: l.authorId,
				createdAt: l.createdAt.toISOString(),
				meta: l.meta as Record<string, unknown> | null,
			})),
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}
