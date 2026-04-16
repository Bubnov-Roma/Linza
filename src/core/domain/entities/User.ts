export type UserRole = "USER" | "PARTNER" | "MANAGER" | "ADMIN";
export type EntityType = "INDIVIDUAL" | "LEGAL";

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

export interface UserApplication {
	id: string;
	status: ApplicationStatus;
	clientType: string;
	createdAt: string;
	updatedAt: string;
	rejectionReason: string | null;
}

export interface UserProfile {
	id: string;
	email: string | null;
	name: string | null;
	phone: string | null;
	avatarUrl: string | null;
	role: UserRole;
	entityType: EntityType | null;
	companyName: string | null;
	tin: string | null;
	createdAt: string;
	isBlocked: boolean;
	blockedReason: string | null;
	permissions: Record<string, boolean>;
	isVerified: boolean | null;
	application?: UserApplication | null;
	labels?: Array<{
		id: string;
		text: string;
		color: string;
		dueDate?: string;
	}>;
	discount?: {
		type: string;
		value: number;
		promoCode?: string | null;
	} | null;
}
