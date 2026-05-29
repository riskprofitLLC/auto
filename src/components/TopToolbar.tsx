import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native'

interface TopToolbarProps {
	onTpmsPress: () => void
}

const TopToolbar: React.FC<TopToolbarProps> = ({ onTpmsPress }) => {
	// Универсальная функция открытия приложений (Яндекс Навигатор / Яндекс Карты)
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

	// Отдельная функция для Google Maps (сохраняем вашу оригинальную логику с canOpenURL)
	const openGoogleMaps = async (): Promise<void> => {
		const scheme = 'comgooglemaps://'
		try {
			const supported = await Linking.canOpenURL(scheme)
			if (supported) {
				await Linking.openURL(scheme)
			} else {
				// Если приложение не установлено — открываем веб-версию
				await Linking.openURL('https://www.google.com/maps')
			}
		} catch (error: unknown) {
			console.error('Error opening Google Maps:', error)
		}
	}

	return (
		<View style={styles.container}>
			{/* Кнопка: Давление в шинах */}
			<TouchableOpacity style={styles.toolBtn} onPress={onTpmsPress}>
				<Text style={styles.icon}>🛞</Text>
				<Text style={styles.label}>Шины</Text>
			</TouchableOpacity>

			{/* Кнопка: Яндекс Навигатор */}
			<TouchableOpacity style={styles.toolBtn} onPress={() => openExternalApp('yandexnavi://', 'Яндекс Навигатор', 'ru.yandex.yandexnavi')}>
				<Text style={styles.icon}>🧭</Text>
				<Text style={styles.label}>Навиг.</Text>
			</TouchableOpacity>

			{/* Кнопка: Яндекс Карты */}
			<TouchableOpacity style={styles.toolBtn} onPress={() => openExternalApp('yandexmaps://', 'Яндекс Карты', 'ru.yandex.maps')}>
				<Text style={styles.icon}>🗺️</Text>
				<Text style={styles.label}>Карты</Text>
			</TouchableOpacity>

			{/* Кнопка: Google Maps (отдельная логика) */}
			<TouchableOpacity style={styles.toolBtn} onPress={openGoogleMaps}>
				<Text style={styles.icon}>🌍</Text>
				<Text style={styles.label}>Google</Text>
			</TouchableOpacity>
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
	icon: {
		fontSize: 16,
		marginRight: 5
	},
	label: {
		fontSize: 13,
		fontWeight: '600',
		color: '#333333'
	}
})

export default TopToolbar
