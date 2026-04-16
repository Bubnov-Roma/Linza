import {
	FileIcon,
	FileMagnifyingGlassIcon,
	NotePencilIcon,
	PaperPlaneTiltIcon,
	QuestionIcon,
	ShieldCheckIcon,
	ShieldIcon,
	ShieldSlashIcon,
	ShieldWarningIcon,
	SpinnerIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
	SUPPORT_PHONE_DEFAULT,
	SUPPORT_TELEGRAM_DEFAULT,
} from "@/constants/support";
import type { ApplicationStatus } from "@/types";

export interface StatusAction {
	href: string;
	label: string;
}

export interface StatusConfig {
	label: string;
	shortLabel: string;
	description: string;
	Icon: React.ElementType;
	color: string;
	bgColor: string;
	borderColor: string;
	glowColor?: string;
	showBadge?: boolean;
	action?: StatusAction;
}

export const VERIFICATION_CONFIG: Record<ApplicationStatus, StatusConfig> = {
	LOADING: {
		label: "Загрузка данных",
		shortLabel: "...",
		description: "Получаем статус анкеты...",
		Icon: SpinnerIcon,
		color: "text-muted-foreground",
		bgColor: "text-muted-foreground/20",
		borderColor: "border-muted-foreground/30",
		glowColor: "shadow-muted-foreground/20",
	},
	NO_APPLICATION: {
		label: "Нет анкеты",
		shortLabel: "Анкеа отсутствует",
		description:
			"Заполните анкету клиента чтобы арендовать технику без страхового депозита",
		Icon: FileIcon,
		color: "text-foreground/50",
		bgColor: "bg-foreground/5",
		borderColor: "border-foreground/10",
		glowColor: "shadow-foreground/10",
		action: { href: "/dashboard/profile", label: "Заполнить анкету" },
	},
	DRAFT: {
		label: "В процессе заполнения",
		shortLabel: "Черновик",
		description:
			"Завершите заполнение анкеты. Обноаление статуса произойдет автоматически",
		Icon: NotePencilIcon,
		color: "text-foreground/50",
		bgColor: "bg-foreground/5",
		borderColor: "border-foreground/10",
		glowColor: "shadow-foreground/10",
		action: {
			href: "/dashboard/profile",
			label: "Завершить заполнение анкеты",
		},
	},
	PENDING: {
		label: "Анкета отправлена",
		shortLabel: "Заполнена",
		description:
			"Мы получили вашу анкету и в ближайщее время приступим к её проверке.",
		Icon: PaperPlaneTiltIcon,
		color: "text-pink-400",
		bgColor: "bg-pink-500/15",
		borderColor: "border-pink-500/20",
		glowColor: "shadow-pink-500/20",
		action: { href: "/dashboard/profile", label: "Открыть профиль" },
	},
	REVIEWING: {
		label: "На проверке",
		shortLabel: "Изучается",
		description: "Модератор в процессе проверки вашей анкеты",
		Icon: FileMagnifyingGlassIcon,
		color: "text-blue-400",
		bgColor: "bg-blue-500/15",
		borderColor: "border-blue-500/20",
		glowColor: "shadow-blue-500/20",
		action: { href: "/dashboard/profile", label: "Открыть профиль" },
	},
	CLARIFICATION: {
		label: "Требуются уточнения",
		shortLabel: "Уточнение",
		description:
			"Пожалуйста ответьте на вопрос модератора, эти данные помогут завершить проверку анкеты.",
		Icon: QuestionIcon,
		color: "text-lime-400",
		bgColor: "bg-lime-500/15",
		borderColor: "border-lime-500/20",
		glowColor: "shadow-lime-500/20",
		action: { href: "/dashboard/profile", label: "Уточнить данные" },
	},
	STANDARD: {
		label: "Стандартные условия",
		shortLabel: "Стандарт",
		description:
			"Вам доступна аренда под залог. Позднее условия аренды могут быть пересмотрены.",
		Icon: ShieldIcon,
		color: "text-gray-400",
		bgColor: "bg-gray-500/15",
		borderColor: "border-gray-500/20",
		glowColor: "shadow-gray-500/20",
		action: { href: "/dashboard/profile", label: "Подать заявку" },
	},
	APPROVED: {
		label: "Анкета одобрена",
		shortLabel: "Одобрено",
		description:
			"Вам доступна аренда без страховаого депозита. Благодарим за доверие!",
		Icon: ShieldCheckIcon,
		color: "text-green-400",
		bgColor: "bg-green-500/15",
		borderColor: "border-green-500/20",
		glowColor: "shadow-green-500/30",
		action: { href: "/equipment", label: "Перейти в каталог" },
	},
	REJECTED: {
		label: "Анкета отклонена",
		shortLabel: "Отклонено",
		description: `К сожалению ваша анкета не прошла проверку. Если у вас возникли вопросы пожалуйста свяжитесь с нами по телфону ${SUPPORT_PHONE_DEFAULT} либо в telegram`,
		Icon: ShieldWarningIcon,
		color: "text-orange-400",
		bgColor: "bg-orange-500/15",
		borderColor: "border-orange-500/20",
		glowColor: "shadow-orange-500/20",
		action: {
			href: `${SUPPORT_TELEGRAM_DEFAULT}`,
			label: "Написать в telegram",
		},
	},
	BLOCKED: {
		label: "Профиль заблокирован",
		shortLabel: "Заблокирован",
		description:
			"Ваш профиль был заблокирован по требованию службы безопасности",
		Icon: ShieldSlashIcon,
		color: "text-red-400",
		bgColor: "bg-red-500/15",
		borderColor: "border-red-500/20",
		glowColor: "shadow-red-500/20",
	},
};
