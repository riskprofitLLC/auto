import React from 'react'
import { View, Text, StyleSheet, Linking, Alert } from 'react-native'
import FeedbackButton from './FeedbackButton'

interface TopToolbarProps {
	onTpmsPress: () => void
	onAmbientLightPress?: () => void
	onSettingsPress?: () => void
}

const TopToolbar: React.FC<TopToolbarProps> = ({ onTpmsPress, onAmbientLightPress, onSettingsPress }) => {
	const openExternalApp = async (scheme: string, appName: string, storeId: string): Promise<void> => {
		try {
			await Linking.openURL(scheme)
		} catch (error: unknown) {
			console.warn(`[TopToolbar] ${appName} fallback:`, error)
			Alert.alert(`${appName} не найден`, 'Загрузить из Google Play или открыть в браузере?', [
				{ text: 'Браузер', onPress: () => Linking.openURL('https://www.google.com/maps') },
				{ text: 'Установить', onPress: () => Linking.openURL(`market://details?id=${storeId}`) },
				{ text: 'Отмена', style: 'cancel' }
			])
		}
	}

	const openGoogleMaps = async (): Promise<void> => {
		const scheme = 'comgooglemaps://'
		try {
			const supported = await Linking.canOpenURL(scheme)
			if (supported) {
				await Linking.openURL(scheme)
			} else {
				await Linking.openURL('https://www.google.com/maps')
			}
		} catch (error: unknown) {
			console.error('Error opening Google Maps:', error)
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

			{/* Кнопка: Яндекс Навигатор */}
			<FeedbackButton style={styles.toolBtn} onPress={() => openExternalApp('yandexnavi://', 'Яндекс Навигатор', 'ru.yandex.yandexnavi')}>
				<Text style={styles.icon}>🧭</Text>
				<Text style={styles.label}>Навиг.</Text>
			</FeedbackButton>

			{/* Кнопка: Яндекс Карты */}
			<FeedbackButton style={styles.toolBtn} onPress={() => openExternalApp('yandexmaps://', 'Яндекс Карты', 'ru.yandex.maps')}>
				<Text style={styles.icon}>🗺️</Text>
				<Text style={styles.label}>Карты</Text>
			</FeedbackButton>

			{/* Кнопка: Google Maps */}
			<FeedbackButton style={styles.toolBtn} onPress={openGoogleMaps}>
				<Text style={styles.icon}>🌍</Text>
				<Text style={styles.label}>Google</Text>
			</FeedbackButton>

			{/* Кнопка: Настройки */}
			{onSettingsPress && (
				<FeedbackButton style={styles.toolBtnIcon} onPress={onSettingsPress}>
					<Text style={styles.icon}>⚙️</Text>
				</FeedbackButton>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		paddingHorizontal: 8,
		paddingVertical: 10,
		backgroundColor: '#F8F9FA',
		gap: 8
	},
	toolBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		borderWidth: 1,
		borderColor: '#E0E0E0'
	},
	toolBtnIcon: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFFFFF',
		width: 36,
		height: 36,
		borderRadius: 18,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		borderWidth: 1,
		borderColor: '#E0E0E0'
	},
	icon: {
		fontSize: 16
	},
	label: {
		fontSize: 13,
		fontWeight: '600',
		color: '#333333'
	}
})

export default TopToolbar
