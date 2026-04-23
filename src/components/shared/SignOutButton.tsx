"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useUnsavedChanges } from "@/store";

interface SignOutButtonProps {
	className?: string;
	showText?: boolean;
}

export function SignOutButton({
	className,
	showText = true,
}: SignOutButtonProps) {
	const [isPending, setIsPending] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const { isDirty, markClean } = useUnsavedChanges(); // Убрали markDirty

	const handleSignOut = async () => {
		setIsOpen(false);
		setIsPending(true);

		try {
			await signOut({
				redirect: false,
				callbackUrl: "/",
			});

			markClean();

			// Показываем успешное сообщение
			toast.success("Вы успешно вышли из аккаунта");

			// Редирект на главную
			window.location.href = "/";
		} catch (error) {
			console.error("Ошибка при выходе:", error);
			toast.error("Не удалось выйти из аккаунта");
			setIsPending(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button
					size="xl"
					variant="ghost"
					disabled={isPending}
					className={cn(
						"w-full box-border duration-100 justify-start px-5 py-4 rounded-2xl border border-foreground/5 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors",
						className
					)}
				>
					<LogOut size={18} className={cn(isPending && "animate-spin")} />
					{showText && (
						<span>{isPending ? "Выход..." : "Выйти из аккаунта"}</span>
					)}
				</Button>
			</AlertDialogTrigger>

			<AlertDialogContent>
				<AlertDialogHeader className="space-y-3">
					<div
						className={cn(
							"w-12 h-12 rounded-2xl flex items-center justify-center mb-2 mx-auto sm:mx-0",
							isDirty
								? "bg-orange-500/20 text-orange-400"
								: "bg-red-500/20 text-red-400"
						)}
					>
						<LogOut size={24} />
					</div>
					<AlertDialogTitle className="text-2xl font-bold">
						{isDirty ? "Есть несохраненные изменения" : "Уже уходите?"}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-base leading-relaxed">
						{isDirty
							? "У вас остались несохраненные правки. Если выйдете сейчас, они исчезнут навсегда."
							: "Вы уверены, что хотите завершить сеанс? Мы будем ждать вашего возвращения."}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter className="mt-8 gap-3">
					<AlertDialogCancel asChild>
						<Button variant="outline" className="rounded-2xl px-6 h-10">
							Отмена
						</Button>
					</AlertDialogCancel>

					<AlertDialogAction asChild>
						<Button
							variant={isDirty ? "destructive" : "ghost"} // Используем стандартные варианты
							onClick={(e) => {
								e.preventDefault();
								handleSignOut();
							}}
							className={cn(
								"rounded-2xl px-6 h-10 transition-all",
								!isDirty && "hover:bg-red-500/20 hover:text-red-400"
							)}
							disabled={isPending}
						>
							{isDirty ? "Все равно выйти" : "Выйти"}
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
