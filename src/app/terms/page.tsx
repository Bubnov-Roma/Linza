import { getSiteSettings } from "@/actions/admin-settings-actions";
import { ClientTime } from "@/components/shared";
import { SimpleMarkdown } from "@/components/shared/MarkdownEditor";

export const metadata = {
	title: "Пользовательское соглашение | Linza",
};

export default async function TermsPage() {
	const settings = await getSiteSettings();
	const formattedDate = new Date(settings.legalDocsUpdatedAt);
	return (
		<div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-foreground/80">
			<h1 className="text-3xl font-black mb-8">
				Пользовательское соглашение (Публичная оферта)
			</h1>
			<p className="text-muted-foreground">
				Дата последнего обновления:{" "}
				{<ClientTime iso={formattedDate} fmt="full" />}
			</p>
			<SimpleMarkdown
				text={settings.termsOfService}
				className="prose dark:prose-invert max-w-none"
			/>

			<section className="space-y-4 mt-8 pt-8 border-t border-foreground/10 text-sm text-foreground/50">
				<h3>Реквизиты исполнителя:</h3>
				<p>
					{settings.companyName}
					<br />
					ИНН: {settings.inn} | ОГРН: {settings.ogrn}
					<br />
					Адрес: {settings.legalAddress}
				</p>
			</section>
		</div>
	);
}
