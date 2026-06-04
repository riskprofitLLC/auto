import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Vibration } from 'react-native'

export type FeedbackMode = 'vibration' | 'sound' | 'none'

interface FeedbackContextValue {
	mode: FeedbackMode
	setMode: (mode: FeedbackMode) => void
	trigger: () => void
}

const FeedbackContext = createContext<FeedbackContextValue>({
	mode: 'none',
	setMode: () => {},
	trigger: () => {}
})

// --- Звуковой сигнал (короткий beep) ---

let audioContext: AudioContext | null = null

// Web-версия через Web Audio API — C-мажорный аккорд (мягкий премиальный звон)
const playBeepWeb = () => {
	try {
		if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return
		if (!audioContext) {
			audioContext = new AudioContext()
		}
		const now = audioContext.currentTime
		const dur = 0.22

		// C-мажорное трезвучие: C6 (1047) + E6 (1319) + G6 (1568) + C7 (2093)
		const chord: [number, number][] = [
			[1047, 0.45],   // C6  — основа
			[1319, 0.25],   // E6  — терция (тёплая)
			[1568, 0.15],   // G6  — квинта
			[2093, 0.06],   // C7  — лёгкое мерцание
		]

		chord.forEach(([freq, vol]) => {
			const osc = audioContext!.createOscillator()
			const gain = audioContext!.createGain()
			osc.type = 'sine'
			osc.frequency.setValueAtTime(freq, now)
			gain.gain.setValueAtTime(0, now)
			gain.gain.linearRampToValueAtTime(vol, now + 0.012)      // 12ms атака
			gain.gain.setValueAtTime(vol, now + 0.04)                // держим
			gain.gain.exponentialRampToValueAtTime(0.001, now + dur) // спад
			osc.connect(gain)
			gain.connect(audioContext!.destination)
			osc.start(now)
			osc.stop(now + dur)
		})
	} catch {
		// fallback тихо
	}
}

// Нативная версия через expo-audio (iOS / Android)
let audioPlayer: any = null

const getOrCreatePlayer = () => {
	if (!audioPlayer) {
		try {
			const { createAudioPlayer } = require('expo-audio')
			audioPlayer = createAudioPlayer(require('../../assets/sounds/beep.wav'))
		} catch {
			// expo-audio не доступен — тихо падаем
		}
	}
	return audioPlayer
}

const playBeepNative = () => {
	const player = getOrCreatePlayer()
	if (!player) return
	try {
		player.seekTo(0)
		player.play()
	} catch {
		// ignore
	}
}

const playBeep = () => {
	const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined'
	if (isWeb) {
		playBeepWeb()
	} else {
		playBeepNative()
	}
}

export const FeedbackProvider = ({ children }: { children: ReactNode }) => {
	const [mode, setMode] = useState<FeedbackMode>('none')

	const trigger = useCallback(() => {
		if (mode === 'vibration') {
			Vibration.vibrate(40)
		} else if (mode === 'sound') {
			playBeep()
		}
	}, [mode])

	return (
		<FeedbackContext.Provider value={{ mode, setMode, trigger }}>
			{children}
		</FeedbackContext.Provider>
	)
}

export const useFeedback = () => useContext(FeedbackContext)
