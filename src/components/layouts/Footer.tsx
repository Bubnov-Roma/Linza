import {
	EnvelopeSimpleIcon,
	MapPinIcon,
	PhoneIcon,
	TelegramLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import type { SupportInfo } from "@/constants";
import { cn } from "@/lib/utils";

export async function Footer({ support }: { support: SupportInfo }) {
	const footerLinkClass =
		"text-sm text-muted-foreground hover:text-primary transition-colors duration-200";
	const sectionTitleClass =
		"text-sm font-bold uppercase tracking-widest text-foreground/70 mb-6";

	return (
		<footer className="w-full border-t border-foreground/5 bg-background">
			<div className="container mx-auto px-6 py-16">
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
					{/* Brand & Mission */}
					<div className="lg:col-span-4 flex flex-col gap-6">
						<Link href="/" className="flex items-center gap-3 group">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary-foreground transition-transform group-hover:scale-105">
								<Logo />
							</div>
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
										Свет и звук
									</Link>
								</li>
								<li>
									<Link
										href="/equipment"
										className={cn(footerLinkClass, "font-medium text-primary")}
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
										О сервисе
									</Link>
								</li>
								<li>
									<Link href="/rules" className={footerLinkClass}>
										Правила проката
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
							<ul className="space-y-4">
								<li className="flex items-start gap-3">
									<PhoneIcon size={20} weight="fill" className="shrink-0" />
									<Link
										href={`tel:${support.phone}`}
										className={footerLinkClass}
									>
										{support.phone}
									</Link>
								</li>
								<li className="flex items-start gap-3">
									<TelegramLogoIcon
										weight="fill"
										size={20}
										className="shrink-0"
									/>
									<Link
										href={`${support.telegram}`}
										target="_blank"
										className={footerLinkClass}
									>
										{support.telegram}
									</Link>
								</li>
								<li className="flex items-start gap-3">
									<EnvelopeSimpleIcon
										weight="fill"
										size={20}
										className="shrink-0"
									/>
									<span className={footerLinkClass}>linzarental@yandex.ru</span>
								</li>
								<li className="flex items-start gap-3">
									<MapPinIcon weight="fill" size={20} className="shrink-0" />
									<span className={footerLinkClass}>{support.address}</span>
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-16 pt-8 border-t border-foreground/5">
					<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
						<p className="text-xs font-medium text-muted-foreground/60">
							© {new Date().getFullYear()} LINZA RENTAL. С любовью к кадру.
						</p>

						<div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
							<Link
								href="/privacy"
								className="text-xs text-muted-foreground/60 hover:text-primary transition-colors"
							>
								Конфиденциальность
							</Link>
							<Link
								href="/terms"
								className="text-xs text-muted-foreground/60 hover:text-primary transition-colors"
							>
								Оферта
							</Link>
							<Link
								href="/sitemap"
								className="text-xs text-muted-foreground/60 hover:text-primary transition-colors"
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
