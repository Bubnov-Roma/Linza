"use client";

import type {
	ClientNotificationEvent,
	ClientSoundSettings,
} from "@/store/use-client-notifications.store";
import type { AdminNotificationType, SoundProfile } from "@/types";

// ─── Параметры звука для каждого профиля ─────────────────────────────────────

interface ToneParams {
	frequency: number;
	type: OscillatorType;
	gainPeak: number;
	duration: number; // секунды
}

// subtle — тихий однотональный бип
// default — двойной бип
// loud — тройной высокий бип

const PROFILES: Record<Exclude<SoundProfile, "off">, ToneParams[]> = {
	subtle: [{ frequency: 660, type: "sine", gainPeak: 0.15, duration: 0.18 }],
	default: [
		{ frequency: 880, type: "sine", gainPeak: 0.25, duration: 0.15 },
		{ frequency: 1100, type: "sine", gainPeak: 0.2, duration: 0.15 },
	],
	loud: [
		{ frequency: 880, type: "triangle", gainPeak: 0.4, duration: 0.15 },
		{ frequency: 1100, type: "triangle", gainPeak: 0.35, duration: 0.15 },
		{ frequency: 1320, type: "triangle", gainPeak: 0.3, duration: 0.2 },
	],
};

// Задержка между нотами в серии (секунды)
const NOTE_GAP = 0.08;

// ─── AudioContext singleton ───────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	try {
		if (!_ctx || _ctx.state === "closed") {
			_ctx = new (
				window.AudioContext ||
				(
					window as unknown as {
						webkitAudioContext: typeof AudioContext;
					}
				).webkitAudioContext
			)();
		}
		return _ctx;
	} catch {
		return null;
	}
}

// ─── Воспроизведение одного тона ─────────────────────────────────────────────

function playTone(
	ctx: AudioContext,
	params: ToneParams,
	startAt: number
): void {
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.frequency.value = params.frequency;
	osc.type = params.type;

	gain.gain.setValueAtTime(0, startAt);
	gain.gain.linearRampToValueAtTime(params.gainPeak, startAt + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.001, startAt + params.duration);

	osc.start(startAt);
	osc.stop(startAt + params.duration + 0.02);
}

// ─── Публичная функция ────────────────────────────────────────────────────────

/**
 * Воспроизводит звук уведомления согласно профилю.
 * Вызывается из AdminNotificationsPoller — fire-and-forget.
 */
export function playNotificationSound(profile: SoundProfile): void {
	if (profile === "off") return;

	const ctx = getAudioContext();
	if (!ctx) return;

	// Разблокировка AudioContext после пользовательского жеста
	if (ctx.state === "suspended") {
		ctx.resume().catch(() => {});
	}

	const tones = PROFILES[profile];
	const now = ctx.currentTime;

	tones.forEach((tone, i) => {
		playTone(ctx, tone, now + i * (tone.duration + NOTE_GAP));
	});
}

// ─── Превью звука (для страницы настроек) ────────────────────────────────────

export function previewNotificationSound(profile: SoundProfile): void {
	playNotificationSound(profile);
}

// ─── Хелпер: получить профиль для типа уведомления ───────────────────────────

export function getSoundProfile(
	type: AdminNotificationType,
	settings: Record<AdminNotificationType, SoundProfile>
): SoundProfile {
	return settings[type] ?? "subtle";
}

export function getClientSoundProfile(
	event: ClientNotificationEvent,
	settings: ClientSoundSettings
): SoundProfile {
	return settings[event] ?? "subtle";
}
