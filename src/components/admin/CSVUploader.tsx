"use client";

import {
	CheckCircleIcon,
	FileCsvIcon,
	UploadSimpleIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import type { EquipmentStatus } from "@prisma/client";
import Papa from "papaparse";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { importEquipmentFromCSV } from "@/actions/admin/upload-actions";
import {
	Button,
	Card,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { slugify } from "@/utils";

// ─── Нормализованная строка после парсинга ────────────────────────────────────
interface NormalizedRow {
	id: string;
	title: string;
	category: string;
	subcategory: string;
	status: string;
	pricePerDay: number;
	deposit: number;
	replacementValue: number;
	inventoryNumber: string | null;
	description: string | null;
	slug: string;
}

// ─── Маппинг категорий → categoryId ──────────────────────────────────────────
// Supabase-экспорт хранит русское название категории как строку.
// Здесь нужно обеспечить совпадение со slug'ами в таблице categories.
const CATEGORY_SLUG_MAP: Record<string, string> = {
	// Русские названия → slug (для обоих форматов)
	Камеры: "cameras",
	"Фото камеры": "cameras",
	Объективы: "lenses",
	Свет: "constant-light",
	"Постоянный свет": "constant-light",
	"Свето-формирующие насадки": "light-modifiers",
	"Световые приборы": "constant-light",
	"Импульсный свет": "flash",
	Штативы: "tripods",
	"Штативы и стойки": "tripods",
	Звук: "audio",
	"Звуковое оборудование": "audio",
	Видеокамеры: "video",
	Видео: "video",
	Стабилизаторы: "stabilizers",
	Слайдеры: "sliders",
	Аксессуары: "accessories",
	Прочее: "other",
	// Английские slug → себе (если уже slug)
	cameras: "cameras",
	lenses: "lenses",
	"constant-light": "constant-light",
	"light-modifiers": "light-modifiers",
	flash: "flash",
	tripods: "tripods",
	audio: "audio",
	video: "video",
	stabilizers: "stabilizers",
	sliders: "sliders",
	accessories: "accessories",
	other: "other",
};

const STATUS_MAP: Record<string, EquipmentStatus> = {
	// Русские
	Доступен: "AVAILABLE",
	Занят: "RENTED",
	Арендован: "RENTED",
	Резерв: "RESERVED",
	Обслуживание: "MAINTENANCE",
	Сломан: "BROKEN",
	// Английские (из Supabase)
	available: "AVAILABLE",
	rented: "RENTED",
	reserved: "RESERVED",
	maintenance: "MAINTENANCE",
	broken: "BROKEN",
	retired: "RETIRED",
};

// ─── Определяем формат и нормализуем строки ───────────────────────────────────
function detectAndNormalize(rows: Record<string, string>[]): NormalizedRow[] {
	if (rows.length === 0) return [];

	const firstRow = rows[0];
	if (!firstRow) return [];
	// Если есть колонка "title" — это Supabase-формат (английский)
	const isSupabaseFormat = "title" in firstRow;

	return rows
		.map((row): NormalizedRow | null => {
			if (isSupabaseFormat) {
				// ── Формат А: Supabase export ──────────────────────────────────
				const title = row.title?.trim();
				if (!title) return null;

				const replacementValue = parseFloat(row.replacementValue ?? "0") || 0;
				const pricePerDay =
					parseFloat(row.pricePerDay ?? "0") ||
					Math.round(replacementValue * 0.03);

				return {
					id: row.id ?? "",
					title,
					category: row.category?.trim() ?? "other",
					subcategory: row.subcategory?.trim() ?? "",
					status: row.status?.trim() ?? "available",
					pricePerDay,
					deposit: parseFloat(row.deposit ?? "0") || 0,
					replacementValue,
					inventoryNumber: row.inventory_number?.trim() || null,
					description: row.description?.trim() || null,
					// Используем существующий slug если есть, иначе генерируем
					slug: row.slug?.trim() || slugify(title),
				};
			} else {
				// ── Формат Б: ручной русский ───────────────────────────────────
				const title = row.Название?.trim();
				if (!title) return null;

				const replacementValue =
					parseFloat(row["Стоимость покупки"] ?? "0") || 0;
				const dailyPrice = Math.round(replacementValue * 0.03);

				return {
					id: "ID",
					title,
					category: row.Категория?.trim() ?? "Прочее",
					subcategory: row.Подскатегория?.trim() ?? "",
					status: row.Статус?.trim() ?? "Доступен",
					pricePerDay: dailyPrice,
					deposit: parseFloat(row["Сумма депозита"] ?? "0") || 0,
					replacementValue,
					inventoryNumber: row["Инв. номер"]?.trim() || null,
					description: row.Описание?.trim() || null,
					slug: slugify(title),
				};
			}
		})
		.filter((r): r is NormalizedRow => r !== null);
}

// ─── Нормализованная строка → формат для importEquipmentCSVAction ─────────────
function toImportRow(row: NormalizedRow) {
	const status = STATUS_MAP[row.status] ?? "AVAILABLE";
	const category = CATEGORY_SLUG_MAP[row.category] ?? "other";

	return {
		id: row.id,
		title: row.title,
		slug: row.slug,
		category,
		subcategory: row.subcategory,
		description: row.description,
		inventoryNumber: row.inventoryNumber,
		deposit: row.deposit,
		replacementValue: row.replacementValue,
		pricePerDay: row.pricePerDay,
		price4h: Math.round(row.pricePerDay * 0.6),
		price8h: Math.round(row.pricePerDay * 0.8),
		status,
		isAvailable: status === "AVAILABLE",
	};
}

type ImportResult =
	| { type: "success"; count: number }
	| { type: "error"; message: string };

// ─── Компонент ────────────────────────────────────────────────────────────────

interface CSVUploaderProps {
	onSuccess?: () => void;
}
export function CSVUploader({ onSuccess }: CSVUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	// null = ещё не загружали, [] = загрузили но пусто (ошибка), [...] = данные
	const [preview, setPreview] = useState<NormalizedRow[] | null>(null);
	const [result, setResult] = useState<ImportResult | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const processFile = (file: File) => {
		if (!file.name.endsWith(".csv") && !file.name.endsWith(".tsv")) {
			setResult({
				type: "error",
				message: "Поддерживаются только .csv и .tsv файлы",
			});
			return;
		}

		setResult(null);
		setPreview(null);

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			// Автодетект разделителя — PapaParse сам разберётся
			complete: (results) => {
				const rows = results.data as Record<string, string>[];
				const normalized = detectAndNormalize(rows);

				if (normalized.length === 0) {
					setResult({
						type: "error",
						message:
							'Не удалось распознать данные. Проверьте что файл содержит колонки "title" или "Название".',
					});
					// Важно: не меняем preview — оставляем null, дропзона остаётся видимой
					return;
				}

				setPreview(normalized);
			},
			error: (err) => {
				setResult({
					type: "error",
					message: `Ошибка парсинга: ${err.message}`,
				});
			},
		});
	};

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) processFile(file);
		e.target.value = "";
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) processFile(file);
	};

	const handleImport = async () => {
		if (!preview?.length) return;
		setIsUploading(true);
		setResult(null);

		try {
			const formatted = preview.map(toImportRow);
			const res = await importEquipmentFromCSV(formatted);

			if (!res.success) {
				setResult({
					type: "error",
					message: res.error ?? "Неизвестная ошибка",
				});
			} else {
				setResult({ type: "success", count: res.count ?? 0 });
				toast.success(`Успешно импортировано ${res.count} записей`);
				setPreview(null);
				onSuccess?.();
			}
		} finally {
			setIsUploading(false);
		}
	};

	const reset = () => {
		setPreview(null);
		setResult(null);
	};

	return (
		<div className="space-y-3">
			{/* ── Drop Zone — показываем только если нет preview ── */}
			{preview === null && (
				<Card
					onDragOver={(e) => {
						e.preventDefault();
						setIsDragging(true);
					}}
					onDragLeave={() => setIsDragging(false)}
					onDrop={handleDrop}
					onClick={() => inputRef.current?.click()}
					className={cn(
						"relative flex flex-col items-center justify-center gap-3 px-2 py-4",
						"border-2 border-dashed rounded-2xl cursor-pointer",
						"transition-all duration-200 select-none",
						isDragging
							? "border-primary bg-primary/10 scale-[1.01]"
							: "border-foreground/10 bg-foreground/3 hover:border-foreground/20 hover:bg-foreground/5"
					)}
				>
					<div className="text-center">
						<div className="flex gap-2 items-center justify-center">
							<span className="text-sm font-semibold">
								Загрузчик{" "}
								<FileCsvIcon
									size={16}
									weight="regular"
									className={cn(
										"inline",
										isDragging ? "text-primary" : "text-foreground"
									)}
								/>{" "}
								таблиц
							</span>
						</div>
						<p className="text-[9px] text-muted-foreground mt-1">
							.csv / .tsv — Supabase-экспорт или ручной формат
						</p>
					</div>
					<input
						ref={inputRef}
						type="file"
						accept=".csv,.tsv"
						onChange={handleFileInput}
						className="hidden"
					/>
				</Card>
			)}

			{/* ── Preview table ── */}
			{preview !== null && preview.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<p className="text-sm font-bold">
							Предпросмотр —{" "}
							<span className="text-primary">{preview.length} строк</span>
						</p>
						<Button
							variant="ghost"
							size="sm"
							onClick={reset}
							className="text-xs"
						>
							Отменить
						</Button>
					</div>

					<div className="overfrounded-xl border border-foreground/10 overflow-y-auto max-h-[50vh] text-sm relativelow-x-auto rounded-xl">
						<Table className="w-full text-xs">
							<TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
								<TableRow className="bg-muted-foreground/50 hover:bg-muted-foreground/50">
									{[
										"Название",
										"Категория",
										"Инв. №",
										"Цена/день",
										"Статус",
									].map((col, index) => (
										<TableHead
											key={`${col}-${index}`}
											className="font-bold whitespace-nowrap px-4 py-3 border-r border-foreground/5 last:border-0"
										>
											{col}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{preview.map((row, i) => (
									<TableRow
										key={i}
										className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors"
									>
										<TableCell className="px-2 py-2 font-medium max-w-48 truncate">
											{row.title}
										</TableCell>
										<TableCell className="px-2 py-2 text-muted-foreground">
											{row.category || "—"}
										</TableCell>
										<TableCell className="px-2 py-2 text-muted-foreground font-mono">
											{row.inventoryNumber || "—"}
										</TableCell>
										<TableCell className="px-2 py-2">
											{row.pricePerDay > 0 ? `${row.pricePerDay} ₽` : "—"}
										</TableCell>
										<TableCell className="px-2 py-2">
											<span
												className={cn(
													"px-2 py-0.5 rounded-full text-[10px] font-bold border",
													row.status === "available" ||
														row.status === "Доступен"
														? "bg-green-500/10 text-green-400 border-green-500/20"
														: "bg-amber-500/10 text-amber-400 border-amber-500/20"
												)}
											>
												{row.status || "—"}
											</span>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					<Button
						onClick={handleImport}
						disabled={isUploading}
						className="w-full gap-2"
					>
						<UploadSimpleIcon size={15} />
						{isUploading
							? "Импортируем..."
							: `Импортировать ${preview.length} позиций`}
					</Button>
				</div>
			)}

			{/* ── Result ── */}
			{result && (
				<div
					className={cn(
						"flex items-start gap-3 p-4 rounded-xl border text-sm",
						result.type === "success"
							? "bg-green-500/10 border-green-500/20 text-green-400"
							: "bg-red-500/10 border-red-500/20 text-red-400"
					)}
				>
					{result.type === "success" ? (
						<CheckCircleIcon size={18} className="shrink-0 mt-0.5" />
					) : (
						<XCircleIcon size={18} className="shrink-0 mt-0.5" />
					)}
					<div>
						{result.type === "success" ? (
							<>
								<p className="font-bold">Импорт завершён</p>
								<p className="text-xs mt-0.5 text-green-400/70">
									Загружено {result.count} позиций
								</p>
							</>
						) : (
							<>
								<p className="font-bold">Ошибка импорта</p>
								<p className="text-xs mt-0.5 opacity-70">{result.message}</p>
							</>
						)}
					</div>
					<button
						type="button"
						onClick={() => setResult(null)}
						className="ml-auto shrink-0 opacity-50 hover:opacity-100"
					>
						✕
					</button>
				</div>
			)}
		</div>
	);
}
