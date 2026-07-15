import { ClockIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { getUserAuditLogAction } from "@/actions/admin/admin-user-actions";

const AUDIT_ACTION_LABELS: Record<string, string> = {
	VIEW_APPLICATION: "Просмотр анкеты",
	EDIT_APPLICATION: "Редактирование поля",
};

export function AuditTab({ userId }: { userId: string }) {
	const [logs, setLogs] = useState<
		Array<{
			id: string;
			action: string;
			fieldName: string | null;
			valueBefore: string | null;
			valueAfter: string | null;
			authorName: string | null;
			createdAt: string;
		}>
	>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getUserAuditLogAction(userId).then((res) => {
			if (res.success && res.data) setLogs(res.data);
			setLoading(false);
		});
	}, [userId]);

	if (loading)
		return (
			<div className="py-10 text-center">
				<div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
			</div>
		);

	if (logs.length === 0)
		return (
			<div className="py-10 text-center">
				<ClockIcon
					size={32}
					className="mx-auto text-muted-foreground/20 mb-3"
				/>
				<p className="text-sm text-muted-foreground">История пуста</p>
			</div>
		);

	return (
		<div className="px-6 py-4 space-y-2">
			{logs.map((log) => (
				<div
					key={log.id}
					className="flex gap-3 py-2 border-b border-foreground/5 last:border-0"
				>
					<div className="w-6 h-6 rounded-full bg-foreground/8 flex items-center justify-center shrink-0 mt-0.5">
						<ClockIcon size={10} className="text-muted-foreground" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-baseline gap-2 flex-wrap">
							<span className="text-xs font-semibold text-foreground">
								{AUDIT_ACTION_LABELS[log.action] ?? log.action}
							</span>
							{log.fieldName && (
								<code className="text-[10px] bg-foreground/8 px-1 rounded text-muted-foreground">
									{log.fieldName}
								</code>
							)}
						</div>
						<div className="flex items-center gap-2 mt-0.5">
							<span className="text-[10px] text-muted-foreground">
								{log.authorName ?? "Система"}
							</span>
							<span className="text-[10px] text-muted-foreground/40">·</span>
							<span className="text-[10px] text-muted-foreground">
								{new Date(log.createdAt).toLocaleString("ru-RU", {
									day: "numeric",
									month: "short",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
						{log.valueBefore && log.valueAfter && (
							<div className="mt-1 text-[10px] text-muted-foreground space-y-0.5">
								<p>
									<span className="text-red-400/70">−</span> {log.valueBefore}
								</p>
								<p>
									<span className="text-green-400/70">+</span> {log.valueAfter}
								</p>
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
