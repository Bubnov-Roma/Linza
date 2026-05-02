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
import { getCategoriesFromDb } from "@/actions/admin-category-actions";
import { getSupportInfo } from "@/actions/admin-settings-actions";
import { auth } from "@/auth";
import { AdminNotificationsPoller } from "@/components/shared";
import CookieBanner from "@/components/shared/CookieBanner";
import { YandexMetrika } from "@/components/shared/YandexMetrika";
import { prisma } from "@/lib/prisma";
import type { ClientFormValues } from "@/schemas";
import type { ClientApplication } from "@/types";

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
	title: "Linza | Прокат фото и видео оборудования в Самаре",
	description:
		"Аренда профессиональной фото- и видеотехники в Самаре. Широкий выбор камер, объективов, света и звука. Бронируйте онлайн на сайте Linza.",
	keywords: [
		"прокат фото видео оборудования",
		"рентал фото-видео техники в Самаре",
		"аренда камер Самара",
		"Linza",
	],
	openGraph: {
		title: "Linza | Прокат фото и видео техники",
		description: "Аренда профессионального оборудования для съемок в Самаре.",
		url: "https://linzarental.ru",
		siteName: "Linza Rental",
		images: [
			{
				url: "https://linzarental.ru/og-image.jpg", // Красивый баннер для соцсетей и Telegram
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

	const [categories, initialApp] = await Promise.all([
		getCategoriesFromDb(),
		user?.id
			? prisma.clientApplication.findFirst({ where: { userId: user.id } })
			: Promise.resolve(null),
	]);

	let pendingBookings = 0;
	let pendingApplications = 0;
	let pendingStudio = 0;

	const typedInitialApp: ClientApplication | null = initialApp
		? {
				...initialApp,
				applicationData: initialApp.applicationData as ClientFormValues,
			}
		: null;

	const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER";

	if (isAdmin) {
		const [bookingCount, appCount, studioCount] = await Promise.all([
			prisma.booking.count({ where: { status: "PENDING_REVIEW" } }),
			prisma.clientApplication.count({ where: { status: "PENDING" } }),
			prisma.studioBooking.count({ where: { status: "PENDING_REVIEW" } }), // Пример
		]);
		pendingBookings = bookingCount;
		pendingApplications = appCount;
		pendingStudio = studioCount;
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
				<NextTopLoader color="#3b82f6" showSpinner={false} />
				<RootProvider session={session}>
					{isAdmin && (
						<AdminNotificationsPoller
							initialBookings={pendingBookings}
							initialApps={pendingApplications}
							initialStudio={pendingStudio}
						/>
					)}
					<ApplicationInitializer
						userId={session?.user?.id ?? null}
						initialData={typedInitialApp}
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
							<MobileNavBar categories={categories} isAdmin={isAdmin} />
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
