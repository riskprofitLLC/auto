import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated, PanResponder } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Slider from '@react-native-community/slider'
import { CarState } from '../types/car'
import FeedbackButton from '../components/FeedbackButton'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const COLORS = [
	{ name: 'Алый', hex: '#FF2D55', glow: 'rgba(255,45,85,0.5)' },
	{ name: 'Закат', hex: '#FF6B35', glow: 'rgba(255,107,53,0.5)' },
	{ name: 'Янтарь', hex: '#FFCC00', glow: 'rgba(255,204,0,0.5)' },
	{ name: 'Неон', hex: '#39FF14', glow: 'rgba(57,255,20,0.5)' },
	{ name: 'Лёд', hex: '#00E5FF', glow: 'rgba(0,229,255,0.5)' },
	{ name: 'Электрик', hex: '#2979FF', glow: 'rgba(41,121,255,0.5)' },
	{ name: 'Ультрафиолет', hex: '#D500F9', glow: 'rgba(213,0,249,0.5)' },
	{ name: 'Розовый', hex: '#FF4081', glow: 'rgba(255,64,129,0.5)' }
]

interface AmbientLightScreenProps {
	visible: boolean
	onClose: () => void
	carState: CarState
	onStateUpdate: (newState: Partial<CarState>) => void
}

export default function AmbientLightScreen({ visible, onClose, carState, onStateUpdate }: AmbientLightScreenProps) {
	const isPowerOn = carState.ambientEnabled ?? false
	const selectedColor = carState.ambientColor ?? '#2979FF'
	const brightness = carState.ambientBrightness ?? 50

	const fadeAnim = useRef(new Animated.Value(0)).current
	const scaleAnim = useRef(new Animated.Value(0.95)).current
	const pulseAnim = useRef(new Animated.Value(1)).current
	const glowAnim = useRef(new Animated.Value(0)).current

	const colorObj = COLORS.find(c => c.hex === selectedColor) ?? COLORS[5]

	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
				Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true })
			]).start()
		} else {
			Animated.parallel([
				Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
				Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true })
			]).start()
		}
	}, [visible])

	useEffect(() => {
		if (isPowerOn) {
			// Pulsing glow animation when on
			Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
					Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true })
				])
			).start()
			Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start()
		} else {
			pulseAnim.stopAnimation()
			pulseAnim.setValue(1)
			Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start()
		}
	}, [isPowerOn])

	const togglePower = () => {
		onStateUpdate({ ambientEnabled: !isPowerOn })
	}

	const handleColorSelect = (hex: string) => {
		onStateUpdate({ ambientColor: hex })
	}

	const handleBrightnessChange = (value: number) => {
		onStateUpdate({ ambientBrightness: Math.round(value) })
	}

	const glowOpacity = glowAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 0.6]
	})

	const glowSize = glowAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [80, 140]
	})

	if (!visible) return null

	return (
		<Modal visible={visible} animationType='none' transparent statusBarTranslucent>
			<Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
				<Animated.View style={[styles.sheet, { transform: [{ scale: scaleAnim }] }]}>
					{/* Ambient glow background blob */}
					<Animated.View
						pointerEvents='none'
						style={[
							styles.glowBlob,
							{
								backgroundColor: selectedColor,
								opacity: glowOpacity,
								width: glowSize,
								height: glowSize
							}
						]}
					/>

					<SafeAreaView edges={['top']} style={{ flex: 1 }}>
						{/* ── Header ── */}
						<View style={styles.header}>
							<View>
								<Text style={styles.headerEyebrow}>УПРАВЛЕНИЕ</Text>
								<Text style={styles.headerTitle}>Подсветка</Text>
							</View>
							<FeedbackButton onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
								<Ionicons name='close' size={20} color='#fff' />
							</FeedbackButton>
						</View>

						{/* ── Power orb ── */}
						<View style={styles.orbSection}>
							<FeedbackButton onPress={togglePower} activeOpacity={0.85}>
								<Animated.View style={[styles.orbOuter, { transform: [{ scale: pulseAnim }] }, isPowerOn && { borderColor: selectedColor + 'AA' }]}>
									<View style={[styles.orbInner, { backgroundColor: isPowerOn ? selectedColor : '#1A1A2E' }]}>
										<Ionicons name='power' size={36} color={isPowerOn ? '#fff' : '#555'} />
									</View>
								</Animated.View>
							</FeedbackButton>
							<Text style={[styles.orbLabel, isPowerOn && { color: selectedColor }]}>{isPowerOn ? '● ВКЛЮЧЕНО' : '○ ВЫКЛЮЧЕНО'}</Text>
						</View>

						{/* ── Color palette ── */}
						<View style={styles.section}>
							<Text style={styles.sectionLabel}>ЦВЕТ</Text>
							<View style={styles.colorRow}>
								{COLORS.map(c => (
									<FeedbackButton key={c.hex} onPress={() => handleColorSelect(c.hex)} activeOpacity={0.75} style={styles.colorWrap}>
										<View
											style={[
												styles.colorDot,
												{ backgroundColor: c.hex },
												selectedColor === c.hex && styles.colorDotSelected,
												selectedColor === c.hex && {
													shadowColor: c.hex,
													shadowOpacity: 0.9,
													shadowRadius: 10,
													elevation: 10
												}
											]}
										>
											{selectedColor === c.hex && <Ionicons name='checkmark' size={14} color='#fff' />}
										</View>
										<Text style={[styles.colorName, selectedColor === c.hex && { color: c.hex }]}>{c.name}</Text>
									</FeedbackButton>
								))}
							</View>
						</View>

						{/* ── Brightness ── */}
						<View style={styles.section}>
							<View style={styles.brightnessHeader}>
								<Text style={styles.sectionLabel}>ЯРКОСТЬ</Text>
								<Text style={[styles.brightnessValue, { color: isPowerOn ? selectedColor : '#555' }]}>{brightness}%</Text>
							</View>

							<View style={styles.sliderTrackWrap}>
								{/* Custom track tint overlay */}
								<View
									style={[
										styles.sliderFill,
										{
											width: `${brightness}%`,
											backgroundColor: isPowerOn ? selectedColor : '#333'
										}
									]}
								/>
								<Slider
									style={styles.slider}
									value={brightness}
									onSlidingComplete={handleBrightnessChange}
									onValueChange={handleBrightnessChange}
									minimumValue={0}
									maximumValue={100}
									minimumTrackTintColor='transparent'
									maximumTrackTintColor='transparent'
									thumbTintColor={isPowerOn ? selectedColor : '#444'}
								/>
							</View>

							{/* Quick presets */}
							<View style={styles.presetsRow}>
								{[25, 50, 75, 100].map(p => (
									<FeedbackButton
										key={p}
										onPress={() => handleBrightnessChange(p)}
										style={[
											styles.presetChip,
											brightness === p && {
												backgroundColor: isPowerOn ? selectedColor + '33' : '#333',
												borderColor: isPowerOn ? selectedColor : '#555'
											}
										]}
										activeOpacity={0.7}
									>
										<Text style={[styles.presetText, brightness === p && { color: isPowerOn ? selectedColor : '#fff' }]}>{p}%</Text>
									</FeedbackButton>
								))}
							</View>
						</View>

						{/* ── Current color preview bar ── */}
						{isPowerOn && (
							<View style={styles.previewBar}>
								<View style={[styles.previewLine, { backgroundColor: selectedColor }]} />
								<Text style={[styles.previewText, { color: selectedColor }]}>
									{colorObj.name} · {brightness}% яркость
								</Text>
								<View style={[styles.previewLine, { backgroundColor: selectedColor }]} />
							</View>
						)}
					</SafeAreaView>
				</Animated.View>
			</Animated.View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.85)',
		justifyContent: 'flex-end'
	},
	sheet: {
		backgroundColor: '#0D0D1A',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		minHeight: SCREEN_HEIGHT * 0.82,
		paddingHorizontal: 24,
		paddingBottom: 24,
		overflow: 'hidden'
	},
	glowBlob: {
		position: 'absolute',
		top: -40,
		alignSelf: 'center',
		borderRadius: 9999,
		filter: undefined // RN doesn't support CSS filter, rely on opacity + size
	},

	// Header
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingTop: 20,
		marginBottom: 8
	},
	headerEyebrow: {
		fontSize: 11,
		fontWeight: '700',
		color: '#444',
		letterSpacing: 3,
		marginBottom: 2
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: '800',
		color: '#fff',
		letterSpacing: -0.5
	},
	closeBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#1E1E30',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 4
	},

	// Orb
	orbSection: {
		alignItems: 'center',
		paddingVertical: 28
	},
	orbOuter: {
		width: 110,
		height: 110,
		borderRadius: 55,
		borderWidth: 2,
		borderColor: '#222',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#111'
	},
	orbInner: {
		width: 88,
		height: 88,
		borderRadius: 44,
		alignItems: 'center',
		justifyContent: 'center'
	},
	orbLabel: {
		marginTop: 14,
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 2,
		color: '#444'
	},

	// Sections
	section: {
		marginBottom: 24
	},
	sectionLabel: {
		fontSize: 11,
		fontWeight: '700',
		color: '#555',
		letterSpacing: 3,
		marginBottom: 14
	},

	// Colors
	colorRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10
	},
	colorWrap: {
		alignItems: 'center',
		width: (SCREEN_WIDTH - 48 - 70) / 8,
		minWidth: 34
	},
	colorDot: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: 'transparent'
	},
	colorDotSelected: {
		borderColor: '#fff',
		transform: [{ scale: 1.15 }]
	},
	colorName: {
		fontSize: 9,
		color: '#444',
		marginTop: 4,
		textAlign: 'center'
	},

	// Brightness
	brightnessHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 14
	},
	brightnessValue: {
		fontSize: 22,
		fontWeight: '800',
		color: '#555'
	},
	sliderTrackWrap: {
		height: 40,
		justifyContent: 'center',
		backgroundColor: '#1A1A2E',
		borderRadius: 20,
		overflow: 'hidden',
		marginBottom: 12
	},
	sliderFill: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		borderRadius: 20,
		opacity: 0.4
	},
	slider: {
		width: '100%',
		height: 40
	},
	presetsRow: {
		flexDirection: 'row',
		gap: 8
	},
	presetChip: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#222',
		alignItems: 'center',
		backgroundColor: '#111'
	},
	presetText: {
		fontSize: 13,
		fontWeight: '700',
		color: '#444'
	},

	// Preview bar
	previewBar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginTop: 4
	},
	previewLine: {
		flex: 1,
		height: 1,
		opacity: 0.4
	},
	previewText: {
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 0.5
	}
})
