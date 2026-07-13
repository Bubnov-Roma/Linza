"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { EquipmentSort } from "@/actions/admin/admin-equipment-actions";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui";

const SORTABLE_COLUMNS = [
	{ value: "title", label: "Наименование" },
	{ value: "categoryId", label: "Категория" },
	{ value: "inventoryNumber", label: "Инв. №" },
	{ value: "pricePerDay", label: "Цена/сутки" },
	{ value: "status", label: "Статус" },
	{ value: "createdAt", label: "Дата создания" },
	{ value: "updatedAt", label: "Дата обновления" },
	{ value: "deposit", label: "Депозит" },
	{ value: "replacementValue", label: "Стоимость замены" },
	{ value: "isPrimary", label: "Основные" },
] as const;

type SortableColumnValue = (typeof SORTABLE_COLUMNS)[number]["value"];

interface SortBuilderProps {
	sorts: EquipmentSort[];
	onSortChange: (sort: EquipmentSort[]) => void;
}

export function SortBuilder({ sorts, onSortChange }: SortBuilderProps) {
	const addSort = () => {
		onSortChange([...sorts, { column: "createdAt", ascending: false }]);
	};

	const updateSort = (
		index: number,
		field: keyof EquipmentSort,
		value: string | boolean
	) => {
		const updated = [...sorts];
		const sort = updated[index];
		if (!sort) return;

		if (field === "column") {
			updated[index] = { ...sort, column: value as SortableColumnValue };
		} else if (field === "ascending") {
			updated[index] = { ...sort, ascending: value as boolean };
		}

		onSortChange(updated);
	};

	const removeSort = (index: number) => {
		onSortChange(sorts.filter((_, i) => i !== index));
	};

	const clearSorts = () => {
		onSortChange([]);
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Button
					variant="outline"
					size="sm"
					onClick={addSort}
					className="h-8 text-xs"
				>
					<Plus className="w-3 h-3 mr-1" />
					Добавить сортировку
				</Button>
				{sorts.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearSorts}
						className="h-8 text-xs text-muted-foreground"
					>
						Очистить
					</Button>
				)}
			</div>

			{sorts.length > 0 && (
				<div className="space-y-2 p-3 border border-white/5 rounded-lg bg-background/20">
					{sorts.map((sort, index) => (
						<div
							key={`${sort.column}-${index}`}
							className="flex items-center gap-2"
						>
							<Select
								value={sort.column as string}
								onValueChange={(value) => updateSort(index, "column", value)}
							>
								<SelectTrigger className="h-8 flex-1 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SORTABLE_COLUMNS.map((col) => (
										<SelectItem key={col.value} value={col.value}>
											{col.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Button
								variant="outline"
								size="sm"
								onClick={() => updateSort(index, "ascending", !sort.ascending)}
								className="h-9 w-24 text-xs"
							>
								{sort.ascending ? (
									<>
										<ArrowUp className="w-3 h-3 mr-1" />
										По возр.
									</>
								) : (
									<>
										<ArrowDown className="w-3 h-3 mr-1" />
										По убыв.
									</>
								)}
							</Button>

							<Button
								variant="ghost"
								size="icon"
								onClick={() => removeSort(index)}
								className="h-8 w-8 shrink-0"
							>
								<X className="w-3 h-3" />
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
