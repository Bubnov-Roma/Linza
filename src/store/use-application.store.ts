import { create } from "zustand";
import type { ClientFormValues } from "@/schemas";
import type { ApplicationStatus } from "@/types";

interface ApplicationState {
	status: ApplicationStatus;
	applicationData: ClientFormValues | null;
	formDraft: Partial<ClientFormValues> | null;
	displayName: string | null;
	setInitialState: (
		status: ApplicationStatus,
		data: ClientFormValues | null,
		displayName?: string | null
	) => void;
	setDisplayName: (name: string | null) => void;
	setFormDraft: (draft: Partial<ClientFormValues>) => void;
	clearFormDraft: () => void;
	submitSuccess: (data: ClientFormValues) => void;
}

export const useApplicationStore = create<ApplicationState>()((set) => ({
	status: "LOADING",
	applicationData: null,
	formDraft: null,
	displayName: null,

	setInitialState: (status, data, displayName = null) =>
		set({ status, applicationData: data, displayName }),

	setDisplayName: (displayName) => set({ displayName }),

	setFormDraft: (draft) => set({ formDraft: draft }),

	clearFormDraft: () => set({ formDraft: null }),

	submitSuccess: (data: ClientFormValues) =>
		set((state) => ({
			status: "PENDING",
			applicationData: data,
			formDraft: null,
			displayName:
				state.displayName ||
				(data.applicationData as { personalData?: { name?: string } })
					?.personalData?.name ||
				null,
		})),
}));
