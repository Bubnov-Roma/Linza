"use client";

import {
	CalendarIcon,
	CameraIcon,
	FolderOpenIcon,
	QuestionIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { Banner } from "@/actions/admin/admin-banner-actions";
import { BannerManager } from "@/components/admin/banner/BannerManager";
import { QuickActionLink } from "@/components/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_STYLES } from "@/constants";
import { fmtRub } from "@/lib/utils";
import type { AdminDashboardData } from "@/types";

interface DashboardClientProps {
	stats: AdminDashboardData;
	banners?: Banner[] | undefined;
}

export function DashboardClient({ stats, banners }: DashboardClientProps) {
	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-3xl font-black italic uppercase tracking-tight">
					Панель администратора
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{new Date().toLocaleDateString("ru-RU", {
						weekday: "long",
						day: "numeric",
						month: "long",
					})}
				</p>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Recent bookings */}
				<Card className="lg:col-span-2 py-4">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-base font-bold">
								Последние бронирования
							</CardTitle>
							<Button variant="outline" size="sm" asChild>
								<Link href="/admin/bookings">Все →</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-foreground/5">
										{["Клиент", "Техника", "Сумма", "Статус"].map((h) => (
											<th
												key={h}
												className="px-4 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{stats.recentBookings.map((booking) => {
										const equipmentTitle =
											booking.bookingItems[0]?.equipment.title ?? "—";
										const statusLabel =
											BOOKING_STATUS_LABELS[booking.status] ?? booking.status;
										const statusColor =
											BOOKING_STATUS_STYLES[booking.status] ??
											"bg-foreground/10 text-foreground/60";

										return (
											<tr
												key={booking.id}
												className="border-b border-foreground/5 last:border-0 hover:bg-foreground/3 transition-colors"
											>
												<td className="px-4 py-3">
													<p className="text-sm font-medium truncate max-w-32">
														{booking.user?.name || "Без имени"}
													</p>
													<p className="text-[11px] text-muted-foreground truncate max-w-32">
														{booking.user?.email || "—"}
													</p>
												</td>
												<td className="px-4 py-3">
													<p className="text-sm truncate max-w-36 text-muted-foreground">
														{equipmentTitle}
													</p>
												</td>
												<td className="px-4 py-3 font-bold text-sm whitespace-nowrap">
													{fmtRub(booking.totalAmount)}
												</td>
												<td className="px-4 py-3">
													<Badge
														variant="outline"
														className={`text-[10px] ${statusColor}`}
													>
														{statusLabel}
													</Badge>
												</td>
											</tr>
										);
									})}
									{stats.recentBookings.length === 0 && (
										<tr>
											<td
												colSpan={4}
												className="px-4 py-8 text-center text-sm text-muted-foreground"
											>
												Бронирований пока нет
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				{/* Right column */}
				<div className="space-y-4">
					<Card className="py-6">
						<CardHeader className="pb-3">
							<CardTitle className="text-base font-bold">
								Быстрые действия
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<QuickActionLink
								href="/admin/equipment"
								icon={<CameraIcon size={18} />}
								label="Техника"
								description="Управление каталогом"
							/>
							<QuickActionLink
								href="/admin/categories"
								icon={<FolderOpenIcon size={18} />}
								label="Категории"
								description={`${stats.categories.length} категорий`}
							/>
							<QuickActionLink
								href="/admin/users"
								icon={<UsersIcon size={18} />}
								label="Клиенты"
								description={`${stats.totalUsers} аккаунтов`}
							/>
							<QuickActionLink
								href="/admin/bookings"
								icon={<CalendarIcon size={18} />}
								label="Заказы"
								badge={stats.pendingBookings}
								description="Обработка заявок"
							/>
							<QuickActionLink
								href="/admin/faq"
								icon={<QuestionIcon size={18} />}
								label="FAQ"
								description={`${stats.faqCount} вопросов`}
							/>
						</CardContent>
					</Card>

					<BannerManager initialBanners={banners ?? []} />
				</div>
			</div>
		</div>
	);
}
