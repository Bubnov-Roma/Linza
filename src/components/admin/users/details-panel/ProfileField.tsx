"use client";

import { CheckIcon, CopyIcon, PasswordIcon } from "@phosphor-icons/react";
import { Info as InfoIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InlineEditField } from "@/components/shared";
import { Button, Label } from "@/components/ui";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProfileFieldProps {
	label: string;
	value?: string | undefined | null;
	originalValue?: string;
	placeholder?: string;
	onSave: (value: string) => Promise<void> | void;
	className?: string;
	type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
	isCrypto?: boolean;
}

export function ProfileField({
	label,
	value,
	originalValue,
	placeholder,
	onSave,
	className,
	type,
	isCrypto = false,
}: ProfileFieldProps) {
	const [copied, setCopied] = useState(false);
	const hasChanges =
		originalValue !== undefined &&
		originalValue !== null &&
		String(originalValue).trim() !== "" &&
		String(originalValue).trim() !== String(value).trim();

	const handleCopy = () => {
		if (!originalValue) return;
		navigator.clipboard.writeText(originalValue);
		setCopied(true);
		toast.success("Значение скопировано");
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className={className}>
			<div className="flex items-center gap-1.5 mb-1">
				<Label className="text-[10px] text-muted-foreground uppercase">
					{label}
				</Label>
				{isCrypto && (
					<Tooltip>
						<TooltipTrigger>
							<PasswordIcon
								size={12}
								className="text-muted-foreground animate-in fade-in zoom-in duration-300 cursor-help"
							/>
						</TooltipTrigger>
						<TooltipContent>Данные зашифрованы в БД</TooltipContent>
					</Tooltip>
				)}
				{hasChanges && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<InfoIcon
									size={12}
									className="text-muted-foreground animate-in fade-in zoom-in duration-300 cursor-help"
								/>
							</TooltipTrigger>
							<TooltipContent side="top" className="max-w-75 wrap-break-word">
								<p className="text-[10px] font-bold mb-1 uppercase opacity-60">
									Вариант клиента:
								</p>
								<div className="flex justify-between items-center gap-4">
									<p className="text-sm">{originalValue}</p>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6 hover:bg-foreground/10"
										onClick={handleCopy}
									>
										{copied ? (
											<CheckIcon size={12} className="text-green-500" />
										) : (
											<CopyIcon size={12} className="opacity-50" />
										)}
									</Button>
								</div>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>

			<InlineEditField
				value={value || ""}
				placeholder={placeholder ?? ""}
				onSave={onSave}
				type={type}
			/>
		</div>
	);
}
