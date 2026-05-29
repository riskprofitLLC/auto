import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import Toast from '../components/Toast';
import DeviceItem from '../components/DeviceItem';
import CarControls from '../components/CarControls';
import { useBluetooth } from '../hooks/useBluetooth';
import { BleDevice, ToastState } from '../types/bluetooth';
import { CarState } from '../types/car';

export default function App() {
	const [toast, setToast] = useState<ToastState>({
		visible: false,
		message: '',
		type: 'info'
	});
	const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [carState, setCarState] = useState<CarState>({
		relay: false,
		steering: false,
		seat_driver_heat: false,
		seat_driver_vent: false,
		seat_passenger_heat: false,
		seat_passenger_vent: false,
	});

	const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		setToast({ visible: true, message, type });
		toastTimerRef.current = setTimeout(() => {
			setToast(prev => ({ ...prev, visible: false }));
		}, 5000);
	};

	const {
		devices,
		status,
		isScanning,
		connectingId,
		connectedDeviceId,
		startScan,
		stopScan,
		rescan,
		connectToDevice,
		cancelConnection,
		disconnect,
		cancelConnectionAndStartScan,
	} = useBluetooth(showToast);

	// Сброс состояния авто при отключении
	useEffect(() => {
		if (!connectedDeviceId) {
			setCarState({
				relay: false,
				steering: false,
				seat_driver_heat: false,
				seat_driver_vent: false,
				seat_passenger_heat: false,
				seat_passenger_vent: false,
			});
		}
	}, [connectedDeviceId]);

	useEffect(() => {
		return () => {
			if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
		};
	}, []);

	const sortedDevices = useMemo(() => {
		const sortedByRssi = [...devices].sort((a, b) => b.rssi - a.rssi);

		if (!connectedDeviceId) return sortedByRssi;

		const connected = sortedByRssi.find(d => d.id === connectedDeviceId);
		if (!connected) return sortedByRssi;

		const others = sortedByRssi.filter(d => d.id !== connectedDeviceId);
		return [connected, ...others];
	}, [devices, connectedDeviceId]);

	const updateCarState = (newState: Partial<CarState>) => {
		setCarState(prev => ({ ...prev, ...newState }));
	};

	return (
		<View style={styles.container}>
			<Text style={styles.status}>Статус: {status}</Text>

			{/* Панель управления авто */}
			{connectedDeviceId && (
				<CarControls
					connectedDeviceId={connectedDeviceId}
					devices={devices}
					carState={carState}
					onStateUpdate={updateCarState}
					onCommandSent={(message, success) => showToast(message, success ? 'success' : 'error')}
				/>
			)}

			{/* Кнопки управления сканированием */}
			<View style={styles.buttonContainer}>
				{!isScanning && !connectingId ? (
					<Button title="Начать поиск" onPress={() => startScan(false)} />
				) : connectingId ? (
					<Button title="Начать поиск" onPress={cancelConnectionAndStartScan} color="#2196F3" />
				) : (
					<View style={styles.scanButtonsRow}>
						<Button title="Остановить" onPress={stopScan} color="#ff4444" />
						<Button title="Перезапуск" onPress={rescan} color="#2196F3" />
					</View>
				)}
			</View>

			{/* Список устройств */}
			<FlatList
				data={sortedDevices}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<DeviceItem
						item={item}
						isConnecting={connectingId === item.id}
						isConnected={connectedDeviceId === item.id}
						onConnect={connectToDevice}
						onCancel={cancelConnection}
						onDisconnect={disconnect}
						disabled={!!connectingId || !!connectedDeviceId}
					/>
				)}
				ListEmptyComponent={
					<Text style={styles.empty}>
						{isScanning ? 'Выполняется сканирование...' : 'Устройства не найдены. Нажмите "Начать поиск".'}
					</Text>
				}
			/>

			{/* Toast уведомления */}
			<Toast message={toast.message} visible={toast.visible} type={toast.type} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
	status: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
	buttonContainer: { marginBottom: 16 },
	scanButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
	empty: { textAlign: 'center', padding: 20, color: '#999', fontSize: 16 },
});