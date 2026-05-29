import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CarState } from '../types/car';

interface TopBarProps {
	connectedDeviceName: string | null;
	carState: CarState;
	onMenuPress: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ connectedDeviceName, carState, onMenuPress }) => {
	return (
		<View style={styles.container}>
			{/* Левая часть: Меню */}
			<TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
				<Text style={styles.menuIcon}>☰</Text>
			</TouchableOpacity>

			{/* Центр: Статус устройства */}
			<View style={styles.centerContent}>
				{connectedDeviceName ? (
					<>
						<Text style={styles.connectedIcon}>🔵</Text>
						<Text style={styles.deviceName} numberOfLines={1}>{connectedDeviceName}</Text>
					</>
				) : (
					<Text style={styles.disconnectedText}>Не подключено</Text>
				)}
			</View>

			{/* Правая часть: Индикаторы активности */}
			<View style={styles.indicators}>
				{carState.relay && <Text style={styles.indicator}>🟢</Text>}
				{carState.steering && <Text style={styles.indicator}>🔥</Text>}
				{(carState.seat_driver_heat || carState.seat_passenger_heat) && <Text style={styles.indicator}>♨️</Text>}
				{(carState.seat_driver_vent || carState.seat_passenger_vent) && <Text style={styles.indicator}>💨</Text>}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		height: 60,
		backgroundColor: '#fff',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
		elevation: 2,
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 2,
		shadowOffset: { width: 0, height: 1 },
		zIndex: 10,
	},
	menuButton: {
		padding: 8,
	},
	menuIcon: {
		fontSize: 24,
		color: '#333',
	},
	centerContent: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		marginHorizontal: 10,
	},
	connectedIcon: {
		fontSize: 16,
		marginRight: 6,
	},
	deviceName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#333',
		maxWidth: 200,
	},
	disconnectedText: {
		fontSize: 14,
		color: '#999',
		fontStyle: 'italic',
	},
	indicators: {
		flexDirection: 'row',
		gap: 4,
	},
	indicator: {
		fontSize: 18,
	},
});

export default TopBar;