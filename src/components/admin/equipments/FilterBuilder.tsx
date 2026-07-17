"use client";

import { PlusIcon, XIcon } from "@phosphor-icons/react";
import type {
	EquipmentFilter,
	FilterOperator,
} from "@/actions/admin/admin-equipment-actions";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";
import type { DbCategory } from "@/core/domain/entities/Equipment";

const COLUMNS = [
	{ value: "title", label: "Наименование" },
	{ value: "categoryId", label: "Категория" },
	{ value: "subcategoryId", label: "Подкатегория" },
	{ value: "inventoryNumber", label: "Инв. №" },
	{ value: "pricePerDay", label: "Цена/сутки" },
	{ value: "status", label: "Статус" },
	{ value: "isAvailable", label: "Доступность" },
	{ value: "ownershipType", label: "Тип владения" },
	{ value: "deposit", label: "Депозит" },
	{ value: "replacementValue", label: "Стоимость замены" },
] as const;

const OPERATORS: Record<string, { value: FilterOperator; label: string }[]> = {
	text: [
		{ value: "ilike", label: "содержит" },
		{ value: "eq", label: "равно" },
		{ value: "neq", label: "не равно" },
	],
	number: [
		{ value: "eq", label: "=" },
		{ value: "neq", label: "≠" },
		{ value: "gt", label: ">" },
		{ value: "gte", label: "≥" },
		{ value: "lt", label: "<" },
		{ value: "lte", label: "≤" },
	],
	boolean: [
		{ value: "eq", label: "равно" },
		{ value: "neq", label: "не равно" },
	],
	category: [{ value: "eq", label: "равно" }],
};

type ColumnValue = (typeof COLUMNS)[number]["value"];

const COLUMN_TYPES: Record<
	ColumnValue,
	"text" | "number" | "boolean" | "category"
> = {
	title: "text",
	categoryId: "category",
	subcategoryId: "category",
	inventoryNumber: "text",
	pricePerDay: "number",
	status: "text",
	isAvailable: "boolean",
	ownershipType: "text",
	deposit: "number",
	replacementValue: "number",
};

interface FilterBuilderProps {
	filters: EquipmentFilter[];
	onFiltersChange: (filters: EquipmentFilter[]) => void;
	categories?: DbCategory[];
}

export function FilterBuilder({
	filters,
	onFiltersChange,
	categories = [],
}: FilterBuilderProps) {
	const addFilter = () => {
		const newFilter: EquipmentFilter = {
			column: "title",
			operator: "ilike",
			value: "",
		};
		onFiltersChange([...filters, newFilter]);
	};

	const updateFilter = (
		index: number,
		field: keyof EquipmentFilter,
		value: string | number | boolean | FilterOperator
	) => {
		const updated = [...filters];
		const filter = updated[index];
		if (!filter) return;

		if (field === "column") {
			const colValue = value as ColumnValue;
			const colType = COLUMN_TYPES[colValue] ?? "text";
			const defaultOp = OPERATORS[colType]?.[0]?.value ?? "eq";
			updated[index] = {
				column: colValue,
				operator: defaultOp,
				value: "",
			};
		} else if (field === "operator") {
			updated[index] = { ...filter, operator: value as FilterOperator };
		} else if (field === "value") {
			updated[index] = { ...filter, value };
		}

		onFiltersChange(updated);
	};

	const removeFilter = (index: number) => {
		onFiltersChange(filters.filter((_, i) => i !== index));
	};

	const clearFilters = () => {
		onFiltersChange([]);
	};

	const getSubcategoriesForFilter = (
		index: number
	): DbCategory["subcategories"] => {
		const catFilter = filters
			.slice(0, index)
			.find((f) => f.column === "categoryId");
		if (!catFilter || !catFilter.value) {
			return categories.flatMap((c) => c.subcategories);
		}
		return (
			categories.find((c) => c.id === catFilter.value)?.subcategories ?? []
		);
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between p-3">
				<Button variant="outline" size="sm" onClick={addFilter}>
					<PlusIcon className="w-3 h-3 mr-1" />
					Добавить
				</Button>
				{filters.length > 0 && (
					<Button
						variant="ghost"
						className="h-8 text-xs text-muted-foreground"
						size="sm"
						onClick={clearFilters}
					>
						Очистить
					</Button>
				)}
			</div>

			{filters.length > 0 && (
				<div className="space-y-2 p-3 border border-white/5 rounded-lg bg-background/20">
					{filters.map((filter, index) => {
						const colValue = filter.column as ColumnValue;
						const columnType = COLUMN_TYPES[colValue] ?? "text";
						const operators = OPERATORS[columnType] ?? OPERATORS.text;
						const isCategoryCol = columnType === "category";

						return (
							<div
								key={`${filter.column}-${index}`}
								className="flex items-center gap-2"
							>
								<Select
									value={filter.column}
									onValueChange={(v) => updateFilter(index, "column", v)}
								>
									<SelectTrigger className="h-8 w-36 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{COLUMNS.map((col) => (
											<SelectItem key={col.value} value={col.value}>
												{col.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<Select
									value={filter.operator}
									onValueChange={(v) =>
										updateFilter(index, "operator", v as FilterOperator)
									}
								>
									<SelectTrigger className="h-8 w-28 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{operators?.map((op) => (
											<SelectItem key={op.value} value={op.value}>
												{op.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{isCategoryCol && filter.column === "categoryId" ? (
									<Select
										value={String(filter.value || "")}
										onValueChange={(v) => updateFilter(index, "value", v)}
									>
										<SelectTrigger className="h-8 flex-1 text-xs">
											<SelectValue placeholder="Категория..." />
										</SelectTrigger>
										<SelectContent>
											{categories.map((cat) => (
												<SelectItem key={cat.id} value={cat.id}>
													{cat.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : isCategoryCol && filter.column === "subcategoryId" ? (
									<Select
										value={String(filter.value || "")}
										onValueChange={(v) => updateFilter(index, "value", v)}
									>
										<SelectTrigger className="h-8 flex-1 text-xs">
											<SelectValue placeholder="Подкатегория..." />
										</SelectTrigger>
										<SelectContent>
											{getSubcategoriesForFilter(index).map((sub) => (
												<SelectItem key={sub.id} value={sub.id}>
													{sub.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : columnType === "boolean" ? (
									<Select
										value={String(filter.value)}
										onValueChange={(v) =>
											updateFilter(index, "value", v === "true")
										}
									>
										<SelectTrigger className="h-8 flex-1 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="true">Да</SelectItem>
											<SelectItem value="false">Нет</SelectItem>
										</SelectContent>
									</Select>
								) : filter.column === "status" ? (
									<Select
										value={String(filter.value || "")}
										onValueChange={(v) => updateFilter(index, "value", v)}
									>
										<SelectTrigger className="h-8 flex-1 text-xs">
											<SelectValue placeholder="Статус..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="AVAILABLE">Доступно</SelectItem>
											<SelectItem value="RENTED">В аренде</SelectItem>
											<SelectItem value="RESERVED">Забронировано</SelectItem>
											<SelectItem value="MAINTENANCE">Обслуживание</SelectItem>
											<SelectItem value="BROKEN">Неисправно</SelectItem>
										</SelectContent>
									</Select>
								) : filter.column === "ownershipType" ? (
									<Select
										value={String(filter.value || "")}
										onValueChange={(v) => updateFilter(index, "value", v)}
									>
										<SelectTrigger className="h-8 flex-1 text-xs">
											<SelectValue placeholder="Тип..." />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="INTERNAL">Собственное</SelectItem>
											<SelectItem value="SUBLEASE">Субаренда</SelectItem>
										</SelectContent>
									</Select>
								) : (
									<Input
										type={columnType === "number" ? "number" : "text"}
										value={String(filter.value)}
										onChange={(e) =>
											updateFilter(
												index,
												"value",
												columnType === "number"
													? Number(e.target.value)
													: e.target.value
											)
										}
										placeholder="Значение..."
										className="h-8 flex-1 text-xs glass-input"
									/>
								)}

								<Button
									variant="ghost"
									size="icon"
									onClick={() => removeFilter(index)}
									className="h-8 w-8 shrink-0"
								>
									<XIcon className="w-3 h-3" />
								</Button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
