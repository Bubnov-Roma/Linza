"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AuthModalProvider } from "@/providers/auth-modal-provider";
import { CartSync } from "@/providers/cart-syncer";
import QueryProvider from "@/providers/query-provider";
import { UnsavedChangesGuard } from "@/providers/unsaved-changes-guard";

interface RootProviderProps {
	children: React.ReactNode;
	session: Session | null;
	defaultOpen?: boolean;
}

export function RootProvider({
	children,
	session,
	defaultOpen = true,
}: RootProviderProps) {
	return (
		<NuqsAdapter>
			<SessionProvider
				session={session}
				refetchInterval={5 * 60}
				refetchOnWindowFocus={true}
			>
				<CartSync />
				<QueryProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<UnsavedChangesGuard />
						<AuthModalProvider />
						<SidebarProvider defaultOpen={defaultOpen}>
							{children}
							<Toaster
								position="top-center"
								expand={false}
								richColors
								closeButton
							/>
						</SidebarProvider>
					</ThemeProvider>
				</QueryProvider>
			</SessionProvider>
		</NuqsAdapter>
	);
}
