import {
	CalendarCheckIcon,
	FileTextIcon,
	MagnifyingGlassIcon,
	PackageIcon,
	StarIcon,
} from "@phosphor-icons/react/dist/ssr";

const steps = [
	{
		icon: MagnifyingGlassIcon,
		title: "Поиск",
		desc: "Найдите тезнику через поиск или в каталоге. Используйте фильтры по категориям",
	},
	{
		icon: CalendarCheckIcon,
		title: "Бронирование",
		desc: "Добавьте выбранную технику в корзину или оформите <бронь> прямо со страницы товара.",
	},
	{
		icon: FileTextIcon,
		title: "Анкета",
		desc: "При первом заказе зарегистрируйтесь на сайте и заполните анкету клиента. С нас скидка на первый заказ.",
	},
	{
		icon: PackageIcon,
		title: "Получение",
		desc: "Мы свяжемся с вами чтобы подтвердить заказ, проверим и подготовим всё к вашему приезду.",
	},
	{
		icon: StarIcon,
		title: "Возврат",
		desc: "Верните заказ и оцените наш сервис. Мы дорожим вашим мнением и дарим скидки за активность.",
	},
];

export function HowItWorks() {
	return (
		<section className="py-4">
			<div className="container mx-auto px-4">
				<div className="mx-auto max-w-4xl text-center">
					<h3 className="mb-4 text-3xl font-bold text-foreground/90 sm:text-4xl select-none">
						Как арендовать технику
					</h3>
				</div>

				<div className="relative">
					{/* Линия соединения */}
					<div className="opacity-20 absolute left-1/2 top-0 h-full w-full rounded-2xl -translate-x-1/2 bg-linear-to-t from-transparent via:muted-foreground/50 to-foreground/60 md:left-1/2 shadow-2xl shadow-muted-foreground/50" />
					<div className="flex flex-col md:flex-row items-stretch gap-0 rounded-t-2xl overflow-hidden">
						{steps.map((step) => (
							<div
								key={step.title}
								className="flex-1 flex flex-col sm:flex-row items-start sm:items-start gap-3 px-4 py-4 relative border-muted-foreground/10 border-b last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
							>
								<div className="flex flex-row md:flex-col items-center gap-3 md:text-center">
									<div className="relative shrink-0 hidden md:flex">
										<div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-primary-foreground/70 backdrop-blur-2xl">
											<step.icon
												weight="fill"
												className="h-6 w-6 text-primary-foreground"
											/>
										</div>
									</div>
									<div className="min-w-0 items-start">
										<h3 className="mb-2 text-foreground/90 text-xs sm:text-sm font-bold leading-tight hidden md:block">
											{step.title}
										</h3>
										<p className="text-sm text-foreground/50 sm:text-xs leading-tight mt-0.5">
											{step.desc}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
