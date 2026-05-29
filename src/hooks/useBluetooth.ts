import { useState, useEffect, useCallback, useRef } from 'react'
import { Platform, PermissionsAndroid, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BleManager, BleError, BleErrorCode } from 'react-native-ble-plx'
import { getBleManager } from '../utils/bleInstance'
import { BleDevice } from '../types/bluetooth'
import { isBenignDisconnectError } from '../utils/bleHelpers'

const LAST_DEVICE_KEY = '@last_connected_device_id'

export const useBluetooth = (showToast: (message: string, type: 'success' | 'error' | 'info') => void) => {
	const [bleManager, setBleManager] = useState<BleManager | null>(null)
	const [initError, setInitError] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true
		try {
			const mgr = getBleManager()
			if (isMounted) setBleManager(mgr)
		} catch (e: any) {
			console.error('❌ Ошибка инициализации BLE:', e.message)
			if (isMounted) {
				setInitError(e.message)
				setTimeout(() => {
					Alert.alert('Ошибка Bluetooth', 'Нативный модуль BLE недоступен. Перезапустите приложение.', [{ text: 'OK' }])
				}, 100)
			}
		}
		return () => {
			isMounted = false
		}
	}, [])

	const [devices, setDevices] = useState<BleDevice[]>([])
	const [status, setStatus] = useState<string>('Отключено')
	const [isScanning, setIsScanning] = useState<boolean>(false)
	const [connectingId, setConnectingId] = useState<string | null>(null)
	const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null)

	const hasAutoConnectedRef = useRef(false)
	const isInitializedRef = useRef(false)

	const requestPermissions = useCallback(async (): Promise<boolean> => {
		if (Platform.OS !== 'android') return true
		try {
			if (Platform.Version >= 31) {
				const granted = await PermissionsAndroid.requestMultiple([
					PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
					PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
				])
				return (
					granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
					granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
				)
			} else {
				const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
				return granted === PermissionsAndroid.RESULTS.GRANTED
			}
		} catch {
			return false
		}
	}, [])

	const saveLastDeviceId = async (id: string) => {
		try {
			await AsyncStorage.setItem(LAST_DEVICE_KEY, id)
		} catch {}
	}

	const getLastDeviceId = async (): Promise<string | null> => {
		try {
			return await AsyncStorage.getItem(LAST_DEVICE_KEY)
		} catch {
			return null
		}
	}

	const handleError = useCallback(
		(error: any) => {
			if (error instanceof BleError) {
				switch (error.errorCode) {
					case BleErrorCode.BluetoothUnsupported:
						showToast('Bluetooth не поддерживается', 'error')
						break
					case BleErrorCode.BluetoothUnauthorized:
						showToast('Нет разрешения', 'error')
						break
					case BleErrorCode.BluetoothPoweredOff:
						showToast('Bluetooth выключен', 'error')
						break
					case BleErrorCode.DeviceNotFound:
						showToast('Устройство не найдено', 'error')
						break
					case BleErrorCode.DeviceDisconnected:
						showToast('Соединение разорвано', 'error')
						break
					default:
						showToast(error.message || 'Ошибка BLE', 'error')
				}
			} else {
				showToast(String(error), 'error')
			}
		},
		[showToast]
	)

	const checkAndAutoConnect = useCallback(async () => {
		if (!bleManager) return
		if (hasAutoConnectedRef.current) return
		hasAutoConnectedRef.current = true

		const lastId = await getLastDeviceId()
		if (!lastId) return

		console.log('🔄 Автоподключение к:', lastId)
		showToast('Поиск...', 'info')

		let found = false
		setIsScanning(true)
		setStatus('Автоподключение...')

		bleManager.startDeviceScan(null, null, (error, device) => {
			if (error) {
				setIsScanning(false)
				return
			}

			// Добавляем найденное устройство в список сразу, чтобы оно появилось в меню
			if (device?.name || device?.id) {
				setDevices(prev => {
					if (prev.find(d => d.id === device.id)) return prev
					return [...prev, { id: device.id, name: device.name || 'Неизвестное', rssi: device.rssi !== null ? device.rssi : 0 }]
				})
			}

			if (device?.id === lastId && !found) {
				found = true
				bleManager.stopDeviceScan()
				setIsScanning(false)
				connectToDevice(lastId, true)
			}
		})
		setTimeout(() => {
			if (!found) {
				bleManager.stopDeviceScan()
				setIsScanning(false)
				showToast('Не найдено', 'info')
				setStatus('Готов к работе')
			}
		}, 5000)
	}, [bleManager, showToast])

	const initBluetooth = useCallback(async () => {
		if (!bleManager) return
		if (isInitializedRef.current) return
		isInitializedRef.current = true

		try {
			await new Promise(res => setTimeout(res, 200))
			const state = await bleManager.state()
			if (state === 'PoweredOn') {
				setStatus('Готов')
				await requestPermissions()
				setTimeout(checkAndAutoConnect, 500)
			} else {
				showToast(`BT выключен: ${state}`, 'error')
			}
		} catch {
			showToast('Ошибка инициализации', 'error')
		}
	}, [bleManager, requestPermissions, showToast, checkAndAutoConnect])

	useEffect(() => {
		if (bleManager && !initError) {
			initBluetooth()
		}
	}, [bleManager, initError, initBluetooth])

	const startScan = useCallback(
		async (forceRestart = false) => {
			if (!bleManager) return
			if (isScanning && !forceRestart) return
			try {
				if (!(await requestPermissions())) {
					showToast('Нет разрешений', 'error')
					return
				}
				if (connectedDeviceId) {
					try {
						await bleManager.cancelDeviceConnection(connectedDeviceId)
						setConnectedDeviceId(null)
					} catch {}
				}
				setDevices([])
				setIsScanning(true)
				setStatus('Поиск...')
				bleManager.startDeviceScan(null, null, (error, device) => {
					if (error) {
						handleError(error)
						setIsScanning(false)
						return
					}
					if (device?.name || device?.id) {
						setDevices(prev =>
							prev.find(d => d.id === device.id) ? prev : [...prev, { id: device.id, name: device.name || 'Unknown', rssi: device.rssi || 0 }]
						)
					}
				})
				setTimeout(() => {
					if (isScanning) {
						bleManager.stopDeviceScan()
						setIsScanning(false)
					}
				}, 15000)
			} catch {
				showToast('Ошибка сканирования', 'error')
				setIsScanning(false)
			}
		},
		[bleManager, isScanning, connectedDeviceId, requestPermissions, handleError, showToast]
	)

	const stopScan = useCallback(() => {
		if (bleManager) bleManager.stopDeviceScan()
		setIsScanning(false)
		setStatus('Остановлен')
	}, [bleManager])

	const rescan = useCallback(async () => {
		stopScan()
		setDevices([])
		await new Promise(r => setTimeout(r, 200))
		await startScan(true)
	}, [stopScan, startScan])

	const connectToDevice = useCallback(
		async (deviceId: string, isAuto = false) => {
			if (!bleManager) return
			try {
				setConnectingId(deviceId)
				setStatus(isAuto ? 'Авто...' : 'Подключение...')
				bleManager.stopDeviceScan()
				setIsScanning(false)
				const device = await bleManager.connectToDevice(deviceId)
				await device.discoverAllServicesAndCharacteristics()

				// Гарантируем наличие устройства в списке для меню
				setDevices(prev => {
					if (prev.find(d => d.id === deviceId)) return prev
					return [...prev, { id: deviceId, name: device.name || 'ESP32 Device', rssi: 0 }]
				})

				setConnectedDeviceId(deviceId)
				setConnectingId(null)
				setStatus('Подключено')
				await saveLastDeviceId(deviceId)
				showToast(`Подключено`, 'success')
			} catch (error: any) {
				handleError(error)
				setConnectingId(null)
				if (!connectedDeviceId) {
					setIsScanning(false)
					setStatus('Готов')
				}
			}
		},
		[bleManager, connectedDeviceId, handleError, showToast]
	)

	const cancelConnection = useCallback(
		async (deviceId: string) => {
			if (!bleManager) return
			setConnectingId(null)
			try {
				await bleManager.cancelDeviceConnection(deviceId)
			} catch {}
			setStatus('Готов')
		},
		[bleManager]
	)

	const disconnect = useCallback(
		async (deviceId: string) => {
			if (!bleManager) return
			if (!deviceId || deviceId !== connectedDeviceId) return
			try {
				await bleManager.cancelDeviceConnection(deviceId)
				setConnectedDeviceId(null)
				setStatus('Отключено')
				showToast('Отключено', 'info')
			} catch (error: any) {
				if (!isBenignDisconnectError(error)) showToast('Ошибка отключения', 'error')
				else {
					setConnectedDeviceId(null)
					setStatus('Отключено')
				}
			}
		},
		[bleManager, connectedDeviceId, showToast]
	)

	const cancelConnectionAndStartScan = useCallback(async () => {
		if (!bleManager) return
		if (connectingId) {
			try {
				await bleManager.cancelDeviceConnection(connectingId)
			} catch {}
		}
		if (connectedDeviceId) {
			try {
				await bleManager.cancelDeviceConnection(connectedDeviceId)
			} catch {}
		}
		setConnectingId(null)
		setConnectedDeviceId(null)
		setIsScanning(false)
		await new Promise(r => setTimeout(r, 300))
		await startScan(false)
	}, [bleManager, connectingId, connectedDeviceId, startScan])

	return {
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
	}
}
