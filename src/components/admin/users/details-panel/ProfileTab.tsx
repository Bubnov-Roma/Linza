"use client";

import {
	ChatIcon,
	ProhibitIcon,
	ShieldIcon,
	TrashIcon,
	UserIcon,
} from "@phosphor-icons/react";
import type { ApplicationDataFull } from "@/actions/admin-user-actions";
import { ProfileField } from "@/components/admin/users/details-panel/ProfileField";
import { InlineEditField, SectionCard } from "@/components/shared";
import { Button, Label } from "@/components/ui";
import type { UserProfile } from "@/core/domain/entities/User";

interface ProfileTabProps {
	user: UserProfile;
	appData: ApplicationDataFull | null;
	permissions: Record<string, boolean>;
	onPermissionSave: (p: Record<string, boolean>) => void;
	handleFieldSave: (
		fieldPath: string,
		value: string | unknown
	) => Promise<void>;
	clientOriginalData: ApplicationDataFull | null;
}

export function ProfileTab({
	user,
	appData,
	handleFieldSave,
	clientOriginalData,
}: ProfileTabProps) {
	const passportSeriesNumber =
		appData?.passport?.seriesAndNumber ||
		`${appData?.passport?.series || ""} ${appData?.passport?.number || ""}`.trim();

	const passport = appData?.passport;
	const contacts = appData?.contacts;

	// Функция для получения оригинального значения
	const getOriginalValue = (path: string): string => {
		if (!clientOriginalData) return "";

		const keys = path.split(".");
		let value: unknown = clientOriginalData;

		for (const key of keys) {
			if (value && typeof value === "object") {
				value = (value as Record<string, unknown>)[key];
			} else {
				return "";
			}
		}
		return value as unknown as string;
	};

	return (
		<div className="divide-y divide-foreground/5 pb-10 space-y-4 pt-4">
			{/* Личные данные */}
			<SectionCard icon={<UserIcon size={14} />} title="Личные данные">
				<div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
					{user.isBlocked && (
						<div className="col-span-1 sm:col-span-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm flex items-start gap-2">
							<ProhibitIcon size={16} className="mt-0.5" />
							<p>
								{user.blockedReason ? (
									<span className="font-bold">{user.blockedReason}</span>
								) : (
									<span className="font-bold">Профиль заблокирован </span>
								)}
							</p>
						</div>
					)}
					<ProfileField
						label="Фамилия"
						value={appData?.lastName}
						originalValue={getOriginalValue("lastName")}
						onSave={(v) => handleFieldSave("lastName", v)}
						placeholder="Добавьте фамилию клиента"
					/>
					<ProfileField
						label="Имя"
						value={appData?.firstName}
						originalValue={getOriginalValue("firstName")}
						onSave={(v) => handleFieldSave("firstName", v)}
						placeholder="Добавьте имя клиента"
					/>
					<ProfileField
						label="Отчество"
						value={appData?.middleName}
						originalValue={getOriginalValue("middleName")}
						onSave={(v) => handleFieldSave("middleName", v)}
						placeholder="Добавьте отчество клиента"
					/>
					<ProfileField
						label="Дата рождения"
						value={appData?.birthDate}
						originalValue={getOriginalValue("birthDate")}
						onSave={(v) => handleFieldSave("birthDate", v)}
						placeholder="ДД.ММ.ГГГГ"
					/>
					<ProfileField
						label="Email"
						value={contacts?.email}
						originalValue={getOriginalValue("contacts.email")}
						onSave={(v) => handleFieldSave("contacts.email", v)}
						placeholder="Актуальная почта для связи"
					/>
					<ProfileField
						label="Телефон"
						value={appData?.contacts?.phone || user.phone}
						originalValue={getOriginalValue("contacts.phone")}
						onSave={(v) => handleFieldSave("contacts.phone", v)}
						placeholder="Актуальный номер для связи"
					/>
				</div>
			</SectionCard>
			<SectionCard icon={<ShieldIcon size={14} />} title="Паспортные данные">
				<div className="p-5 space-y-5">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<ProfileField
							label="Серия и номер"
							isCrypto
							value={passportSeriesNumber}
							originalValue={
								clientOriginalData?.passport?.seriesAndNumber ||
								`${clientOriginalData?.passport?.series || ""} ${clientOriginalData?.passport?.number || ""}`.trim()
							}
							onSave={(v) => handleFieldSave("passport.seriesAndNumber", v)}
							placeholder="0000 000000"
						/>
						<ProfileField
							label="Дата выдачи"
							value={passport?.issuedAt}
							originalValue={getOriginalValue("passport.issuedAt")}
							onSave={(v) => handleFieldSave("passport.issuedAt", v)}
							placeholder="ДД.ММ.ГГГГ"
						/>
						<ProfileField
							label="Код подразделения"
							value={passport?.divisionCode}
							originalValue={getOriginalValue("passport.divisionCode")}
							onSave={(v) => handleFieldSave("passport.divisionCode", v)}
							placeholder="000-000"
						/>
					</div>
					<ProfileField
						label="Кем выдан"
						isCrypto
						value={passport?.issuedBy}
						originalValue={getOriginalValue("passport.issuedBy")}
						onSave={(v) => handleFieldSave("passport.issuedBy", v)}
						placeholder="Наименование органа выдавшего документ"
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2">
						<ProfileField
							label="Адрес регистрации"
							value={appData?.passport?.registrationAddress}
							originalValue={getOriginalValue("passport.registrationAddress")}
							onSave={(v) => handleFieldSave("passport.registrationAddress", v)}
							placeholder="Адрес прописки указанный в паспорте"
						/>
						<ProfileField
							label="Адрес проживания"
							value={appData?.address?.residentialAddress}
							originalValue={getOriginalValue("address.residentialAddress")}
							onSave={(v) => handleFieldSave("address.residentialAddress", v)}
							placeholder="Адрес фактического места жительства"
						/>
					</div>
				</div>
			</SectionCard>
			<div className="flex flex-col gap-4">
				<SectionCard
					icon={<ChatIcon size={14} />}
					title="Дополнительные данные"
				>
					<div className="grid  grid-cols-1 sm:grid-cols-2 p-5 gap-4">
						<ProfileField
							label="Как узнали"
							value={appData?.recommendedBy || ""}
							originalValue={getOriginalValue("recommendedBy")}
							onSave={(v) => handleFieldSave("recommendedBy", v)}
							placeholder="Данные о том, как узнали о прокате"
						/>
						<ProfileField
							label="Дополнительный телефон"
							value={contacts?.extraPhone}
							originalValue={getOriginalValue("contacts.extraPhone")}
							onSave={(v) => handleFieldSave("contacts.extraPhone", v)}
							placeholder="+7(000)000-00-00"
						/>
					</div>
				</SectionCard>
				<SectionCard icon={<ChatIcon size={14} />} title="Социальные сети">
					<div className="grid grid-cols-1 sm:grid-cols-2 p-5 gap-4">
						{/* Вывод существующих соцсетей */}
						{(contacts?.socials || []).map((s, i) => {
							// Достаем оригинальную ссылку клиента по индексу массива
							const originalValue =
								clientOriginalData?.contacts?.socials?.[i]?.url;

							return (
								<div key={i} className="flex gap-2 items-start">
									<ProfileField
										label={`Ссылка ${i + 1}`}
										value={s.url}
										originalValue={originalValue ?? ""}
										placeholder="@username или https://..."
										onSave={(val) => {
											const newArr = [...(contacts?.socials || [])];
											if (newArr[i]) {
												newArr[i].url = val;
												handleFieldSave("contacts.socials", newArr);
											}
										}}
										className="flex-1"
									/>
									<Button
										variant="ghost"
										className="h-10 w-10 mt-6 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0 transition-colors"
										onClick={() => {
											const newArr = (contacts?.socials || []).filter(
												(_, idx) => idx !== i
											);
											handleFieldSave("contacts.socials", newArr);
										}}
									>
										<TrashIcon size={16} />
									</Button>
								</div>
							);
						})}
						<div>
							<Label className="text-[10px] text-muted-foreground uppercase block mb-1">
								Добавить новую ссылку
							</Label>
							<InlineEditField
								value=""
								mode="create"
								placeholder="@username или https://..."
								onAdd={(val) => {
									// Берем текущий массив и добавляем в конец новый объект
									const newArr = [...(contacts?.socials || []), { url: val }];
									handleFieldSave("contacts.socials", newArr);
								}}
							/>
						</div>
					</div>
				</SectionCard>
			</div>
		</div>
	);
}
