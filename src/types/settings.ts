// src/types/settings.ts

export type ButtonFeedbackMode = 'sound' | 'vibration' | 'none'
export type MapProvider = 'yandex-navi' | 'yandex-maps' | 'google-maps'

export interface AppSettings {
	buttonFeedbackMode: ButtonFeedbackMode
	mapProvider: MapProvider
}

export const DEFAULT_SETTINGS: AppSettings = {
	buttonFeedbackMode: 'vibration',
	mapProvider: 'yandex-navi'
}
