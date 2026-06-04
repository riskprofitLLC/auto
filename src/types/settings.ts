// src/types/settings.ts

export type ButtonFeedbackMode = 'sound' | 'vibration' | 'none'

export interface AppSettings {
	buttonFeedbackMode: ButtonFeedbackMode
}

export const DEFAULT_SETTINGS: AppSettings = {
	buttonFeedbackMode: 'sound'
}
