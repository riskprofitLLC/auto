import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Slider from '@react-native-community/slider'

// Импортируем типы и хук состояния (предполагая, что они доступны в проекте)
// В реальном проекте замените на правильный путь импорта
import { useCarState } from '../hooks/useCarState'
import { ControlType } from '../types/car'

const COLORS = [
	{ name: 'Красный', value: '#FF0000' },
	{ name: 'Оранжевый', value: '#FF7F00' },
	{ name: 'Желтый', value: '#FFFF00' },
	{ name: 'Зеленый', value: '#00FF00' },
	{ name: 'Голубой', value: '#00FFFF' },
	{ name: 'Синий', value: '#0000FF' },
	{ name: 'Фиолетовый', value: '#8B00FF' },
	{ name: 'Белый', value: '#FFFFFF' }
]

export default function AmbientLightScreen() {
	const navigation = useNavigation()
	const { carState, sendCommand } = useCarState()

	const [selectedColor, setSelectedColor] = useState<string>('#FF0000')
	const [brightness, setBrightness] = useState<number>(50)
	const [isSending, setIsSending] = useState(false)

	// Инициализация состояния из carState при загрузке
	useEffect(() => {
		if (carState.ambientColor) setSelectedColor(carState.ambientColor)
		if (carState.ambientBrightness !== undefined) setBrightness(carState.ambientBrightness)
	}, [carState.ambientColor, carState.ambientBrightness])

	const isEngineOn = carState.relay // Двигатель включен

	const handleSetColor = async (color: string) => {
		if (!isEngineOn) {
			Alert.alert('Двигатель выключен', 'Запустите двигатель для изменения подсветки.')
			return
		}

		setIsSending(true)
		try {
			// Пример команды, замените на реальную логику отправки
			await sendCommand('ambient_color', color)
			setSelectedColor(color)
		} catch (error) {
			console.error('Ошибка установки цвета:', error)
			Alert.alert('Ошибка', 'Не удалось изменить цвет')
		} finally {
			setIsSending(false)
		}
	}

	const handleSetBrightness = async (value: number) => {
		if (!isEngineOn) {
			// Слайдер лучше блокировать визуально или игнорировать изменения
			return
		}

		setBrightness(value)
		// Дебаунс можно добавить здесь, если нужно
		try {
			await sendCommand('ambient_brightness', Math.round(value))
		} catch (error) {
			console.error('Ошибка установки яркости:', error)
		}
	}

	const toggleAmbient = async () => {
		if (!isEngineOn) {
			Alert.alert('Двигатель выключен', 'Запустите двигатель для управления подсветкой.')
			return
		}

		setIsSending(true)
		try {
			const newState = !carState.ambientEnabled
			await sendCommand('ambient_enabled', newState)
		} catch (error) {
			console.error('Ошибка переключения подсветки:', error)
			Alert.alert('Ошибка', 'Не удалось переключить подсветку')
		} finally {
			setIsSending(false)
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* Заголовок */}
			<View style={styles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
					<Ionicons name='arrow-back' size={24} color='#333' />
				</TouchableOpacity>
				<Text style={styles.title}>Атмосферная подсветка</Text>
				<View style={{ width: 24 }} /> {/* Пустое место для центровки */}
			</View>

			<ScrollView contentContainerStyle={styles.content}>
				{/* Индикатор состояния двигателя */}
				{!isEngineOn && (
					<View style={styles.warningBox}>
						<Ionicons name='warning' size={24} color='#FF9800' />
						<Text style={styles.warningText}>Двигатель выключен. Управление недоступно.</Text>
					</View>
				)}

				{/* Визуализация салона */}
				<View style={[styles.visualizer, { borderColor: isEngineOn ? selectedColor : '#ccc' }]}>
					<View style={[styles.carOutline, { shadowColor: isEngineOn && carState.ambientEnabled ? selectedColor : 'transparent' }]} />
					<Text style={styles.visualizerText}>{carState.ambientEnabled && isEngineOn ? 'Включено' : 'Выключено'}</Text>
				</View>

				{/* Кнопка ВКЛ/ВЫКЛ */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Основное управление</Text>
					<TouchableOpacity
						style={[styles.toggleButton, { backgroundColor: carState.ambientEnabled && isEngineOn ? '#4CAF50' : '#E0E0E0' }]}
						onPress={toggleAmbient}
						disabled={!isEngineOn}
					>
						<Text style={[styles.toggleButtonText, { color: carState.ambientEnabled && isEngineOn ? '#FFF' : '#757575' }]}>
							{carState.ambientEnabled ? 'Подсветка ВКЛ' : 'Подсветка ВЫКЛ'}
						</Text>
					</TouchableOpacity>
				</View>

				{/* Выбор цвета */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Цвет подсветки</Text>
					<View style={styles.colorGrid}>
						{COLORS.map(c => (
							<TouchableOpacity
								key={c.value}
								style={[
									styles.colorItem,
									{ backgroundColor: c.value },
									selectedColor === c.value && styles.colorItemSelected,
									!isEngineOn && styles.colorItemDisabled
								]}
								onPress={() => handleSetColor(c.value)}
								disabled={!isEngineOn}
							>
								{selectedColor === c.value && <Ionicons name='checkmark' size={24} color='#FFF' />}
							</TouchableOpacity>
						))}
					</View>
					<Text style={styles.selectedColorText}>Выбран: {COLORS.find(c => c.value === selectedColor)?.name}</Text>
				</View>

				{/* Регулировка яркости */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Яркость: {Math.round(brightness)}%</Text>
					<Slider
						style={styles.slider}
						minimumValue={0}
						maximumValue={100}
						value={brightness}
						onValueChange={handleSetBrightness}
						disabled={!isEngineOn}
						minimumTrackTintColor={isEngineOn ? selectedColor : '#ccc'}
						maximumTrackTintColor='#E0E0E0'
						thumbTintColor={isEngineOn ? selectedColor : '#999'}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F5F5F5'
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		backgroundColor: '#FFF',
		borderBottomWidth: 1,
		borderBottomColor: '#E0E0E0'
	},
	backButton: {
		padding: 4
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333'
	},
	content: {
		padding: 16
	},
	warningBox: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFF3E0',
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#FFCC80'
	},
	warningText: {
		marginLeft: 8,
		color: '#E65100',
		fontWeight: '500'
	},
	visualizer: {
		height: 150,
		backgroundColor: '#222',
		borderRadius: 12,
		marginBottom: 20,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		overflow: 'hidden'
	},
	carOutline: {
		width: 100,
		height: 60,
		borderRadius: 10,
		backgroundColor: 'rgba(255,255,255,0.1)',
		shadowRadius: 20,
		shadowOpacity: 1
	},
	visualizerText: {
		color: '#FFF',
		marginTop: 10,
		fontWeight: 'bold'
	},
	section: {
		backgroundColor: '#FFF',
		padding: 16,
		borderRadius: 12,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
		color: '#333'
	},
	toggleButton: {
		padding: 16,
		borderRadius: 8,
		alignItems: 'center'
	},
	toggleButtonText: {
		fontSize: 16,
		fontWeight: 'bold'
	},
	colorGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between'
	},
	colorItem: {
		width: '22%',
		aspectRatio: 1,
		borderRadius: 12,
		marginBottom: 12,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 2
	},
	colorItemSelected: {
		borderWidth: 3,
		borderColor: '#333',
		transform: [{ scale: 1.05 }]
	},
	colorItemDisabled: {
		opacity: 0.5
	},
	selectedColorText: {
		textAlign: 'center',
		color: '#666',
		marginTop: 4
	},
	slider: {
		width: '100%',
		height: 40
	}
})
