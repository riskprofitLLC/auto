import React from 'react'
import { View, Text, FlatList, StyleSheet, Button, Modal, TouchableOpacity } from 'react-native'
import { BleDevice } from '../types/bluetooth'
import SignalStrength from './SignalStrength'
import FeedbackButton from './FeedbackButton'

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
						<FeedbackButton onPress={onClose} style={styles.closeButton}>
							<Text style={styles.closeText}>✕</Text>
						</FeedbackButton>
					</View>

					<View style={styles.controls}>
						{!isScanning && !connectingId ? (
							<FeedbackButton onPress={onStartScan} style={styles.scanBtn}>
								<Text style={styles.scanBtnText}>Начать поиск</Text>
							</FeedbackButton>
						) : connectingId ? (
							<FeedbackButton onPress={() => onCancel(connectingId)} style={[styles.scanBtn, { backgroundColor: '#ff4444' }]}>
								<Text style={styles.scanBtnText}>Отмена подключения</Text>
							</FeedbackButton>
						) : (
							<View style={styles.scanButtonsRow}>
								<FeedbackButton onPress={onStopScan} style={[styles.scanBtn, { backgroundColor: '#ff4444' }]}>
								<Text style={styles.scanBtnText}>Стоп</Text>
							</FeedbackButton>
								<FeedbackButton onPress={onRescan} style={[styles.scanBtn, { backgroundColor: '#2196F3' }]}>
								<Text style={styles.scanBtnText}>Обновить</Text>
							</FeedbackButton>
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
											<FeedbackButton onPress={() => onDisconnect(item.id)} style={[styles.smallBtn, { backgroundColor: '#FF5252' }]}>
													<Text style={styles.smallBtnText}>Откл.</Text>
												</FeedbackButton>
										) : isThisConnecting ? (
											<FeedbackButton disabled style={[styles.smallBtn, { backgroundColor: '#999' }]}>
													<Text style={styles.smallBtnText}>...</Text>
												</FeedbackButton>
										) : (
											<FeedbackButton onPress={() => onConnect(item.id)} disabled={!!connectingId || !!connectedDeviceId} style={[styles.smallBtn, { backgroundColor: '#4CAF50' }, (!!connectingId || !!connectedDeviceId) && { opacity: 0.5 }]}>
													<Text style={styles.smallBtnText}>Подкл.</Text>
												</FeedbackButton>
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
	scanBtn: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		backgroundColor: '#2196F3',
		minHeight: 36
	},
	scanBtnText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600' as const
	},
	smallBtn: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 6,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		minHeight: 32
	},
	smallBtnText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '600' as const
	},
	emptyText: {
		textAlign: 'center',
		color: '#999',
		marginTop: 40,
		fontSize: 16
	}
})

export default DeviceScanner
