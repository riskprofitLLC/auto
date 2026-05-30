import { useState, useCallback, useEffect } from 'react'
import { CarState } from '../types/car'

const initialState: CarState = {
	relay: false,
	trunk: false,
	steering: false,
	bsm: false,
	seat_driver_heat: false,
	seat_driver_vent: false,
	seat_passenger_heat: false,
	seat_passenger_vent: false
}

export const useCarState = () => {
	const [carState, setCarState] = useState<CarState>(initialState)

	// Сброс состояния при отключении устройства
	const resetState = useCallback(() => {
		setCarState(initialState)
	}, [])

	// Обновление состояния
	const updateState = useCallback((newState: Partial<CarState>) => {
		setCarState(prev => ({ ...prev, ...newState }))
	}, [])

	// Получение текущего состояния флага для конкретного типа управления
	const getIsOn = useCallback((type: keyof CarState): boolean => {
		return carState[type] || false
	}, [carState])

	// Проверка, работает ли двигатель (для блокировки климата)
	const isEngineRunning = useCallback((): boolean => {
		return carState.relay
	}, [carState.relay])

	// Проверка, заблокирован ли климат (двигатель выключен)
	const isClimateLocked = useCallback((): boolean => {
		return !carState.relay
	}, [carState.relay])

	return {
		carState,
		resetState,
		updateState,
		getIsOn,
		isEngineRunning,
		isClimateLocked
	}
}
