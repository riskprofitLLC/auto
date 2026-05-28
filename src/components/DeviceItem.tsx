import React from 'react'
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native'
import SignalStrength from './SignalStrength'
import { BleDevice } from '../types/bluetooth'

interface DeviceItemProps {
	item: BleDevice
	isConnecting: boolean
	isConnected: boolean
	onConnect: (id: string) => void
	onCancel: (id: string) => void
	onDisconnect: (id: string) => void
	disabled: boolean
}

const DeviceItem: React.FC<DeviceItemProps> = ({ item, isConnecting, isConnected, onConnect, onCancel, onDisconnect, disabled }) => {
	return (
		<View style={styles.deviceItem}>
			<View style={{ flex: 1 }}>
				<Text style={styles.deviceName}>{item.name && item.name !== 'Unknown' ? item.name : 'Неизвестное устройство'}</Text>
				<Text style={styles.deviceId}>{item.id}</Text>
			</View>

			<SignalStrength rssi={item.rssi} />

			<View style={styles.rightActions}>
				{isConnected ? (
					<>
						<View style={styles.greenCircle} />
						<TouchableOpacity style={styles.disconnectBtn} onPress={() => onDisconnect(item.id)}>
							<Text style={styles.disconnectText}>Откл.</Text>
						</TouchableOpacity>
					</>
				) : isConnecting ? (
					<Button title='Отмена' onPress={() => onCancel(item.id)} color='#ff4444' />
				) : (
					<Button title='Подключить' onPress={() => onConnect(item.id)} disabled={disabled} />
				)}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	deviceItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		backgroundColor: 'white',
		marginBottom: 8,
		borderRadius: 8,
		elevation: 2,
		gap: 8
	},
	deviceName: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 2
	},
	deviceId: {
		fontSize: 12,
		color: '#666'
	},
	rightActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		minWidth: 80,
		justifyContent: 'flex-end'
	},
	greenCircle: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: '#4CAF50'
	},
	disconnectBtn: {
		backgroundColor: '#FF5252',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4
	},
	disconnectText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '600'
	}
})

export default DeviceItem
