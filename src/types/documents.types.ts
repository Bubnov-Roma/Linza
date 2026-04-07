export type DocTemplateType =
	| "CONTRACT_INDIVIDUAL"
	| "CONTRACT_LEGAL"
	| "ACT"
	| "INVOICE"
	| "RECEIPT"
	| "CUSTOM";

export interface DocTemplateRow {
	id: string;
	name: string;
	type: DocTemplateType;
	fileUrl: string;
	fileFormat: string;
	description: string | null;
	isActive: boolean;
	sortOrder: number;
	variables: string[];
	createdAt: string;
}

export interface BookingDocData {
	// Заказ
	bookingId: string;
	bookingNumber: string;
	bookingDate: string;
	startDate: string;
	endDate: string;
	startDatetime: string;
	endDatetime: string;
	totalAmount: string;
	totalAmountWords: string;
	depositAmount: string;
	insurance: string;
	// Клиент
	clientName: string;
	clientEmail: string;
	clientPhone: string;
	clientType: string;
	companyName: string;
	tin: string;
	// Техника — список
	equipmentList: string;
	equipmentListNumbered: string;
	equipmentCount: string;
}
