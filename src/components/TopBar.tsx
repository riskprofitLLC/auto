import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FeedbackButton from './FeedbackButton';
import { colors } from '../constants/colors';
import { CarState } from '../types/car';

interface TopBarProps {
	connectedDeviceName: string | null;
	carState: CarState;
	onMenuPress: () => void;
	onSettingsPress: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ connectedDeviceName, carState, onMenuPress, onSettingsPress }) => {
	return (
		<View style={styles.container}>
			{/* Левая часть: Меню — круглая кнопка */}
			<FeedbackButton onPress={onMenuPress} style={styles.iconBtn} activeOpacity={0.7}>
				<Ionicons name='menu' size={20} color={colors.textPrimary} />
			</FeedbackButton>

			{/* Центр: Статус */}
			<View style={styles.centerContent}>
				<Text style={styles.eyebrow}>СТАТУС</Text>
				{connectedDeviceName ? (
					<View style={styles.statusRow}>
						<View style={styles.dot} />
						<Text style={styles.deviceName} numberOfLines={1}>{connectedDeviceName}</Text>
					</View>
				) : (
					<Text style={styles.disconnectedText}>Не подключено</Text>
				)}
			</View>

			{/* Правая часть: Индикаторы и Настройки */}
			<View style={styles.rightSection}>
				{carState.relay && <View style={[styles.statusDot, { backgroundColor: colors.success }]} />}
				{carState.steering && <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />}
				{(carState.seat_driver_heat || carState.seat_passenger_heat) && <View style={[styles.statusDot, { backgroundColor: colors.seatHeat }]} />}
				{(carState.seat_driver_vent || carState.seat_passenger_vent) && <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />}
				<FeedbackButton onPress={onSettingsPress} style={styles.iconBtn} activeOpacity={0.7}>
					<Ionicons name='settings-outline' size={20} color={colors.textPrimary} />
				</FeedbackButton>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: colors.background,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	iconBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: colors.backgroundElevated,
		alignItems: 'center',
		justifyContent: 'center',
	},
	centerContent: {
		flex: 1,
		alignItems: 'center',
		marginHorizontal: 12,
	},
	eyebrow: {
		fontSize: 10,
		fontWeight: '700',
		color: colors.textMuted,
		letterSpacing: 3,
		marginBottom: 2,
	},
	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: colors.success,
	},
	deviceName: {
		fontSize: 16,
		fontWeight: '700',
		color: colors.textPrimary,
		maxWidth: 180,
	},
	disconnectedText: {
		fontSize: 14,
		color: colors.textMuted,
		fontWeight: '500',
	},
	rightSection: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
});

export default TopBar;
