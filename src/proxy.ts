import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
	const isLoggedIn = !!req.auth;
	const { pathname } = req.nextUrl;
	const role = req.auth?.user?.role;

	const isAuthRoute = pathname.startsWith("/auth");
	const isAdminRoute = pathname.startsWith("/admin");
	const isProtectedRoute =
		pathname.startsWith("/dashboard") || pathname.startsWith("/booking");

	// 1. Redirect unauthorized persons from protected areas
	if (!isLoggedIn && (isProtectedRoute || isAdminRoute)) {
		const url = req.nextUrl.clone();
		url.pathname = "/auth";
		url.searchParams.set("view", "register");
		url.searchParams.set("redirect", pathname);
		return NextResponse.redirect(url);
	}

	// 2. Checking roles for the admin panel
	if (isLoggedIn && isAdminRoute) {
		if (role !== "ADMIN" && role !== "MANAGER") {
			return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
		}
	}

	// 3. Redirect authorized users from the login page (only if not invite page)
	if (isLoggedIn && isAuthRoute && !req.nextUrl.searchParams.has("view")) {
		// /auth/invite нужен залогиненному пользователю — он сам редиректит дальше
		if (pathname === "/auth/invite") return NextResponse.next();
		return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
	}

	return NextResponse.next();
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
