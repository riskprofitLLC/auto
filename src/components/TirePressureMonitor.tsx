import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native'
import { TirePressure } from '../types/car'

interface TirePressureMonitorProps {
	visible: boolean
	onClose: () => void
	pressure: TirePressure
}

type TirePosition = 'posFL' | 'posFR' | 'posRL' | 'posRR'

const NORMAL_PRESSURE_MIN = 2.0
const NORMAL_PRESSURE_MAX = 2.5

const TirePressureMonitor: React.FC<TirePressureMonitorProps> = ({ visible, onClose, pressure }) => {
	// Очистка при размонтировании или закрытии модального окна
	useEffect(() => {
		return () => {
			// Гарантируем очистку любых активных анимаций или таймеров
			// на случай будущего расширения функционала
		}
	}, [visible])

	const getStatusColor = (val: number) => {
		if (val === 0) return '#9E9E9E' // Серый (нет данных)
		if (val < NORMAL_PRESSURE_MIN || val > NORMAL_PRESSURE_MAX) return '#F44336' // Красный (опасно)
		if (val < NORMAL_PRESSURE_MIN + 0.2 || val > NORMAL_PRESSURE_MAX - 0.2) return '#FF9800' // Оранжевый (внимание)
		return '#4CAF50' // Зеленый (норма)
	}

	const TireIndicator = ({ value, position }: { value: number; position: TirePosition }) => (
		<View style={[styles.tireWrapper, styles[position]]}>
			<View style={[styles.tireCircle, { borderColor: getStatusColor(value), borderWidth: getStatusColor(value) === '#9E9E9E' ? 2 : 4 }]}>
				<Text style={[styles.tireValue, { color: getStatusColor(value) === '#9E9E9E' ? '#555' : '#fff' }]}>{value > 0 ? value.toFixed(1) : '--'}</Text>
			</View>
		</View>
	)

	return (
		<Modal animationType='slide' transparent={true} visible={visible} onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>Давление в шинах</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeText}>✕</Text>
						</TouchableOpacity>
					</View>

					{/* Графическое изображение автомобиля (Минимализм) */}
					<View style={styles.carContainer}>
						{/* Кузов - простой серый силуэт */}
						<View style={styles.carBody} />

						{/* Колеса */}
						<TireIndicator value={pressure.frontLeft} position='posFL' />
						<TireIndicator value={pressure.frontRight} position='posFR' />
						<TireIndicator value={pressure.rearLeft} position='posRL' />
						<TireIndicator value={pressure.rearRight} position='posRR' />
					</View>

					<View style={styles.legend}>
						<View style={styles.legendItem}>
							<View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
							<Text>Норма (2.0-2.5 бар)</Text>
						</View>
						<View style={styles.legendItem}>
							<View style={[styles.dot, { backgroundColor: '#FF9800' }]} />
							<Text>Внимание</Text>
						</View>
						<View style={styles.legendItem}>
							<View style={[styles.dot, { backgroundColor: '#F44336' }]} />
							<Text>Опасно</Text>
						</View>
					</View>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	modalContent: {
		width: '85%',
		maxWidth: 320,
		backgroundColor: '#fff',
		borderRadius: 24,
		padding: 24,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 12,
		elevation: 12
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		marginBottom: 10
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#333'
	},
	closeButton: {
		padding: 4
	},
	closeText: {
		fontSize: 24,
		color: '#999'
	},
	carContainer: {
		width: 140, // Уменьшенная ширина
		height: 240, // Уменьшенная высота
		position: 'relative',
		marginVertical: 20
	},
	// --- Минималистичный кузов ---
	carBody: {
		position: 'absolute',
		left: 20,
		top: 20,
		width: 100,
		height: 200,
		backgroundColor: '#BDBDBD', // Светло-серый силуэт
		borderRadius: 35, // Скругленные углы
		zIndex: 1
	},
	// --- Позиционирование колес ---
	tireWrapper: {
		position: 'absolute',
		zIndex: 2
	},
	posFL: { top: 10, left: -10 },
	posFR: { top: 10, right: -10 },
	posRL: { bottom: 10, left: -10 },
	posRR: { bottom: 10, right: -10 },

	tireCircle: {
		width: 60, // Увеличенный размер
		height: 60,
		borderRadius: 30,
		borderWidth: 4,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#212121', // Черные шины
		shadowColor: '#000',
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 5
	},
	tireValue: {
		fontSize: 20, // Крупный шрифт
		fontWeight: 'bold'
	},
	legend: {
		marginTop: 10,
		width: '100%',
		paddingHorizontal: 10
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8
	},
	dot: {
		width: 14,
		height: 14,
		borderRadius: 7,
		marginRight: 10
	}
})

export default TirePressureMonitor
