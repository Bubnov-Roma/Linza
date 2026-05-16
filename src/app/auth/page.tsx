import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { Suspense } from "react";
import { AuthFormController } from "@/components/auth/AuthFormController";

export default async function AuthPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const params = await searchParams;
	const view = (params.view as string) || "otp-login";

	return (
		<div className="container mx-auto flex min-h-screen items-top md:items-center justify-center">
			<Suspense
				fallback={
					<div className="flex h-64 items-center justify-center">
						<CircleNotchIcon size={50} className="text-primary animate-spin" />
					</div>
				}
			>
				<AuthFormController view={view} />
			</Suspense>
		</div>
	);
}
