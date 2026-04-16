// Использует AES-256-GCM — симметричное шифрование с аутентификацией

import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.ENCRYPTION_KEY; // 64 hex-символа = 32 байта

function getKey(): Buffer {
	if (!KEY_HEX || KEY_HEX.length !== 64) {
		throw new Error(
			"ENCRYPTION_KEY must be set in .env as 64 hex chars (32 bytes). " +
				"Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
		);
	}
	return Buffer.from(KEY_HEX, "hex");
}

/**
 * Шифрует строку. Возвращает строку вида "iv:authTag:ciphertext" (всё в hex).
 * Если значение пустое — возвращает пустую строку без шифрования.
 */
export function encrypt(plaintext: string): string {
	if (!plaintext) return "";
	const key = getKey();
	const iv = crypto.randomBytes(12); // 96 бит для GCM
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();
	return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Расшифровывает строку вида "iv:authTag:ciphertext".
 * Если значение пустое или не зашифровано — возвращает как есть.
 */
export function decrypt(ciphertext: string): string {
	if (!ciphertext) return "";
	const parts = ciphertext.split(":");
	// Если формат не совпадает — скорее всего старые незашифрованные данные, возвращаем как есть
	if (parts.length !== 3) return ciphertext;
	try {
		const key = getKey();
		const [ivHex, authTagHex, encryptedHex] = parts;
		if (!ivHex || !authTagHex || !encryptedHex)
			return "*** ОШИБКА РАСШИФРОВКИ ***";
		const iv = Buffer.from(ivHex, "hex");
		const authTag = Buffer.from(authTagHex, "hex");
		const encrypted = Buffer.from(encryptedHex, "hex");
		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(authTag);
		return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
	} catch {
		// Если ключ не тот или данные повреждены — вернуть маску
		return "*** ОШИБКА РАСШИФРОВКИ ***";
	}
}

/**
 * Маскирует строку для показа в интерфейсе: "1234 567890" → "1234 ••••••"
 */
export function maskSensitive(value: string, visibleChars = 4): string {
	if (!value || value.length <= visibleChars) return value;
	return value.slice(0, visibleChars) + "•".repeat(value.length - visibleChars);
}

/**
 * Зашифровать только если значение изменилось (для патчей).
 */
export function encryptIfChanged(
	newValue: string | undefined,
	oldEncrypted: string | undefined
): string | undefined {
	if (newValue === undefined) return oldEncrypted;
	return encrypt(newValue);
}
