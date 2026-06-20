"use client";

import {
	CaretRightIcon,
	ChatCenteredTextIcon,
	ChatsCircleIcon,
	EnvelopeSimpleIcon,
	PhoneIcon,
	TelegramLogoIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { VkLogoIcon } from "@/components/icons";
import {
	Button,
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui";
import { useClientNotificationsStore } from "@/store/use-client-notifications.store";

export interface SupportConfig {
	telegram?: string;
	phone?: string;
	email?: string;
	vk?: string;
}

export function SupportDrawer({
	open,
	onOpenChange,
	onOpenLiveChat,
	support,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onOpenLiveChat: () => void;
	support?: SupportConfig;
}) {
	const unreadChats = useClientNotificationsStore((s) => s.unreadChats);

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="max-h-[65vh] p-0 flex flex-col">
				<DrawerHeader className="px-6 pt-6 pb-2">
					<DrawerTitle className="text-xl font-black uppercase italic tracking-tight text-left">
						Служба поддержки
					</DrawerTitle>
					<DrawerDescription className="hidden">
						Связь со службой поддержки
					</DrawerDescription>
				</DrawerHeader>

				<div className="p-6 space-y-3 flex-1 overflow-y-auto">
					{/* Новый чат */}
					<Button
						size="xl"
						variant="glass"
						onClick={onOpenLiveChat}
						className="flex items-center gap-4 w-full h-16 px-5 rounded-full font-bold shadow-md"
					>
						<ChatCenteredTextIcon size={24} weight="duotone" />
						<div className="flex flex-col flex-1 text-left">
							<span className="text-base font-black uppercase tracking-tight italic">
								Написать в поддержку
							</span>
							<span className="text-xs font-normal opacity-80">
								Ответим прямо здесь
							</span>
						</div>
						<CaretRightIcon size={16} weight="bold" />
					</Button>

					{/* Мои обращения */}
					<Link
						href="/dashboard/support"
						onClick={() => onOpenChange(false)}
						className="flex items-center justify-between w-full h-14 px-5 rounded-2xl bg-muted-foreground/10 active:bg-muted-foreground/15 transition-colors"
					>
						<div className="flex items-center gap-3">
							<ChatsCircleIcon
								size={20}
								weight="fill"
								className="text-foreground"
							/>
							<span className="text-sm font-semibold text-foreground/80">
								Мои обращения
							</span>
						</div>
						{unreadChats > 0 ? (
							<span className="min-w-5 h-5 px-1.5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
								{unreadChats}
							</span>
						) : (
							<CaretRightIcon
								size={14}
								weight="bold"
								className="text-muted-foreground/40"
							/>
						)}
					</Link>

					<div className="relative flex py-2 items-center">
						<div className="grow border-t border-border/60" />
						<span className="shrink mx-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none">
							или свяжитесь напрямую
						</span>
						<div className="grow border-t border-border/60" />
					</div>

					<div className="grid grid-cols-1 gap-2.5">
						{support?.telegram && (
							<Link
								href={support.telegram}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-4 h-14 px-4 rounded-2xl bg-muted-foreground/10 active:bg-muted-foreground/15 transition-colors text-foreground"
							>
								<TelegramLogoIcon
									size={22}
									weight="fill"
									className="text-[#24A1DE]"
								/>
								<span className="text-sm font-semibold">Telegram</span>
							</Link>
						)}
						{support?.vk && (
							<Link
								href={support.vk}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-4 h-14 px-4 rounded-2xl bg-muted-foreground/10 active:bg-muted-foreground/15 transition-colors text-foreground"
							>
								<VkLogoIcon className="text-[#5277f0]" />
								<span className="text-sm font-semibold">ВКонтакте</span>
							</Link>
						)}
						{support?.phone && (
							<Link
								href={`tel:${support.phone}`}
								className="flex items-center gap-4 h-14 px-4 rounded-2xl bg-muted-foreground/10 active:bg-muted-foreground/15 transition-colors text-foreground"
							>
								<PhoneIcon size={22} weight="fill" className="text-green-500" />
								<span className="text-sm font-semibold">{support.phone}</span>
							</Link>
						)}
						{support?.email && (
							<Link
								href={`mailto:${support.email}`}
								className="flex items-center gap-4 h-14 px-4 rounded-2xl bg-muted-foreground/10 active:bg-muted-foreground/15 transition-colors text-foreground"
							>
								<EnvelopeSimpleIcon
									size={22}
									weight="fill"
									className="text-amber-500"
								/>
								<span className="text-sm font-semibold">{support.email}</span>
							</Link>
						)}
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
