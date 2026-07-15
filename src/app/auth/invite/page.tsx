import { redirect } from "next/navigation";
import { consumeInviteTokenAction } from "@/actions/admin/admin-user-actions";
import { signInByUserId } from "@/lib/auth-helpers";

interface InvitePageProps {
	searchParams: Promise<{ token?: string }>;
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
	const { token } = await searchParams;

	if (!token) {
		redirect("/auth/login?error=invalid_invite");
	}

	const result = await consumeInviteTokenAction(token);

	if (!result.success || !result.userId) {
		// Передаём понятное сообщение об ошибке через search param
		const msg = encodeURIComponent(result.error ?? "Ссылка недействительна");
		redirect(`/auth/login?error=invite&message=${msg}`);
	}

	// Создаём сессию для пользователя без пароля
	await signInByUserId(result.userId);

	// После входа — на страницу установки пароля
	redirect("/profile/set-password?from=invite");
}
