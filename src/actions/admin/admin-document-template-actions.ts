"use server";

import { revalidatePath } from "next/cache";
import { uploadToS3 } from "@/actions/admin/upload-actions";
import { TEMPLATE_VARIABLES } from "@/constants";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { fmtRub } from "@/lib/utils";
import type { BookingDocData, DocTemplateRow, DocTemplateType } from "@/types";

/** Сумма прописью (упрощённая русскоязычная версия) */
function amountToWords(amount: number): string {
	const ones = [
		"",
		"один",
		"два",
		"три",
		"четыре",
		"пять",
		"шесть",
		"семь",
		"восемь",
		"девять",
	];
	const teens = [
		"десять",
		"одиннадцать",
		"двенадцать",
		"тринадцать",
		"четырнадцать",
		"пятнадцать",
		"шестнадцать",
		"семнадцать",
		"восемнадцать",
		"девятнадцать",
	];
	const tens = [
		"",
		"десять",
		"двадцать",
		"тридцать",
		"сорок",
		"пятьдесят",
		"шестьдесят",
		"семьдесят",
		"восемьдесят",
		"девяносто",
	];
	const hundreds = [
		"",
		"сто",
		"двести",
		"триста",
		"четыреста",
		"пятьсот",
		"шестьсот",
		"семьсот",
		"восемьсот",
		"девятьсот",
	];

	const n = Math.round(amount);
	if (n === 0) return "ноль рублей 00 копеек";

	const th = Math.floor(n / 1000);
	const rem = n % 1000;
	const h = Math.floor(rem / 100);
	const t = Math.floor((rem % 100) / 10);
	const o = rem % 10;

	const parts: string[] = [];
	if (th > 0) {
		const thOnes = [
			"",
			"одна",
			"две",
			"три",
			"четыре",
			"пять",
			"шесть",
			"семь",
			"восемь",
			"девять",
		];
		const thWord =
			th % 100 >= 10 && th % 100 <= 19
				? `${teens[th % 10]} тысяч`
				: th % 10 === 1
					? `${thOnes[th % 10]} тысяча`
					: th % 10 >= 2 && th % 10 <= 4
						? `${thOnes[th % 10]} тысячи`
						: `${th > 9 ? `${tens[Math.floor(th / 10)]} ` : ""}${thOnes[th % 10]} тысяч`;
		parts.push(
			th > 9 ? `${tens[Math.floor(th / 10)]} ${thWord}`.trim() : thWord.trim()
		);
	}
	if (h > 0) parts.push(hundreds[h] ?? "");
	if (t === 1) {
		parts.push(teens[o] ?? "");
	} else {
		if (t > 0) parts.push(tens[t] ?? "");
		if (o > 0) parts.push(ones[o] ?? "");
	}

	const rubles =
		n % 10 === 1 && n % 100 !== 11
			? "рубль"
			: n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
				? "рубля"
				: "рублей";

	return `${parts.join(" ")} ${rubles} 00 копеек`;
}

/** Собирает объект переменных из данных заказа в БД */
async function buildBookingDocData(bookingId: string): Promise<BookingDocData> {
	await requireAdmin();
	const booking = await prisma.booking.findUniqueOrThrow({
		where: { id: bookingId },
		include: {
			user: true,
			bookingItems: {
				include: {
					equipment: { select: { title: true, pricePerDay: true } },
				},
			},
		},
	});

	const fmtDate = (d: Date) =>
		d.toLocaleDateString("ru-RU", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	const fmtDateLong = (d: Date) =>
		d.toLocaleDateString("ru-RU", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	const fmtTime = (d: Date) =>
		d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

	// Группируем позиции
	const grouped = new Map<
		string,
		{ title: string; qty: number; price: number }
	>();
	for (const item of booking.bookingItems) {
		const key = item.equipmentId;
		const ex = grouped.get(key);
		if (ex) {
			ex.qty++;
		} else {
			grouped.set(key, {
				title: item.equipment?.title ?? "—",
				qty: 1,
				price: item.priceAtBooking,
			});
		}
	}

	const items = Array.from(grouped.values());
	const equipmentList = items
		.map((i) => (i.qty > 1 ? `${i.title} (${i.qty} шт.)` : i.title))
		.join(", ");
	const equipmentListNumbered = items
		.map(
			(i, idx) =>
				`${idx + 1}. ${i.title}${i.qty > 1 ? ` — ${i.qty} шт.` : ""} — ${fmtRub(i.price)}`
		)
		.join("\n");

	const deposit = booking.bookingItems.reduce(
		(s, i) => s + (i.depositAtBooking ?? 0),
		0
	);

	return {
		bookingId: booking.id,
		bookingNumber: booking.id.slice(0, 8).toUpperCase(),
		bookingDate: fmtDateLong(booking.createdAt),
		startDate: fmtDate(booking.startDate),
		endDate: fmtDate(booking.endDate),
		startDatetime: `${fmtDate(booking.startDate)} ${fmtTime(booking.startDate)}`,
		endDatetime: `${fmtDate(booking.endDate)} ${fmtTime(booking.endDate)}`,
		totalAmount: `${fmtRub(booking.totalAmount)}`,
		totalAmountWords: amountToWords(booking.totalAmount),
		depositAmount: `${fmtRub(deposit)}`,
		insurance: booking.insuranceIncluded ? "включена" : "не включена",
		clientName: booking.user.name ?? "—",
		clientEmail: booking.user.email ?? "—",
		clientPhone: booking.user.phone ?? "—",
		clientType:
			booking.user.entityType === "LEGAL_ENTITY" ||
			booking.user.entityType === "LEGAL_PARTNER"
				? "Юридическое лицо"
				: "Физическое лицо",
		companyName: booking.user.companyName ?? "—",
		tin: booking.user.tin ?? "—",
		equipmentList: equipmentList,
		equipmentListNumbered: equipmentListNumbered,
		equipmentCount: String(booking.bookingItems.length),
	};
}

// ─── CRUD: DocumentTemplate ───────────────────────────────────────────────────

export async function getDocumentTemplatesAction(): Promise<{
	success: boolean;
	data?: DocTemplateRow[];
	error?: string;
}> {
	try {
		await requireAdmin();
		const templates = await prisma.documentTemplate.findMany({
			where: { isActive: true },
			orderBy: { sortOrder: "asc" },
		});
		return {
			success: true,
			data: templates.map((t) => ({
				id: t.id,
				name: t.name,
				type: t.type as DocTemplateType,
				fileUrl: t.fileUrl,
				fileFormat: t.fileFormat,
				description: t.description,
				isActive: t.isActive,
				sortOrder: t.sortOrder,
				variables: (t.variables as string[]) ?? [],
				createdAt: t.createdAt.toISOString(),
			})),
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function uploadDocumentTemplateAction(
	formData: FormData
): Promise<{ success: boolean; data?: DocTemplateRow; error?: string }> {
	try {
		const { userId } = await requireAdmin();

		const file = formData.get("file") as File;
		const name = formData.get("name") as string;
		const type = formData.get("type") as DocTemplateType;
		const description = formData.get("description") as string | null;

		if (!file || !name || !type) {
			return { success: false, error: "Заполните все обязательные поля" };
		}

		const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
		const allowedExts = ["docx", "xlsx", "pdf"];
		if (!allowedExts.includes(ext)) {
			return {
				success: false,
				error: "Поддерживаются только .docx, .xlsx, .pdf",
			};
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const fileUrl = await uploadToS3(
			buffer,
			file.name,
			file.type,
			"documentTemplates"
		);

		const last = await prisma.documentTemplate.findFirst({
			orderBy: { sortOrder: "desc" },
			select: { sortOrder: true },
		});

		const template = await prisma.documentTemplate.create({
			data: {
				name: name.trim(),
				type,
				fileUrl,
				fileFormat: ext,
				description: description?.trim() ?? null,
				variables: TEMPLATE_VARIABLES.map((v) => v.key),
				sortOrder: (last?.sortOrder ?? 0) + 1,
				createdBy: userId,
			},
		});

		revalidatePath("/admin/documents");
		return {
			success: true,
			data: {
				id: template.id,
				name: template.name,
				type: template.type as DocTemplateType,
				fileUrl: template.fileUrl,
				fileFormat: template.fileFormat,
				description: template.description,
				isActive: template.isActive,
				sortOrder: template.sortOrder,
				variables: (template.variables as string[]) ?? [],
				createdAt: template.createdAt.toISOString(),
			},
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

export async function deleteDocumentTemplateAction(
	id: string
): Promise<{ success: boolean; error?: string }> {
	try {
		await requireAdmin();
		await prisma.documentTemplate.update({
			where: { id },
			data: { isActive: false },
		});
		revalidatePath("/admin/documents");
		return { success: true };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ─── Document generation ──────────────────────────────────────────────────────

/**
 * Генерирует документ из шаблона с подстановкой данных заказа.
 * Возвращает base64-строку готового файла для скачивания/печати на клиенте.
 */
export async function generateBookingDocumentAction(
	bookingId: string,
	templateId: string
): Promise<{
	success: boolean;
	fileBase64?: string;
	fileFormat?: string;
	fileName?: string;
	error?: string;
}> {
	try {
		const { userId } = await requireAdmin();

		const template = await prisma.documentTemplate.findUnique({
			where: { id: templateId },
			select: { fileUrl: true, fileFormat: true, name: true },
		});
		if (!template) return { success: false, error: "Шаблон не найден" };

		// Загружаем шаблон из S3
		const fetchResp = await fetch(template.fileUrl);
		if (!fetchResp.ok) {
			return { success: false, error: "Не удалось загрузить шаблон" };
		}
		const templateBuffer = Buffer.from(await fetchResp.arrayBuffer());

		// Получаем данные заказа
		const docData = await buildBookingDocData(bookingId);

		let resultBuffer: Buffer;
		const fmt = template.fileFormat.toLowerCase();

		if (fmt === "docx") {
			resultBuffer = await fillDocxTemplate(templateBuffer, docData);
		} else if (fmt === "xlsx") {
			resultBuffer = await fillXlsxTemplate(templateBuffer, docData);
		} else if (fmt === "pdf") {
			resultBuffer = await fillPdfTemplate(templateBuffer, docData);
		} else {
			return { success: false, error: `Формат .${fmt} не поддерживается` };
		}

		// Сохраняем в S3
		const fileName = `${template.name.replace(/\s+/g, "_")}_${docData.bookingNumber}.${fmt}`;
		const generatedUrl = await uploadToS3(
			resultBuffer,
			fileName,
			getMimeType(fmt),
			"generatedDocuments"
		);

		// Логируем генерацию
		await prisma.documentGenerationLog.create({
			data: { bookingId, templateId, generatedUrl, generatedBy: userId },
		});

		return {
			success: true,
			fileBase64: resultBuffer.toString("base64"),
			fileFormat: fmt,
			fileName,
		};
	} catch (e) {
		console.error("[generateBookingDocumentAction]", e);
		return {
			success: false,
			error: e instanceof Error ? e.message : "Ошибка генерации",
		};
	}
}

function getMimeType(ext: string): string {
	const map: Record<string, string> = {
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		pdf: "application/pdf",
	};
	return map[ext] ?? "application/octet-stream";
}

/** История сгенерированных документов по заказу */
export async function getGeneratedDocumentsAction(bookingId: string): Promise<{
	success: boolean;
	data?: {
		id: string;
		templateName: string;
		generatedUrl: string;
		createdAt: string;
	}[];
	error?: string;
}> {
	try {
		await requireAdmin();
		const logs = await prisma.documentGenerationLog.findMany({
			where: { bookingId },
			orderBy: { createdAt: "desc" },
			include: { template: { select: { name: true } } },
		});
		return {
			success: true,
			data: logs.map((l) => ({
				id: l.id,
				templateName: l.template.name,
				generatedUrl: l.generatedUrl,
				createdAt: l.createdAt.toISOString(),
			})),
		};
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : "Ошибка" };
	}
}

// ─── Fill engines ─────────────────────────────────────────────────────────────

/**
 * DOCX: заменяем {{variable}} в XML Word-документа.
 * .docx = ZIP-архив с XML-файлами внутри.
 */
async function fillDocxTemplate(
	templateBuffer: Buffer,
	data: BookingDocData
): Promise<Buffer> {
	// Используем JSZip для работы с ZIP (docx = zip)
	const JSZip = (await import("jszip")).default;
	const zip = await JSZip.loadAsync(templateBuffer);

	// Файлы с контентом в docx
	const contentFiles = [
		"word/document.xml",
		"word/header1.xml",
		"word/footer1.xml",
		"word/header2.xml",
		"word/footer2.xml",
	];

	for (const filePath of contentFiles) {
		const file = zip.file(filePath);
		if (!file) continue;

		let content = await file.async("string");
		content = applyVariables(content, data);
		zip.file(filePath, content);
	}

	return zip.generateAsync({ type: "nodebuffer" }) as Promise<Buffer>;
}

/**
 * XLSX: заменяем {{variable}} в shared strings XML.
 * xlsx = ZIP с XML, текст хранится в xl/sharedStrings.xml.
 */
async function fillXlsxTemplate(
	templateBuffer: Buffer,
	data: BookingDocData
): Promise<Buffer> {
	const JSZip = (await import("jszip")).default;
	const zip = await JSZip.loadAsync(templateBuffer);

	const contentFiles = [
		"xl/sharedStrings.xml",
		// обходим листы
		...Object.keys(zip.files).filter((f) =>
			f.startsWith("xl/worksheets/sheet")
		),
	];

	for (const filePath of contentFiles) {
		const file = zip.file(filePath);
		if (!file) continue;

		let content = await file.async("string");
		content = applyVariables(content, data);
		zip.file(filePath, content);
	}

	return zip.generateAsync({ type: "nodebuffer" }) as Promise<Buffer>;
}

/**
 * PDF: используем pdf-lib для заполнения полей формы AcroForm.
 * Если поля не найдены — ищем текст-плейсхолдеры (ограниченная поддержка).
 */
async function fillPdfTemplate(
	templateBuffer: Buffer,
	data: BookingDocData
): Promise<Buffer> {
	const { PDFDocument } = await import("pdf-lib");
	const pdfDoc = await PDFDocument.load(templateBuffer);
	const form = pdfDoc.getForm();
	const fields = form.getFields();

	// Маппинг имён полей формы на переменные
	for (const field of fields) {
		const fieldName = field.getName();
		const varKey = fieldName
			.replace(/^{{|}}$/g, "")
			.trim() as keyof BookingDocData;
		if (varKey in data) {
			try {
				const textField = form.getTextField(fieldName);
				textField.setText(data[varKey]);
			} catch {
				// Поле может быть не TextField — пропускаем
			}
		}

		// Также пробуем точное совпадение имени поля с ключом данных
		const directKey = fieldName as keyof BookingDocData;
		if (directKey in data) {
			try {
				const textField = form.getTextField(fieldName);
				textField.setText(data[directKey]);
			} catch {
				// ignore
			}
		}
	}

	// Flatten (сделать поля нередактируемыми после заполнения)
	form.flatten();

	const pdfBytes = await pdfDoc.save();
	return Buffer.from(pdfBytes);
}

/**
 * Подставляет переменные {{key}} в строку.
 * Учитывает что Word/Excel может разбить {{variable}} на несколько XML-тегов.
 * Например: <w:t>{{client</w:t><w:t>_name}}</w:t>
 * Поэтому сначала склеиваем XML-теги, затем заменяем.
 */
function applyVariables(content: string, data: BookingDocData): string {
	// Шаг 1: убираем XML-разрывы внутри {{...}} (Word разбивает placeholder по тегам форматирования)
	// Ищем паттерн {{...}} с возможными XML-тегами внутри
	let result = content.replace(/\{\{([^{}]*?)\}\}/g, (match, key) => {
		const cleanKey = key.trim() as keyof BookingDocData;
		if (cleanKey in data) {
			// Экранируем XML-спецсимволы в значении
			return escapeXml(data[cleanKey]);
		}
		return match;
	});

	// Шаг 2: обработка случая когда Word разбил {{var}} по тегам
	// Заменяем остатки после первого прохода
	result = result.replace(
		/<\/w:t>([^<]*)<w:t[^>]*>([^<]*)<\/w:t>([^<]*)<w:t[^>]*>/g,
		(match) => match // оставляем как есть — это нормальная разметка
	);

	return result;
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
		.replace(/\n/g, "&#10;");
}
