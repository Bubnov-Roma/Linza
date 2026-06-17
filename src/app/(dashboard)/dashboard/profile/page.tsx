import { auth } from "@/auth";
import { ProfileViewClient } from "@/components/dashboard/profile/ProfileViewClient";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
	const session = await auth();

	let hasPassword = false;
	if (session?.user?.id) {
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { password: true },
		});
		hasPassword = !!user?.password;
	}
	return (
		<ProfileViewClient
			hasPassword={hasPassword}
			userEmail={session?.user?.email || ""}
		/>
	);
}
