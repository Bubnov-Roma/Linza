import Link from "next/link";
import { getSiteSettings } from "@/actions/admin-settings-actions";
import { ClientTime } from "@/components/shared";
import { SimpleMarkdown } from "@/components/shared/MarkdownEditor";

export const metadata = {
	title: "Политика конфиденциальности | Linza",
};

export const revalidate = 3600;

export default async function PrivacyPage() {
	const settings = await getSiteSettings();
	const formattedDate = new Date(settings.legalDocsUpdatedAt);
	return (
		<div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-foreground/80">
			<h1 className="text-3xl font-black mb-8">Политика конфиденциальности</h1>
			<p className="text-muted-foreground">
				Дата последнего обновления:{" "}
				{<ClientTime iso={formattedDate} fmt="full" />}
			</p>
			<SimpleMarkdown
				text={settings.privacyPolicy}
				className="prose dark:prose-invert max-w-none"
			/>
			<div className="mt-10 pt-6 border-t border-border">
				<p className="text-muted-foreground text-sm">
					Если у вас остались вопросы, свяжитесь с нами:{" "}
					<Link
						href={`mailto:${settings.supportEmail}`}
						className="text-blue-500 hover:underline font-medium"
					>
						{settings.supportEmail}
					</Link>
				</p>
			</div>
		</div>
	);
}
