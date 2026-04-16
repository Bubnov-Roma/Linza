export type EquipmentStatus =
	| "AVAILABLE"
	| "RENTED"
	| "RESERVED"
	| "MAINTENANCE"
	| "BROKEN"
	| "RETIRED";
export type OwnershipType = "INTERNAL" | "SUBLEASE";

export interface SupabaseImage {
	id: string;
	url: string;
}

export interface Comment {
	id: string;
	text: string;
	author: string;
	createdAt: string;
}

export interface DbEquipmentBase {
	id: string;
	title: string;
	description: string | null;
	categoryId: string;
	subcategoryId: string | null;
	inventoryNumber: string | null;
	pricePerDay: number;
	price4h: number;
	price8h: number;
	deposit: number;
	replacementValue: number;
	isAvailable: boolean;
	isPrimary: boolean;
	status: EquipmentStatus;
	ownershipType: OwnershipType;
	partnerName: string | null;
	defects: string | null;
	kit: string | null;
	kitDescription: string | null;
	specifications: Record<string, unknown>;
	comments: Comment[];
	videoUrls: string[];
	slug: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface DbEquipment extends DbEquipmentBase {
	// relatedIds хранится в другой таблице EquipmentRelation, не в Equipment
}

export interface DbEquipmentWithImages extends DbEquipmentBase {
	equipmentImageLinks: EquipmentImageLinkWithImage[];
	relatedEquipment?: { relatedId: string }[];
	relatedIds?: string[];
}

/** Link между Equipment и Image с полной информацией */
export interface EquipmentImageLinkWithImage {
	id: string;
	equipmentId: string;
	imageId: string;
	image: {
		id: string;
		url: string;
	};
	orderIndex: number;
}

export type RawEquipmentRow = DbEquipmentWithImages;

export interface GroupedEquipment
	extends Omit<DbEquipment, "createdAt" | "updatedAt"> {
	createdAt: Date;
	updatedAt: Date;
	totalCount: number;
	availableCount: number;
	imagesData: SupabaseImage[];
	allUnitIds: string[];
	imageUrl: string;
	images: string[];
	rating: number;
	reviewsCount: number;
	equipmentImageLinks: EquipmentImageLinkWithImage[];
	relatedIds?: string[];
}

export type DbSubcategory = {
	id: string;
	name: string;
	slug: string;
	adminNotes?: string | undefined;
	imageUrl?: string | undefined;
};

export type DbCategory = {
	id: string;
	name: string;
	slug: string;
	adminNotes?: string | undefined;
	isModular: boolean;
	imageUrl?: string | undefined;
	iconName: string;
	subcategories: DbSubcategory[];
};
export interface DbRawCSVRow {
	id: string;
	title: string;
	slug: string;
	category: string;
	subcategory: string;
	description: string | null;
	inventoryNumber: string | null;
	deposit: number;
	replacementValue: number;
	pricePerDay: number;
	price4h: number;
	price8h: number;
	status: EquipmentStatus;
	isAvailable: boolean;
	videoUrls?: string[];
}
