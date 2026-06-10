"use client";

import { useSession } from "next-auth/react";

interface UserProfile {
	id: string;
	name: string | null | undefined;
	email: string | null | undefined;
	image: string | null | undefined;
	role: string;
	nickname?: string | undefined;
	companyName?: string | undefined;
	phone?: string | undefined;
	extraPhone?: string | undefined;
}

export function useAuth() {
	const { data: session, status, update } = useSession();
	const isLoading = status === "loading";
	const sessionUser = session?.user;

	const user: UserProfile | null = sessionUser
		? {
				id: sessionUser.id || "",
				name: sessionUser.name,
				email: sessionUser.email,
				image: sessionUser.image,
				role: sessionUser.role || "USER",
				nickname: sessionUser.nickname ?? "",
				companyName: sessionUser.companyName ?? "",
				phone: sessionUser.phone ?? "",
				extraPhone: sessionUser.extraPhone ?? "",
			}
		: null;

	return {
		user,
		isLoading,
		isAuthenticated: status === "authenticated",
		refreshProfile: update,
	};
}
