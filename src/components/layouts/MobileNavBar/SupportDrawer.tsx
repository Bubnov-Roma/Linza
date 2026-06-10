import {
	CaretRightIcon,
	ChatCenteredTextIcon,
	EnvelopeSimpleIcon,
	PhoneIcon,
	TelegramLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
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
	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="max-h-[60vh] p-0 flex flex-col">
				<DrawerHeader className="px-6 pt-6 pb-2">
					<DrawerTitle className="text-xl font-black uppercase italic tracking-tight text-left">
						Служба поддержки
					</DrawerTitle>
					<DrawerDescription className="hidden">
						Связь со службой поддержки
					</DrawerDescription>
				</DrawerHeader>

				<div className="p-6 space-y-4 flex-1 overflow-y-auto">
					<Button
						size="xl"
						onClick={onOpenLiveChat}
						className="flex items-center gap-4 w-full h-16 px-5 rounded-full font-bold shadow-md"
					>
						<div className="p-2.5 bg-primary-foreground/10 rounded-full">
							<ChatCenteredTextIcon size={24} weight="fill" />
						</div>
						<div className="flex flex-col flex-1 text-left">
							<span className="text-base font-black uppercase tracking-tight italic">
								Написать в чат
							</span>
							<span className="text-xs font-normal opacity-80">
								Ответим прямо здесь
							</span>
						</div>
						<CaretRightIcon size={16} weight="bold" />
					</Button>

					<div className="relative flex py-2 items-center">
						<div className="grow border-t border-border/60"></div>
						<span className="shrink mx-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/40 select-none">
							или свяжитесь напрямую
						</span>
						<div className="grow border-t border-border/60"></div>
					</div>

					<div className="grid grid-cols-1 gap-2.5">
						{support?.telegram && (
							<Link
								href={support.telegram}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-4 h-14 px-4 rounded-xl bg-muted-foreground/5 active:bg-muted-foreground/10 transition-colors text-foreground"
							>
								<TelegramLogoIcon
									size={22}
									weight="duotone"
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
								className="flex items-center gap-4 h-14 px-4 rounded-xl bg-muted-foreground/5 active:bg-muted-foreground/10 transition-colors text-foreground"
							>
								<VkLogoIcon className="text-[#5277f0]" />
								<span className="text-sm font-semibold">ВКонтакте</span>
							</Link>
						)}
						{support?.phone && (
							<Link
								href={`tel:${support.phone}`}
								className="flex items-center gap-4 h-14 px-4 rounded-xl bg-muted-foreground/5 active:bg-muted-foreground/10 transition-colors text-foreground"
							>
								<PhoneIcon
									size={22}
									weight="duotone"
									className="text-green-500"
								/>
								<span className="text-sm font-semibold">{support.phone}</span>
							</Link>
						)}
						{support?.email && (
							<Link
								href={`mailto:${support.email}`}
								className="flex items-center gap-4 h-14 px-4 rounded-xl bg-muted-foreground/5 active:bg-muted-foreground/10 transition-colors text-foreground"
							>
								<EnvelopeSimpleIcon
									size={22}
									weight="duotone"
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
