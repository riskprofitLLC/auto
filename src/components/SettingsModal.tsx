import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { AppSettings, ButtonFeedbackMode, MapProvider, DEFAULT_SETTINGS } from '../types/settings';
import { loadSettings, saveSettings } from '../utils/settingsStorage';
import FeedbackButton from './FeedbackButton';

interface SettingsModalProps {
	visible: boolean;
	onClose: () => void;
	onSettingsChange: (newSettings: AppSettings) => void;
}

const FEEDBACK_OPTIONS: { value: ButtonFeedbackMode; label: string; icon: string }[] = [
	{ value: 'sound', label: 'Звуковой сигнал', icon: '🔊' },
	{ value: 'vibration', label: 'Вибрация', icon: '📳' },
	{ value: 'none', label: 'Ничего', icon: '🔇' }
];

const MAP_OPTIONS: { value: MapProvider; label: string; icon: string }[] = [
	{ value: 'yandex-navi', label: 'Яндекс Навигатор', icon: '🧭' },
	{ value: 'yandex-maps', label: 'Яндекс Карты', icon: '🗺️' },
	{ value: 'google-maps', label: 'Google Карты', icon: '🌍' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, onSettingsChange }) => {
	const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (visible) {
			loadInitialSettings();
		}
	}, [visible]);

	const loadInitialSettings = async () => {
		setIsLoading(true);
		try {
			const loaded = await loadSettings();
			setSettings(loaded);
		} catch (error) {
			console.error('Failed to load settings:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const updateFeedbackMode = async (mode: ButtonFeedbackMode) => {
		const newSettings = { ...settings, buttonFeedbackMode: mode };
		setSettings(newSettings);
		try {
			await saveSettings(newSettings);
			// Уведомляем родительский компонент об изменении настроек
			if (onSettingsChange) {
				onSettingsChange(newSettings);
			}
		} catch (error) {
			console.error('Failed to save settings:', error);
		}
	};

	const updateMapProvider = async (provider: MapProvider) => {
		const newSettings = { ...settings, mapProvider: provider };
		setSettings(newSettings);
		try {
			await saveSettings(newSettings);
			if (onSettingsChange) {
				onSettingsChange(newSettings);
			}
		} catch (error) {
			console.error('Failed to save settings:', error);
		}
	};

	return (
		<Modal animationType='slide' transparent={true} visible={visible} onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>⚙️ Настройки</Text>
						<FeedbackButton onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
							<Ionicons name='close' size={20} color={colors.textPrimary} />
						</FeedbackButton>
					</View>

					<ScrollView showsVerticalScrollIndicator={false}>
						{/* Секция: Режим обратной связи кнопок */}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Режим кнопок</Text>
							<Text style={styles.sectionDescription}>
								Выберите реакцию при нажатии на все кнопки проекта:
							</Text>

							{isLoading ? (
								<Text style={styles.loadingText}>Загрузка...</Text>
							) : (
								<View style={styles.optionsContainer}>
									{FEEDBACK_OPTIONS.map((option) => (
										<FeedbackButton
											key={option.value}
											style={[
												styles.optionCard,
												settings.buttonFeedbackMode === option.value && styles.optionCardActive
											]}
											onPress={() => updateFeedbackMode(option.value)}
											activeOpacity={0.7}
										>
											<View style={styles.optionContent}>
												<Text style={styles.optionIcon}>{option.icon}</Text>
												<View style={styles.optionTextContainer}>
													<Text
														style={[
															styles.optionLabel,
															settings.buttonFeedbackMode === option.value &&
																styles.optionLabelActive
														]}
													>
														{option.label}
													</Text>
												</View>
												{settings.buttonFeedbackMode === option.value && (
													<Text style={styles.checkmark}>✓</Text>
												)}
											</View>
										</FeedbackButton>
									))}
								</View>
							)}
						</View>
							{/* Секция: Выбор карты */}
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Карта</Text>
								<Text style={styles.sectionDescription}>
									Выберите приложение для кнопки «Карта»:
								</Text>
								<View style={styles.optionsContainer}>
									{MAP_OPTIONS.map((option) => (
										<FeedbackButton
											key={option.value}
											style={[
												styles.optionCard,
												settings.mapProvider === option.value && styles.optionCardActive
											]}
											onPress={() => updateMapProvider(option.value)}
											activeOpacity={0.7}
										>
											<View style={styles.optionContent}>
												<Text style={styles.optionIcon}>{option.icon}</Text>
												<View style={styles.optionTextContainer}>
													<Text
														style={[
															styles.optionLabel,
															settings.mapProvider === option.value &&
																styles.optionLabelActive
														]}
													>
														{option.label}
													</Text>
												</View>
												{settings.mapProvider === option.value && (
													<Text style={styles.checkmark}>✓</Text>
												)}
											</View>
										</FeedbackButton>
									))}
								</View>
							</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: colors.overlay,
		justifyContent: 'flex-end'
	},
	modalContent: {
		backgroundColor: colors.modalBackground,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		maxHeight: '70%',
		padding: 20,
		shadowColor: colors.textPrimary,
		shadowOpacity: 0.2,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: -5 },
		elevation: 10
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
		paddingBottom: 15,
		borderBottomWidth: 1,
		borderBottomColor: colors.border
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: colors.textPrimary
	},
	closeBtn: {
		width: 36, height: 36, borderRadius: 18, backgroundColor: colors.backgroundElevated, alignItems: 'center', justifyContent: 'center'
	},
	section: {
		marginBottom: 20
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: colors.textPrimary,
		marginBottom: 8
	},
	sectionDescription: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 16,
		lineHeight: 20
	},
	loadingText: {
		textAlign: 'center',
		color: colors.textMuted,
		paddingVertical: 20
	},
	optionsContainer: {
		gap: 12
	},
	optionCard: {
		backgroundColor: colors.backgroundElevated,
		borderRadius: 12,
		padding: 16,
		borderWidth: 2,
		borderColor: 'transparent'
	},
	optionCardActive: {
		backgroundColor: colors.surface,
		borderColor: colors.primary
	},
	optionContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12
	},
	optionIcon: {
		fontSize: 28
	},
	optionTextContainer: {
		flex: 1
	},
	optionLabel: {
		fontSize: 16,
		color: colors.textPrimary,
		fontWeight: '500'
	},
	optionLabelActive: {
		color: colors.primaryDark,
		fontWeight: '600'
	},
	checkmark: {
		fontSize: 20,
		color: colors.success,
		fontWeight: 'bold'
	}
});

export default SettingsModal;
