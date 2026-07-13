import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Не авторизован");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true, permissions: true, name: true },
	});

	if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
		throw new Error("Недостаточно прав");
	}

	return {
		userId: session.user.id,
		name: user.name ?? "Администратор",
		role: user.role,
		permissions: user.permissions as Record<string, boolean>,
	};
}
