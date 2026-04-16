"use client";

import {
	ChevronRight,
	Clock,
	Download,
	ExternalLink,
	FileText,
	Loader2,
	Plus,
	Printer,
	RefreshCw,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deleteDocumentTemplateAction,
	generateBookingDocumentAction,
	getDocumentTemplatesAction,
	getGeneratedDocumentsAction,
	uploadDocumentTemplateAction,
} from "@/actions/admin-document-template-actions";
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import { TEMPLATE_VARIABLES } from "@/constants";
import { cn } from "@/lib/utils";
import type { DocTemplateRow, DocTemplateType } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedDoc {
	id: string;
	templateName: string;
	generatedUrl: string;
	createdAt: string;
}

const TEMPLATE_TYPE_LABELS: Record<DocTemplateType, string> = {
	CONTRACT_INDIVIDUAL: "Договор (физ. лицо)",
	CONTRACT_LEGAL: "Договор (юр. лицо)",
	ACT: "Акт выполненных работ",
	INVOICE: "Счёт на оплату",
	RECEIPT: "Квитанция",
	CUSTOM: "Произвольный",
};

const FORMAT_ICONS: Record<string, React.ReactNode> = {
	docx: (
		<span className="text-blue-500 font-mono text-[10px] font-bold">DOCX</span>
	),
	xlsx: (
		<span className="text-green-500 font-mono text-[10px] font-bold">XLSX</span>
	),
	pdf: (
		<span className="text-red-500 font-mono text-[10px] font-bold">PDF</span>
	),
};

// ─── Upload form ──────────────────────────────────────────────────────────────

function UploadTemplateForm({
	onUploaded,
	onClose,
}: {
	onUploaded: (t: DocTemplateRow) => void;
	onClose: () => void;
}) {
	const [name, setName] = useState("");
	const [type, setType] = useState<DocTemplateType>("CONTRACT_INDIVIDUAL");
	const [description, setDescription] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [isPending, startTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = () => {
		if (!file || !name.trim()) {
			toast.error("Укажите название и выберите файл");
			return;
		}
		startTransition(async () => {
			const fd = new FormData();
			fd.append("file", file);
			fd.append("name", name);
			fd.append("type", type);
			fd.append("description", description);
			const r = await uploadDocumentTemplateAction(fd);
			if (r.success && r.data) {
				onUploaded(r.data);
				toast.success("Шаблон загружен");
				onClose();
			} else {
				toast.error(r.error ?? "Ошибка загрузки");
			}
		});
	};

	return (
		<div className="p-4 rounded-xl bg-foreground/4 border border-foreground/10 space-y-3">
			<div className="flex items-center justify-between">
				<p className="text-xs font-bold">Загрузить шаблон</p>
				<button
					type="button"
					onClick={onClose}
					className="text-muted-foreground hover:text-foreground"
				>
					<X size={13} />
				</button>
			</div>

			<div className="space-y-1">
				<Label className="text-[10px] text-muted-foreground">Название *</Label>
				<Input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Договор аренды физ. лицо"
					className="h-8 text-xs"
				/>
			</div>

			<div className="space-y-1">
				<Label className="text-[10px] text-muted-foreground">Тип *</Label>
				<Select
					value={type}
					onValueChange={(v) => setType(v as DocTemplateType)}
				>
					<SelectTrigger className="h-8 text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{(
							Object.entries(TEMPLATE_TYPE_LABELS) as [
								DocTemplateType,
								string,
							][]
						).map(([k, v]) => (
							<SelectItem key={k} value={k} className="text-xs">
								{v}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1">
				<Label className="text-[10px] text-muted-foreground">
					Описание (опц.)
				</Label>
				<Input
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Краткое описание шаблона..."
					className="h-8 text-xs"
				/>
			</div>

			<div className="space-y-1">
				<Label className="text-[10px] text-muted-foreground">
					Файл * (.docx, .xlsx, .pdf)
				</Label>
				<button
					className={cn(
						"border-2 border-dashed border-foreground/15 rounded-xl p-4 text-center cursor-pointer transition-colors",
						file
							? "border-primary/40 bg-primary/5"
							: "hover:border-foreground/30"
					)}
					onClick={() => inputRef.current?.click()}
					onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
					type="button"
					tabIndex={0}
				>
					<input
						ref={inputRef}
						type="file"
						accept=".docx,.xlsx,.pdf"
						className="hidden"
						onChange={(e) => setFile(e.target.files?.[0] ?? null)}
					/>
					{file ? (
						<div className="flex items-center justify-center gap-2">
							<FileText size={14} className="text-primary" />
							<span className="text-xs font-medium truncate max-w-48">
								{file.name}
							</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setFile(null);
								}}
								className="text-muted-foreground hover:text-red-500"
							>
								<X size={12} />
							</button>
						</div>
					) : (
						<div className="space-y-1">
							<Upload size={20} className="mx-auto text-muted-foreground/40" />
							<p className="text-[11px] text-muted-foreground">
								Нажмите или перетащите файл
							</p>
							<p className="text-[10px] text-muted-foreground/60">
								.docx .xlsx .pdf
							</p>
						</div>
					)}
				</button>
			</div>

			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					className="flex-1 text-xs"
					onClick={onClose}
					disabled={isPending}
				>
					Отмена
				</Button>
				<Button
					size="sm"
					className="flex-1 text-xs gap-1"
					onClick={handleSubmit}
					disabled={isPending || !file || !name.trim()}
				>
					{isPending ? (
						<Loader2 size={12} className="animate-spin" />
					) : (
						<Upload size={12} />
					)}
					{isPending ? "Загрузка..." : "Загрузить"}
				</Button>
			</div>
		</div>
	);
}

// ─── Variables reference ──────────────────────────────────────────────────────

function VariablesReference({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	if (!open) return null;
	return (
		<div className="p-3 rounded-xl bg-foreground/4 border border-foreground/10 space-y-2">
			<div className="flex items-center justify-between">
				<p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
					Переменные для шаблонов
				</p>
				<button
					type="button"
					onClick={onClose}
					className="text-muted-foreground hover:text-foreground"
				>
					<X size={12} />
				</button>
			</div>
			<p className="text-[10px] text-muted-foreground">
				Вставьте в документ в формате{" "}
				<code className="bg-foreground/8 px-1 py-0.5 rounded font-mono">
					{"{{имя_переменной}}"}
				</code>
			</p>
			<div className="space-y-1 max-h-52 overflow-y-auto">
				{TEMPLATE_VARIABLES.map((v) => (
					<div
						key={v.key}
						className="flex items-start gap-2 py-1 border-b border-foreground/5 last:border-0"
					>
						<code className="text-[10px] font-mono text-primary shrink-0 mt-0.5">
							{`{{${v.key}}}`}
						</code>
						<div className="min-w-0">
							<p className="text-[10px] font-medium">{v.label}</p>
							<p className="text-[10px] text-muted-foreground truncate">
								{v.example}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Document generation result ───────────────────────────────────────────────

function GenerationResult({
	fileBase64,
	fileFormat,
	fileName,
	onClose,
}: {
	fileBase64: string;
	fileFormat: string;
	fileName: string;
	onClose: () => void;
}) {
	const mimeMap: Record<string, string> = {
		docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		pdf: "application/pdf",
	};
	const mime = mimeMap[fileFormat] ?? "application/octet-stream";

	const handleDownload = () => {
		const byteCharacters = atob(fileBase64);
		const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
		const byteArray = new Uint8Array(byteNumbers);
		const blob = new Blob([byteArray], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handlePrint = () => {
		// Для PDF — открываем в iframe и вызываем print
		// Для docx/xlsx — скачиваем (браузер не печатает напрямую)
		if (fileFormat === "pdf") {
			const byteCharacters = atob(fileBase64);
			const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
			const blob = new Blob([new Uint8Array(byteNumbers)], {
				type: "application/pdf",
			});
			const url = URL.createObjectURL(blob);

			const iframe = document.createElement("iframe");
			iframe.style.display = "none";
			iframe.src = url;
			document.body.appendChild(iframe);
			iframe.onload = () => {
				iframe.contentWindow?.focus();
				iframe.contentWindow?.print();
				// Убираем iframe после печати
				setTimeout(() => {
					document.body.removeChild(iframe);
					URL.revokeObjectURL(url);
				}, 2000);
			};
		} else {
			// Для docx/xlsx — скачиваем и сообщаем пользователю открыть в Word/Excel для печати
			handleDownload();
			toast.info(
				"Файл скачан. Откройте в Word / Excel и нажмите Ctrl+P для печати."
			);
		}
	};

	return (
		<div className="p-3 rounded-xl bg-green-500/8 border border-green-500/20 space-y-3">
			<div className="flex items-center gap-2">
				<div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
					<FileText size={15} className="text-green-500" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-xs font-semibold text-green-600 dark:text-green-400">
						Документ сформирован
					</p>
					<p className="text-[10px] text-muted-foreground truncate">
						{fileName}
					</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="text-muted-foreground hover:text-foreground shrink-0"
				>
					<X size={12} />
				</button>
			</div>
			<div className="flex gap-2">
				<Button
					size="sm"
					variant="outline"
					className="flex-1 text-xs gap-1 text-green-600 border-green-500/30 hover:bg-green-500/10"
					onClick={handleDownload}
				>
					<Download size={12} /> Скачать
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="flex-1 text-xs gap-1"
					onClick={handlePrint}
				>
					<Printer size={12} />{" "}
					{fileFormat === "pdf" ? "Печать" : "Скачать и открыть"}
				</Button>
			</div>
		</div>
	);
}

// ─── Main: DocumentsPanel ─────────────────────────────────────────────────────

interface DocumentsPanelProps {
	bookingId: string;
}

export function DocumentsPanel({ bookingId }: DocumentsPanelProps) {
	const [templates, setTemplates] = useState<DocTemplateRow[]>([]);
	const [generated, setGenerated] = useState<GeneratedDoc[]>([]);
	const [loading, setLoading] = useState(true);
	const [showUpload, setShowUpload] = useState(false);
	const [showVars, setShowVars] = useState(false);
	const [generatingId, setGeneratingId] = useState<string | null>(null);
	const [result, setResult] = useState<{
		fileBase64: string;
		fileFormat: string;
		fileName: string;
	} | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		Promise.all([
			getDocumentTemplatesAction(),
			getGeneratedDocumentsAction(bookingId),
		]).then(([tRes, gRes]) => {
			if (cancelled) return;
			if (tRes.success) setTemplates(tRes.data ?? []);
			if (gRes.success) setGenerated(gRes.data ?? []);
			setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [bookingId]);

	const handleGenerate = async (templateId: string) => {
		setGeneratingId(templateId);
		setResult(null);
		const r = await generateBookingDocumentAction(bookingId, templateId);
		setGeneratingId(null);
		if (r.success && r.fileBase64 && r.fileFormat && r.fileName) {
			setResult({
				fileBase64: r.fileBase64,
				fileFormat: r.fileFormat,
				fileName: r.fileName,
			});
			// Добавляем в историю (optimistic)
			const tpl = templates.find((t) => t.id === templateId);
			if (tpl) {
				setGenerated((prev) => [
					{
						id: crypto.randomUUID(),
						templateName: tpl.name,
						generatedUrl: "#",
						createdAt: new Date().toISOString(),
					},
					...prev,
				]);
			}
			toast.success("Документ сформирован");
		} else {
			toast.error(r.error ?? "Ошибка генерации");
		}
	};

	const handleDeleteTemplate = async (id: string) => {
		const r = await deleteDocumentTemplateAction(id);
		if (r.success) {
			setTemplates((prev) => prev.filter((t) => t.id !== id));
			toast.success("Шаблон удалён");
		} else {
			toast.error(r.error ?? "Ошибка");
		}
	};

	if (loading) {
		return (
			<div className="py-10 flex items-center justify-center gap-2 text-muted-foreground">
				<Loader2 size={16} className="animate-spin" />
				<span className="text-sm">Загрузка шаблонов...</span>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header actions */}
			<div className="flex items-center gap-2 flex-wrap">
				<Button
					size="sm"
					variant="outline"
					className="h-8 text-xs gap-1"
					onClick={() => {
						setShowUpload(true);
						setShowVars(false);
					}}
				>
					<Plus size={12} /> Загрузить шаблон
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="h-8 text-xs gap-1 text-muted-foreground"
					onClick={() => {
						setShowVars((v) => !v);
						setShowUpload(false);
					}}
				>
					<ChevronRight
						size={12}
						className={cn("transition-transform", showVars && "rotate-90")}
					/>
					Переменные
				</Button>
			</div>

			{/* Upload form */}
			{showUpload && (
				<UploadTemplateForm
					onUploaded={(t) => setTemplates((prev) => [...prev, t])}
					onClose={() => setShowUpload(false)}
				/>
			)}

			{/* Variables reference */}
			<VariablesReference open={showVars} onClose={() => setShowVars(false)} />

			{/* Generation result */}
			{result && (
				<GenerationResult {...result} onClose={() => setResult(null)} />
			)}

			{/* Templates list */}
			{templates.length === 0 ? (
				<div className="py-8 text-center space-y-2">
					<FileText size={28} className="mx-auto text-muted-foreground/20" />
					<p className="text-sm text-muted-foreground">
						Нет загруженных шаблонов
					</p>
					<p className="text-[11px] text-muted-foreground/60">
						Загрузите .docx, .xlsx или .pdf с переменными вида{" "}
						<code className="font-mono">{"{{client_name}}"}</code>
					</p>
				</div>
			) : (
				<div className="space-y-2">
					<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
						Шаблоны документов
					</p>
					{templates.map((t) => (
						<div
							key={t.id}
							className="flex items-center gap-3 p-3 rounded-xl bg-foreground/3 border border-foreground/8 hover:bg-foreground/5 transition-colors"
						>
							<div className="w-8 h-8 rounded-lg bg-foreground/8 flex items-center justify-center shrink-0">
								{FORMAT_ICONS[t.fileFormat] ?? (
									<FileText size={14} className="text-muted-foreground" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium truncate">{t.name}</p>
								<p className="text-[10px] text-muted-foreground">
									{TEMPLATE_TYPE_LABELS[t.type]}
									{t.description && ` · ${t.description}`}
								</p>
							</div>
							<div className="flex items-center gap-1 shrink-0">
								<Button
									size="sm"
									variant="outline"
									className="h-7 text-[11px] gap-1 px-2.5"
									onClick={() => handleGenerate(t.id)}
									disabled={generatingId !== null}
								>
									{generatingId === t.id ? (
										<Loader2 size={11} className="animate-spin" />
									) : (
										<RefreshCw size={11} />
									)}
									{generatingId === t.id ? "..." : "Сформировать"}
								</Button>
								<button
									type="button"
									onClick={() => handleDeleteTemplate(t.id)}
									className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
									title="Удалить шаблон"
								>
									<Trash2 size={12} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Generation history */}
			{generated.length > 0 && (
				<div className="space-y-2">
					<p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
						История документов
					</p>
					{generated.map((doc) => (
						<div
							key={doc.id}
							className="flex items-center gap-2.5 py-2 border-b border-foreground/5 last:border-0"
						>
							<Clock size={11} className="text-muted-foreground shrink-0" />
							<div className="flex-1 min-w-0">
								<p className="text-xs truncate">{doc.templateName}</p>
								<p className="text-[10px] text-muted-foreground">
									{new Date(doc.createdAt).toLocaleString("ru-RU", {
										day: "numeric",
										month: "short",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							</div>
							{doc.generatedUrl !== "#" && (
								<a
									href={doc.generatedUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-muted-foreground hover:text-foreground transition-colors"
									title="Открыть"
								>
									<ExternalLink size={12} />
								</a>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
