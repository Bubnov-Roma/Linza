"use client";

import { ru } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import {
	type SiteSettingsInfo,
	updateSiteSettingsAction,
} from "@/actions/admin-settings-actions";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import {
	Button,
	Calendar,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@/components/ui";

export function SettingsClient({
	initialSettings,
}: {
	initialSettings: SiteSettingsInfo;
}) {
	const [formData, setFormData] = useState(initialSettings);
	const [isSaving, setIsSaving] = useState(false);

	// Конвертируем строки YYYY-MM-DD в Date объекты для календаря
	const selectedDates = formData.disabledDates.map((d) => new Date(d));

	const handleDatesChange = (dates: Date[] | undefined) => {
		if (!dates) return;
		// Сохраняем в ISO формате (срез YYYY-MM-DD)
		const strings = dates.map((d) => {
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			return `${year}-${month}-${day}`;
		});
		setFormData({ ...formData, disabledDates: strings });
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			const result = await updateSiteSettingsAction({
				phone: formData.phone,
				telegram: formData.telegram,
				address: formData.address,
				workStart: Number(formData.workStart),
				workEnd: Number(formData.workEnd),
				disabledDates: formData.disabledDates,
			});

			if (result.success) {
				toast.success("Настройки успешно обновлены");
			} else {
				toast.error(result.error || "Ошибка при сохранении");
			}
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="max-w-5xl mx-auto space-y-6 pb-20">
			<DashboardBreadcrumb items={[{ label: "Настройки сайта" }]} />

			<div>
				<h1 className="text-3xl font-black italic uppercase tracking-tight">
					Настройки
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Глобальные параметры и график работы.
				</p>
			</div>

			<form
				onSubmit={handleSave}
				className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
			>
				{/* График и выходные */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Часы работы</CardTitle>
							<CardDescription>
								Влияет на автоматический перенос аренды
							</CardDescription>
						</CardHeader>
						<CardContent className="flex gap-4">
							<div className="space-y-2 flex-1">
								<Label>Открытие (ч)</Label>
								<Input
									type="number"
									min={0}
									max={23}
									value={formData.workStart}
									onChange={(e) =>
										setFormData({
											...formData,
											workStart: Number(e.target.value),
										})
									}
								/>
							</div>
							<div className="space-y-2 flex-1">
								<Label>Закрытие (ч)</Label>
								<Input
									type="number"
									min={1}
									max={24}
									value={formData.workEnd}
									onChange={(e) =>
										setFormData({
											...formData,
											workEnd: Number(e.target.value),
										})
									}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Нерабочие дни</CardTitle>
							<CardDescription>
								Заблокированы для выдачи и возврата (праздники и т.д.)
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col items-center">
							<Calendar
								mode="multiple"
								locale={ru}
								selected={selectedDates}
								onSelect={handleDatesChange}
								className="rounded-xl border border-foreground/10 p-3"
							/>
						</CardContent>
					</Card>
				</div>

				{/* Контакты */}
				<Card>
					<CardHeader>
						<CardTitle>Контактная информация</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Телефон поддержки</Label>
							<Input
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Telegram (@username или ссылка)</Label>
							<Input
								value={formData.telegram}
								onChange={(e) =>
									setFormData({ ...formData, telegram: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Адрес самовывоза</Label>
							<Input
								value={formData.address}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
							/>
						</div>
					</CardContent>
				</Card>

				<div className="lg:col-span-2 flex justify-end">
					<Button
						type="submit"
						disabled={isSaving}
						size="lg"
						className="w-full sm:w-auto h-12 rounded-xl"
					>
						{isSaving ? "Сохранение..." : "Сохранить настройки"}
					</Button>
				</div>
			</form>
		</div>
	);
}

// const PERMISSIONS = [
// 	{ key: "bookings_approve", label: "Подтверждать брони" },
// 	{ key: "equipment_edit", label: "Редактировать технику" },
// 	{ key: "users_view", label: "Просматривать клиентов" },
// 	{ key: "finance_view", label: "Просматривать финансы" },
// ] as const;

/* (user.role === "MANAGER" && (
			<SectionCard
				icon={<ShieldCheckIcon size={14} />}
				title="Права менеджера"
				className="bg-amber-500/5"
			>
				<div className="p-5 space-y-3">
					{PERMISSIONS.map((perm) => (
						<Label
							key={perm.key}
							className="flex items-center gap-3 cursor-pointer"
						>
							<Checkbox
								checked={!!permissions[perm.key]}
								onCheckedChange={(v) => {
									const newPerms = { ...permissions, [perm.key]: !!v };
									onPermissionSave(newPerms);
								}}
							/>
							<span className="text-sm font-medium">{perm.label}</span>
						</Label>
					))}
				</div>
			</SectionCard>
			); */
import type { UserProfile } from "@/core/domain/entities/User";

interface PersonalTableProps {
	currentUserRole: string | undefined;
	initialUsers: UserProfile[];
}

export const PersonalTable = ({
	currentUserRole,
	initialUsers,
}: PersonalTableProps) => {
	// const [_isPending, startTransition] = useTransition();
	// const handleRoleChange = (userId: string, newRole: Role) => {
	// 	startTransition(async () => {
	// 		const r = await updateUserRoleAction(userId, newRole);
	// 		if (r.success) {
	// 			setUsers((prev) =>
	// 				prev.map((u) =>
	// 					u.id === userId ? { ...u, role: newRole as UserProfile["role"] } : u
	// 				)
	// 			);
	// 			toast.success(`Роль → ${newRole}`);
	// 		} else toast.error(r.error);
	// 	});
	// };

	return (
		<div>
			{currentUserRole}
			{initialUsers.map((u) => (
				<div key={u.id}>
					{u.name} - {u.email} - {u.role}
				</div>
			))}

			{/* <TableCell onClick={(e) => e.stopPropagation()}>
                      {currentUserRole === "ADMIN" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-1 hover:opacity-80"
                            >
                              <RoleBadge role={user.role ?? "user"} />
                              <CaretDownIcon
                                size={10}
                                className="text-muted-foreground"
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {(
                              ["USER", "PARTNER", "MANAGER", "ADMIN"] as Role[]
                            ).map((r) => (
                              <DropdownMenuItem
                                key={r}
                                onClick={() => handleRoleChange(user.id, r)}
                                className={user.role === r ? "font-bold" : ""}
                              >
                                {r}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <RoleBadge role={user.role ?? "user"} />
                      )}
                    </TableCell> */}
		</div>
	);
};
