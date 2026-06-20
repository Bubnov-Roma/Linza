"use client";

import { ProfileDetails } from "@/components/dashboard/profile/ProfileDetails";
import { ProfileSkeleton } from "@/components/dashboard/profile/ProfileSkeleton";
import { ClientForm } from "@/components/forms";
import { useApplicationStore } from "@/store/use-application.store";

interface ProfileViewClientProps {
	hasPassword: boolean;
	userEmail: string;
}

export const ProfileViewClient = ({
	hasPassword,
	userEmail,
}: ProfileViewClientProps) => {
	const applicationData = useApplicationStore((state) => state.applicationData);
	const status = useApplicationStore((state) => state.status);

	if (status === "LOADING") {
		return <ProfileSkeleton variant="form" />;
	}

	return (
		<div className="relative min-h-screen">
			{status === "NO_APPLICATION" || status === "DRAFT" ? (
				<ClientForm />
			) : (
				<ProfileDetails
					data={applicationData}
					hasPassword={hasPassword}
					userEmail={userEmail}
				/>
			)}
		</div>
	);
};
