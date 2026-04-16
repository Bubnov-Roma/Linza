import { signIn } from "@/auth";

/**
 * Создаёт сессию для пользователя по его ID — без пароля.
 * Используется только в серверных компонентах/route handlers (invite flow).
 * Токен уже был проверен и помечен использованным ДО вызова этой функции.
 */
export async function signInByUserId(userId: string): Promise<void> {
	await signIn("invite", {
		userId,
		redirect: false,
	});
}
