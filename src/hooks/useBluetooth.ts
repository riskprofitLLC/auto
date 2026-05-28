import { useState, useEffect, useCallback, useRef } from 'react'
import { Platform, PermissionsAndroid } from 'react-native'
import { BleManager, BleError, BleErrorCode } from 'react-native-ble-plx'
import { BleDevice, ToastState } from '../types/bluetooth'
import { isBenignDisconnectError } from '../utils/bleHelpers'

export const useBluetooth = (showToast: (message: string, type: 'success' | 'error' | 'info') => void) => {
	const [bleManager] = useState(() => new BleManager())
	const [devices, setDevices] = useState<BleDevice[]>([])
	const [status, setStatus] = useState<string>('Отключено')
	const [isScanning, setIsScanning] = useState<boolean>(false)
	const [connectingId, setConnectingId] = useState<string | null>(null)
	const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null)

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

	const initBluetooth = useCallback(async () => {
		try {
			const state = await bleManager.state()
			if (state === 'PoweredOn') {
				setStatus('Готов к работе')
				await requestPermissions()
			} else {
				showToast(`Bluetooth выключен: ${state}`, 'error')
			}
		} catch {
			showToast('Ошибка инициализации Bluetooth', 'error')
		}
	}, [bleManager, requestPermissions, showToast])

	const handleError = useCallback(
		(error: any) => {
			if (error instanceof BleError) {
				switch (error.errorCode) {
					case BleErrorCode.BluetoothUnsupported:
						showToast('Bluetooth не поддерживается на этом устройстве', 'error')
						break
					case BleErrorCode.BluetoothUnauthorized:
						showToast('Отсутствует разрешение на использование Bluetooth', 'error')
						break
					case BleErrorCode.BluetoothPoweredOff:
						showToast('Bluetooth адаптер выключен', 'error')
						break
					case BleErrorCode.DeviceNotFound:
						showToast('Устройство не найдено в зоне действия', 'error')
						break
					case BleErrorCode.DeviceDisconnected:
						showToast('Соединение с устройством разорвано', 'error')
						break
					default:
						showToast(error.message || 'Произошла ошибка BLE', 'error')
				}
			} else {
				showToast(String(error), 'error')
			}
		},
		[showToast]
	)

	const startScan = useCallback(
		async (forceRestart = false) => {
			if (isScanning && !forceRestart) return

			try {
				const state = await bleManager.state()
				if (state !== 'PoweredOn') {
					showToast('Bluetooth выключен', 'error')
					return
				}
				if (!(await requestPermissions())) {
					showToast('Нет разрешений для работы с Bluetooth', 'error')
					return
				}

				if (connectedDeviceId) {
					try {
						await bleManager.cancelDeviceConnection(connectedDeviceId)
						setConnectedDeviceId(null)
						await new Promise(res => setTimeout(res, 300))
					} catch {
						setConnectedDeviceId(null)
					}
				}

				setDevices([])
				setIsScanning(true)
				setStatus('Поиск устройств...')

				bleManager.startDeviceScan(null, null, (error, device) => {
					if (error) {
						handleError(error)
						setIsScanning(false)
						return
					}
					if (device?.name || device?.id) {
						setDevices(prev => {
							if (prev.find(d => d.id === device.id)) return prev
							return [
								...prev,
								{
									id: device.id,
									name: device.name || 'Неизвестное',
									rssi: device.rssi !== null ? device.rssi : 0
								}
							]
						})
					}
				})

				setTimeout(() => {
					if (isScanning) stopScan()
				}, 15000)
			} catch {
				showToast('Не удалось запустить сканирование', 'error')
				setIsScanning(false)
			}
		},
		[bleManager, isScanning, connectedDeviceId, requestPermissions, handleError, showToast]
	)

	const stopScan = useCallback(() => {
		bleManager.stopDeviceScan()
		setIsScanning(false)
		setStatus('Поиск остановлен')
	}, [bleManager])

	const rescan = useCallback(async () => {
		bleManager.stopDeviceScan()
		setDevices([])
		await new Promise(res => setTimeout(res, 200))
		await startScan(true)
	}, [bleManager, startScan])

	const connectToDevice = useCallback(
		async (deviceId: string) => {
			try {
				setConnectingId(deviceId)
				setStatus('Подключение...')
				bleManager.stopDeviceScan()
				setIsScanning(false)

				const device = await bleManager.connectToDevice(deviceId)
				await device.discoverAllServicesAndCharacteristics()

				setConnectedDeviceId(deviceId)
				setConnectingId(null)
				setStatus('Подключено')

				const services = await device.services()
				showToast(`Успешно подключено к ${device.name || deviceId} (${services.length} сервисов)`, 'success')
			} catch (error) {
				handleError(error)
				setConnectingId(null)
				if (!connectedDeviceId) {
					setIsScanning(false)
					setStatus('Готов к работе')
				}
			}
		},
		[bleManager, connectedDeviceId, handleError, showToast]
	)

	const cancelConnection = useCallback(
		async (deviceId: string) => {
			setConnectingId(null)
			setStatus('Отмена...')
			try {
				await bleManager.cancelDeviceConnection(deviceId)
			} catch {}
			setStatus('Готов к работе')
		},
		[bleManager]
	)

	const disconnect = useCallback(
		async (deviceId: string) => {
			if (!deviceId || deviceId !== connectedDeviceId) return

			try {
				await bleManager.cancelDeviceConnection(deviceId)
				setConnectedDeviceId(null)
				setStatus('Отключено')
				showToast('Устройство успешно отключено', 'info')
			} catch (error: any) {
				if (!isBenignDisconnectError(error)) {
					console.error('Критическая ошибка отключения:', error)
					showToast('Не удалось отключить устройство', 'error')
				} else {
					setConnectedDeviceId(null)
					setStatus('Отключено')
				}
			}
		},
		[bleManager, connectedDeviceId, showToast]
	)

	const cancelConnectionAndStartScan = useCallback(async () => {
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
		await new Promise(res => setTimeout(res, 300))
		await startScan(false)
	}, [bleManager, connectingId, connectedDeviceId, startScan])

	useEffect(() => {
		initBluetooth()
		return () => {
			bleManager.destroy()
		}
	}, [initBluetooth, bleManager])

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
