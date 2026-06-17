"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cancelBookingAction } from "@/actions/client-booking-actions";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Textarea,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { CANCELLATION_PRESETS } from "@/constants";
import { cn } from "@/lib/utils";

interface CancelBookingDialogProps {
	bookingId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function CancelBookingDialog({
	bookingId,
	open,
	onOpenChange,
	onSuccess,
}: CancelBookingDialogProps) {
	const [selected, setSelected] = useState<string | null>(null);
	const [custom, setCustom] = useState("");
	const [loading, setLoading] = useState(false);

	const isCustom = selected === "Указать свою причину";
	const reason = isCustom ? custom.trim() : (selected ?? "");
	const canSubmit = reason.length > 0;

	const handleSubmit = async () => {
		if (!canSubmit) return;
		setLoading(true);
		const result = await cancelBookingAction(bookingId, reason);
		setLoading(false);
		if (result.success) {
			onSuccess();
			onOpenChange(false);
		} else {
			toast.error(result.error ?? "Ошибка отмены");
		}
	};

	const reset = () => {
		setSelected(null);
		setCustom("");
	};

	return (
		<AlertDialog
			open={open}
			onOpenChange={(o) => {
				if (!o) reset();
				onOpenChange(o);
			}}
		>
			<AlertDialogContent className="border-foreground/10 bg-background/90 backdrop-blur-xl max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle>Отменить заказ?</AlertDialogTitle>
					<AlertDialogDescription>
						Укажите причину отмены — это поможет нам стать лучше.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-2 py-1">
					{CANCELLATION_PRESETS.map((preset) => (
						<Button
							key={preset}
							size="xl"
							onClick={() => setSelected(preset)}
							className={cn(
								"w-full text-left px-4 py-2.5 rounded-2xl border text-sm transition-all",
								selected === preset
									? "border-muted-foreground/40 bg-muted-foreground/10 text-foreground"
									: "border-foreground/10 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
							)}
						>
							{preset}
						</Button>
					))}

					{/* Custom textarea */}
					{isCustom && (
						<Textarea
							value={custom}
							onChange={(e) => setCustom(e.target.value)}
							placeholder="Опишите причину отмены..."
							autoFocus
							rows={3}
							className="w-full rounded-xl resize-none glass-input"
						/>
					)}
				</div>

				<AlertDialogFooter className="gap-2">
					<AlertDialogCancel onClick={reset} className="flex-1">
						Не отменять
					</AlertDialogCancel>
					<Button
						variant="destructive"
						disabled={!canSubmit || loading}
						onClick={handleSubmit}
						className="flex-1"
					>
						{loading ? (
							<span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
						) : (
							"Отменить заказ"
						)}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
