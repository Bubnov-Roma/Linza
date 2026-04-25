export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Вызывается по расписанию
// Физически удаляет пользователей у которых deletionScheduledAt < now().
//
// Защита: проверяет секретный заголовок CRON_SECRET из .env
// Пример .env: CRON_SECRET=my-super-secret-key
//
// Для Vercel Cron добавить в vercel.json:
// {
//   "crons": [{ "path": "/api/cron/cleanup-users", "schedule": "0 3 * * *" }]
// }
// (запускается каждый день в 3:00 UTC)
//
// Для самостоятельного хостинга — вызывать через внешний cron (crontab, Render Cron, etc.)
// или добавить вызов в src/instrumentation.ts

export async function GET(request: Request) {
	// ── Авторизация cron-запроса ──────────────────────────────────────────────
	const authHeader = request.headers.get("authorization");
	const expected = `Bearer ${process.env.CRON_SECRET}`;

	if (!process.env.CRON_SECRET || authHeader !== expected) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const now = new Date();

		// 1. Ищем кандидатов на удаление
		const toDelete = await prisma.user.findMany({
			where: {
				deletionScheduledAt: { lte: now },
			},
			select: {
				id: true,
				email: true,
				mergedIntoId: true,
				deletionScheduledAt: true,
			},
		});

		if (toDelete.length === 0) {
			return NextResponse.json({ deleted: 0, message: "Нечего удалять" });
		}

		const ids = toDelete.map((u) => u.id);

		// 2. Физически удаляем (каскадные связи в схеме сделают остальное)
		const result = await prisma.user.deleteMany({
			where: { id: { in: ids } },
		});

		console.log(`[cron/cleanup-users] Удалено ${result.count} профилей:`, ids);

		return NextResponse.json({
			deleted: result.count,
			ids,
		});
	} catch (e) {
		console.error("[cron/cleanup-users] Ошибка:", e);
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : "Ошибка" },
			{ status: 500 }
		);
	}
}
