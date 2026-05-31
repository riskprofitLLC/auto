import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Slider from '@react-native-community/slider'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'

// Импортируем типы и хук состояния (предполагая, что они доступны в проекте)
// В реальном проекте замените на правильный путь импорта
import { useCarState } from '../hooks/useCarState'
import { ControlType } from '../types/car'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const COLORS = [
	{ name: 'Красный', value: '#FF0000', gradient: ['#FF0000', '#FF6B6B'] },
	{ name: 'Оранжевый', value: '#FF7F00', gradient: ['#FF7F00', '#FFA500'] },
	{ name: 'Желтый', value: '#FFFF00', gradient: ['#FFFF00', '#FFD700'] },
	{ name: 'Зеленый', value: '#00FF00', gradient: ['#00FF00', '#7FFF00'] },
	{ name: 'Голубой', value: '#00FFFF', gradient: ['#00FFFF', '#40E0D0'] },
	{ name: 'Синий', value: '#0000FF', gradient: ['#0000FF', '#4169E1'] },
	{ name: 'Фиолетовый', value: '#8B00FF', gradient: ['#8B00FF', '#BA55D3'] },
	{ name: 'Белый', value: '#FFFFFF', gradient: ['#FFFFFF', '#E0E0E0'] }
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

	const currentColorData = COLORS.find(c => c.value === selectedColor) || COLORS[0]

	return (
		<Modal visible={visible} animationType="slide" transparent={true}>
			<View style={styles.overlay}>
				<LinearGradient
					colors={['#1a1a2e', '#16213e', '#0f3460']}
					style={styles.container}
				>
					<SafeAreaView style={styles.safeArea}>
						{/* Заголовок с эффектом стекла */}
						<View style={styles.header}>
							<TouchableOpacity onPress={onClose} style={styles.backButton}>
								<Ionicons name='arrow-back' size={24} color='#FFF' />
							</TouchableOpacity>
							<Text style={styles.title}>Атмосферная подсветка</Text>
							<View style={{ width: 40 }} />
						</View>

						<ScrollView 
							contentContainerStyle={styles.content}
							showsVerticalScrollIndicator={false}
						>
							{/* Визуализация салона с градиентом и свечением */}
							<View style={styles.visualizerContainer}>
								<LinearGradient
									colors={carState.ambientEnabled ? (currentColorData?.gradient || ['#2a2a3e', '#1a1a2e']) : ['#2a2a3e', '#1a1a2e']}
									style={styles.visualizer}
									start={{ x: 0.5, y: 0 }}
									end={{ x: 0.5, y: 1 }}
								>
									<View style={[
										styles.glowRing,
										carState.ambientEnabled && {
											shadowColor: selectedColor,
											shadowOpacity: brightness / 100,
											shadowRadius: 30 * (brightness / 100),
											borderColor: selectedColor
										}
									]} />
									<View style={styles.carIcon}>
										<Ionicons 
											name='car-sport' 
											size={80} 
											color={carState.ambientEnabled ? selectedColor : '#444'} 
										/>
									</View>
									<Text style={styles.visualizerStatus}>
										{carState.ambientEnabled ? 'Активно' : 'Неактивно'}
									</Text>
									{carState.ambientEnabled && (
										<Text style={[styles.visualizerColor, { color: selectedColor }]}>
											{currentColorData.name}
										</Text>
									)}
								</LinearGradient>
							</View>

							{/* Главный переключатель с крупным дизайном */}
							<TouchableOpacity
								style={[
									styles.mainToggle,
									carState.ambientEnabled && { backgroundColor: selectedColor + '30' }
								]}
								onPress={toggleAmbient}
								activeOpacity={0.7}
							>
								<LinearGradient
									colors={carState.ambientEnabled ? (currentColorData?.gradient || ['#3a3a4e', '#2a2a3e']) : ['#3a3a4e', '#2a2a3e']}
									style={styles.mainToggleGradient}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 1 }}
								>
									<Ionicons 
										name={carState.ambientEnabled ? 'bulb' : 'bulb-outline'} 
										size={32} 
										color={carState.ambientEnabled ? '#FFF' : '#888'} 
									/>
									<Text style={[
										styles.mainToggleText,
										{ color: carState.ambientEnabled ? '#FFF' : '#888' }
									]}>
										{carState.ambientEnabled ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО'}
									</Text>
								</LinearGradient>
							</TouchableOpacity>

							{/* Выбор цвета - горизонтальный скролл */}
							<View style={styles.section}>
								<View style={styles.sectionHeader}>
									<Ionicons name='color-palette' size={20} color='#FFF' />
									<Text style={styles.sectionTitle}>Цвет подсветки</Text>
								</View>
								<ScrollView 
									horizontal 
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.colorScroll}
								>
									{COLORS.map(c => (
										<TouchableOpacity
											key={c.value}
											style={[
												styles.colorItem,
												selectedColor === c.value && styles.colorItemSelected,
											]}
											onPress={() => handleSetColor(c.value)}
											disabled={!carState.ambientEnabled}
										>
											<LinearGradient
												colors={c.gradient}
												style={styles.colorGradient}
												start={{ x: 0, y: 0 }}
												end={{ x: 1, y: 1 }}
											>
												{selectedColor === c.value && (
													<View style={styles.checkmark}>
														<Ionicons name='checkmark' size={20} color='#FFF' />
													</View>
												)}
											</LinearGradient>
										</TouchableOpacity>
									))}
								</ScrollView>
								<Text style={styles.selectedColorName}>
									{currentColorData.name}
								</Text>
							</View>

							{/* Регулировка яркости с круговым дизайном */}
							<View style={styles.section}>
								<View style={styles.sectionHeader}>
									<Ionicons name='sunny' size={20} color='#FFF' />
									<Text style={styles.sectionTitle}>Яркость</Text>
									<Text style={styles.brightnessValue}>{Math.round(brightness)}%</Text>
								</View>
								<View style={styles.sliderContainer}>
									<View style={[
										styles.brightnessIndicator,
										{ backgroundColor: selectedColor + '20' }
									]}>
										<LinearGradient
											colors={currentColorData.gradient}
											style={[
												styles.brightnessFill,
												{ width: `${brightness}%` }
											]}
											start={{ x: 0, y: 0.5 }}
											end={{ x: 1, y: 0.5 }}
										/>
									</View>
									<Slider
										style={styles.slider}
										minimumValue={0}
										maximumValue={100}
										value={brightness}
										onValueChange={handleSetBrightness}
										minimumTrackTintColor={selectedColor}
										maximumTrackTintColor='#3a3a4e'
										thumbTintColor={selectedColor}
									/>
								</View>
								{/* Быстрые пресеты яркости */}
								<View style={styles.presets}>
									{[25, 50, 75, 100].map(preset => (
										<TouchableOpacity
											key={preset}
											style={[
												styles.preset,
												brightness === preset && { backgroundColor: selectedColor }
											]}
											onPress={() => handleSetBrightness(preset)}
										>
											<Text style={[
												styles.presetText,
												brightness === preset && { color: '#FFF' }
											]}>
												{preset}%
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>

							{/* Дополнительная информация */}
							<View style={styles.infoCard}>
								<Ionicons name='information-circle' size={20} color='#666' />
								<Text style={styles.infoText}>
									Используйте атмосферную подсветку для создания уникальной атмосферы в салоне автомобиля
								</Text>
							</View>
						</ScrollView>
					</SafeAreaView>
				</LinearGradient>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)'
	},
	container: {
		flex: 1
	},
	safeArea: {
		flex: 1
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12
	},
	backButton: {
		padding: 8,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.1)'
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#FFF',
		letterSpacing: 0.5
	},
	content: {
		padding: 16,
		paddingBottom: 40
	},
	visualizerContainer: {
		height: 200,
		borderRadius: 24,
		overflow: 'hidden',
		marginBottom: 20
	},
	visualizer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	glowRing: {
		position: 'absolute',
		width: 140,
		height: 140,
		borderRadius: 70,
		borderWidth: 2,
		backgroundColor: 'transparent'
	},
	carIcon: {
		zIndex: 10
	},
	visualizerStatus: {
		color: '#FFF',
		fontSize: 16,
		fontWeight: '600',
		marginTop: 12,
		opacity: 0.9
	},
	visualizerColor: {
		fontSize: 14,
		fontWeight: '500',
		marginTop: 4,
		opacity: 0.8
	},
	mainToggle: {
		borderRadius: 20,
		overflow: 'hidden',
		marginBottom: 20,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8
	},
	mainToggleGradient: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 20,
		gap: 12
	},
	mainToggleText: {
		fontSize: 18,
		fontWeight: '800',
		letterSpacing: 2
	},
	section: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		padding: 16,
		borderRadius: 20,
		marginBottom: 16,
		backdropFilter: 'blur(10px)'
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 16
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFF',
		flex: 1
	},
	brightnessValue: {
		fontSize: 14,
		fontWeight: '700',
		color: '#FFF',
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12
	},
	colorScroll: {
		gap: 12,
		paddingRight: 16
	},
	colorItem: {
		width: 60,
		height: 60,
		borderRadius: 16,
		overflow: 'hidden',
		elevation: 3,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4
	},
	colorItemSelected: {
		transform: [{ scale: 1.1 }],
		elevation: 6,
		shadowOpacity: 0.4
	},
	colorGradient: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	checkmark: {
		backgroundColor: 'rgba(0, 0, 0, 0.3)',
		borderRadius: 20,
		padding: 4
	},
	selectedColorName: {
		textAlign: 'center',
		color: '#AAA',
		fontSize: 14,
		marginTop: 12,
		fontWeight: '500'
	},
	sliderContainer: {
		marginBottom: 16
	},
	brightnessIndicator: {
		height: 12,
		borderRadius: 6,
		overflow: 'hidden',
		marginBottom: 12
	},
	brightnessFill: {
		height: '100%',
		borderRadius: 6
	},
	slider: {
		width: '100%',
		height: 40
	},
	presets: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 10
	},
	preset: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		alignItems: 'center'
	},
	presetText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#AAA'
	},
	infoCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		padding: 14,
		borderRadius: 16,
		marginTop: 8
	},
	infoText: {
		flex: 1,
		fontSize: 13,
		color: '#888',
		lineHeight: 18
	}
})
