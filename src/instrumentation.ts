export async function register() {
	// Запускаем только на сервере, не в edge-runtime
	if (process.env.NEXT_RUNTIME !== "nodejs") return;

	// Динамический импорт чтобы не тащить prisma в edge
	const { scheduledCleanup } = await import("@/lib/scheduled-cleanup");
	scheduledCleanup();
}
