import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView } from 'react-native'
import { useFeedback, FeedbackMode } from './FeedbackContext'

interface SettingsScreenProps {
	visible: boolean
	onClose: () => void
}

const MODES: { value: FeedbackMode; label: string; icon: string; description: string }[] = [
	{ value: 'vibration', label: 'Вибрация', icon: '📳', description: 'Вибрация при нажатии кнопок' },
	{ value: 'sound', label: 'Звуковой сигнал', icon: '🔔', description: 'Звуковой сигнал при нажатии' },
	{ value: 'none', label: 'Ничего', icon: '🔇', description: 'Без обратной связи' }
]

const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
	const { mode, setMode, trigger } = useFeedback()

	const handleSelect = (value: FeedbackMode) => {
		setMode(value)
		// Демонстрируем выбранный режим
		if (value === 'vibration') {
			const { Vibration } = require('react-native')
			Vibration.vibrate(40)
		} else if (value === 'sound') {
			// trigger сработает уже с новым режимом через useEffect, вызываем вручную
			setTimeout(() => {
				// небольшая задержка чтобы setMode успел применить
				const tempTrigger = () => {
					try {
						if (typeof window !== 'undefined' && typeof AudioContext !== 'undefined') {
							const ctx = new AudioContext()
							const osc = ctx.createOscillator()
							const gain = ctx.createGain()
							osc.connect(gain)
							gain.connect(ctx.destination)
							osc.type = 'sine'
							osc.frequency.setValueAtTime(880, ctx.currentTime)
							gain.gain.setValueAtTime(0.3, ctx.currentTime)
							gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
							osc.start(ctx.currentTime)
							osc.stop(ctx.currentTime + 0.1)
						} else {
							const { Vibration } = require('react-native')
							Vibration.vibrate([0, 30, 30, 30])
						}
					} catch (e) {}
				}
				tempTrigger()
			}, 50)
		}
	}

	return (
		<Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
			<View style={styles.overlay}>
				<SafeAreaView style={styles.sheet}>
					{/* Заголовок */}
					<View style={styles.header}>
						<Text style={styles.title}>Настройки</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeBtn}>
							<Text style={styles.closeText}>✕</Text>
						</TouchableOpacity>
					</View>

					{/* Раздел обратной связи */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Обратная связь при нажатии</Text>
						<View style={styles.modesContainer}>
							{MODES.map(item => {
								const isSelected = mode === item.value
								return (
									<TouchableOpacity
										key={item.value}
										style={[styles.modeItem, isSelected && styles.modeItemSelected]}
										onPress={() => handleSelect(item.value)}
										activeOpacity={0.7}
									>
										<View style={styles.modeLeft}>
											<Text style={styles.modeIcon}>{item.icon}</Text>
											<View>
												<Text style={[styles.modeLabel, isSelected && styles.modeLabelSelected]}>
													{item.label}
												</Text>
												<Text style={styles.modeDescription}>{item.description}</Text>
											</View>
										</View>
										{/* Радиокнопка */}
										<View style={[styles.radio, isSelected && styles.radioSelected]}>
											{isSelected && <View style={styles.radioDot} />}
										</View>
									</TouchableOpacity>
								)
							})}
						</View>
					</View>

					{/* Подсказка */}
					<View style={styles.hint}>
						<Text style={styles.hintText}>
							💡 Текущий режим: <Text style={styles.hintBold}>
								{MODES.find(m => m.value === mode)?.label}
							</Text>
						</Text>
					</View>
				</SafeAreaView>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'flex-end'
	},
	sheet: {
		backgroundColor: '#FFFFFF',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 32
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
		paddingBottom: 14,
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0'
	},
	title: {
		fontSize: 22,
		fontWeight: '800',
		color: '#1C1C1E'
	},
	closeBtn: {
		padding: 4
	},
	closeText: {
		fontSize: 22,
		color: '#999'
	},
	section: {
		marginBottom: 20
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '600',
		color: '#8E8E93',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 12
	},
	modesContainer: {
		gap: 10
	},
	modeItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#F2F2F7',
		borderRadius: 14,
		padding: 14,
		borderWidth: 2,
		borderColor: 'transparent'
	},
	modeItemSelected: {
		backgroundColor: '#EEF4FF',
		borderColor: '#007AFF'
	},
	modeLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1
	},
	modeIcon: {
		fontSize: 28
	},
	modeLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#1C1C1E',
		marginBottom: 2
	},
	modeLabelSelected: {
		color: '#007AFF'
	},
	modeDescription: {
		fontSize: 12,
		color: '#8E8E93'
	},
	radio: {
		width: 22,
		height: 22,
		borderRadius: 11,
		borderWidth: 2,
		borderColor: '#C7C7CC',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 10
	},
	radioSelected: {
		borderColor: '#007AFF'
	},
	radioDot: {
		width: 11,
		height: 11,
		borderRadius: 5.5,
		backgroundColor: '#007AFF'
	},
	hint: {
		backgroundColor: '#F2F2F7',
		borderRadius: 12,
		padding: 14,
		alignItems: 'center'
	},
	hintText: {
		fontSize: 14,
		color: '#8E8E93'
	},
	hintBold: {
		fontWeight: '700',
		color: '#1C1C1E'
	}
})

export default SettingsScreen
