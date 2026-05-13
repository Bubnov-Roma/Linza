import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

function Spinner({ className, color, ...props }: React.ComponentProps<"svg">) {
	return (
		<CircleNotchIcon
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			color={color || "currentColor"}
			{...props}
		/>
	);
}

export { Spinner };
