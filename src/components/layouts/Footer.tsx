import {
	EnvelopeSimpleIcon,
	MapPinIcon,
	PhoneIcon,
	TelegramLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { VkLogoIcon } from "@/components/icons";
import { Logo } from "@/components/icons/Logo";
import type { SupportInfo } from "@/constants";
import { cn } from "@/lib/utils";

export async function Footer({ support }: { support: SupportInfo }) {
	const footerLinkClass =
		"text-sm text-muted-foreground hover:text-foreground transition-colors duration-200";
	const sectionTitleClass =
		"text-sm font-bold uppercase tracking-widest text-foreground/70 mb-6";

	const encodedAddress = encodeURIComponent(support.address);

	return (
		<footer className="w-full border-t border-foreground/5 bg-background">
			<div className="container mx-auto w-full py-16 px-6 md:px-4">
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
					{/* Brand & Mission */}
					<div className="lg:col-span-4 flex flex-col gap-6">
						<Link
							href="/"
							className="flex text-background gap-3 group bg-foreground items-baseline justify-center rounded-full transition-transform group-hover:scale-105 w-fit px-6 py-2"
						>
							<Logo size={20} className="text-background" />
							<span className="text-2xl font-black tracking-tighter">
								LINZA
							</span>
						</Link>
						<p className="max-w-xs text-base leading-relaxed text-muted-foreground">
							Профессиональное решение для аренды фото и видео оборудования.
							Техника, которая вдохновляет на творчество.
						</p>
					</div>

					{/* Navigation Grid */}
					<div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
						{/* Catalog */}
						<div className="flex flex-col">
							<h3 className={sectionTitleClass}>Каталог</h3>
							<ul className="space-y-4">
								<li>
									<Link
										href="/equipment?category=cameras"
										className={footerLinkClass}
									>
										Камеры
									</Link>
								</li>
								<li>
									<Link
										href="/equipment?category=lenses"
										className={footerLinkClass}
									>
										Объективы
									</Link>
								</li>
								<li>
									<Link
										href="/equipment?category=lighting"
										className={footerLinkClass}
									>
										Свет
									</Link>
								</li>
								<li>
									<Link
										href="/equipment"
										className={cn(footerLinkClass, "font-medium")}
									>
										Все категории
									</Link>
								</li>
							</ul>
						</div>

						{/* Company */}
						<div className="flex flex-col">
							<h3 className={sectionTitleClass}>Компания</h3>
							<ul className="space-y-4">
								<li>
									<Link href="/about" className={footerLinkClass}>
										О нас
									</Link>
								</li>
								<li>
									<Link href="/contacts" className={footerLinkClass}>
										Контакты
									</Link>
								</li>
								<li>
									<Link href="/faq" className={footerLinkClass}>
										Вопросы и ответы
									</Link>
								</li>
							</ul>
						</div>

						{/* Contacts */}
						<div className="flex flex-col col-span-2 md:col-span-1">
							<h3 className={sectionTitleClass}>Связь с нами</h3>
							<ul className="space-y-5">
								{/* Телефон */}
								<li>
									<Link
										href={`tel:${support.phone}`}
										className={cn(
											"flex items-start gap-3 group",
											footerLinkClass
										)}
									>
										<PhoneIcon
											size={20}
											weight="fill"
											className="shrink-0 transition-colors duration-200"
										/>
										<span>{support.phone}</span>
									</Link>
								</li>

								{/* Telegram */}
								<li>
									<Link
										href={`${support.telegram}`}
										target="_blank"
										className={cn(
											"flex items-start gap-3 group",
											footerLinkClass
										)}
									>
										<TelegramLogoIcon
											weight="fill"
											size={20}
											className="shrink-0 transition-colors duration-200"
										/>
										<span>{support.telegram}</span>
									</Link>
								</li>

								{/* VK */}
								<li>
									<Link
										target="_blank"
										href={support.vk}
										className={cn(
											"flex items-start gap-3 group",
											footerLinkClass
										)}
									>
										<VkLogoIcon className="shrink-0 transition-colors duration-200" />
										<span>ВКонтакте</span>
									</Link>
								</li>

								{/* Email */}
								<li>
									<Link
										href={`mailto:${support.email}`}
										className={cn(
											"flex items-start gap-3 group",
											footerLinkClass
										)}
									>
										<EnvelopeSimpleIcon
											weight="fill"
											size={20}
											className="shrink-0 transition-colors duration-200"
										/>
										<span>{support.email}</span>
									</Link>
								</li>

								{/* Адрес с картами */}
								<li className="w-full">
									<details className="group/map w-full appearance-none [&_summary::-webkit-details-marker]:hidden">
										<summary
											className={cn(
												footerLinkClass,
												"flex items-start gap-3 w-full list-none cursor-pointer select-none outline-none group"
											)}
										>
											<MapPinIcon
												size={20}
												weight="fill"
												className="shrink-0 transition-colors duration-200"
											/>
											<span>{support.address}</span>
										</summary>

										<div className="pt-3 space-y-2 ml-2.5 mt-2">
											<Link
												href={`https://yandex.ru/maps/?text=${encodedAddress}`}
												target="_blank"
												rel="noreferrer"
												className="block text-xs py-1.5 px-3 bg-muted-foreground/5 hover:bg-muted-foreground/10 rounded-lg transition-colors"
											>
												📍 Открыть в Яндекс Картах
											</Link>
											<Link
												href={`https://2gis.ru/search/${encodedAddress}`}
												target="_blank"
												rel="noreferrer"
												className="block text-xs py-1.5 px-3 bg-muted-foreground/5 hover:bg-muted-foreground/10 rounded-lg transition-colors"
											>
												🏢 Открыть в 2GIS
											</Link>
											<Link
												href={`https://maps.google.com/?q=${encodedAddress}`}
												target="_blank"
												rel="noreferrer"
												className="block text-xs py-1.5 px-3 bg-muted-foreground/5 hover:bg-muted-foreground/10 rounded-lg transition-colors"
											>
												🗺 Открыть в Google Maps
											</Link>
										</div>
									</details>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-16 pt-8 pb-8 md:pb-0 border-t border-foreground/5">
					<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
						<p className="text-xs font-medium text-muted-foreground/60 select-none">
							© {new Date().getFullYear()} LINZA RENTAL. С любовью к кадру.
						</p>

						<div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
							<Link
								href="/privacy"
								target="_blank"
								className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors"
							>
								Конфиденциальность
							</Link>
							<Link
								href="/terms"
								target="_blank"
								className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors"
							>
								Оферта
							</Link>
							<Link
								href="/sitemap"
								target="_blank"
								className="text-xs text-muted-foreground/60 hover:text-foreground/80 transition-colors"
							>
								Карта сайта
							</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
