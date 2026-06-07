import React from 'react'
import { View, Text, StyleSheet, Linking, Alert, Platform } from 'react-native'
import { colors } from '../constants/colors'
import { MapProvider } from '../types/settings'
import FeedbackButton from './FeedbackButton'

interface TopToolbarProps {
	onTpmsPress: () => void
	onAmbientLightPress?: () => void
	onSettingsPress?: () => void
	mapProvider: MapProvider
}

const MAP_CONFIG: Record<MapProvider, { primaryUrl: string; storeId: string; label: string; icon: string }> = {
	'yandex-navi': {
		primaryUrl: 'yandexnavi://',
		storeId: 'ru.yandex.yandexnavi',
		label: 'Навигатор',
		icon: '🧭',
	},
	'yandex-maps': {
		primaryUrl: 'yandexmaps://',
		storeId: 'ru.yandex.maps',
		label: 'Карты',
		icon: '🗺️',
	},
	'google-maps': {
		primaryUrl: 'https://www.google.com/maps',
		storeId: 'com.google.android.apps.maps',
		label: 'Google',
		icon: '🌍',
	},
}

const TopToolbar: React.FC<TopToolbarProps> = ({ onTpmsPress, onAmbientLightPress, mapProvider }) => {
	const openMap = async (): Promise<void> => {
		const config = MAP_CONFIG[mapProvider]
		try {
			await Linking.openURL(config.primaryUrl)
		} catch {
			// Если не сработало — предлагаем установить
			Alert.alert(
				`${config.label} не найден`,
				'Загрузить из Google Play?',
				[
					{
						text: 'Установить',
						onPress: () => {
							const marketUrl = Platform.select({
								android: `market://details?id=${config.storeId}`,
								default: `https://play.google.com/store/apps/details?id=${config.storeId}`,
							})
							Linking.openURL(marketUrl)
						},
					},
					{ text: 'Отмена', style: 'cancel' },
				],
			)
		}
	}

	return (
		<View style={styles.container}>
			{/* Кнопка: Давление в шинах */}
			<FeedbackButton style={styles.toolBtn} onPress={onTpmsPress}>
				<Text style={styles.icon}>🛞</Text>
				<Text style={styles.label}>Шины</Text>
			</FeedbackButton>

			{/* Кнопка: Атмосферная подсветка */}
			{onAmbientLightPress && (
				<FeedbackButton style={styles.toolBtnIcon} onPress={onAmbientLightPress}>
					<Text style={styles.icon}>💡</Text>
				</FeedbackButton>
			)}

			{/* Кнопка: Карта (выбранный провайдер) */}
			<FeedbackButton style={styles.toolBtn} onPress={openMap}>
				<Text style={styles.icon}>{MAP_CONFIG[mapProvider].icon}</Text>
				<Text style={styles.label}>{MAP_CONFIG[mapProvider].label}</Text>
			</FeedbackButton>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		paddingHorizontal: 8,
		paddingVertical: 10,
		backgroundColor: colors.background,
		gap: 8,
	},
	toolBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.backgroundElevated,
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 20,
		shadowColor: colors.textPrimary,
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		borderWidth: 1,
		borderColor: colors.border,
	},
	toolBtnIcon: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.backgroundElevated,
		width: 36,
		height: 36,
		borderRadius: 18,
		shadowColor: colors.textPrimary,
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		borderWidth: 1,
		borderColor: colors.border,
	},
	icon: {
		fontSize: 16,
	},
	label: {
		fontSize: 13,
		fontWeight: '600',
		color: colors.textSecondary,
	},
})

export default TopToolbar
