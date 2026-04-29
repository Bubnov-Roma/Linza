import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/auth");
	}
	const dbUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true, isBlocked: true },
	});

	if (dbUser?.isBlocked || session.user.role !== dbUser?.role) {
		redirect("/api/auth/signout?callbackUrl=/auth");
	}

	if (dbUser?.role !== "ADMIN" && dbUser?.role !== "MANAGER") {
		redirect("/auth");
	}

	return <>{children}</>;
}
