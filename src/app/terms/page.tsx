import { getSiteSettings } from "@/actions/admin-settings-actions";
import { SimpleMarkdown } from "@/components/shared/MarkdownEditor";

export const metadata = {
	title: "Пользовательское соглашение | Linza",
};

export default async function TermsPage() {
	const settings = await getSiteSettings();
	return (
		<div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6">
			<h1 className="text-3xl font-black mb-8">Пользовательское соглашение</h1>

			<SimpleMarkdown
				text={settings.termsOfService}
				className="prose dark:prose-invert max-w-none"
			/>

			{/* <div className="mt-10 pt-6 border-t border-border">
				<p>Дата последнего обновления: [ТЕКУЩАЯ ДАТА]</p>
				<p>
					Реквизиты Администрации: [ВСТАВЬТЕ ВАШИ РЕКВИЗИТЫ: ИП/ООО, ИНН, ОГРН,
					Юридический адрес, Email]
					{settings.phone}, {settings.address}, {settings.supportEmail}.
				</p>
			</div> */}
		</div>
	);
}
