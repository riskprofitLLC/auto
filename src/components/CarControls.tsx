import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { BleDevice } from '../types/bluetooth'
import { CarState, ControlType } from '../types/car'

interface CarControlsProps {
	connectedDeviceId: string | null
	devices: BleDevice[]
	carState: CarState
	onCommandSent: (message: string, success: boolean) => void
	onStateUpdate: (newState: Partial<CarState>) => void
}

const CarControls: React.FC<CarControlsProps> = ({ connectedDeviceId, devices, carState, onCommandSent, onStateUpdate }) => {
	// Используем Record<ControlType, boolean> для отслеживания загрузки по каждому типу устройства
	const [isLoading, setIsLoading] = useState<Record<ControlType, boolean>>({
		relay: false,
		steering: false,
		seat_driver_heat: false,
		seat_driver_vent: false,
		seat_passenger_heat: false,
		seat_passenger_vent: false
	})

	const fadeAnim = useRef(new Animated.Value(0)).current
	const deviceInfo = devices.find(d => d.id === connectedDeviceId)

	useEffect(() => {
		if (connectedDeviceId) {
			Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
		} else {
			Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start()
		}
	}, [connectedDeviceId])

	const toggleFeature = async (type: ControlType) => {
		if (!connectedDeviceId || isLoading[type]) return

		setIsLoading(prev => ({ ...prev, [type]: true }))

		try {
			// Текущее состояние берем из props
			const isCurrentlyOn = getIsOn(type, carState)
			const targetState = !isCurrentlyOn // То, к чему стремимся

			console.log(`🔄 Переключение ${type}: ${isCurrentlyOn ? 'ON->OFF' : 'OFF->ON'}`)

			// Имитация задержки
			await new Promise(res => setTimeout(res, 600))

			const newState: Partial<CarState> = {}
			let toastMessage = ''

			if (targetState) {
				// --- ВКЛЮЧЕНИЕ ---
				switch (type) {
					case 'relay':
						newState.relay = true
						toastMessage = '✅ Двигатель ЗАПУЩЕН'
						break
					case 'steering':
						newState.steering = true
						toastMessage = ' Подогрев руля ВКЛ'
						break
					case 'seat_driver_heat':
						newState.seat_driver_heat = true
						newState.seat_driver_vent = false // Гасим вентиляцию
						toastMessage = ' Подогрев водителя ВКЛ (Вент. выкл.)'
						break
					case 'seat_driver_vent':
						newState.seat_driver_vent = true
						newState.seat_driver_heat = false // Гасим подогрев
						toastMessage = '💨 Вентиляция водителя ВКЛ (Подгрев выкл.)'
						break
					case 'seat_passenger_heat':
						newState.seat_passenger_heat = true
						newState.seat_passenger_vent = false
						toastMessage = '🔥 Подогрев пассажира ВКЛ (Вент. выкл.)'
						break
					case 'seat_passenger_vent':
						newState.seat_passenger_vent = true
						newState.seat_passenger_heat = false
						toastMessage = '💨 Вентиляция пассажира ВКЛ (Подгрев выкл.)'
						break
				}
			} else {
				// --- ВЫКЛЮЧЕНИЕ ---
				switch (type) {
					case 'relay':
						newState.relay = false
						toastMessage = '✅ Двигатель ОСТАНОВЛЕН'
						break
					case 'steering':
						newState.steering = false
						toastMessage = '️ Подогрев руля ВЫКЛ'
						break
					case 'seat_driver_heat':
						newState.seat_driver_heat = false
						toastMessage = '❄️ Подогрев водителя ВЫКЛ'
						break
					case 'seat_driver_vent':
						newState.seat_driver_vent = false
						toastMessage = '⏹ Вентиляция водителя ВЫКЛ'
						break
					case 'seat_passenger_heat':
						newState.seat_passenger_heat = false
						toastMessage = '❄️ Подогрев пассажира ВЫКЛ'
						break
					case 'seat_passenger_vent':
						newState.seat_passenger_vent = false
						toastMessage = ' Вентиляция пассажира ВЫКЛ'
						break
				}
			}

			onStateUpdate(newState)
			onCommandSent(toastMessage, true)
		} catch (error) {
			console.error('Ошибка:', error)
			onCommandSent('❌ Нет ответа от ESP32', false)
		} finally {
			// Снимаем блокировку с этого типа устройства
			setIsLoading(prev => ({ ...prev, [type]: false }))
		}
	}

	// Вспомогательная функция для получения текущего состояния
	const getIsOn = (type: ControlType, state: CarState): boolean => {
		switch (type) {
			case 'relay':
				return state.relay
			case 'steering':
				return state.steering
			case 'seat_driver_heat':
				return state.seat_driver_heat
			case 'seat_driver_vent':
				return state.seat_driver_vent
			case 'seat_passenger_heat':
				return state.seat_passenger_heat
			case 'seat_passenger_vent':
				return state.seat_passenger_vent
			default:
				return false
		}
	}

	if (!connectedDeviceId) return null

	return (
		<Animated.View style={[styles.container, { opacity: fadeAnim }]}>
			<Text style={styles.title}>Управление: {deviceInfo?.name || 'ESP32-C6'}</Text>

			{/* 🚗 Двигатель */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Двигатель</Text>
				<ToggleBtn
					label={carState.relay ? 'Остановить' : 'Запустить'}
					iconOn='🛑'
					iconOff='🔑'
					isActive={carState.relay}
					colorOn='#F44336'
					colorOff='#4CAF50'
					loading={isLoading.relay}
					onPress={() => toggleFeature('relay')}
				/>
				{carState.relay && <Text style={styles.statusActive}>🟢 Двигатель работает</Text>}
			</View>

			{/* ️ Подогрев руля */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Подогрев руля</Text>
				<ToggleBtn
					label={carState.steering ? 'Выключить' : 'Включить'}
					iconOn='️'
					iconOff=''
					isActive={carState.steering}
					colorOn='#FF9800'
					colorOff='#E0E0E0'
					loading={isLoading.steering}
					onPress={() => toggleFeature('steering')}
				/>
				{carState.steering && <Text style={styles.statusActive}> Руль нагревается</Text>}
			</View>

			{/* 🪑 Сиденье ВОДИТЕЛЯ */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Сиденье водителя</Text>
				<View style={styles.rowTwoCols}>
					<ToggleBtn
						label={carState.seat_driver_heat ? 'Выкл. Подогрев' : 'Вкл. Подогрев'}
						iconOn='❄️'
						iconOff='🔥'
						isActive={carState.seat_driver_heat}
						colorOn='#FF9800'
						colorOff='#E0E0E0'
						loading={isLoading.seat_driver_heat}
						onPress={() => toggleFeature('seat_driver_heat')}
					/>
					<ToggleBtn
						label={carState.seat_driver_vent ? 'Выкл. Вент.' : 'Вкл. Вент.'}
						iconOn=''
						iconOff='💨'
						isActive={carState.seat_driver_vent}
						colorOn='#03A9F4'
						colorOff='#E0E0E0'
						loading={isLoading.seat_driver_vent}
						onPress={() => toggleFeature('seat_driver_vent')}
					/>
				</View>
				{carState.seat_driver_heat && <Text style={styles.statusActiveHeat}> Подогрев активен</Text>}
				{carState.seat_driver_vent && <Text style={styles.statusActiveVent}>💨 Вентиляция активна</Text>}
			</View>

			{/*  Сиденье ПАССАЖИРА */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Сиденье пассажира</Text>
				<View style={styles.rowTwoCols}>
					<ToggleBtn
						label={carState.seat_passenger_heat ? 'Выкл. Подогрев' : 'Вкл. Подогрев'}
						iconOn=''
						iconOff='🔥'
						isActive={carState.seat_passenger_heat}
						colorOn='#FF9800'
						colorOff='#E0E0E0'
						loading={isLoading.seat_passenger_heat}
						onPress={() => toggleFeature('seat_passenger_heat')}
					/>
					<ToggleBtn
						label={carState.seat_passenger_vent ? 'Выкл. Вент.' : 'Вкл. Вент.'}
						iconOn='⏹'
						iconOff='💨'
						isActive={carState.seat_passenger_vent}
						colorOn='#03A9F4'
						colorOff='#E0E0E0'
						loading={isLoading.seat_passenger_vent}
						onPress={() => toggleFeature('seat_passenger_vent')}
					/>
				</View>
				{carState.seat_passenger_heat && <Text style={styles.statusActiveHeat}> Подогрев активен</Text>}
				{carState.seat_passenger_vent && <Text style={styles.statusActiveVent}>💨 Вентиляция активна</Text>}
			</View>
		</Animated.View>
	)
}

//  Компонент кнопки
interface ToggleBtnProps {
	label: string
	iconOn: string
	iconOff: string
	isActive: boolean
	colorOn: string
	colorOff: string
	loading?: boolean
	disabled?: boolean
	onPress: () => void
}

const ToggleBtn: React.FC<ToggleBtnProps> = ({ label, iconOn, iconOff, isActive, colorOn, colorOff, loading, disabled, onPress }) => {
	return (
		<TouchableOpacity
			style={[
				styles.toggleBtn,
				{
					backgroundColor: disabled ? '#F5F5F5' : isActive ? colorOn : colorOff,
					borderColor: isActive ? colorOn : '#ccc',
					opacity: disabled || loading ? 0.7 : 1
				}
			]}
			onPress={onPress}
			disabled={disabled || loading}
		>
			{loading ? (
				<Text style={styles.btnLoading}></Text>
			) : (
				<>
					<Text style={styles.btnIcon}>{isActive ? iconOn : iconOff}</Text>
					<Text style={[styles.btnText, { color: isActive ? '#fff' : '#333' }]}>{isActive ? 'Выкл' : 'Вкл'}</Text>
					<Text style={[styles.btnLabel, { color: isActive ? '#fff' : '#666' }]}>{label}</Text>
				</>
			)}
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		elevation: 3,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 }
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 12,
		textAlign: 'center',
		color: '#1976D2'
	},
	section: {
		marginBottom: 16,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#eee'
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#666',
		marginBottom: 8
	},
	rowTwoCols: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 10
	},
	toggleBtn: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 8,
		borderRadius: 8,
		alignItems: 'center',
		borderWidth: 1,
		minHeight: 60,
		justifyContent: 'center'
	},
	btnIcon: {
		fontSize: 20,
		marginBottom: 4
	},
	btnText: {
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 2
	},
	btnLabel: {
		fontSize: 10,
		textAlign: 'center'
	},
	btnLoading: {
		fontSize: 20
	},
	statusActive: {
		marginTop: 6,
		fontSize: 12,
		color: '#4CAF50',
		fontWeight: 'bold',
		textAlign: 'center'
	},
	statusActiveHeat: {
		marginTop: 6,
		fontSize: 12,
		color: '#FF9800',
		fontWeight: 'bold',
		textAlign: 'center'
	},
	statusActiveVent: {
		marginTop: 6,
		fontSize: 12,
		color: '#03A9F4',
		fontWeight: 'bold',
		textAlign: 'center'
	}
})

export default CarControls
