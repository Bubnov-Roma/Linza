import { getSiteSettings } from "@/actions/admin-settings-actions";
import { SimpleMarkdown } from "@/components/shared/MarkdownEditor";

export const metadata = {
	title: "Политика конфиденциальности | Linza",
};

export const revalidate = 3600;

export default async function PrivacyPage() {
	const settings = await getSiteSettings();

	return (
		<div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6">
			<h1 className="text-2xl md:text-3xl lg:text-4xl font-black italic uppercase tracking-tight">
				Политика конфиденциальности
			</h1>
			<SimpleMarkdown
				text={settings.privacyPolicy}
				className="prose dark:prose-invert max-w-none"
			/>
			<div className="mt-10 pt-6 border-t border-border">
				<p className="text-muted-foreground text-sm">
					Если у вас остались вопросы, свяжитесь с нами:{" "}
					<a
						href={`mailto:${settings.supportEmail}`}
						className="text-blue-500 hover:underline font-medium"
					>
						{settings.supportEmail}
					</a>
				</p>
			</div>
		</div>
	);
}
