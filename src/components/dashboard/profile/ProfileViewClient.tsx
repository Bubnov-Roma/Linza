"use client";

import { ProfileDetails } from "@/components/dashboard/profile/ProfileDetails";
import { ProfileSkeleton } from "@/components/dashboard/profile/ProfileSkeleton";
import { ClientForm } from "@/components/forms";
import { useApplicationStore } from "@/store";

export const ProfileViewClient = () => {
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
				<ProfileDetails data={applicationData} />
			)}
		</div>
	);
};
