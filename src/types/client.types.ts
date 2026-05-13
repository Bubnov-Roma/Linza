import type { ClientFormValues } from "@/schemas";

export type ApplicationStatus =
	| "LOADING"
	| "NO_APPLICATION"
	| "DRAFT"
	| "PENDING"
	| "REVIEWING"
	| "CLARIFICATION"
	| "STANDARD"
	| "APPROVED"
	| "REJECTED"
	| "BLOCKED";

export type ClientVariants =
	| "individual"
	| "individual_partner"
	| "legal"
	| "legal_partner";

export type AllowedUpdateField =
	| "applicationData.personalData.name"
	| "applicationData.personalData.phone"
	| "applicationData.passport.seriesAndNumber"
	| "applicationData.passport.issueDate"
	| "applicationData.passport.issuedBy"
	| "applicationData.addresses.registration"
	| "applicationData.addresses.registration.index"
	| "applicationData.addresses.registration.country"
	| "applicationData.addresses.registration.region"
	| "applicationData.addresses.registration.city"
	| "applicationData.addresses.registration.address"
	| "applicationData.addresses.actual"
	| "applicationData.addresses.actual.address"
	| "applicationData.addresses.isSame";

export type UserRole = "GUEST" | "USER" | "ADMIN" | "MANAGER";

export interface ClientApplication {
	id: string;
	userId: string;
	clientType: string;
	applicationData: ClientFormValues;
	status: ApplicationStatus;
	rejectionReason?: string | null;
	createdAt: Date;
	updatedAt: Date;
}
