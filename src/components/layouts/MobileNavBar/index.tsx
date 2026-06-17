"use client";

import {
	CameraIcon,
	ChatsIcon,
	FilmSlateIcon,
	HeadsetIcon,
	HouseIcon,
	MagnifyingGlassIcon,
	PackageIcon,
	SquaresFourIcon,
	UserIcon,
} from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { CatalogDrawer } from "@/components/layouts/MobileNavBar/CatalogDrawer";
import { NavTab } from "@/components/layouts/MobileNavBar/NavTab";
import {
	type SupportConfig,
	SupportDrawer,
} from "@/components/layouts/MobileNavBar/SupportDrawer";
import { UserMenu } from "@/components/layouts/UserMenu";
import { SupportModal } from "@/components/shared/SupportModal/SupportModal";
import type { DbCategory } from "@/core/domain/entities/Equipment";
import { useAdminNotificationsStore } from "@/store";
import { MobileSearch, type MobileSearchHandle } from "./MobileSearch";

interface MobileNavBarProps {
	categories: DbCategory[];
	isAdmin: boolean;
	support: SupportConfig;
}

export function MobileNavBar({
	categories,
	isAdmin,
	support,
}: MobileNavBarProps) {
	const pathname = usePathname();
	const mobileSearchRef = useRef<MobileSearchHandle>(null);

	// Состояния открытия шторок/модалок
	const [searchOpen, setSearchOpen] = useState(false);
	const [catalogOpen, setCatalogOpen] = useState(false);
	const [supportOpen, setSupportOpen] = useState(false);
	const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);

	// Подписка на уведомления из стора (для админа)
	const pendingBookings = useAdminNotificationsStore((s) => s.pendingBookings);
	const pendingApps = useAdminNotificationsStore((s) => s.pendingApps);
	const pendingSupport = useAdminNotificationsStore((s) => s.pendingChats);
	const pendingStudio = useAdminNotificationsStore((s) => s.pendingStudio);

	const handleOpenSearch = () => {
		setSearchOpen(true);
		mobileSearchRef.current?.focus();
	};

	return (
		<>
			<nav className="md:hidden fixed bottom-0 inset-x-0 z-50">
				<div className="fixed bottom-0 inset-x-0 h-16 bg-background/80 backdrop-blur-lg z-40 flex items-center justify-around px-2 pb-safe border-t border-border/10">
					{/* Левый неизменяемый элемент — Меню пользователя */}
					<div className="shrink-0 w-14 flex items-center justify-center border-r border-muted-foreground/5">
						<UserMenu isAdmin={isAdmin} variant="mobile" />
					</div>

					{isAdmin ? (
						<>
							{/* НАВИГАЦИЯ АДМИНА */}
							<NavTab
								title="Заказы"
								icon={PackageIcon}
								href="/admin/bookings"
								isActive={pathname.startsWith("/admin/bookings")}
								badge={pendingBookings > 0 ? pendingBookings : ""}
							/>
							<NavTab
								title="Клиенты"
								icon={UserIcon}
								href="/admin/users"
								isActive={pathname.startsWith("/admin/users")}
								badge={pendingApps > 0 ? pendingApps : ""}
							/>
							<NavTab
								title="Чаты"
								icon={ChatsIcon}
								href="/admin/support"
								isActive={pathname.startsWith("/admin/support")}
								badge={pendingSupport > 0 ? pendingSupport : ""}
							/>
							<NavTab
								title="Студия"
								icon={FilmSlateIcon}
								href="/admin/studio"
								isActive={pathname.startsWith("/admin/studio")}
								badge={pendingStudio > 0 ? pendingStudio : ""}
							/>
							<NavTab
								title="Техника"
								icon={CameraIcon}
								href="/admin/equipment"
								isActive={pathname.startsWith("/admin/equipment")}
							/>
						</>
					) : (
						<>
							{/* НАВИГАЦИЯ КЛИЕНТА */}
							<NavTab
								title="Главная"
								icon={HouseIcon}
								href="/"
								isActive={pathname === "/"}
							/>
							<NavTab
								title="Каталог"
								icon={SquaresFourIcon}
								isActive={pathname.startsWith("/equipment")}
								onClick={() => setCatalogOpen(true)}
							/>
							<NavTab
								title="Студия"
								icon={FilmSlateIcon}
								href="/studio"
								isActive={pathname.startsWith("/studio")}
							/>
							<NavTab
								title="Поиск"
								icon={MagnifyingGlassIcon}
								isActive={searchOpen}
								onClick={handleOpenSearch}
							/>
							<NavTab
								title="Связь"
								icon={HeadsetIcon}
								isActive={supportOpen}
								onClick={() => setSupportOpen(true)}
							/>
						</>
					)}
				</div>
			</nav>

			<CatalogDrawer
				open={catalogOpen}
				onOpenChange={setCatalogOpen}
				categories={categories}
			/>

			<SupportDrawer
				open={supportOpen}
				onOpenChange={setSupportOpen}
				onOpenLiveChat={() => {
					setSupportOpen(false);
					setIsLiveChatOpen(true);
				}}
				support={support}
			/>

			<SupportModal open={isLiveChatOpen} onOpenChange={setIsLiveChatOpen} />

			<MobileSearch
				isOpen={searchOpen}
				onClose={() => setSearchOpen(false)}
				categories={categories}
			/>
		</>
	);
}
