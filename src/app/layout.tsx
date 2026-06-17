import { SpeedInsights } from "@vercel/speed-insights/next";
import NextTopLoader from "nextjs-toploader";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { Footer } from "@/components/layouts/Footer";
import { Header } from "@/components/layouts/Header";
import { MobileNavBar } from "@/components/layouts/MobileNavBar";
import { SidebarInset } from "@/components/ui/sidebar";
import { ApplicationInitializer } from "@/providers/application-initializer";
import { RootProvider } from "@/providers/root-provider";
import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getCategoriesFromDb } from "@/actions/admin-category-actions";
import { getSupportInfo } from "@/actions/admin-settings-actions";
import { auth } from "@/auth";
import {
	AdminNotificationsPoller,
	ClientChatsBridge,
} from "@/components/shared";
import CookieBanner from "@/components/shared/CookieBanner";
import { YandexMetrika } from "@/components/shared/YandexMetrika";
import { prisma } from "@/lib/prisma";
import type { ClientFormValues } from "@/schemas";
import type { ClientApplication } from "@/types";
import { decryptApplicationDataForClient } from "@/utils";
import { getClientDisplayData } from "@/utils/client-data.utils";

export const viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#fff6f5" },
		{ media: "(prefers-color-scheme: dark)", color: "#111016" },
	],
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export const metadata: Metadata = {
	metadataBase: new URL("https://linzarental.ru"),
	title: "Linza | Прокат фото и видео оборудования в Самаре ",
	description:
		"Аренда профессиональной фототехники и видеооборудования в Самаре. Широкий выбор камер, объективов, света и звука. Бронируйте онлайн на сайте Linza.",
	keywords: [
		"прокат фото видео оборудования",
		"аренда фото-видео техники в Самаре",
		"аренда фотостудии Самара",
		"прокат фототехники Самара",
		"аренда фототехники Самара",
		"аренла видео Самара",
		"Линза",
		"Linza",
	],
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "Linza | Прокат фото видео техники",
		description: "Аренда профессионального оборудования для съемок в Самаре.",
		url: "https://linzarental.ru",
		siteName: "Linza",
		images: [
			{
				url: "https://linzarental.ru/og-image.png",
				width: 1200,
				height: 630,
			},
		],
		locale: "ru_RU",
		type: "website",
	},
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	const user = session?.user;
	const support = await getSupportInfo();

	const cookieStore = await cookies();
	const sidebarState = cookieStore.get("sidebar_state")?.value;
	const defaultOpen = sidebarState !== "false";

	const [categories, initialApp] = await Promise.all([
		getCategoriesFromDb(),
		user?.id
			? prisma.clientApplication.findFirst({ where: { userId: user.id } })
			: Promise.resolve(null),
	]);

	let pendingBookings = 0;
	let pendingApplications = 0;
	let pendingStudio = 0;
	let pendingChats = 0;

	const typedInitialApp: ClientApplication | null = initialApp
		? {
				...initialApp,
				applicationData: initialApp.applicationData as ClientFormValues,
			}
		: null;

	const decryptedInitialApp: ClientApplication | null = typedInitialApp
		? {
				...typedInitialApp,
				applicationData:
					decryptApplicationDataForClient(typedInitialApp.applicationData) ??
					typedInitialApp.applicationData,
			}
		: null;

	const appDisplayData = decryptedInitialApp
		? getClientDisplayData(decryptedInitialApp.applicationData)
		: null;

	const displayName =
		user?.nickname || // никнейм из JWT
		appDisplayData?.name || // ФИО из анкеты
		user?.name || // имя из провайдера (Google/Yandex)
		user?.email?.split("@")[0] || // email-prefix как запасной вариант
		null;

	const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";

	if (isAdmin) {
		const [bookingCount, appCount, studioCount, chatsCount] = await Promise.all(
			[
				prisma.booking.count({ where: { status: "PENDING_REVIEW" } }),
				prisma.clientApplication.count({ where: { status: "PENDING" } }),
				prisma.studioBooking.count({ where: { status: "PENDING_REVIEW" } }),
				prisma.supportThread.count({ where: { status: "WAITING_FOR_ADMIN" } }),
			]
		);
		pendingBookings = bookingCount;
		pendingApplications = appCount;
		pendingStudio = studioCount;
		pendingChats = chatsCount;
	}

	let clientUnreadChats = 0;

	if (user?.id && !isAdmin) {
		const threads = await prisma.supportThread.findMany({
			where: { userId: user.id },
			select: {
				messages: {
					orderBy: { createdAt: "desc" },
					take: 1,
					select: { isAdmin: true },
				},
			},
		});
		clientUnreadChats = threads.filter(
			(t) => t.messages[0]?.isAdmin === true
		).length;
	}

	return (
		<html lang="ru" suppressHydrationWarning>
			<head>
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-title" content="Linza" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="yandex-verification" content="921d31c22c2388b2" />
			</head>
			<body suppressHydrationWarning>
				<NextTopLoader color="#ffd106" showSpinner={false} />
				<RootProvider session={session} defaultOpen={defaultOpen}>
					{isAdmin && (
						<AdminNotificationsPoller
							initialBookings={pendingBookings}
							initialApps={pendingApplications}
							initialStudio={pendingStudio}
							initialChats={pendingChats}
						/>
					)}
					{!isAdmin && user?.id && (
						<ClientChatsBridge initialCount={clientUnreadChats} />
					)}
					<ApplicationInitializer
						userId={session?.user?.id ?? null}
						initialData={decryptedInitialApp}
						displayName={displayName}
					>
						<AppSidebar isAdmin={isAdmin} categories={categories} />
						<SidebarInset className="flex flex-col min-h-screen">
							<Header
								categories={categories}
								isAdmin={isAdmin}
								support={support}
							/>
							<main className="flex-1 pt-16">{children}</main>
							<Footer support={support} />
							<MobileNavBar
								categories={categories}
								isAdmin={isAdmin}
								support={support}
							/>
						</SidebarInset>
					</ApplicationInitializer>
					<CookieBanner />
				</RootProvider>
				<SpeedInsights />
				<YandexMetrika />
			</body>
		</html>
	);
}
