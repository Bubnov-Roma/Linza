"use client";

import {
	CaretRightIcon,
	CircleNotchIcon,
	FileTextIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	deleteDocumentTemplateAction,
	getDocumentTemplatesAction,
	uploadDocumentTemplateAction,
} from "@/actions/admin-document-template-actions";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import {
	FORMAT_COLORS,
	TEMPLATE_TYPE_LABELS,
	TEMPLATE_VARIABLES,
} from "@/constants";
import { cn } from "@/lib/utils";
import type { DocTemplateRow, DocTemplateType } from "@/types";

export default function AdminDocumentsPage() {
	const [templates, setTemplates] = useState<DocTemplateRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [showUpload, setShowUpload] = useState(false);
	const [showVars, setShowVars] = useState(false);

	// Upload form state
	const [name, setName] = useState("");
	const [type, setType] = useState<DocTemplateType>("CONTRACT_INDIVIDUAL");
	const [description, setDescription] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [isPending, startTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		getDocumentTemplatesAction().then((r) => {
			if (r.success) setTemplates(r.data ?? []);
			setLoading(false);
		});
	}, []);

	const handleUpload = () => {
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
			const result = await uploadDocumentTemplateAction(fd);
			if (result.success && result.data) {
				const newData = result.data as DocTemplateRow;
				setTemplates((prev) => [...prev, newData]);
				setName("");
				setDescription("");
				setFile(null);
				setShowUpload(false);
				toast.success("Шаблон загружен");
			} else {
				toast.error(result.error ?? "Ошибка загрузки");
			}
		});
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Удалить шаблон?")) return;
		const r = await deleteDocumentTemplateAction(id);
		if (r.success) {
			setTemplates((prev) => prev.filter((t) => t.id !== id));
			toast.success("Шаблон удалён");
		} else {
			toast.error(r.error ?? "Ошибка");
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-black italic uppercase tracking-tight">
						Документы
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Договоры, акты, счета · {templates.length} шаблонов
					</p>
				</div>
				<div className="flex flex-col md:flex-row gap-2">
					<Button
						variant="outline"
						size="sm"
						className="gap-1.5"
						onClick={() => setShowVars((v) => !v)}
					>
						<CaretRightIcon
							size={14}
							className={cn("transition-transform", showVars && "rotate-90")}
						/>
						Переменные
					</Button>
					<Button
						size="sm"
						className="gap-1.5"
						onClick={() => setShowUpload((v) => !v)}
					>
						<PlusIcon size={14} /> Добавить шаблон
					</Button>
				</div>
			</div>

			{/* Variables reference */}
			{showVars && (
				<Card className="py-4">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-bold">
								Доступные переменные
							</CardTitle>
							<button
								type="button"
								onClick={() => setShowVars(false)}
								className="text-muted-foreground hover:text-foreground"
							>
								<XIcon size={14} />
							</button>
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Вставьте в документ в формате{" "}
							<code className="bg-foreground/8 px-1 py-0.5 rounded font-mono text-xs">
								{"{{имя_переменной}}"}
							</code>{" "}
							— при генерации подставятся реальные данные заказа.
						</p>
					</CardHeader>
					<CardContent className="pt-0">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
							{TEMPLATE_VARIABLES.map((v) => (
								<div
									key={v.key}
									className="flex items-baseline justify-between gap-2 p-2.5 rounded-lg bg-foreground/15 border border-foreground/8"
								>
									<code className="text-xs px-1 font-mono text-primary-accent shrink-0 mt-0.5 select-all bg-background rounded">
										{`{{${v.key}}}`}
									</code>
									<div className="min-w-0 text-end">
										<p className="text-xs font-medium">{v.label}</p>
										<p className="text-[10px] text-muted-foreground truncate">
											{v.example}
										</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Templates list */}
				{loading ? (
					<div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
						<CircleNotchIcon size={18} className="animate-spin" />
						<span className="text-sm">Загрузка...</span>
					</div>
				) : templates.length === 0 ? (
					<Card className="py-4">
						<CardContent className="py-16 text-center space-y-3">
							<FileTextIcon
								size={40}
								className="mx-auto text-muted-foreground/20"
							/>
							<p className="text-sm text-muted-foreground">Нет шаблонов</p>
							<p className="text-xs text-muted-foreground/60 max-w-sm mx-auto">
								Загрузите .docx, .xlsx или .pdf с переменными вида{" "}
								<code className="font-mono">{"{{client_name}}"}</code>. При
								формировании документа переменные автоматически заменятся
								данными заказа.
							</p>
							<Button
								size="sm"
								className="mt-2 gap-1.5"
								onClick={() => setShowUpload(true)}
							>
								<PlusIcon size={14} /> Загрузить первый шаблон
							</Button>
						</CardContent>
					</Card>
				) : (
					<Card className="py-4">
						<CardContent className="p-0">
							<table className="w-full">
								<thead>
									<tr className="border-b border-foreground/5">
										{["Название", "Тип", "Формат", "Загружен", ""].map((h) => (
											<th
												key={h}
												className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{templates.map((t) => (
										<tr
											key={t.id}
											className="border-b border-foreground/5 last:border-0 hover:bg-foreground/3 transition-colors"
										>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2.5">
													<div className="w-8 h-8 rounded-lg bg-foreground/8 flex items-center justify-center shrink-0">
														<FileTextIcon
															size={15}
															className="text-muted-foreground"
														/>
													</div>
													<div>
														<p className="text-sm font-medium">{t.name}</p>
														{t.description && (
															<p className="text-[11px] text-muted-foreground truncate max-w-48">
																{t.description}
															</p>
														)}
													</div>
												</div>
											</td>
											<td className="px-4 py-3">
												<span className="text-xs text-muted-foreground">
													{TEMPLATE_TYPE_LABELS[t.type]}
												</span>
											</td>
											<td className="px-4 py-3">
												<Badge
													variant="outline"
													className={cn(
														"text-[10px] font-mono font-bold uppercase",
														FORMAT_COLORS[t.fileFormat] ??
															"bg-foreground/8 text-foreground/60"
													)}
												>
													{t.fileFormat}
												</Badge>
											</td>
											<td className="px-4 py-3 text-xs text-muted-foreground">
												{new Date(t.createdAt).toLocaleDateString("ru-RU", {
													day: "numeric",
													month: "short",
													year: "numeric",
												})}
											</td>
											<td className="px-4 py-3 text-right">
												<button
													type="button"
													onClick={() => handleDelete(t.id)}
													className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
													title="Удалить"
												>
													<TrashIcon size={13} />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</CardContent>
					</Card>
				)}
				{/* Upload form */}
				{showUpload && (
					<Card className="py-4">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm font-bold">
									Новый шаблон
								</CardTitle>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setShowUpload(false)}
									className="text-muted-foreground hover:text-foreground"
								>
									<XIcon size={14} />
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="grid grid-cols-1 gap-4">
									<div className="space-y-1.5">
										<Label>Название *</Label>
										<Input
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="Договор аренды физ. лицо"
											className="glass-input"
										/>
									</div>
									<div className="space-y-1.5">
										<Label>Тип документа *</Label>
										<Select
											value={type}
											onValueChange={(v) => setType(v as DocTemplateType)}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{(
													Object.entries(TEMPLATE_TYPE_LABELS) as [
														DocTemplateType,
														string,
													][]
												).map(([k, v]) => (
													<SelectItem key={k} value={k}>
														{v}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1.5">
										<Label>Описание</Label>
										<Input
											value={description}
											onChange={(e) => setDescription(e.target.value)}
											placeholder="Краткое описание шаблона ( опционально )"
											className="glass-input"
										/>
									</div>
								</div>
								{/* File drop zone */}
								<div className="space-y-1.5">
									<Label>Файл * (.docx, .xlsx, .pdf)</Label>
									<button
										className={cn(
											"border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
											file
												? "border-primary/40 bg-primary/5"
												: "border-foreground/15 hover:border-foreground/30"
										)}
										onClick={() => inputRef.current?.click()}
										onKeyDown={(e) =>
											e.key === "Enter" && inputRef.current?.click()
										}
										type="button"
										tabIndex={0}
										onDragOver={(e) => e.preventDefault()}
										onDrop={(e) => {
											e.preventDefault();
											const dropped = e.dataTransfer.files[0];
											if (dropped) setFile(dropped);
										}}
									>
										<input
											ref={inputRef}
											type="file"
											accept=".docx,.xlsx,.pdf"
											className="hidden"
											onChange={(e) => setFile(e.target.files?.[0] ?? null)}
										/>
										{file ? (
											<div className="flex items-center justify-center gap-3">
												<FileTextIcon size={20} className="text-primary" />
												<div className="text-left">
													<p className="text-sm font-medium">{file.name}</p>
													<p className="text-xs text-muted-foreground">
														{(file.size / 1024).toFixed(0)} KB
													</p>
												</div>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setFile(null);
													}}
													className="text-muted-foreground hover:text-red-500 ml-2"
												>
													<XIcon size={14} />
												</button>
											</div>
										) : (
											<div className="space-y-2">
												<FileTextIcon
													size={32}
													className="mx-auto text-muted-foreground/30"
												/>
												<p className="text-sm text-muted-foreground">
													Нажмите или перетащите файл
												</p>
												<p className="text-xs text-muted-foreground/60">
													.docx · .xlsx · .pdf — до 20 МБ
												</p>
											</div>
										)}
									</button>
								</div>
							</div>
							<div className="flex gap-2 pt-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={() => setShowUpload(false)}
									disabled={isPending}
								>
									Отмена
								</Button>
								<Button
									className="flex-1 gap-2"
									onClick={handleUpload}
									disabled={isPending || !file || !name.trim()}
								>
									{isPending ? (
										<CircleNotchIcon size={14} className="animate-spin" />
									) : (
										<PlusIcon size={14} />
									)}
									{isPending ? "Загрузка..." : "Загрузить шаблон"}
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
