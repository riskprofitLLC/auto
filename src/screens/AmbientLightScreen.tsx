import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Slider from '@react-native-community/slider'
import { useCarState } from '../hooks/useCarState'

const { height } = Dimensions.get('window')

const COLORS = [
	{ name: 'Красный', value: '#FF3B30' },
	{ name: 'Оранжевый', value: '#FF9500' },
	{ name: 'Желтый', value: '#FFCC00' },
	{ name: 'Зеленый', value: '#34C759' },
	{ name: 'Голубой', value: '#5AC8FA' },
	{ name: 'Синий', value: '#007AFF' },
	{ name: 'Фиолетовый', value: '#AF52DE' }
]

interface AmbientLightScreenProps {
	visible: boolean
	onClose: () => void
}

export default function AmbientLightScreen({ visible, onClose }: AmbientLightScreenProps) {
	const { carState, sendCommand } = useCarState()

	// Локальные состояния для мгновенного отклика UI
	const [selectedColor, setSelectedColor] = useState('#FF3B30')
	const [brightness, setBrightness] = useState(50)
	const [isPowerOn, setIsPowerOn] = useState(false)
	const [isSending, setIsSending] = useState(false)

	// Синхронизация с реальным состоянием машины
	useEffect(() => {
		if (carState.ambientColor) setSelectedColor(carState.ambientColor)
		if (carState.ambientBrightness !== undefined) setBrightness(carState.ambientBrightness)
		if (carState.ambientEnabled !== undefined) setIsPowerOn(carState.ambientEnabled)
	}, [carState.ambientColor, carState.ambientBrightness, carState.ambientEnabled])

	if (!visible) return null

	// 🔘 КНОПКА №1: Главный выключатель
	const toggleMainPower = async () => {
		const newState = !isPowerOn
		setIsPowerOn(newState)
		setIsSending(true)

		try {
			await sendCommand('ambient_enabled', newState)
		} catch (error) {
			console.error('Ошибка переключения:', error)
			setIsPowerOn(!newState) // Откат при ошибке
		} finally {
			setIsSending(false)
		}
	}

	// 🔘 КНОПКА №2: Яркость
	const handleBrightnessChange = async (value: number) => {
		try {
			await sendCommand('ambient_brightness', Math.round(value))
		} catch (error) {
			console.error(error)
		}
	}

	// 🔘 КНОПКА №3: Цвет
	const handleColorSelect = async (color: string) => {
		setSelectedColor(color)
		setIsSending(true)
		try {
			await sendCommand('ambient_color', color)
		} catch (error) {
			console.error(error)
		} finally {
			setIsSending(false)
		}
	}

	return (
		<Modal visible={visible} animationType='slide' transparent={true}>
			<View style={styles.modalContainer}>
				<View style={styles.overlay} />
				<SafeAreaView style={styles.sheet}>
					{/* Заголовок */}
					<View style={styles.header}>
						<Text style={styles.title}>Атмосферная подсветка</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Ionicons name='close' size={28} color='#1C1C1E' />
						</TouchableOpacity>
					</View>

					<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
						{/* 🔘 КНОПКА №1: Главный выключатель */}
						<View style={styles.mainPowerContainer}>
							<Text style={styles.mainPowerLabel}>{isPowerOn ? 'Система активна' : 'Система выключена'}</Text>

							<TouchableOpacity
								style={[styles.mainPowerButton, { backgroundColor: isPowerOn ? selectedColor : '#E5E5EA' }]}
								onPress={toggleMainPower}
								activeOpacity={0.8}
								disabled={isSending}
							>
								{isSending ? (
									<ActivityIndicator size='large' color={isPowerOn ? '#FFF' : '#8E8E93'} />
								) : (
									<>
										<Ionicons name={isPowerOn ? 'power' : 'power'} size={36} color={isPowerOn ? '#FFFFFF' : '#8E8E93'} />
										<Text style={[styles.mainPowerText, { color: isPowerOn ? '#FFFFFF' : '#8E8E93' }]}>{isPowerOn ? 'ВЫКЛЮЧИТЬ' : 'ВКЛЮЧИТЬ'}</Text>
									</>
								)}
							</TouchableOpacity>

							<View style={[styles.statusIndicator, { backgroundColor: isPowerOn ? '#34C759' : '#FF3B30' }]}>
								<Text style={styles.statusText}>{isPowerOn ? '● Включено' : '○ Выключено'}</Text>
							</View>
						</View>

						{/* 🔘 КНОПКА №2: Яркость */}
						{isPowerOn && (
							<View style={styles.controlSection}>
								<View style={styles.sectionHeader}>
									<Ionicons name='sunny' size={24} color={selectedColor} />
									<Text style={styles.sectionTitle}>Яркость</Text>
									<Text style={styles.brightnessValue}>{Math.round(brightness)}%</Text>
								</View>

								<View style={styles.sliderContainer}>
									<Slider
										style={styles.slider}
										value={brightness}
										onValueChange={setBrightness} // Мгновенная отрисовка
										onSlidingComplete={handleBrightnessChange} // Команда только после отпускания
										minimumValue={0}
										maximumValue={100}
										minimumTrackTintColor={selectedColor}
										maximumTrackTintColor='#E5E5EA'
										thumbTintColor={selectedColor}
									/>
								</View>

								<View style={styles.presetsRow}>
									{[25, 50, 75, 100].map(preset => (
										<TouchableOpacity
											key={preset}
											style={[styles.presetButton, Math.round(brightness) === preset && { backgroundColor: selectedColor, borderColor: selectedColor }]}
											onPress={() => handleBrightnessChange(preset)}
										>
											<Text style={[styles.presetText, Math.round(brightness) === preset && { color: '#FFFFFF' }]}>{preset}%</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>
						)}

						{/* 🔘 КНОПКА №3: Цвет подсветки */}
						{isPowerOn && (
							<View style={styles.controlSection}>
								<View style={styles.sectionHeader}>
									<Ionicons name='color-palette' size={24} color={selectedColor} />
									<Text style={styles.sectionTitle}>Цвет подсветки</Text>
								</View>

								<View style={styles.colorGrid}>
									{COLORS.map(color => (
										<TouchableOpacity
											key={color.value}
											style={[styles.colorButton, { backgroundColor: color.value }, selectedColor === color.value && styles.colorButtonSelected]}
											onPress={() => handleColorSelect(color.value)}
											activeOpacity={0.7}
										>
											{selectedColor === color.value && <Ionicons name='checkmark' size={28} color='#FFFFFF' />}
										</TouchableOpacity>
									))}
								</View>

								<View style={styles.currentColorContainer}>
									<Text style={styles.currentColorLabel}>Текущий цвет:</Text>
									<View style={[styles.currentColorBox, { backgroundColor: selectedColor }]}>
										<Text style={styles.currentColorName}>{COLORS.find(c => c.value === selectedColor)?.name}</Text>
									</View>
								</View>
							</View>
						)}

						{/* Подсказка при выключенном состоянии */}
						{!isPowerOn && (
							<View style={styles.hintContainer}>
								<Ionicons name='information-circle' size={24} color='#8E8E93' />
								<Text style={styles.hintText}>Нажмите кнопку "ВКЛЮЧИТЬ" для настройки яркости и цвета</Text>
							</View>
						)}
					</ScrollView>
				</SafeAreaView>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' },
	overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'transparent' },
	sheet: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30,
		height: height * 0.9,
		paddingHorizontal: 24,
		paddingTop: 20
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 25,
		paddingBottom: 15,
		borderBottomWidth: 1,
		borderBottomColor: '#F2F2F7'
	},
	title: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
	closeButton: { padding: 4 },
	// Кнопка №1
	mainPowerContainer: { alignItems: 'center', marginBottom: 30 },
	mainPowerLabel: { fontSize: 16, color: '#8E8E93', marginBottom: 20, fontWeight: '600' },
	mainPowerButton: {
		width: '100%',
		height: 120,
		borderRadius: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 5
	},
	mainPowerText: { fontSize: 24, fontWeight: 'bold', marginLeft: 12, letterSpacing: 1 },
	statusIndicator: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		marginTop: 15
	},
	statusText: { fontSize: 14, fontWeight: '600', color: '#FFF' },

	// Секции управления
	controlSection: {
		backgroundColor: '#F2F2F7',
		borderRadius: 20,
		padding: 20,
		marginBottom: 20
	},
	sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
	sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginLeft: 10, flex: 1 },
	brightnessValue: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
	sliderContainer: { marginBottom: 16 },
	slider: { width: '100%', height: 40 },
	presetsRow: { flexDirection: 'row', justifyContent: 'space-between' },
	presetButton: {
		flex: 1,
		height: 40,
		marginHorizontal: 4,
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		borderWidth: 2,
		borderColor: '#E5E5EA',
		justifyContent: 'center',
		alignItems: 'center'
	},
	presetText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },

	// Цвета
	colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
	colorButton: {
		width: '30%',
		aspectRatio: 1,
		borderRadius: 16,
		marginBottom: 12,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2
	},
	colorButtonSelected: {
		borderWidth: 4,
		borderColor: '#FFFFFF',
		transform: [{ scale: 1.05 }],
		shadowOpacity: 0.3
	},
	currentColorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		padding: 12,
		borderRadius: 12
	},
	currentColorLabel: { fontSize: 14, color: '#8E8E93', marginRight: 10 },
	currentColorBox: {
		flex: 1,
		height: 40,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center'
	},
	currentColorName: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFFFFF',
		textShadowColor: 'rgba(0,0,0,0.3)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2
	},

	// Подсказка
	hintContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F2F2F7',
		padding: 16,
		borderRadius: 12,
		marginTop: 10
	},
	hintText: { flex: 1, marginLeft: 10, fontSize: 14, color: '#8E8E93', lineHeight: 20 }
})
