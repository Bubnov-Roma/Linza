export const CHATS_STATUS_LABELS: Record<string, string> = {
	OPEN: "Открыто",
	CLOSED: "Закрыто",
	WAITING_FOR_ADMIN: "Ожидание ответа",
	WAITING_FOR_CLIENT: "Ожидание ответа",
};

export const CHATS_STATUS_COLORS: Record<string, string> = {
	OPEN: "bg-blue-500/20 text-blue-600 border-blue-300/30",
	CLOSED: "bg-gray-500/20 text-gray-600 border-gray-300/30",
	WAITING_FOR_ADMIN: "bg-yellow-500/20 text-yellow-600 border-yellow-300/30",
	WAITING_FOR_CLIENT: "bg-green-500/20 text-green-600 border-green-300/30",
};
