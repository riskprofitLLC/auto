import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
	{ name: 'Фиолетовый', value: '#8B00FF' }
]

interface AmbientLightScreenProps {
	visible: boolean
	onClose: () => void
}

export default function AmbientLightScreen({ visible, onClose }: AmbientLightScreenProps) {
	const { carState, sendCommand } = useCarState()

	const [selectedColor, setSelectedColor] = useState<string>('#FF0000')
	const [brightness, setBrightness] = useState<number>(50)
	const [isSending, setIsSending] = useState(false)

	// Инициализация состояния из carState при загрузке
	useEffect(() => {
		if (carState.ambientColor) setSelectedColor(carState.ambientColor)
		if (carState.ambientBrightness !== undefined) setBrightness(carState.ambientBrightness)
	}, [carState.ambientColor, carState.ambientBrightness])

	if (!visible) return null

	const handleSetColor = async (color: string) => {
		setIsSending(true)
		try {
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
		setBrightness(value)
		try {
			await sendCommand('ambient_brightness', Math.round(value))
		} catch (error) {
			console.error('Ошибка установки яркости:', error)
		}
	}

	const toggleAmbient = async () => {
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
		<Modal visible={visible} animationType="slide" transparent={true}>
			<SafeAreaView style={styles.container}>
				{/* Заголовок */}
				<View style={styles.header}>
					<TouchableOpacity onPress={onClose} style={styles.backButton}>
						<Ionicons name='arrow-back' size={24} color='#333' />
					</TouchableOpacity>
					<Text style={styles.title}>Атмосферная подсветка</Text>
					<View style={{ width: 24 }} />
				</View>

			<ScrollView contentContainerStyle={styles.content}>
				{/* Визуализация салона */}
				<View style={[styles.visualizer, { borderColor: selectedColor }]}>
					<View style={[styles.carOutline, { shadowColor: carState.ambientEnabled ? selectedColor : 'transparent' }]} />
					<Text style={styles.visualizerText}>{carState.ambientEnabled ? 'Включено' : 'Выключено'}</Text>
				</View>

				{/* Кнопка ВКЛ/ВЫКЛ */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Основное управление</Text>
					<TouchableOpacity
						style={[styles.toggleButton, { backgroundColor: carState.ambientEnabled ? '#4CAF50' : '#E0E0E0' }]}
						onPress={toggleAmbient}
					>
						<Text style={[styles.toggleButtonText, { color: carState.ambientEnabled ? '#FFF' : '#757575' }]}>
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
								]}
								onPress={() => handleSetColor(c.value)}
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
						minimumTrackTintColor={selectedColor}
						maximumTrackTintColor='#E0E0E0'
						thumbTintColor={selectedColor}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
		</Modal>
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
