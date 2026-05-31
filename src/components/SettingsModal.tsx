import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { AppSettings, ButtonFeedbackMode, DEFAULT_SETTINGS } from '../types/settings';
import { loadSettings, saveSettings } from '../utils/settingsStorage';

interface SettingsModalProps {
	visible: boolean;
	onClose: () => void;
}

const FEEDBACK_OPTIONS: { value: ButtonFeedbackMode; label: string; icon: string }[] = [
	{ value: 'sound', label: 'Звуковой сигнал', icon: '🔊' },
	{ value: 'vibration', label: 'Вибрация', icon: '📳' },
	{ value: 'none', label: 'Ничего', icon: '🔇' }
];

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
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
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeText}>✕</Text>
						</TouchableOpacity>
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
										<TouchableOpacity
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
										</TouchableOpacity>
									))}
								</View>
							)}
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
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'flex-end'
	},
	modalContent: {
		backgroundColor: '#fff',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		maxHeight: '70%',
		padding: 20,
		shadowColor: '#000',
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
		borderBottomColor: '#eee'
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#333'
	},
	closeButton: {
		padding: 8
	},
	closeText: {
		fontSize: 24,
		color: '#666'
	},
	section: {
		marginBottom: 20
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 8
	},
	sectionDescription: {
		fontSize: 14,
		color: '#666',
		marginBottom: 16,
		lineHeight: 20
	},
	loadingText: {
		textAlign: 'center',
		color: '#999',
		paddingVertical: 20
	},
	optionsContainer: {
		gap: 12
	},
	optionCard: {
		backgroundColor: '#F5F5F5',
		borderRadius: 12,
		padding: 16,
		borderWidth: 2,
		borderColor: 'transparent'
	},
	optionCardActive: {
		backgroundColor: '#E3F2FD',
		borderColor: '#2196F3'
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
		color: '#333',
		fontWeight: '500'
	},
	optionLabelActive: {
		color: '#1565C0',
		fontWeight: '600'
	},
	checkmark: {
		fontSize: 20,
		color: '#4CAF50',
		fontWeight: 'bold'
	}
});

export default SettingsModal;
