"use client";
import { type FieldPath, useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ClientFormValues } from "@/schemas";

interface FormCheckboxProps {
	name: FieldPath<ClientFormValues>;
	label: React.ReactNode;
	isSecondary?: boolean;
	className?: string;
}

export const FormCheckbox = ({
	name,
	label,
	isSecondary,
	className,
}: FormCheckboxProps) => {
	const { register, control, formState, trigger } =
		useFormContext<ClientFormValues>();
	const { ref, onChange, ...restRegister } = register(name);
	const isChecked = useWatch({ control, name });
	const { error } = control.getFieldState(name, formState);

	return (
		<div className="flex flex-col gap-1.5">
			<Label
				className={`flex items-center gap-3 cursor-pointer group transition-opacity font-bold uppercase tracking-[0.12em]`}
			>
				<div className="relative flex items-center justify-center">
					<input
						type="checkbox"
						ref={ref}
						{...restRegister}
						onChange={async (e) => {
							await onChange(e);
							trigger(name);
						}}
						className="peer w-5 h-5 opacity-0 absolute cursor-pointer z-10"
					/>
					<div
						className={`
					  w-5 h-5 rounded-lg border transition-all duration-200 flex items-center justify-center
					  ${
							isSecondary
								? "border-white/10 bg-white/5 peer-checked:bg-blue-500 peer-checked:border-blue-500"
								: "border-foreground/10 bg-foreground/2 peer-checked:bg-transparent peer-checked:border-foreground/20"
						}
					`}
					>
						{isChecked ? (
							<svg
								width="12"
								height="10"
								viewBox="0 0 12 10"
								fill="none"
								className="absolute z-10"
							>
								<path
									d="M1 5L4.5 8.5L11 1.5"
									stroke="background"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						) : null}
						<div
							className={`absolute w-full h-full rounded-full -bottom-50% -right-50% peer-checked:scale-100 bg-foreground hover:shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-400
								${isChecked ? "scale:1" : "scale-0"}
            `}
						/>
					</div>
				</div>
				<span
					className={cn(
						`tracking-widest transition-colors`,
						isSecondary
							? "text-[10px] text-foreground/30"
							: "text-xs text-foreground/50 group-hover:text-foreground/80",
						className
					)}
				>
					{label}
				</span>
			</Label>

			{error?.message && (
				<p className="text-[9px] text-red-400 uppercase font-bold ml-8 tracking-tighter">
					{error.message}
				</p>
			)}
		</div>
	);
};
