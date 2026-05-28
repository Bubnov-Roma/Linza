"use client";

import {
	ArrowUpRightIcon,
	CardsThreeIcon,
	ChatCenteredTextIcon,
	CheckIcon,
	CoffeeIcon,
	LecternIcon,
	LightbulbFilamentIcon,
	MonitorPlayIcon,
	PencilIcon,
	StarIcon,
	WrenchIcon,
	XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
	type UpdateAboutInput,
	updateAboutSettings,
} from "@/actions/admin-about-actions";
import { MarkdownEditor, SimpleMarkdown } from "@/components/shared";
import { MediaUploader } from "@/components/shared/MediaUploader";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui/button";

interface ReviewPlatform {
	id: string;
	name: string;
	rating: number;
	maxStars: number;
	reviewText: string;
	author?: string;
	href: string;
	isBadge?: boolean;
	logo: React.ReactNode;
}

interface AboutClientViewProps {
	initialData: UpdateAboutInput;
	isAdmin: boolean;
	liveReviews?: Array<{ id: string; rating: number; text: string }>;
}

const BENEFITS = [
	{
		icon: LightbulbFilamentIcon,
		title: "Воплотить идею в результат",
		desc: "Найдем вместе удачные технические и визуальные решения под ваш концепт",
		href: "/studio",
	},
	{
		icon: WrenchIcon,
		title: "Установить Настроить Подключить",
		desc: "Расскажем, покажем, а если нужно — установим и настроим всё для вашей съёмки",
		href: "/equipment",
	},
	{
		icon: CardsThreeIcon,
		title: "Собрать готовый комплект",
		desc: "Предложим оптимальный сетап под вашу задачу. Вам останется только снять",
		href: "/equipment",
	},
	{
		icon: ChatCenteredTextIcon,
		title: "Разобраться с настройками",
		desc: "Понятно объясним логику и нюансы настроек любой сложной техники",
		href: "/equipment",
	},
	{
		icon: MonitorPlayIcon,
		title: "Организовать трансляцию",
		desc: "Поможем с организацией или проведением онлайн-трансляции вашего мероприятия",
		href: "/studio",
	},
	{
		icon: LecternIcon,
		title: "Подготовить студию под ключ",
		desc: "Подкаст, интервью, лукбук, реклама - студия LINZA готова к любому вызову",
		href: "/studio",
	},
];

export default function AboutClientView({
	initialData,
	isAdmin,
	liveReviews,
}: AboutClientViewProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<UpdateAboutInput>(initialData);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const reviewPlatforms: ReviewPlatform[] = [
		{
			id: "yandex",
			name: "Яндекс Карты",
			rating: liveReviews?.find((r) => r.id === "yandex")?.rating || 5.0,
			maxStars: 5,
			isBadge: true,
			reviewText:
				liveReviews?.find((r) => r.id === "yandex")?.text ||
				"Очень отзывчивая команда, всегда подскажут как лучше сделать съемку, работают на результат.",
			href: "https://yandex.ru/maps/org/linza/151843648628/reviews/?ll=50.103535%2C53.199654&z=16",
			logo: (
				<svg
					viewBox="0 0 3201 3200"
					className="w-7 h-7"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<circle cx="1600" cy="1600" r="1500" fill="#FFFFFF" />
					<path
						d="M1596.5 0C2416 0 3199.5 655 3199.5 1603C3221 2053.5 2850.5 3178.5 1602.5 3200C689.5 3180.5 0 2478 0 1596.5C34.5 554 845.5 0 1596.5 0ZM1622.5 650C1622.5 650 1195 637 1012.5 923C830 1209 931 1480.5 1012.5 1623C1094 1765.5 1303.5 1908.5 1303.5 1908.5L872.5 2550H1230.5L1711 1832.5C1228.35 1535.81 1166 1328 1306 1045C1442.5 894 1632.5 906 1632.5 906H1805.5V2548H2135.5V650H1622.5Z"
						fill="#F9412B"
					/>
				</svg>
			),
		},
		{
			id: "google",
			name: "Google Maps",
			rating: liveReviews?.find((r) => r.id === "google")?.rating || 5.0,
			maxStars: 5,
			reviewText:
				liveReviews?.find((r) => r.id === "google")?.text ||
				"Самый любимый рентал в Самаре! Всегда всё чётко и быстро! Александру отдельное спасибо! Не часто встретишь пункт проката, где узнаёшь новые фичи своей же техники 😂.",
			href: "https://www.google.com/maps/place/LINZA/@53.2422081,50.1443481,10z/data=!4m8!3m7!1s0x41661f0705770e39:0x239de98126179f1d!8m2!3d53.199659!4d50.1035717!9m1!1b1!16s%2Fg%2F11ssftqh4r?entry=ttu&g_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D",
			logo: (
				<svg
					viewBox="0 0 24 24"
					className="w-7 h-7"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
			),
		},
		{
			id: "2gis",
			name: "2ГИС",
			rating: liveReviews?.find((r) => r.id === "2gis")?.rating || 5.0,
			maxStars: 5,
			reviewText:
				liveReviews?.find((r) => r.id === "2gis")?.text ||
				"Выручили в трудный момент. Единственный прокат в городе, где нашлась камера Nikon. Спасибо большое, обращусь ещё не раз.",
			href: "https://2gis.ru/samara/firm/70000001069632273/tab/reviews",
			logo: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 48 48"
					className="w-8.5 h-8.5"
				>
					<defs>
						{/* Создаем маску обрезки по форме оригинальной плашки 2ГИС */}
						<clipPath id="2gis-body-clip">
							<path d="M38.5006,5.4992H9.4994c-2.2001,0-4.0002,1.8001-4.0002,4.0002v29.0012c0,2.2001,1.8001,4.0002,4.0002,4.0002h29.0012c2.2001,0,4.0002-1.8001,4.0002-4.0002V9.4994c0-2.2001-1.8001-4.0002-4.0002-4.0002Z" />
						</clipPath>
					</defs>

					{/* 1. Трехцветный фон, зажатый внутри маски */}
					<g clipPath="url(#2gis-body-clip)">
						{/* Центральная зона (основной зеленый фон) */}
						<rect width="48" height="48" fill="#24C562" />

						{/* Верхняя зона (заливка над линиями дорог) */}
						<path
							fill="#f6b332"
							d="M 0,0 L 48,0 L 48,17.0114 L 42.5,17.0114 L 32.3554,15.5301 L 17.8448,13.3306 L 5.5,11.0402 L 0,11.0402 Z"
						/>

						{/* Нижняя зона (заливка под линией дороги) */}
						<path
							fill="#80ce2e"
							d="M 0,48 L 48,48 L 48,33.479 L 42.5,33.479 L 5.5,39.3026 L 0,39.3026 Z"
						/>
					</g>

					{/* Внешний белый контур всей плашки основы */}
					<path
						fill="none"
						stroke="#ffffff"
						strokeWidth="2"
						strokeLinejoin="round"
						d="M38.5006,5.4992H9.4994c-2.2001,0-4.0002,1.8001-4.0002,4.0002v29.0012c0,2.2001,1.8001,4.0002,4.0002,4.0002h29.0012c2.2001,0,4.0002-1.8001,4.0002-4.0002V9.4994c0-2.2001-1.8001-4.0002-4.0002-4.0002Z"
					/>

					{/* 2. Главная белая петля с синей заливкой внутри */}
					<path
						id="d"
						stroke="#ffffff"
						fill="#1573f1"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M25.5785,36.1424c-.0409-4.7889,1.0624-8.7464,7.0814-8.4979,8.5861-21.8817-26.424-21.0476-17.0918-.1307,2.8297-.1756,7.5211,1.5091,6.7199,9.1465"
					/>

					{/* 3. Белые контуры дорог */}
					<path
						id="e"
						fill="none"
						stroke="#ffffff"
						strokeWidth="2"
						strokeLinecap="round"
						d="M42.5,33.479l-37,5.8236"
					/>
					<path
						id="f"
						fill="none"
						stroke="#ffffff"
						strokeWidth="2"
						strokeLinecap="round"
						d="M5.5,11.0402l12.3448,2.2904"
					/>
					<path
						id="g"
						fill="none"
						stroke="#ffffff"
						strokeWidth="2"
						strokeLinecap="round"
						d="M32.3554,15.5301l10.1446,1.4812"
					/>
				</svg>
			),
		},
		{
			id: "flamp",
			name: "Flamp",
			rating: liveReviews?.find((r) => r.id === "flamp")?.rating || 0.0,
			maxStars: 5,
			reviewText:
				liveReviews?.find((r) => r.id === "flamp")?.text ||
				"Оставьте первый отзыв",
			href: "https://samara.flamp.ru/firm/linza-70000001069632273",
			logo: (
				<svg
					viewBox="0 0 200 200"
					className="w-7 h-7"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect width="200" height="200" rx="36" fill="#3D72E8" />
					<defs>
						<clipPath id="ear-clip">
							<polygon points="0,0 200,0 200,26 0,142" />
						</clipPath>
					</defs>
					<path
						d="M 82 71 A 20 20 0 1 0 82 111"
						fill="none"
						stroke="white"
						strokeWidth="20"
						strokeLinecap="butt"
						clipPath="url(#ear-clip)"
					/>
					<path
						d="M 82 148 L 82 61 L 150 61 L 150 81 L 102 81 L 102 101 L 140 101 L 140 121 L 102 121 L 102 148 Z"
						fill="white"
					/>
				</svg>
			),
		},
	];

	const handleSave = async () => {
		setIsSaving(true);
		let finalImageUrl = formData.imageUrl;

		if (selectedFile) {
			try {
				// ✅ Загружаем файл в S3 через route handler
				const fd = new FormData();
				fd.append("file", selectedFile);
				fd.append("folder", "about");

				const res = await fetch("/api/upload", {
					method: "POST",
					body: fd,
				});

				if (!res.ok) throw new Error("Upload failed");

				const data = await res.json();
				finalImageUrl = data.url; // ← настоящий S3 URL
			} catch {
				toast.error("Ошибка загрузки изображения");
				setIsSaving(false);
				return;
			}
		}

		const updatedData = { ...formData, imageUrl: finalImageUrl };
		const result = await updateAboutSettings(updatedData);
		setIsSaving(false);

		if (result.success) {
			setFormData(updatedData);
			setIsEditing(false);
			setSelectedFile(null);
			toast.success("Контент успешно сохранен");
		} else {
			toast.error(result.error || "Не удалось сохранить");
		}
	};

	return (
		<div className="container mx-auto px-4 max-w-5xl space-y-16">
			{/* ─── ВЕРХНЯЯ ЧАСТЬ: HERO & РЕДАКТИРОВАНИЕ ─── */}
			<div className="space-y-6">
				{isAdmin && (
					<div className="flex justify-end">
						{!isEditing ? (
							<Button
								onClick={() => setIsEditing(true)}
								variant="outline"
								className="rounded-full text-xs font-black uppercase tracking-wider gap-2 border-foreground/10 italic py-5 px-6"
							>
								<PencilIcon size={14} weight="bold" /> Редактировать текст
							</Button>
						) : (
							<div className="flex gap-3">
								<Button
									onClick={() => {
										setFormData(initialData);
										setIsEditing(false);
									}}
									variant="ghost"
									disabled={isSaving}
									className="rounded-full text-xs font-black uppercase tracking-wider gap-1 py-5 px-6"
								>
									<XIcon size={14} /> Отмена
								</Button>
								<Button
									onClick={handleSave}
									disabled={isSaving}
									className="rounded-full text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 gap-1 py-5 px-6 italic"
								>
									<CheckIcon size={14} weight="bold" />{" "}
									{isSaving ? "Сохранение..." : "Сохранить"}
								</Button>
							</div>
						)}
					</div>
				)}

				<div className="flex flex-col gap-12 items-start">
					<div className="space-y-6 w-full">
						<div className="space-y-3">
							{isEditing ? (
								<div className="space-y-4">
									<input
										type="text"
										value={formData.heroTitle}
										onChange={(e) =>
											setFormData({ ...formData, heroTitle: e.target.value })
										}
										className="text-2xl font-black uppercase italic bg-foreground/2 border border-foreground/10 rounded-xl px-4 py-2 w-full focus:outline-none"
										placeholder="Название проекта"
									/>
									<input
										type="text"
										value={formData.heroSub}
										onChange={(e) =>
											setFormData({ ...formData, heroSub: e.target.value })
										}
										className="text-sm font-bold bg-foreground/2 border border-foreground/10 rounded-xl px-4 py-2 w-full focus:outline-none"
										placeholder="Подзаголовок"
									/>
								</div>
							) : (
								<>
									<h1 className="text-5xl sm:text-7xl font-black uppercase italic text-foreground tracking-tighter leading-[0.9]">
										{formData.heroTitle}
									</h1>
									<div className="text-lg sm:text-xl font-black italic tracking-wide">
										<SimpleMarkdown text={formData.heroSub} />
									</div>
								</>
							)}
						</div>

						<div className="h-px w-full bg-linear-to-r from-foreground/10 to-transparent" />

						{isEditing ? (
							<MarkdownEditor
								value={formData.description}
								onChange={(v) => setFormData({ ...formData, description: v })}
								rows={10}
							/>
						) : (
							<div className="prose dark:prose-invert w-full">
								<SimpleMarkdown text={formData.description} />
							</div>
						)}
					</div>

					<div className="w-full flex justify-center h-full">
						{isEditing ? (
							<div className="w-full max-w-150">
								<MediaUploader
									currentUrl={formData.imageUrl || ""}
									aspectRatio={16 / 9}
									acceptType="image"
									onFileSelect={(file) => setSelectedFile(file)}
								/>
							</div>
						) : (
							<div className="relative w-full h-full max-w-142.5 aspect-video rounded-[32px] overflow-hidden bg-foreground/2 border border-foreground/5 shadow-xs group">
								{formData.imageUrl ? (
									<Image
										src={formData.imageUrl}
										alt="Linza Crew"
										fill
										sizes="570px"
										className="object-cover transition-transform duration-700 ease-out group-hover:scale-102"
										priority
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground italic font-black">
										LINZA SPACE
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ─── СРЕДНЯЯ ЧАСТЬ: ОТЗЫВЫ (GLASS STYLE) ─── */}
			<div className="space-y-6 pt-4">
				<h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
					Отзывы наших клиентов
				</h2>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
					{reviewPlatforms.map((platform) => (
						<Card key={platform.id}>
							<Link
								href={platform.href}
								target="_blank"
								className="group relative flex flex-col justify-between p-6 h-full min-h-55"
							>
								<div className="flex justify-between items-start">
									<div className="space-y-3">
										<div className="flex gap-3 items-center wrap px-2">
											<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-foreground/5 dark:bg-white/5 border border-foreground/5 backdrop-blur-md shadow-xs transition-transform group-hover:scale-105 duration-300 overflow-hidden">
												{platform.logo}
											</div>
											<p className="text-foreground/80 tracking-tighter">
												{platform.name}
											</p>
										</div>

										{/* Оценка */}
										<div className="flex items-baseline gap-2 pt-1">
											<span className="text-4xl font-black italic tracking-tighter">
												{platform.rating.toFixed(1)}
											</span>
											<div className="flex gap-0.5 text-amber-500 overflow-hidden">
												{[...Array(platform.maxStars)].map((_, i) => (
													<StarIcon
														key={i}
														size={13}
														weight={
															i < Math.floor(platform.rating)
																? "fill"
																: "regular"
														}
													/>
												))}
											</div>
										</div>
									</div>

									{/* Кнопка-стрелка */}
									<div className="p-2.5 rounded-full bg-background/80 dark:bg-neutral-900/80 backdrop-blur-md border border-foreground/5 text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 group-hover:scale-110 transition-all duration-300 shadow-xs">
										<ArrowUpRightIcon size={14} weight="bold" />
									</div>
								</div>

								{/* Специальный бейдж */}
								{platform.isBadge && platform.rating >= 4.9 && (
									<div className="mt-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl w-fit backdrop-blur-md">
										<div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
										<span className="text-[9px] font-black uppercase tracking-widest">
											Лучшее место · 2026
										</span>
									</div>
								)}

								{/* Текст отзыва */}
								<p className="mt-5 text-xs sm:text-sm text-muted-foreground/90 font-medium line-clamp-4 italic leading-relaxed group-hover:text-foreground transition-colors duration-300">
									«{platform.reviewText}»
								</p>
							</Link>
						</Card>
					))}
				</div>
			</div>

			{/* ─── НИЖНЯЯ ЧАСТЬ: БЕНЕФИТЫ (MATCHING GLASS STYLE) ─── */}
			<div className="space-y-6 pt-4">
				<div className="space-y-1">
					<h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
						Мы всегда поможем
					</h3>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{BENEFITS.map((b, idx) => {
						const IconComponent = b.icon;
						return (
							<Link
								key={idx}
								href={b.href}
								className="group flex flex-col p-6 border border-foreground/5 rounded-2xl backdrop-blur-lg bg-foreground/5  hover:border-primary/20 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
							>
								<div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

								<div className="flex items-center justify-start gap-4 mb-3">
									<div className="p-2.5 rounded-xl bg-background/80 backdrop-blur-md border border-foreground/5 text-foreground sm:group-hover:bg-primary sm:group-hover:text-primary-foreground transition-all duration-300 shadow-xs">
										<IconComponent size={18} weight="duotone" />
									</div>
									<h4 className="text-sm font-black uppercase italic tracking-wide text-foreground/80 group-hover:text-foreground transition-colors duration-300">
										{b.title}
									</h4>
								</div>
								<p className="text-xs text-muted-foreground/80 group-hover:text-muted-foreground/90 leading-normal font-medium z-10">
									{b.desc}
								</p>
							</Link>
						);
					})}
				</div>

				<div className="w-full flex font-mono gap-3 mx-auto items-baseline justify-end text-sm tracking-widest text-muted-foreground/60 italic pt-8">
					<span className="ml-auto">
						...заварим вкусный кофе и обсудим свежие новости индустрии{" "}
						<CoffeeIcon
							size={14}
							weight="duotone"
							className="text-primary-accent inline animate-bounce-slow"
						/>
					</span>
				</div>
			</div>
		</div>
	);
}
