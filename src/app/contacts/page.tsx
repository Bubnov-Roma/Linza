import { Suspense } from "react";
import { getSupportInfo } from "@/actions/admin-settings-actions";
import { auth } from "@/auth";
import ContactsClientView from "@/components/layouts/Contacts/ContactsClientView";
import ContactsSkeleton from "@/components/layouts/Contacts/ContactsSkeleton";

export const metadata = {
	title: "Контакты | LINZA",
	description:
		"Свяжитесь с нами для аренды фото- и видеооборудования в Самаре. Адрес, телефон, мессенджеры и форма обратной связи проката LINZA.",
};

export default async function ContactsPage() {
	const [supportInfo] = await Promise.all([getSupportInfo(), auth()]);

	return (
		<main className="min-h-screen pb-20 pt-10 md:pt-16">
			<Suspense fallback={<ContactsSkeleton />}>
				<ContactsClientView supportInfo={supportInfo} />
			</Suspense>
		</main>
	);
}
