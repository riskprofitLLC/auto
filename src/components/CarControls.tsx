import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { BleDevice } from '../types/bluetooth';
import { CarState, ControlType } from '../types/car';

interface CarControlsProps {
	connectedDeviceId: string | null;
	devices: BleDevice[];
	carState: CarState;
	onCommandSent: (message: string, success: boolean) => void;
	onStateUpdate: (newState: Partial<CarState>) => void;
}

const CarControls: React.FC<CarControlsProps> = ({
																									 connectedDeviceId,
																									 devices,
																									 carState,
																									 onCommandSent,
																									 onStateUpdate
																								 }) => {
	// Используем Record<string, boolean> для отслеживания загрузки каждой кнопки отдельно
	const [isSending, setIsSending] = useState<Record<ControlType | 'bsm', boolean>>({
		relay: false,
		trunk: false,
		steering: false,
		seat_driver_heat: false,
		seat_driver_vent: false,
		seat_passenger_heat: false,
		seat_passenger_vent: false,
		bsm: false,
	});

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const deviceInfo = devices.find(d => d.id === connectedDeviceId);

	// Таймеры для аварийного сброса блокировки кнопок
	const timersRef = useRef<Record<ControlType | 'bsm', ReturnType<typeof setTimeout> | null>>({
		relay: null, trunk: null, steering: null, seat_driver_heat: null,
		seat_driver_vent: null, seat_passenger_heat: null, seat_passenger_vent: null, bsm: null,
	});

	useEffect(() => {
		if (connectedDeviceId) {
			Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
		} else {
			Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
		}

		return () => {
			// Очистка всех таймеров при размонтировании
			Object.values(timersRef.current).forEach(timer => timer && clearTimeout(timer));
		};
	}, [connectedDeviceId]);

	const toggleFeature = async (type: ControlType) => {
		// 1. Если уже идет отправка для ЭТОЙ конкретной кнопки, игнорируем нажатие
		// Это предотвращает создание нескольких параллельных операций для одной кнопки
		if (!connectedDeviceId || isSending[type]) {
			console.log(`⛔ Игнорирование повторного нажатия ${type}, операция уже выполняется`);
			return;
		}

		// 2. Проверка безопасности: климат только при работающем двигателе
		// Блокируем отправку команды, но НЕ меняем состояние carState (оно сохраняется в памяти)
		if (!carState.relay && type !== 'relay' && type !== 'trunk' && type !== 'bsm') {
			onCommandSent('⚠️ Двигатель выключен. Запустите двигатель для использования климата.', false);
			return;
		}

		// 3. СБРОС любого существующего таймера для этой кнопки перед новой операцией
		// Это гарантирует, что старые таймеры не сработают после новой операции
		if (timersRef.current[type]) {
			clearTimeout(timersRef.current[type]!);
			timersRef.current[type] = null;
			console.log(`🔄 Сброс старого таймера для ${type}`);
		}

		// 4. Блокируем кнопку
		setIsSending(prev => ({ ...prev, [type]: true }));
		console.log(`🔒 Блокировка кнопки: ${type}`);

		// 5. Таймаут безопасности (3 секунды). Если ESP32 молчит, разблокируем кнопку.
		timersRef.current[type] = setTimeout(() => {
			console.warn(`⚠️ Таймаут операции ${type}. Принудительная разблокировка.`);
			timersRef.current[type] = null;
			setIsSending(prev => ({ ...prev, [type]: false }));
		}, 3000);

		try {
			const isCurrentlyOn = getIsOn(type, carState);
			const targetState = !isCurrentlyOn;

			console.log(`📤 Отправка команды: ${type.toUpperCase()} -> ${targetState ? 'ON' : 'OFF'}`);

			// Имитация задержки сети/ESP32 (200мс для быстрой реакции UI)
			await new Promise(res => setTimeout(res, 200));

			const newState: Partial<CarState> = {};
			let message = '';

			if (targetState) {
				switch (type) {
					case 'relay': newState.relay = true; message = '✅ Двигатель ЗАПУЩЕН'; break;
					case 'trunk': newState.trunk = true; message = '📦 Багажник ОТКРЫТ'; break;
					case 'bsm': newState.bsm = true; message = '🚗 BSM ВКЛ'; break;
					case 'steering': newState.steering = true; message = '🔥 Подогрев руля ВКЛ'; break;
					case 'seat_driver_heat': newState.seat_driver_heat = true; newState.seat_driver_vent = false; message = '🔥 Подогрев водителя ВКЛ'; break;
					case 'seat_driver_vent': newState.seat_driver_vent = true; newState.seat_driver_heat = false; message = '💨 Вентиляция водителя ВКЛ'; break;
					case 'seat_passenger_heat': newState.seat_passenger_heat = true; newState.seat_passenger_vent = false; message = '🔥 Подогрев пассажира ВКЛ'; break;
					case 'seat_passenger_vent': newState.seat_passenger_vent = true; newState.seat_passenger_heat = false; message = '💨 Вентиляция пассажира ВКЛ'; break;
				}
			} else {
				switch (type) {
					case 'relay': newState.relay = false; message = '✅ Двигатель ОСТАНОВЛЕН'; break;
					case 'trunk': newState.trunk = false; message = '🔒 Багажник ЗАКРЫТ'; break;
					case 'bsm': newState.bsm = false; message = '🚗 BSM ВЫКЛ'; break;
					case 'steering': newState.steering = false; message = '❄️ Подогрев руля ВЫКЛ'; break;
					case 'seat_driver_heat': newState.seat_driver_heat = false; message = '❄️ Подогрев водителя ВЫКЛ'; break;
					case 'seat_driver_vent': newState.seat_driver_vent = false; message = '⏹ Вентиляция водителя ВЫКЛ'; break;
					case 'seat_passenger_heat': newState.seat_passenger_heat = false; message = '❄️ Подогрев пассажира ВЫКЛ'; break;
					case 'seat_passenger_vent': newState.seat_passenger_vent = false; message = '⏹ Вентиляция пассажира ВЫКЛ'; break;
				}
			}

			onStateUpdate(newState);
			onCommandSent(message, true);

		} catch (error) {
			console.error('Ошибка отправки:', error);
			onCommandSent('❌ Нет ответа от ESP32', false);
		} finally {
			// 6. ГАРАНТИРОВАННАЯ РАЗБЛОКИРОВКА
			// Очищаем таймер и сбрасываем флаг блокировки
			if (timersRef.current[type]) {
				clearTimeout(timersRef.current[type]!);
				timersRef.current[type] = null;
			}
			setIsSending(prev => {
				// Дополнительная проверка: убедимся, что мы сбрасываем именно эту кнопку
				if (prev[type]) {
					console.log(`🔓 Разблокировка кнопки: ${type}`);
					return { ...prev, [type]: false };
				}
				return prev;
			});
		}
	};

	const getIsOn = (type: ControlType | 'bsm', state: CarState): boolean => {
		switch (type) {
			case 'relay': return state.relay;
			case 'trunk': return state.trunk;
			case 'bsm': return state.bsm;
			case 'steering': return state.steering;
			case 'seat_driver_heat': return state.seat_driver_heat;
			case 'seat_driver_vent': return state.seat_driver_vent;
			case 'seat_passenger_heat': return state.seat_passenger_heat;
			case 'seat_passenger_vent': return state.seat_passenger_vent;
			default: return false;
		}
	};

	const isClimateLocked = !carState.relay;

	if (!connectedDeviceId) return null;

	return (
		<Animated.View style={[styles.container, { opacity: fadeAnim }]}>
			<ScrollView showsVerticalScrollIndicator={false}>

				{/* 🚗 ЗОНА ДВИГАТЕЛЯ */}
				<View style={styles.sectionCard}>
					<Text style={styles.sectionTitle}>Силовая установка</Text>

					<View style={styles.engineRow}>
						<ToggleBtn
							label={carState.relay ? "Остановить" : "Запустить"}
							icon={carState.relay ? "🛑" : "🔑"}
							isActive={carState.relay}
							colorActive="#EF5350"
							colorInactive="#4CAF50"
							loading={isSending.relay} // ✅ Прямая передача состояния
							onPress={() => toggleFeature('relay')}
							large
						/>
					</View>

					{carState.relay && <Text style={styles.statusActive}>🟢 Двигатель работает</Text>}
				</View>

				{/* 🎛️ ЗОНА КОМФОРТА И БАГАЖНИКА */}
				<View style={[styles.sectionCard, isClimateLocked && styles.lockedCard]}>
					<View style={styles.headerWithLock}>
						<Text style={styles.sectionTitle}>Управление</Text>
						{isClimateLocked && <Text style={styles.lockIcon}>🔒</Text>}
					</View>

					{isClimateLocked && (
						<Text style={styles.lockMessage}>Запустите двигатель для доступа к климату</Text>
					)}

					<View style={styles.grid}>

						{/* 2. Багажник (ВСЕГДА АКТИВЕН) */}
						<View style={styles.cardSmall}>
							<Text style={styles.cardTitle}>Багажник</Text>
							<ToggleBtn
								label={carState.trunk ? "Закрыть" : "Открыть"}
								icon={carState.trunk ? "🔒" : "📦"}
								isActive={carState.trunk}
								colorActive="#9C27B0"
								colorInactive="#E1BEE7"
								loading={isSending.trunk} // ✅ Прямая передача состояния
								onPress={() => toggleFeature('trunk')}
								// Нет disabled={isClimateLocked}
							/>
						</View>

						{/* 3. BSM (мониторинг слепых зон) */}
						<View style={styles.cardSmall}>
							<Text style={styles.cardTitle}>BSM</Text>
							<ToggleBtn
								label={carState.bsm && !isClimateLocked ? "Выкл" : "Вкл"}
								icon={carState.bsm && !isClimateLocked ? "🚗" : "📡"}
								isActive={carState.bsm && !isClimateLocked}
								colorActive="#4CAF50"
								colorInactive="#E0E0E0"
								loading={isSending.bsm}
								disabled={false}
								onPress={() => toggleFeature('bsm')}
							/>
						</View>

						{/* 4. Руль */}
						<View style={styles.cardSmall}>
							<Text style={styles.cardTitle}>Руль</Text>
							<ToggleBtn
								label={carState.steering && !isClimateLocked ? "Выкл" : "Вкл"}
								icon={carState.steering && !isClimateLocked ? "❄️" : "🔥"}
								isActive={carState.steering && !isClimateLocked}
								colorActive="#FF9800"
								colorInactive="#E0E0E0"
								loading={isSending.steering}
								disabled={false}
								onPress={() => toggleFeature('steering')}
							/>
						</View>

						{/* 5. Сиденье Водителя */}
						<View style={styles.cardSmall}>
							<Text style={styles.cardTitle}>Водитель</Text>
							<View style={styles.miniGrid}>
								<ToggleBtn
									label="Подогрев"
									icon="🔥"
									isActive={carState.seat_driver_heat && !isClimateLocked}
									colorActive="#FF9800"
									colorInactive="#F5F5F5"
									loading={isSending.seat_driver_heat}
									disabled={false}
									onPress={() => toggleFeature('seat_driver_heat')}
									small
								/>
								<ToggleBtn
									label="Вент."
									icon="💨"
									isActive={carState.seat_driver_vent && !isClimateLocked}
									colorActive="#03A9F4"
									colorInactive="#F5F5F5"
									loading={isSending.seat_driver_vent}
									disabled={false}
									onPress={() => toggleFeature('seat_driver_vent')}
									small
								/>
							</View>
						</View>

					{/* 6. Сиденье Пассажира */}
						<View style={styles.cardSmall}>
							<Text style={styles.cardTitle}>Пассажир</Text>
							<View style={styles.miniGrid}>
								<ToggleBtn
									label="Подогрев"
									icon="🔥"
									isActive={carState.seat_passenger_heat && !isClimateLocked}
									colorActive="#FF9800"
									colorInactive="#F5F5F5"
									loading={isSending.seat_passenger_heat}
									disabled={false}
									onPress={() => toggleFeature('seat_passenger_heat')}
									small
								/>
								<ToggleBtn
									label="Вент."
									icon="💨"
									isActive={carState.seat_passenger_vent && !isClimateLocked}
									colorActive="#03A9F4"
									colorInactive="#F5F5F5"
									loading={isSending.seat_passenger_vent}
									disabled={false}
									onPress={() => toggleFeature('seat_passenger_vent')}
									small
								/>
							</View>
						</View>

					</View>
				</View>

			</ScrollView>
		</Animated.View>
	);
};

// 🔘 Компонент кнопки
interface ToggleBtnProps {
	label: string;
	icon: string;
	isActive: boolean;
	colorActive: string;
	colorInactive: string;
	loading?: boolean;
	disabled?: boolean;
	onPress: () => void;
	large?: boolean;
	medium?: boolean;
	small?: boolean;
}

const ToggleBtn: React.FC<ToggleBtnProps> = ({
																							 label, icon, isActive, colorActive, colorInactive, loading, disabled, onPress, large, medium, small
																						 }) => {
	const btnStyle = [
		styles.toggleBtn,
		large && styles.btnLarge,
		medium && styles.btnMedium,
		small && styles.btnSmall,
		disabled && styles.btnDisabled,
		{
			backgroundColor: disabled ? '#EEEEEE' : (isActive ? colorActive : colorInactive),
			borderColor: disabled ? '#CCCCCC' : (isActive ? colorActive : '#ddd'),
			opacity: (disabled || loading) ? 0.6 : 1
		}
	];

	return (
		<TouchableOpacity
			style={btnStyle}
			onPress={onPress}
			// Кнопка заблокирована ТОЛЬКО если идет загрузка ИЛИ она явно отключена (например, климат при выкл двигателе)
			disabled={!!loading || !!disabled}
			activeOpacity={0.7}
		>
			{loading ? (
				<Text style={styles.btnLoading}>⏳</Text>
			) : (
				<>
					<Text style={[styles.btnIcon, large && styles.iconLarge]}>{icon}</Text>
					<Text style={[styles.btnText, isActive && !disabled ? styles.textWhite : styles.textDark, small && styles.textSmall]}>
						{label}
					</Text>
				</>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#F8F9FA' },
	sectionCard: {
		backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
		shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
	},
	lockedCard: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE' },
	headerWithLock: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
	lockIcon: { fontSize: 18, marginLeft: 8 },
	lockMessage: { textAlign: 'center', color: '#999', fontStyle: 'italic', marginBottom: 16, fontSize: 14 },
	sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
	engineRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
	grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
	cardSmall: {
		backgroundColor: '#fff', borderRadius: 16, padding: 12, width: '48%', marginBottom: 12,
		shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2,
	},
	cardTitle: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 10, textAlign: 'center' },
	miniGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
	toggleBtn: {
		alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, paddingVertical: 10,
		shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
	},
	btnDisabled: { backgroundColor: '#EEEEEE', borderColor: '#CCCCCC' },
	btnLarge: { width: '100%', paddingVertical: 20, borderRadius: 16 },
	btnMedium: { width: '100%', paddingVertical: 15, borderRadius: 12 },
	btnSmall: { flex: 1, paddingVertical: 8, borderRadius: 8 },
	btnIcon: { fontSize: 20, marginBottom: 4 },
	iconLarge: { fontSize: 32, marginBottom: 8 },
	btnText: { fontSize: 14, fontWeight: 'bold' },
	textWhite: { color: '#fff' },
	textDark: { color: '#333' },
	textSmall: { fontSize: 11 },
	btnLoading: { fontSize: 24 },
	statusActive: {
		marginTop: 12, fontSize: 14, color: '#4CAF50', fontWeight: 'bold', textAlign: 'center',
		backgroundColor: '#E8F5E9', paddingVertical: 6, borderRadius: 8,
	},
});

export default CarControls;