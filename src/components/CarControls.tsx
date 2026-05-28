import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { BleDevice } from '../types/bluetooth'
import { ControlButtonProps } from '../types/car'

interface CarControlsProps {
	connectedDeviceId: string | null
	devices: BleDevice[]
	onCommandSent: (message: string, success: boolean) => void
}

type ControlType = 'relay' | 'steering' | 'seat_driver' | 'seat_passenger'
type CommandAction = 'on' | 'off'

const CarControls: React.FC<CarControlsProps> = ({ connectedDeviceId, devices, onCommandSent }) => {
	const [isSending, setIsSending] = useState<Record<string, boolean>>({})
	const fadeAnim = useRef(new Animated.Value(0)).current

	const deviceInfo = devices.find(d => d.id === connectedDeviceId)

	useEffect(() => {
		if (connectedDeviceId) {
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true
			}).start()
		} else {
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true
			}).start()
		}
	}, [connectedDeviceId])

	// ✅ Функция отправки команды (МОК — позже заменить на реальный BLE write)
	const sendCommand = async (type: ControlType, action: CommandAction) => {
		if (!connectedDeviceId || isSending[`${type}_${action}`]) return

		const key = `${type}_${action}`
		setIsSending(prev => ({ ...prev, [key]: true }))

		try {
			// 🔹 МОК-КОМАНДА: имитация задержки сети
			await new Promise(res => setTimeout(res, 400))

			// 🔹 Здесь позже будет реальный код для ESP32:
			/*
			const bleManager = new BleManager();
			const device = await bleManager.connectToDevice(connectedDeviceId);
			const service = await device.discoverAllServicesAndCharacteristics();
			const characteristic = service.characteristics.find(
				c => c.uuid.toLowerCase() === 'YOUR_CHARACTERISTIC_UUID'
			);
			const command = `${type.toUpperCase()}:${action.toUpperCase()}`;
			await characteristic?.writeWithResponse(Buffer.from(command).toString('base64'));
			*/

			// Сообщения для Toast
			const messages: Record<string, string> = {
				relay_on: '✅ Запуск двигателя...',
				relay_off: '✅ Остановка двигателя...',
				steering_on: '🔥 Подогрев руля ВКЛЮЧЕН',
				steering_off: '❄️ Подогрев руля ВЫКЛЮЧЕН',
				seat_driver_on: '🔥 Подогрев сиденья водителя ВКЛЮЧЕН',
				seat_driver_off: '❄️ Подогрев сиденья водителя ВЫКЛЮЧЕН',
				seat_passenger_on: '🔥 Подогрев сиденья пассажира ВКЛЮЧЕН',
				seat_passenger_off: '❄️ Подогрев сиденья пассажира ВЫКЛЮЧЕН'
			}

			onCommandSent(messages[key] || 'Команда отправлена', true)
		} catch (error) {
			console.error('Ошибка отправки команды:', error)
			onCommandSent('❌ Не удалось отправить команду', false)
		} finally {
			setIsSending(prev => ({ ...prev, [key]: false }))
		}
	}

	if (!connectedDeviceId) return null

	return (
		<Animated.View style={[styles.container, { opacity: fadeAnim }]}>
			<Text style={styles.title}>Управление: {deviceInfo?.name || 'Устройство'}</Text>

			{/* 🔑 Двигатель */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Двигатель</Text>
				<View style={styles.buttonRow}>
					<ControlButton
						title='Запуск'
						icon='🔑'
						color='#4CAF50'
						onPress={() => sendCommand('relay', 'on')}
						disabled={isSending['relay_on']}
						loading={isSending['relay_on']}
					/>
					<ControlButton
						title='Стоп'
						icon='⏹'
						color='#F44336'
						onPress={() => sendCommand('relay', 'off')}
						disabled={isSending['relay_off']}
						loading={isSending['relay_off']}
					/>
				</View>
			</View>

			{/* 🎛️ Подогрев руля */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Подогрев руля</Text>
				<View style={styles.buttonRow}>
					<ControlButton
						title='Вкл'
						icon='🔥'
						color='#FF9800'
						onPress={() => sendCommand('steering', 'on')}
						disabled={isSending['steering_on']}
						loading={isSending['steering_on']}
					/>
					<ControlButton
						title='Выкл'
						icon='❄️'
						color='#9E9E9E'
						onPress={() => sendCommand('steering', 'off')}
						disabled={isSending['steering_off']}
						loading={isSending['steering_off']}
					/>
				</View>
			</View>

			{/* 🪑 Сиденье водителя */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Сиденье водителя</Text>
				<View style={styles.buttonRow}>
					<ControlButton
						title='Вкл'
						icon='🔥'
						color='#FF9800'
						onPress={() => sendCommand('seat_driver', 'on')}
						disabled={isSending['seat_driver_on']}
						loading={isSending['seat_driver_on']}
					/>
					<ControlButton
						title='Выкл'
						icon='❄️'
						color='#9E9E9E'
						onPress={() => sendCommand('seat_driver', 'off')}
						disabled={isSending['seat_driver_off']}
						loading={isSending['seat_driver_off']}
					/>
				</View>
			</View>

			{/* 🪑 Сиденье пассажира */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Сиденье пассажира</Text>
				<View style={styles.buttonRow}>
					<ControlButton
						title='Вкл'
						icon='🔥'
						color='#FF9800'
						onPress={() => sendCommand('seat_passenger', 'on')}
						disabled={isSending['seat_passenger_on']}
						loading={isSending['seat_passenger_on']}
					/>
					<ControlButton
						title='Выкл'
						icon='❄️'
						color='#9E9E9E'
						onPress={() => sendCommand('seat_passenger', 'off')}
						disabled={isSending['seat_passenger_off']}
						loading={isSending['seat_passenger_off']}
					/>
				</View>
			</View>
		</Animated.View>
	)
}

// 🔘 Компонент кнопки управления
const ControlButton: React.FC<ControlButtonProps> = ({ title, icon, color, onPress, disabled, loading }) => (
	<TouchableOpacity style={[styles.controlBtn, { backgroundColor: disabled ? '#E0E0E0' : color }]} onPress={onPress} disabled={disabled}>
		{loading ? (
			<Text style={styles.btnLoading}>⏳</Text>
		) : (
			<>
				<Text style={styles.btnIcon}>{icon}</Text>
				<Text style={styles.btnText}>{title}</Text>
			</>
		)}
	</TouchableOpacity>
)

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
	buttonRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12
	},
	controlBtn: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 6
	},
	btnIcon: {
		fontSize: 16
	},
	btnText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600'
	},
	btnLoading: {
		color: '#fff',
		fontSize: 16
	}
})

export default CarControls
