import { redirect } from "next/navigation";
import { getSiteSettings } from "@/actions/admin-settings-actions";
import { auth } from "@/auth";
import { SettingsClient } from "@/components/admin/settings/SettingsClient";

export const metadata = {
	title: "Настройки сайта | Linza Admin",
};

export default async function SettingsPage() {
	const session = await auth();

	if (session?.user?.role !== "ADMIN") {
		redirect("/admin");
	}

	const settings = await getSiteSettings();

	return <SettingsClient initialSettings={settings} />;
}
