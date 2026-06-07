// src/constants/colors.ts
// Design system — см. tz.md для полной документации

export const colors = {
	// Backgrounds
	background: '#0A0A0F',
	backgroundCard: '#12121A',
	backgroundElevated: '#1A1A26',
	modalBackground: '#0F0F18',
	surface: '#1E1E2E',
	overlay: 'rgba(0,0,0,0.75)',

	// Accents
	primary: '#4F8EF7',         // Синий — основные действия
	primaryDark: '#3B7DE6',
	secondary: '#06B6D4',       // Циан — вентиляция, холод
	accent: '#A855F7',          // Фиолетовый — багажник, подсветка

	// Semantic
	success: '#22C55E',         // Зелёный — активно, ON
	danger: '#EF4444',          // Красный — стоп, опасность
	warning: '#F59E0B',         // Оранжевый — предупреждения, подогрев

	// Text
	textPrimary: '#F1F5F9',
	textSecondary: '#94A3B8',
	textMuted: '#475569',

	// Borders (rgba)
	border: 'rgba(255,255,255,0.08)',
	borderActive: 'rgba(79,142,247,0.4)',
	borderLight: 'rgba(255,255,255,0.06)',

	// Car control toggle colours
	engine: '#EF4444',
	engineOff: '#1E1E2E',
	engineOn: '#22C55E',
	trunk: '#A855F7',
	trunkOff: '#1E1E2E',
	bsm: '#22C55E',
	bsmOff: '#1E1E2E',
	steering: '#F59E0B',
	steeringOff: '#1E1E2E',
	seatHeat: '#F59E0B',
	seatHeatOff: '#1E1E2E',
	seatVent: '#06B6D4',
	seatVentOff: '#1E1E2E',
	security: '#EF4444',
	securityOff: '#1E1E2E',

	// Toast
	toastSuccess: 'rgba(34,197,94,0.15)',
	toastError: 'rgba(239,68,68,0.15)',
	toastInfo: 'rgba(79,142,247,0.15)',
} as const

export type ColorKey = keyof typeof colors

// Токены для единообразных скруглений
export const radius = {
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	'2xl': 24,
	full: 999,
} as const
