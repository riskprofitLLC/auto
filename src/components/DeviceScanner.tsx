import React from 'react'
import { View, Text, FlatList, StyleSheet, Button, Modal, TouchableOpacity } from 'react-native'
import { BleDevice } from '../types/bluetooth'
import SignalStrength from './SignalStrength'

interface DeviceScannerProps {
	visible: boolean
	onClose: () => void
	devices: BleDevice[]
	isScanning: boolean
	connectingId: string | null
	connectedDeviceId: string | null
	onStartScan: () => void
	onStopScan: () => void
	onRescan: () => void
	onConnect: (id: string) => void
	onCancel: (id: string) => void
	onDisconnect: (id: string) => void
}

const DeviceScanner: React.FC<DeviceScannerProps> = ({
	visible,
	onClose,
	devices,
	isScanning,
	connectingId,
	connectedDeviceId,
	onStartScan,
	onStopScan,
	onRescan,
	onConnect,
	onCancel,
	onDisconnect
}) => {
	const sortedDevices = React.useMemo(() => {
		if (!connectedDeviceId) {
			return [...devices].sort((a, b) => b.rssi - a.rssi)
		}
		const connectedDevice = devices.find(d => d.id === connectedDeviceId)
		const otherDevices = devices.filter(d => d.id !== connectedDeviceId)
		const sortedOthers = otherDevices.sort((a, b) => b.rssi - a.rssi)
		if (connectedDevice) {
			return [connectedDevice, ...sortedOthers]
		}
		return sortedOthers
	}, [devices, connectedDeviceId])

	return (
		<Modal animationType='slide' transparent={true} visible={visible} onRequestClose={onClose}>
			<View style={styles.modalOverlay}>
				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>Устройства Bluetooth</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeText}>✕</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.controls}>
						{!isScanning && !connectingId ? (
							<Button title='Начать поиск' onPress={onStartScan} />
						) : connectingId ? (
							<Button title='Отмена подключения' onPress={() => onCancel(connectingId)} color='#ff4444' />
						) : (
							<View style={styles.scanButtonsRow}>
								<Button title='Стоп' onPress={onStopScan} color='#ff4444' />
								<Button title='Обновить' onPress={onRescan} color='#2196F3' />
							</View>
						)}
					</View>

					<FlatList
						data={sortedDevices}
						keyExtractor={item => item.id}
						renderItem={({ item }) => {
							const isThisConnected = item.id === connectedDeviceId
							const isThisConnecting = connectingId === item.id

							return (
								<View style={[styles.deviceItem, isThisConnected && styles.connectedDeviceItem]}>
									<View style={{ flex: 1 }}>
										<View style={styles.deviceHeader}>
											<Text style={[styles.deviceName, isThisConnected && styles.connectedDeviceName]}>
												{item.name && item.name !== 'Unknown' ? item.name : 'Неизвестное'}
												{isThisConnected && ' 🔵'}
											</Text>
											<Text style={styles.rssiText}>{item.rssi} dBm</Text>
										</View>
										<Text style={styles.deviceId}>{item.id}</Text>
									</View>

									<SignalStrength rssi={item.rssi} />

									<View style={styles.actions}>
										{isThisConnected ? (
											<Button title='Откл.' onPress={() => onDisconnect(item.id)} color='#FF5252' />
										) : isThisConnecting ? (
											<Button title='...' disabled color='#999' />
										) : (
											<Button title='Подкл.' onPress={() => onConnect(item.id)} disabled={!!connectingId || !!connectedDeviceId} />
										)}
									</View>
								</View>
							)
						}}
						ListEmptyComponent={<Text style={styles.emptyText}>{isScanning ? 'Сканирование...' : 'Нажмите "Начать поиск"'}</Text>}
					/>
				</View>
			</View>
		</Modal>
	)
}

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
		height: '80%',
		padding: 16,
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
		marginBottom: 16,
		paddingBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#eee'
	},
	title: {
		fontSize: 20,
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
	controls: {
		marginBottom: 16
	},
	scanButtonsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 10
	},
	deviceItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		backgroundColor: '#f9f9f9',
		borderRadius: 8,
		marginBottom: 8,
		gap: 10,
		borderWidth: 1,
		borderColor: 'transparent'
	},
	connectedDeviceItem: {
		backgroundColor: '#E3F2FD',
		borderColor: '#2196F3'
	},
	deviceHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 2
	},
	deviceName: {
		fontSize: 16,
		fontWeight: '600',
		color: '#333'
	},
	connectedDeviceName: {
		color: '#1565C0'
	},
	rssiText: {
		fontSize: 12,
		fontWeight: 'bold',
		color: '#03A9F4',
		backgroundColor: '#E1F5FE',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4
	},
	deviceId: {
		fontSize: 12,
		color: '#888'
	},
	actions: {
		minWidth: 80,
		alignItems: 'flex-end'
	},
	emptyText: {
		textAlign: 'center',
		color: '#999',
		marginTop: 40,
		fontSize: 16
	}
})

export default DeviceScanner
