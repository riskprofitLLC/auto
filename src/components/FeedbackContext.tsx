import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Vibration, Platform } from 'react-native'

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

// Простой звуковой сигнал через Web Audio API (только для web) или системный звук
let audioContext: AudioContext | null = null

const playBeep = () => {
	try {
		// React Native: используем системный звук через Vibration с паттерном 0 (только звук невозможен
		// без expo-av, поэтому используем короткую вибрацию как fallback на мобиле)
		// На web — Web Audio API
		if (typeof window !== 'undefined' && typeof AudioContext !== 'undefined') {
			if (!audioContext) {
				audioContext = new AudioContext()
			}
			const oscillator = audioContext.createOscillator()
			const gainNode = audioContext.createGain()
			oscillator.connect(gainNode)
			gainNode.connect(audioContext.destination)
			oscillator.type = 'sine'
			oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
			gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
			gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1)
			oscillator.start(audioContext.currentTime)
			oscillator.stop(audioContext.currentTime + 0.1)
		} else {
			// На мобильных без expo-av делаем двойную короткую вибрацию как звуковой эффект
			Vibration.vibrate([0, 30, 30, 30])
		}
	} catch (e) {
		// fallback
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
