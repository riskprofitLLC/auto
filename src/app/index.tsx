import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, StyleSheet, SafeAreaView, Text } from 'react-native'
import Toast from '../components/Toast'
import CarControls from '../components/CarControls'
import TopBar from '../components/TopBar'
import TopToolbar from '../components/TopToolbar'
import DeviceScanner from '../components/DeviceScanner'
import TirePressureMonitor from '../components/TirePressureMonitor'
import AmbientLightScreen from '../screens/AmbientLightScreen'
import SettingsModal from '../components/SettingsModal'
import { useBluetooth } from '../hooks/useBluetooth'
import { ToastState } from '../types/bluetooth'
import { CarState, TirePressure } from '../types/car'
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings'
import { loadSettings } from '../utils/settingsStorage'

export default function App() {
	const [toast, setToast] = useState<ToastState>({
		visible: false,
		message: '',
		type: 'info'
	})
	const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isTpmsOpen, setIsTpmsOpen] = useState(false)
	const [isAmbientLightOpen, setIsAmbientLightOpen] = useState(false)
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)

	const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

	const [carState, setCarState] = useState<CarState>({
		relay: false,
		trunk: false,
		steering: false,
		bsm: false,
		seat_driver_heat: false,
		seat_driver_vent: false,
		seat_passenger_heat: false,
		seat_passenger_vent: false,
		ambientEnabled: false,
		ambientColor: '#2979FF',
		ambientBrightness: 50
	})

	const [tirePressure, setTirePressure] = useState<TirePressure>({
		frontLeft: 2.2,
		frontRight: 2.2,
		rearLeft: 2.2,
		rearRight: 2.2
	})

	const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
		if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
		setToast({ visible: true, message, type })
		toastTimerRef.current = setTimeout(() => {
			setToast(prev => ({ ...prev, visible: false }))
		}, 5000)
	}

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
		cancelConnectionAndStartScan
	} = useBluetooth(showToast)

	const connectedDeviceName = useMemo(() => {
		if (!connectedDeviceId) return null
		const device = devices.find(d => d.id === connectedDeviceId)
		return device?.name || 'ESP32 Device'
	}, [connectedDeviceId, devices])

	useEffect(() => {
		if (!connectedDeviceId) {
			setCarState({
				relay: false,
				trunk: false,
				steering: false,
				bsm: false,
				seat_driver_heat: false,
				seat_driver_vent: false,
				seat_passenger_heat: false,
				seat_passenger_vent: false,
				ambientEnabled: false,
				ambientColor: '#2979FF',
				ambientBrightness: 50
			})
			setTirePressure({ frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 })
		}
	}, [connectedDeviceId])

	// Демо-режим TPMS
	useEffect(() => {
		if (!connectedDeviceId) return
		const interval = setInterval(() => {
			setTirePressure(prev => ({
				frontLeft: Math.max(1.5, Math.min(2.8, prev.frontLeft + (Math.random() - 0.5) * 0.1)),
				frontRight: Math.max(1.5, Math.min(2.8, prev.frontRight + (Math.random() - 0.5) * 0.1)),
				rearLeft: Math.max(1.5, Math.min(2.8, prev.rearLeft + (Math.random() - 0.5) * 0.1)),
				rearRight: Math.max(1.5, Math.min(2.8, prev.rearRight + (Math.random() - 0.5) * 0.1))
			}))
		}, 5000)
		return () => clearInterval(interval)
	}, [connectedDeviceId])

	useEffect(() => {
		loadInitialSettings();
		return () => {
			if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
		}
	}, [])

	const handleSettingsChange = (newSettings: AppSettings) => {
		setSettings(newSettings);
	};

	const loadInitialSettings = async () => {
		try {
			const loaded = await loadSettings();
			setSettings(loaded);
		} catch (error) {
			console.error('Failed to load settings:', error);
		}
	};

	const updateCarState = (newState: Partial<CarState>) => {
		setCarState(prev => ({ ...prev, ...newState }))
	}

	return (
		<SafeAreaView style={styles.container}>
			{/* 1. Верхняя панель статуса */}
			<TopBar connectedDeviceName={connectedDeviceName} carState={carState} onMenuPress={() => setIsMenuOpen(true)} onSettingsPress={() => setIsSettingsOpen(true)} />

			{/* 2. Панель инструментов (Шины, Настройки) */}
			{connectedDeviceId && <TopToolbar onTpmsPress={() => setIsTpmsOpen(true)} onAmbientLightPress={() => setIsAmbientLightOpen(true)} />}

			{/* 3. Основной контент */}
			<View style={styles.mainContent}>
				{connectedDeviceId ? (
					<CarControls
						connectedDeviceId={connectedDeviceId}
						devices={devices}
						carState={carState}
						buttonFeedbackMode={settings.buttonFeedbackMode}
						onStateUpdate={updateCarState}
						onCommandSent={(message, success) => showToast(message, success ? 'success' : 'error')}
					/>
				) : (
					<View style={styles.placeholder}>
						<Text style={styles.placeholderIcon}>📡</Text>
						<Text style={styles.placeholderText}>Подключитесь к устройству через меню ☰</Text>
					</View>
				)}
			</View>

			{/* Модальные окна */}
			<DeviceScanner
				visible={isMenuOpen}
				onClose={() => setIsMenuOpen(false)}
				devices={devices}
				isScanning={isScanning}
				connectingId={connectingId}
				connectedDeviceId={connectedDeviceId}
				onStartScan={() => startScan(false)}
				onStopScan={stopScan}
				onRescan={rescan}
				onConnect={connectToDevice}
				onCancel={cancelConnection}
				onDisconnect={disconnect}
			/>

			<TirePressureMonitor visible={isTpmsOpen} onClose={() => setIsTpmsOpen(false)} pressure={tirePressure} />

			{/* AmbientLightScreen теперь получает carState и onStateUpdate через props */}
			<AmbientLightScreen visible={isAmbientLightOpen} onClose={() => setIsAmbientLightOpen(false)} carState={carState} onStateUpdate={updateCarState} />

				{/* Модальное окно настроек */}
				<SettingsModal 
					visible={isSettingsOpen} 
					onClose={() => setIsSettingsOpen(false)} 
					onSettingsChange={handleSettingsChange}
				/>

			<Toast message={toast.message} visible={toast.visible} type={toast.type} />
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8F9FA'
	},
	mainContent: {
		flex: 1,
		padding: 16,
		paddingTop: 8
	},
	placeholder: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#fff',
		borderRadius: 16,
		margin: 16,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 2
	},
	placeholderIcon: { fontSize: 48, marginBottom: 16, opacity: 0.5 },
	placeholderText: { fontSize: 18, color: '#666', textAlign: 'center' }
})
