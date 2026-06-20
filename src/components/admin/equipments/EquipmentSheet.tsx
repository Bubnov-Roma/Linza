"use client";

import {
	ArrowsClockwiseIcon,
	CircleNotchIcon,
	DotsNineIcon,
	InfoIcon,
	LinkIcon,
	MagnifyingGlassIcon,
	NoteIcon,
	PlusIcon,
	StarIcon,
	XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useDebounceCallback, useDebounceValue } from "usehooks-ts";
import {
	createCategoryAction,
	createSubcategoryAction,
} from "@/actions/admin-category-actions";
import {
	type CreateEquipmentData,
	checkInventoryNumberUniqueAction,
	createEquipmentAction,
	getRelatedEquipmentAction,
	syncEquipmentByTitle,
	updateEquipment,
} from "@/actions/admin-equipment-actions";
import { clientSearchEquipmentAction } from "@/actions/client-equipment-actions";
import { ImageCell } from "@/components/admin/equipments/ImageCell";
import {
	CommentsBlock,
	type UserComment,
} from "@/components/admin/users/details-panel/CommentsBlock";
import { InlineEditField, MarkdownEditor } from "@/components/shared";
import {
	Button,
	Card,
	CardContent,
	Input,
	InputGroup,
	InputGroupInput,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Textarea,
} from "@/components/ui";
import { SINKABLE_FIELDS } from "@/constants";
import type {
	DbCategory,
	DbEquipment,
	DbEquipmentWithImages,
	DbSubcategory,
	EquipmentStatus,
	GroupedEquipment,
	OwnershipType,
} from "@/core/domain/entities/Equipment";
import { cn, fmtRub } from "@/lib/utils";
import { useUnsavedChanges } from "@/store/unsaved-changes.store";

interface EditMode {
	mode: "edit";
	equipment: DbEquipmentWithImages;
	hasSiblings?: boolean;
}

interface CreateMode {
	mode: "create";
	equipment?: undefined;
	hasSiblings?: undefined;
}

type EquipmentSheetProps = (EditMode | CreateMode) & {
	open: boolean;
	categories: DbCategory[];
	onOpenChange: (open: boolean) => void;
	onSuccess: (id?: string) => void;
	onCategoriesChange?: () => void;
};

interface RelatedItem {
	id: string;
	title: string;
	imageUrl: string;
	pricePerDay: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeSpecsToText(specs: unknown): string {
	if (!specs) return "{}";
	if (typeof specs === "string") {
		try {
			JSON.parse(specs);
			return specs;
		} catch {
			return JSON.stringify({ description: specs }, null, 2);
		}
	}
	try {
		return JSON.stringify(specs, null, 2);
	} catch {
		return "{}";
	}
}

function safeParseSpecs(text: string): Record<string, unknown> {
	try {
		const parsed = JSON.parse(text);
		if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed))
			return parsed;
		return { value: String(parsed) };
	} catch {
		return text.trim() ? { description: text.trim() } : {};
	}
}

interface RelatedEquipmentPickerProps {
	value: string[]; // массив ID
	onChange: (ids: string[]) => void;
	excludeId?: string; // ID текущей позиции
	isPending: boolean;
}

// ─── RelatedEquipmentPicker ──────────────────────────────────────────────────────────────

export function RelatedEquipmentPicker({
	value,
	onChange,
	excludeId,
	isPending = false,
}: RelatedEquipmentPickerProps) {
	const [query, setQuery] = useState("");
	const [debouncedQuery] = useDebounceValue(query, 250);
	const [results, setResults] = useState<GroupedEquipment[]>([]);
	const [isSearching, startSearchTransition] = useTransition();
	const [selectedItems, setSelectedItems] = useState<RelatedItem[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const prevValueRef = useRef<string>("");

	// ─── Синхронизация внешнего value со списком выбранных элементов ─────────
	useEffect(() => {
		const newIdsStr = value.join(",");

		// Обновляем только если массив ID реально изменился извне
		if (prevValueRef.current !== newIdsStr) {
			prevValueRef.current = newIdsStr;

			if (value.length === 0) {
				setSelectedItems([]);
				return;
			}

			// Запрашиваем детали для всех ID из value
			getRelatedEquipmentAction(value).then((data) => {
				const fetchedMap = new Map(data.map((d) => [d?.id, d]));
				const mapped = value
					.map((id) => {
						const item = fetchedMap.get(id);
						if (!item) return null;
						return {
							id: item.id,
							title: item.title,
							imageUrl: item.imageUrl || "/placeholder-equipment.png",
							pricePerDay: item.pricePerDay,
						};
					})
					.filter((x): x is RelatedItem => x !== null);

				setSelectedItems(mapped);
			});
		}

		return;
	}, [value]);

	// ─── Поиск ──────────────────────────────────────────────────────────────
	useEffect(() => {
		if (!debouncedQuery || debouncedQuery.length < 2) {
			setResults([]);
			return;
		}
		startSearchTransition(async () => {
			const data = await clientSearchEquipmentAction(debouncedQuery);
			setResults(
				data.filter((item) => item.id !== excludeId && !value.includes(item.id))
			);
		});
	}, [debouncedQuery, excludeId, value]);

	const addItem = (item: GroupedEquipment) => {
		const newItem: RelatedItem = {
			id: item.id,
			title: item.title,
			imageUrl: item.imageUrl ?? "/placeholder-equipment.png",
			pricePerDay: item.pricePerDay,
		};
		const newSelected = [...selectedItems, newItem];

		setSelectedItems(newSelected);
		const newIds = newSelected.map((i) => i.id);
		prevValueRef.current = newIds.join(",");
		onChange(newIds);

		setQuery("");
		setResults([]);
		setIsOpen(false);
	};

	const removeItem = (id: string) => {
		const newSelected = selectedItems.filter((i) => i.id !== id);
		setSelectedItems(newSelected);
		const newIds = newSelected.map((i) => i.id);
		prevValueRef.current = newIds.join(",");
		onChange(newIds);
	};

	// ─── Drag & Drop ────────────────────────────────────────────────────────
	const dragIndex = useRef<number | null>(null);
	const dragOverIndex = useRef<number | null>(null);

	const handleDragStart = useCallback((index: number) => {
		dragIndex.current = index;
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
		e.preventDefault();
		dragOverIndex.current = index;
	}, []);

	const handleDrop = useCallback(() => {
		const from = dragIndex.current;
		const to = dragOverIndex.current;
		if (from === null || to === null || from === to) return;

		const reordered = [...selectedItems];
		const [moved] = reordered.splice(from, 1);
		if (!moved) return;
		reordered.splice(to, 0, moved);

		setSelectedItems(reordered);
		const newIds = reordered.map((i) => i.id);
		prevValueRef.current = newIds.join(",");
		onChange(newIds);

		dragIndex.current = null;
		dragOverIndex.current = null;
	}, [selectedItems, onChange]);

	if (isPending) {
		return <CircleNotchIcon className="w-14 h-14 animate-spin m-auto" />;
	}

	return (
		<div className="space-y-4">
			{/* Search input */}
			<div className="relative">
				<InputGroup className="flex items-center gap-2 px-3 rounded-2xl border border-white/10 bg-foreground/5 focus-within:border-primary/50 transition-colors">
					<MagnifyingGlassIcon
						size={13}
						className="text-muted-foreground shrink-0"
					/>
					<InputGroupInput
						type="text"
						className="flex-1 input-glass bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 h-10"
						placeholder="Поиск техники для добавления..."
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setIsOpen(true);
						}}
						onFocus={() => setIsOpen(true)}
						onBlur={() => setTimeout(() => setIsOpen(false), 200)}
					/>
					{isSearching && (
						<div className="w-3 h-3 border border-primary/40 border-t-primary rounded-full animate-spin shrink-0" />
					)}
				</InputGroup>

				{/* Results dropdown */}
				{isOpen && results.length > 0 && (
					<div className="absolute left-0 right-0 top-full mt-1 z-50 border border-foreground/10 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto backdrop-blur-2xl bg-background/80">
						{results.map((item) => (
							<CardContent
								key={item.id}
								onClick={() => addItem(item)}
								className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-foreground/5 transition-colors text-left group cursor-pointer"
							>
								<div className="w-9 h-9 rounded-lg overflow-hidden bg-foreground/8 shrink-0 relative">
									<Image
										src={item.imageUrl ?? "/placeholder-equipment.png"}
										alt={item.title}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-200"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{item.title}</p>
									<p className="text-[11px] text-muted-foreground">
										{fmtRub(item.pricePerDay)}/сут
									</p>
								</div>
								<PlusIcon
									size={14}
									className="text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
								/>
							</CardContent>
						))}
					</div>
				)}

				{isOpen &&
					debouncedQuery.length >= 2 &&
					results.length === 0 &&
					!isSearching && (
						<div className="absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-white/10 rounded-xl shadow-xl px-3 py-4 text-center text-sm text-muted-foreground">
							Ничего не найдено
						</div>
					)}
			</div>

			{/* Selected items list */}
			{selectedItems.length > 0 && (
				<div className="space-y-1.5 pt-2">
					<p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
						Выбрано ({selectedItems.length}) — перетащите для изменения порядка
					</p>
					<div className="space-y-1.5">
						{selectedItems.map((item, index) => (
							<CardContent
								key={item.id}
								draggable
								onDragStart={() => handleDragStart(index)}
								onDragOver={(e) => handleDragOver(e, index)}
								onDrop={handleDrop}
								className={cn(
									"flex items-center gap-2 p-2 rounded-xl border border-foreground/8 bg-foreground/3",
									"hover:bg-foreground/10 transition-colors group cursor-grab active:cursor-grabbing"
								)}
							>
								<DotsNineIcon
									size={14}
									weight="bold"
									className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors"
								/>
								<div className="w-8 h-8 rounded-lg overflow-hidden bg-foreground/8 shrink-0 relative">
									<Image
										src={item.imageUrl}
										alt={item.title}
										fill
										className="object-cover"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate leading-tight">
										{item.title}
									</p>
									<p className="text-[11px] text-muted-foreground">
										{fmtRub(item.pricePerDay)}/сут
									</p>
								</div>
								<span className="text-[10px] text-muted-foreground/40 font-mono shrink-0">
									#{index + 1}
								</span>
								<Button
									asChild
									size="icon-xs"
									variant="outline"
									onClick={() => removeItem(item.id)}
									className="p-1 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
								>
									<XIcon size={10} />
								</Button>
							</CardContent>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ─── SpecsEditor ──────────────────────────────────────────────────────────────

// function SpecsEditor({
// 	value,
// 	onChange,
// }: {
// 	value: string;
// 	onChange: (v: string) => void;
// }) {
// 	const [mode, setMode] = useState<"text" | "json" | "preview">(() => {
// 		try {
// 			const p = JSON.parse(value);
// 			const keys = Object.keys(p);
// 			if (keys.length === 1 && keys[0] === "description") return "text";
// 			if (keys.length > 0) return "json";
// 		} catch {}
// 		return "text";
// 	});
// 	const [hasJsonError, setHasJsonError] = useState(false);
// 	const [textValue, setTextValue] = useState(() => {
// 		try {
// 			const p = JSON.parse(value);
// 			return typeof p.description === "string" ? p.description : "";
// 		} catch {
// 			return typeof value === "string" && !value.startsWith("{") ? value : "";
// 		}
// 	});
// 	const [jsonValue, setJsonValue] = useState(() => {
// 		try {
// 			const p = JSON.parse(value);
// 			if (Object.keys(p).length === 1 && p.description) return '{\n  "": ""\n}';
// 			return JSON.stringify(p, null, 2);
// 		} catch {
// 			return '{\n  "": ""\n}';
// 		}
// 	});

// 	const handleTextChange = (t: string) => {
// 		setTextValue(t);
// 		onChange(JSON.stringify({ description: t }, null, 2));
// 	};
// 	const handleJsonChange = (t: string) => {
// 		setJsonValue(t);
// 		try {
// 			JSON.parse(t);
// 			setHasJsonError(false);
// 			onChange(t);
// 		} catch {
// 			setHasJsonError(true);
// 		}
// 	};

// 	let previewEntries: [string, string][] = [];
// 	try {
// 		previewEntries = Object.entries(
// 			JSON.parse(mode === "json" ? jsonValue : value)
// 		).map(([k, v]) => [k, String(v)]);
// 	} catch {}

// 	return (
// 		<div className="space-y-1.5">
// 			<div className="flex items-center justify-between">
// 				<Label className="flex items-center gap-2">
// 					Характеристики
// 					{hasJsonError && mode === "json" && (
// 						<span className="text-[10px] text-amber-400 font-normal">
// 							невалидный JSON
// 						</span>
// 					)}
// 				</Label>
// 				<div className="flex items-center gap-0.5 rounded-md border border-white/10 bg-muted/10 p-0.5">
// 					{(["text", "json", "preview"] as const).map((m) => (
// 						<button
// 							key={m}
// 							type="button"
// 							onClick={() => setMode(m)}
// 							className={cn(
// 								"flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors",
// 								mode === m
// 									? "bg-primary/10 text-foreground"
// 									: "text-muted-foreground hover:text-foreground"
// 							)}
// 						>
// 							{m === "text" ? (
// 								<PencilIcon size={9} />
// 							) : m === "json" ? (
// 								<span className="font-mono text-[9px] font-bold">{"{}"}</span>
// 							) : (
// 								<EyeIcon size={9} />
// 							)}
// 							{m === "text" ? "Текст" : m === "json" ? "JSON" : "Preview"}
// 						</button>
// 					))}
// 				</div>
// 			</div>
// 			{mode === "text" && (
// 				<Textarea
// 					rows={7}
// 					value={textValue}
// 					onChange={(e) => handleTextChange(e.target.value)}
// 					className="text-xs resize-none glass-input"
// 					placeholder={
// 						"Произвольный текст с описанием характеристик...\n\nНапример:\nСенсор — Full Frame BSI CMOS\nРазрешение — 33 МП"
// 					}
// 				/>
// 			)}
// 			{mode === "json" && (
// 				<Textarea
// 					rows={7}
// 					value={jsonValue}
// 					onChange={(e) => handleJsonChange(e.target.value)}
// 					className={cn(
// 						"font-mono text-xs resize-none glass-input",
// 						hasJsonError &&
// 							"border-amber-400/50 focus-visible:ring-amber-400/30"
// 					)}
// 					placeholder={
// 						'{\n  "Сенсор": "Full Frame",\n  "Разрешение": "33MP"\n}'
// 					}
// 				/>
// 			)}
// 			{mode === "preview" && (
// 				<div className="min-h-42 rounded-md border border-white/10 bg-muted/10 p-3">
// 					{previewEntries.length > 0 ? (
// 						<dl className="divide-y divide-white/5">
// 							{previewEntries.map(([k, v]) => (
// 								<div key={k} className="flex gap-3 py-1.5">
// 									<dt className="text-xs text-muted-foreground w-36 shrink-0 truncate">
// 										{k}
// 									</dt>
// 									<dd className="text-xs font-medium flex-1 whitespace-pre-wrap">
// 										{v}
// 									</dd>
// 								</div>
// 							))}
// 						</dl>
// 					) : (
// 						<span className="text-muted-foreground text-xs italic">
// 							Нет данных
// 						</span>
// 					)}
// 				</div>
// 			)}
// 		</div>
// 	);
// }

// ─── CategorySubcategorySelector ─────────────────────────────────────────────

function CategorySubcategorySelector({
	categories,
	categoryId,
	subcategoryId,
	onCategoryChange,
	onSubcategoryChange,
	onCategoriesChange,
}: {
	categories: DbCategory[];
	categoryId: string;
	subcategoryId: string;
	onCategoryChange: (id: string) => void;
	onSubcategoryChange: (id: string) => void;
	onCategoriesChange?: () => void;
}) {
	const [showNewCategory, setShowNewCategory] = useState(false);
	const [showNewSubcategory, setShowNewSubcategory] = useState(false);
	const [localCategories, setLocalCategories] = useState(categories);

	useEffect(() => setLocalCategories(categories), [categories]);

	const selectedCat = localCategories.find((c) => c.id === categoryId);
	const subcategories: DbSubcategory[] = selectedCat?.subcategories ?? [];

	const handleCreateCategory = async (name: string) => {
		const result = await createCategoryAction({ name });
		if (!result.success || !result.category) {
			toast.error(result.error ?? "Ошибка создания категории");
			return;
		}
		const newCat: DbCategory = { ...result.category, subcategories: [] };
		setLocalCategories((prev) => [...prev, newCat]);
		onCategoryChange(newCat.id);
		onSubcategoryChange("");
		setShowNewCategory(false);
		onCategoriesChange?.();
		toast.success(`Категория «${newCat.name}» создана`);
	};

	const handleCreateSubcategory = async (name: string) => {
		if (!categoryId) return;
		const result = await createSubcategoryAction({
			categoryId: categoryId,
			name,
		});
		if (!result.success || !result.subcategory) {
			toast.error(result.error ?? "Ошибка создания подкатегории");
			return;
		}
		const newSub = result.subcategory;
		setLocalCategories((prev) =>
			prev.map((cat) =>
				cat.id === categoryId
					? { ...cat, subcategories: [...cat.subcategories, newSub] }
					: cat
			)
		);
		onSubcategoryChange(newSub.id);
		setShowNewSubcategory(false);
		onCategoriesChange?.();
		toast.success(`Подкатегория «${newSub.name}» создана`);
	};

	return (
		<div className="grid md:grid-cols-2 gap-4 card-surface p-2">
			{/* Селектор категорий */}
			<div className="space-y-1.5">
				<Label>Категория *</Label>
				<Select
					value={categoryId}
					onValueChange={(v) => {
						onCategoryChange(v);
						onSubcategoryChange("");
					}}
				>
					<SelectTrigger className="w-full glass-input cursor-pointer rounded-2xl">
						<SelectValue placeholder="Выберите категорию" />
					</SelectTrigger>
					<SelectContent className="rounded-2xl">
						{localCategories.map((cat) => (
							<SelectItem
								key={cat.id}
								value={cat.id}
								className="cursor-pointer hover:bg-muted-foreground/30"
							>
								{cat.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{showNewCategory ? (
					<div className="mt-1.5 flex gap-1 items-center">
						<InlineEditField
							mode="create"
							value=""
							onAdd={handleCreateCategory}
							onCancel={() => setShowNewCategory(false)}
							className="flex-1 glass-input border border-foreground/10 rounded-2xl h-11 items-center px-1 focus-within:ring-1 focus-within:ring-amber-500/50 focus-within:border-amber-500/50 transition-all"
							renderInput={(draft, onChange, onKeyDown) => (
								<Input
									autoFocus
									value={draft}
									onChange={(e) => onChange(e.target.value)}
									onKeyDown={onKeyDown}
									placeholder="Добавьте название категории"
									className="bg-transparent! border-none! shadow-none! ring-0! ring-offset-0! outline-none! focus:ring-0! focus-visible:ring-0! focus:bg-transparent! dark:bg-transparent! h-full text-xs flex-1"
								/>
							)}
						/>
						<Button
							size="icon-sm"
							variant="ghost"
							className="h-11 w-11 p-0 text-muted-foreground shrink-0 rounded-full transition-colors"
							onClick={() => setShowNewCategory(false)}
						>
							<XIcon size={14} />
						</Button>
					</div>
				) : (
					<Button
						variant="outline"
						size="md"
						onClick={() => setShowNewCategory(true)}
						className="h-11 flex w-full justify-start text-muted-foreground items-center gap-1 transition-colors mt-1 hover:text-foreground"
					>
						Добавить новую категорию
					</Button>
				)}
			</div>

			{/* Селектор подкатегорий */}
			<div className="space-y-1.5">
				<Label>Подкатегория</Label>
				<Select
					value={subcategoryId || "_none"}
					onValueChange={(v) => onSubcategoryChange(v === "_none" ? "" : v)}
					disabled={!categoryId}
				>
					<SelectTrigger className="w-full glass-input cursor-pointer dark:glass-input rounded-2xl">
						<SelectValue
							placeholder={
								!categoryId
									? "Сначала выберите категорию"
									: subcategories.length === 0
										? "Нет подкатегорий"
										: "Выберите подкатегорию"
							}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="_none">— Без подкатегории —</SelectItem>
						{subcategories.map((sub) => (
							<SelectItem key={sub.id} value={sub.id}>
								{sub.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{categoryId &&
					(showNewSubcategory ? (
						<div className="mt-1.5 flex gap-1 items-center">
							<InlineEditField
								mode="create"
								value=""
								onAdd={handleCreateSubcategory}
								onCancel={() => setShowNewSubcategory(false)}
								className="flex-1 glass-input border border-foreground/10 rounded-2xl h-11 items-center px-1"
								renderInput={(draft, onChange, onKeyDown) => (
									<Input
										autoFocus
										placeholder="Добавьте название подкатегории"
										value={draft}
										onChange={(e) => onChange(e.target.value)}
										onKeyDown={onKeyDown}
										className="bg-transparent border-none shadow-none focus:ring-0 focus:shadow-none focus:translate-y-0 hover:border-none hover:shadow-none hover:translate-y-0 h-full text-xs"
									/>
								)}
							/>
							<Button
								size="icon-sm"
								variant="ghost"
								className="h-11 w-11 p-0 text-muted-foreground shrink-0 rounded-full transition-colors"
								onClick={() => setShowNewSubcategory(false)}
							>
								<XIcon size={14} />
							</Button>
						</div>
					) : (
						<Button
							variant="outline"
							size="md"
							onClick={() => setShowNewSubcategory(true)}
							className="h-11 flex w-full justify-start text-muted-foreground items-center text-sm mt-1"
						>
							Добавить новую подкатегорию
						</Button>
					))}
			</div>
		</div>
	);
}
// ─── EquipmentSheet (main) ────────────────────────────────────────────────────

type EquipmentFormState = DbEquipment & {
	isFeatured: boolean;
	relatedIds: string[];
	videoUrls: string[];
	studioAvailable: boolean;
};

function buildInitialForm(
	equipment?: DbEquipmentWithImages
): EquipmentFormState {
	return {
		id: equipment?.id ?? "",
		isPrimary: equipment?.isPrimary ?? false,
		isFeatured:
			(equipment as unknown as { isFeatured?: boolean })?.isFeatured ?? false,
		studioAvailable:
			(equipment as unknown as { studioAvailable?: boolean })
				?.studioAvailable ?? true,
		kit: equipment?.kit ?? "",
		specifications: equipment?.specifications ?? {},
		title: equipment?.title ?? "",
		description: equipment?.description ?? "",
		categoryId: equipment?.categoryId ?? "",
		subcategoryId: equipment?.subcategoryId ?? "",
		inventoryNumber: equipment?.inventoryNumber ?? "",
		pricePerDay: equipment?.pricePerDay ?? 0,
		priceStudio: equipment?.priceStudio ?? 0,
		price4h: equipment?.price4h ?? 0,
		price8h: equipment?.price8h ?? 0,
		deposit: equipment?.deposit ?? 0,
		replacementValue: equipment?.replacementValue ?? 0,
		status: equipment?.status ?? "AVAILABLE",
		isAvailable: equipment?.isAvailable ?? true,
		ownershipType: equipment?.ownershipType ?? "INTERNAL",
		partnerName: equipment?.partnerName ?? "",
		defects: equipment?.defects ?? "",
		kitDescription: equipment?.kitDescription ?? "",
		comments: equipment?.comments ?? [],
		slug: equipment?.slug ?? "",
		createdAt: equipment?.createdAt ?? new Date(),
		updatedAt: equipment?.updatedAt ?? new Date(),
		videoUrls: (equipment?.videoUrls as string[]) ?? [],
		relatedIds: equipment?.relatedEquipment?.map((r) => r.relatedId) ?? [],
	};
}

const TABS = [
	{ id: "info", label: "Основное", icon: InfoIcon },
	{ id: "related", label: "Сопутствующие", icon: LinkIcon },
	{ id: "notes", label: "Заметки", icon: NoteIcon },
] as const;

export function EquipmentSheet(props: EquipmentSheetProps) {
	const {
		open,
		onOpenChange,
		categories,
		onSuccess,
		onCategoriesChange,
		mode,
		equipment,
	} = props;
	const hasSiblings = props.hasSiblings ?? false;
	const { markClean, isDirty, markDirty } = useUnsavedChanges();

	const [tab, setTab] = useState<"info" | "related" | "notes">("info");

	const [isPending, setIsPending] = useState(false);
	const [syncFields, setSyncFields] = useState<string[]>([]);
	const [showSync, setShowSync] = useState(false);
	const [formData, setFormData] = useState<EquipmentFormState>(() =>
		buildInitialForm(equipment)
	);
	const [specText, setSpecText] = useState(() =>
		safeSpecsToText(equipment?.specifications)
	);

	const [comments, setComments] = useState<UserComment[]>(() => {
		const c = equipment?.comments;
		if (!c || !Array.isArray(c)) return [];
		return (c as UserComment[]).filter((cm) => cm?.id && cm?.text);
	});

	const [inventoryError, setInventoryError] = useState<string | null>(null);
	const [isChecking, setIsChecking] = useState(false);

	const debouncedCheck = useDebounceCallback(async (value: string) => {
		if (!value || value.length < 2) return;

		setIsChecking(true);
		try {
			const { isUnique } = await checkInventoryNumberUniqueAction(
				value,
				formData.id
			);
			setInventoryError(isUnique ? null : "Этот номер уже используется");
		} finally {
			setIsChecking(false);
		}
	}, 500);

	// const handleSpecChange = (v: string) => {
	// 	markDirty();
	// 	setSpecText(v);
	// };

	useEffect(() => {
		markClean();
		if (open) {
			setFormData(buildInitialForm(equipment));
			setSpecText(safeSpecsToText(equipment?.specifications));
			const c = equipment?.comments;
			setComments(
				Array.isArray(c) ? (c as UserComment[]).filter((cm) => cm?.id) : []
			);
			setSyncFields([]);
			setShowSync(false);
			setTab("info");
		}
	}, [open, equipment, markClean]);

	const set = (patch: Partial<EquipmentFormState>) =>
		setFormData((prev) => ({ ...prev, ...patch }));

	const handleSave = async () => {
		if (!formData.title.trim()) {
			toast.error("Укажите наименование");
			return;
		}
		if (!formData.categoryId) {
			toast.error("Выберите категорию");
			return;
		}
		if (!formData.pricePerDay) {
			toast.error("Укажите цену/сутки");
			return;
		}

		setIsPending(true);
		try {
			const specs = safeParseSpecs(specText);
			const commentsPayload = comments;

			if (mode === "create") {
				const payload: CreateEquipmentData = {
					title: formData.title.trim(),
					category: formData.categoryId,
					subcategory: formData.subcategoryId || null,
					inventoryNumber: formData.inventoryNumber || undefined,
					pricePerDay: Number(formData.pricePerDay),
					priceStudio: formData.priceStudio
						? Number(formData.priceStudio)
						: undefined,
					price4h: formData.price4h ? Number(formData.price4h) : undefined,
					price8h: formData.price8h ? Number(formData.price8h) : undefined,
					deposit: formData.deposit ? Number(formData.deposit) : undefined,
					replacementValue: formData.replacementValue
						? Number(formData.replacementValue)
						: undefined,
					description: formData.description || undefined,
					kitDescription: formData.kitDescription || undefined,
					defects: formData.defects || undefined,
					status: formData.status,
					isAvailable: formData.isAvailable,
					ownershipType: formData.ownershipType,
					partnerName: formData.partnerName || undefined,
					specifications: specs,
					relatedIds: formData.relatedIds,
					videoUrls: formData.videoUrls ?? [],
				};
				const result = await createEquipmentAction(payload);
				if (!result.success) {
					toast.error(result.error ?? "Ошибка создания");
					return;
				}
				toast.success("Позиция успешно создана");
				onSuccess(result.id);
				markClean();
				onOpenChange(false);
			} else {
				await updateEquipment(equipment.id, {
					...formData,
					isFeatured: formData.isFeatured,
					ownershipType: formData.ownershipType,
					status: formData.status as unknown as EquipmentStatus,
					pricePerDay: Number(formData.pricePerDay) || 0,
					price4h: Number(formData.price4h) || 0,
					price8h: Number(formData.price8h) || 0,
					deposit: Number(formData.deposit) || 0,
					replacementValue: Number(formData.replacementValue) || 0,
					subcategoryId: formData.subcategoryId || null,
					partnerName: formData.partnerName || null,
					specifications: specs,
					comments: commentsPayload,
					videoUrls: formData.videoUrls ?? [],
				});
				if (syncFields.length > 0) {
					const result = await syncEquipmentByTitle(equipment.id, syncFields);
					toast.success(
						`Обновлено + синхронизировано ${syncFields.length} полей с ${result.updated} позициями`
					);
				} else {
					toast.success("Данные успешно обновлены");
				}
				onSuccess(equipment.id);
				markClean();
				onOpenChange(false);
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Ошибка при сохранении");
		} finally {
			setIsPending(false);
		}
	};

	const isEdit = mode === "edit";
	const title = isEdit ? `${equipment.title}` : "Новая позиция";
	const isPrimary = formData.isPrimary; // Теперь опираемся на локальный стейт формы

	const initialImages = isEdit
		? (equipment.equipmentImageLinks
				?.map((l) => ({ id: l.image.id, url: l.image.url }))
				.filter((i): i is { id: string; url: string } => !!(i.id && i.url)) ??
			[])
		: [];

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && isDirty) {
			const confirmed = window.confirm(
				"Есть несохранённые изменения. Закрыть без сохранения?"
			);
			if (!confirmed) return;
		}
		if (!nextOpen) markClean();
		onOpenChange(nextOpen);
	};

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="w-full sm:max-w-full md:w-[70vw] lg:w-[60vw] lg:max-w-6xl overflow-hidden flex flex-col backdrop-blur bg-background/50 p-0">
				<SheetHeader className={cn("bg-background/50 px-6 py-2 shrink-0")}>
					<div className="flex items-start justify-between gap-3">
						<SheetTitle
							className={cn("text-xl font-bold leading-tight items-baseline")}
						>
							{isPrimary && (
								<StarIcon
									size={15}
									weight="fill"
									className="mr-1 mb-1 bg-muted-foreground/40 rounded-full p-0.5 fill-primary inline shadow-sm shadow-muted-foreground"
								/>
							)}{" "}
							{title}
							{equipment?.title && (
								<div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-2">
									<span className="text-muted-foreground font-black uppercase text-[10px]">
										{" "}
										редактирование
									</span>
									<span className="font-mono text-[10px] text-muted-foreground/60 select-all bg-background/20 py-0.5 px-2 rounded border border-foreground/5">
										{equipment.id}
									</span>
								</div>
							)}
						</SheetTitle>
					</div>
					{isEdit && (
						<div className="flex flex-col items-start gap-1 shrink-0 pr-2"></div>
					)}
				</SheetHeader>

				{/* ── TABS ── */}
				<div className="flex border-b border-foreground/8 shrink-0 overflow-x-auto">
					{TABS.map(({ id, label, icon: Icon }) => (
						<button
							type="button"
							key={id}
							onClick={() => setTab(id)}
							className={cn(
								"cursor-pointer flex-1 min-w-0 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap px-4 outline-none",
								tab === id
									? "text-foreground border-foreground"
									: "text-muted-foreground border-transparent hover:text-foreground hover:bg-foreground/3"
							)}
						>
							<Icon
								size={14}
								weight={tab === id ? "duotone" : "bold"}
								className={cn(
									tab === id ? "text-foreground" : "text-muted-foreground"
								)}
							/>{" "}
							{label}
							{id === "notes" && comments.length > 0 && (
								<span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-muted-foreground/20 text-foreground text-[10px] font-bold">
									{comments.length}
								</span>
							)}
						</button>
					))}
				</div>

				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{tab === "info" && (
						<div className="space-y-6">
							{/* IMAGES */}
							{isEdit ? (
								<div className="space-y-2">
									<Label>Галерея изображений</Label>
									<ImageCell
										equipmentId={equipment.id}
										equipmentSlug={equipment.slug}
										initialImages={initialImages}
									/>
									{mode === "edit" && hasSiblings && (
										<Button
											variant="outline"
											size="sm"
											type="button"
											className="text-xs gap-1.5"
											onClick={async () => {
												if (!equipment?.id) return;
												const { syncEquipmentImagesAction } = await import(
													"@/actions/admin-equipment-actions"
												);
												const result = await syncEquipmentImagesAction(
													equipment.id
												);
												if (result.updated > 0) {
													toast.success(
														`Картинки скопированы в ${result.updated} экземпляр(ов)`
													);
												} else {
													toast.info(
														"У остальных экземпляров уже есть свои картинки"
													);
												}
											}}
										>
											<ArrowsClockwiseIcon size={12} />
											Скопировать картинки в копии
										</Button>
									)}
								</div>
							) : (
								<div className="rounded-lg border border-white/10 bg-muted/10 p-3 text-xs text-muted-foreground">
									💡 Фотографии можно добавить после создания позиции через
									редактирование
								</div>
							)}
							{formData.isAvailable ? (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-baseline">
									{/* isPrimary Toggle */}
									<div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
										<Label className="flex items-center gap-3 cursor-pointer">
											<input
												type="checkbox"
												checked={formData.isPrimary}
												onChange={(e) => set({ isPrimary: e.target.checked })}
												className="w-4 h-4 rounded border-white/10 text-primary accent-primary"
											/>
											<div className="flex flex-col">
												<span
													className={cn(
														"font-bold text-sm",
														formData.isPrimary && "text-amber-500"
													)}
												>
													{isPrimary
														? "★ Основной экземпляр"
														: "Дополнительный экземпляр"}
												</span>
												<span className="text-[11px] text-muted-foreground">
													{isPrimary
														? "На сайте как основной экземпляр"
														: "На сайте при аренде нескольких штук"}
												</span>
											</div>
										</Label>
									</div>

									{/* isFeatured Toggle */}
									<div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
										<Label className="flex items-center gap-3 cursor-pointer">
											<input
												type="checkbox"
												checked={formData.isFeatured}
												onChange={(e) => set({ isFeatured: e.target.checked })}
												className="w-4 h-4 rounded border-white/10 text-primary accent-violet-500"
											/>
											<div className="flex flex-col">
												<span
													className={cn(
														"font-bold text-sm",
														formData.isFeatured && "text-violet-300"
													)}
												>
													{formData.isFeatured
														? `✦ "Популярная" позиция`
														: "Обычная позиция"}
												</span>
												<span className="text-[11px] text-muted-foreground">
													{formData.isFeatured
														? "В блоке «Популярное» на главной странице"
														: "Не отображается на главной странице сайта"}
												</span>
											</div>
										</Label>
									</div>
								</div>
							) : (
								<div className="p-3 rounded-xl border border-gray-500/20 bg-gray-500/5">
									<Label className="mx-auto text-xs text-center text-gray-400 font-mono uppercase select-none w-full">
										Недоступно для аренды на сайте
									</Label>
								</div>
							)}

							{/* NAME */}
							<div className="space-y-1.5">
								<Label>Наименование *</Label>
								<Input
									value={formData.title}
									onChange={(e) => set({ title: e.target.value })}
									placeholder="Название техники"
									className="glass-input"
								/>
							</div>

							{/* INV NUMBER */}
							<div className="space-y-1.5">
								<Label>Инвентарный номер</Label>
								<div className="relative">
									<Input
										value={formData.inventoryNumber ?? ""}
										placeholder="Уникальный инв. №"
										className={cn(
											"glass-input",
											inventoryError ? "border-red-500 pr-10" : "pr-10"
										)}
										onChange={(e) => {
											const val = e.target.value;
											set({ inventoryNumber: val });
											setInventoryError(null);
											debouncedCheck(val);
										}}
									/>
									{/* Индикатор загрузки внутри инпута справа */}
									{isChecking && (
										<div className="absolute right-3 top-1/2 -translate-y-1/2">
											<CircleNotchIcon className="h-4 w-4 animate-spin text-muted-foreground" />
										</div>
									)}
								</div>

								{inventoryError && (
									<p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
										{inventoryError}
									</p>
								)}
							</div>

							{/* CATEGORY / SUBCATEGORY */}
							<CategorySubcategorySelector
								categories={categories}
								categoryId={formData.categoryId}
								subcategoryId={formData.subcategoryId ?? ""}
								onCategoryChange={(id) =>
									set({ categoryId: id, subcategoryId: "" })
								}
								onSubcategoryChange={(id) => set({ subcategoryId: id })}
								{...(onCategoriesChange ? { onCategoriesChange } : {})}
							/>

							{/* DESCRIPTION / KIT / VIDEO_URLS */}
							{(!isEdit || isPrimary) && (
								<div className="grid grid-cols-1 gap-4 items-baseline">
									<MarkdownEditor
										label="Описание"
										value={formData.description ?? ""}
										onChange={(v) => {
											set({ description: v });
										}}
										placeholder={
											"Описание в **markdown**...\n\n- пункт 1\n- пункт 2\n- пункт 3"
										}
										rows={7}
										className="card-surface p-2"
									/>
									{/* <SpecsEditor
										value={specText}
										onChange={(v) => {
											handleSpecChange(v);
											setSpecText(v);
										}}
									/> */}
									<MarkdownEditor
										label="Комплектация"
										value={formData.kitDescription ?? ""}
										onChange={(v) => set({ kitDescription: v })}
										placeholder={"- Камера\n- Зарядное устройство\n- Кейс"}
										rows={5}
										className="card-surface p-2"
									/>
									<div className="space-y-3">
										<Label>Видеообзоры</Label>
										<Textarea
											value={(formData.videoUrls ?? []).join("\n")}
											onChange={(e) =>
												set({
													videoUrls: e.target.value
														.split("\n")
														.map((u) => u.trim())
														.filter(Boolean),
												})
											}
											placeholder={
												"ссылки на YouTube, VK Video, RuTube\n\nhttps://youtube.com/watch?...\nhttps://vk.com/video...\nhttps://rutube.ru/video/..."
											}
											rows={4}
											className="font-mono text-xs resize-none glass-input"
										/>
										{(formData.videoUrls ?? []).length > 0 && (
											<p className="text-[11px] text-muted-foreground">
												{(formData.videoUrls ?? []).length} видео добавлено
											</p>
										)}
									</div>
								</div>
							)}

							<Card className="rounded-xl px-2 py-2  bg-muted-foreground/10 w-full">
								{/* AVAILABILITY / OWNERSHIP / PRICES / DEPOSIT / REPLACEMENT / STATUS  */}
								<div className="flex flex-col sm:flex-row w-full justify-between gap-4">
									{/* AVAILABILITY / OWNERSHIP */}
									<div className="flex flex-1 flex-col gap-2">
										<div className="space-y-3">
											<div className="flex gap-2">
												<div className="space-y-1 flex-1">
													<Label>Cдается в аренду</Label>
													<Select
														value={String(formData.isAvailable)}
														onValueChange={(v) =>
															set({ isAvailable: v === "true" })
														}
													>
														<SelectTrigger className="glass-card w-full shadow-md shadow-muted-foreground/10 rounded-xl">
															<SelectValue />
														</SelectTrigger>
														<SelectContent className="glass-card w-full shadow-md shadow-muted-foreground/10 rounded-xl bg-background/50">
															<SelectItem
																value="true"
																className="hover:bg-muted-foreground/10 cursor-pointer"
															>
																Да
															</SelectItem>
															<SelectItem
																value="false"
																className="hover:bg-muted-foreground/10 cursor-pointer"
															>
																Нет
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div className="space-y-1 flex-1">
													<Label>Cдается в студии</Label>
													<Select
														value={String(formData.studioAvailable)}
														onValueChange={(v) =>
															set({ studioAvailable: v === "true" })
														}
													>
														<SelectTrigger className="glass-card w-full shadow-md shadow-muted-foreground/10 rounded-xl">
															<SelectValue />
														</SelectTrigger>
														<SelectContent className="glass-card w-full shadow-md shadow-muted-foreground/10 rounded-xl bg-background/50">
															<SelectItem
																value="true"
																className="hover:bg-muted-foreground/10 cursor-pointer"
															>
																Да
															</SelectItem>
															<SelectItem
																value="false"
																className="hover:bg-muted-foreground/10 cursor-pointer"
															>
																Нет
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
											<div className="space-y-1">
												<Label>Техническое состояние</Label>
												<Select
													value={formData.status}
													onValueChange={(v: EquipmentStatus) =>
														set({ status: v })
													}
												>
													<SelectTrigger className="glass-card w-full shadow-md shadow-muted-foreground/10 rounded-xl">
														<SelectValue />
													</SelectTrigger>
													<SelectContent className="glass-card w-full shadow-md shadow-muted-foreground/10 rounded-xl bg-background/50">
														<SelectItem
															value="AVAILABLE"
															className="hover:bg-muted-foreground/10 cursor-pointer"
														>
															Исправно
														</SelectItem>
														<SelectItem
															value="MAINTENACE"
															className="hover:bg-muted-foreground/10 cursor-pointer"
														>
															В ремонте
														</SelectItem>
														<SelectItem
															value="BROKEN"
															className="hover:bg-muted-foreground/10 cursor-pointer"
														>
															Неисправно
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div className="flex gap-1">
												<div className="space-y-1">
													<Label>Субаренда</Label>
													<Select
														value={formData.ownershipType}
														onValueChange={(v) =>
															set({
																ownershipType: v as unknown as OwnershipType,
																// Если меняем на Свое (INTERNAL), очищаем имя партнера
																partnerName:
																	v === "INTERNAL" ? "" : formData.partnerName,
															})
														}
													>
														<SelectTrigger className="glass-card w-auto shadow-md shadow-muted-foreground/10 rounded-xl">
															<SelectValue />
														</SelectTrigger>
														<SelectContent className="glass-card w-auto shadow-md shadow-muted-foreground/10 rounded-xl bg-background/50">
															<SelectItem
																value="SUBLEASE"
																className="hover:bg-muted-foreground/10 cursor-pointer"
															>
																Да
															</SelectItem>
															<SelectItem
																value="INTERNAL"
																className="hover:bg-muted-foreground/10 cursor-pointer"
															>
																Нет
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
												<div className="space-y-1 flex-1">
													<Label>Владелец</Label>
													<Input
														value={formData.partnerName ?? ""}
														onChange={(e) =>
															set({ partnerName: e.target.value })
														}
														placeholder="Имя субарендатора"
														disabled={formData.ownershipType !== "SUBLEASE"}
														className="glass-card shadow-md shadow-muted-foreground/10 w-full flex-1 rounded-xl disabled:opacity-50 transition-opacity h-9"
													/>
												</div>
											</div>
										</div>
									</div>
									{/*  PRICES / DEPOSIT / REPLACEMENT / STATUS  */}
									<div className="flex gap-2">
										<div className="flex flex-col space-y-3">
											{[
												{ label: "Цена сутки *", key: "pricePerDay" as const },
												{ label: "Цена 8ч", key: "price8h" as const },
												{ label: "Цена 4ч", key: "price4h" as const },
											].map(({ label, key }) => (
												<div key={key} className="space-y-1">
													<Label>{label}</Label>
													<Input
														type="number"
														className="h-9 glass-input"
														value={formData[key]}
														onChange={(e) =>
															set({
																[key]:
																	e.target.value === ""
																		? ""
																		: Number(e.target.value),
															})
														}
													/>
												</div>
											))}
										</div>
										<div className="flex flex-col space-y-3">
											{[
												{ label: "Цена в студии", key: "priceStudio" as const },
												{ label: "Залог", key: "deposit" as const },
												{
													label: "Стоимость",
													key: "replacementValue" as const,
												},
											].map(({ label, key }) => (
												<div key={key} className="space-y-1">
													<Label>{label}</Label>
													<Input
														type="number"
														className="h-9 glass-input"
														value={formData[key]}
														onChange={(e) =>
															set({
																[key]:
																	e.target.value === ""
																		? ""
																		: Number(e.target.value),
															})
														}
													/>
												</div>
											))}
										</div>
									</div>
								</div>
								{/*  DEFECTS */}
								<div className="flex flex-col gap-1.5 pt-4">
									<Label>Дефекты</Label>
									<Textarea
										value={formData.defects ?? ""}
										onChange={(e) =>
											set({
												defects: e.target.value,
											})
										}
										placeholder="Опишите дефекты если имеются"
										rows={5}
										className="glass-input"
									/>
								</div>
							</Card>
							{/* SYNC */}
							{isEdit && hasSiblings && isPrimary && (
								<div className="border-t border-white/10 pt-4">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setShowSync(!showSync)}
										className="mb-3"
									>
										{showSync
											? "Скрыть опции синхронизации"
											: "Синхронизировать с другими позициями"}
									</Button>
									{showSync && (
										<div className="space-y-2 p-3 bg-muted/20 rounded-lg">
											<p className="text-xs text-muted-foreground mb-2">
												Выберите поля для копирования во все позиции с
												идентичным наименованием
											</p>
											<div className="grid grid-cols-2 gap-2">
												{SINKABLE_FIELDS.map((field) => (
													<Label
														key={field.value}
														className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 p-2 rounded"
													>
														<input
															type="checkbox"
															checked={syncFields.includes(field.value)}
															onChange={() =>
																setSyncFields((prev) =>
																	prev.includes(field.value)
																		? prev.filter((f) => f !== field.value)
																		: [...prev, field.value]
																)
															}
															className="w-4 h-4"
														/>
														<span>{field.label}</span>
													</Label>
												))}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					)}

					{tab === "related" && (
						<div className="space-y-4">
							<div className="p-3 rounded-xl bg-foreground/5 border border-foreground/10 text-xs text-muted-foreground mb-4">
								<p>
									Здесь вы можете добавить{" "}
									<strong>«Сопутствующие товары»</strong>, которые будут
									показываться пользователю в корзине или в карточке товара как
									рекомендация «Вместе с этим арендуют».
								</p>
							</div>
							<RelatedEquipmentPicker
								isPending={isPending}
								value={formData.relatedIds}
								onChange={(ids) => set({ relatedIds: ids })}
								{...(mode === "edit" ? { excludeId: equipment.id } : {})}
							/>
						</div>
					)}

					{tab === "notes" && (
						<div className="p-4 space-y-1.5">
							<p className="text-xs text-muted-foreground mb-3">
								Внутренние комментарии — видны только сотрудникам
							</p>
							<CommentsBlock
								comments={comments}
								onAdd={(text) => {
									const newComment: UserComment = {
										id: crypto.randomUUID(),
										text,
										author: "admin",
										createdAt: new Date().toISOString(),
									};
									const updated = [...comments, newComment];
									setComments(updated);
									markDirty();
								}}
								onRemove={(id) => {
									const updated = comments.filter((c) => c.id !== id);
									setComments(updated);
									markDirty();
								}}
							/>
						</div>
					)}
				</div>

				<SheetFooter className="bg-muted-foreground/10 border-t border-white/10 px-6 py-4 shrink-0">
					<div className="flex gap-2 w-full">
						<Button
							onClick={handleSave}
							className="flex-1"
							disabled={isPending}
						>
							{isPending && (
								<CircleNotchIcon className="w-4 h-4 animate-spin mr-2" />
							)}
							{mode === "create" ? "Создать" : "Сохранить"}
						</Button>
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => handleOpenChange(false)}
						>
							Отмена
						</Button>
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
