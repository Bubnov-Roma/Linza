import { prisma } from "@/lib/prisma";

// Вызывается из instrumentation.ts при старте сервера.
// Запускает очистку сразу + повторяет каждые 6 часов.

async function runCleanup() {
	try {
		const now = new Date();

		const toDelete = await prisma.user.findMany({
			where: { deletionScheduledAt: { lte: now } },
			select: { id: true, email: true },
		});

		if (toDelete.length === 0) return;

		const ids = toDelete.map((u) => u.id);
		const result = await prisma.user.deleteMany({
			where: { id: { in: ids } },
		});

		console.log(
			`[cleanup] Удалено ${result.count} профилей (${ids.join(", ")})`
		);
	} catch (e) {
		console.error("[cleanup] Ошибка при удалении профилей:", e);
	}
}

export function scheduledCleanup() {
	// Запуск при старте (на случай если сервер перезапустился и пропустил время)
	runCleanup();

	// Повтор каждые 6 часов
	setInterval(runCleanup, 6 * 60 * 60 * 1000);
}
