import { BleErrorCode } from 'react-native-ble-plx'
import { colors } from '../constants/colors'

export const getBarsCount = (rssi: number): number => {
	if (rssi >= -50) return 4
	if (rssi >= -60) return 3
	if (rssi >= -70) return 2
	if (rssi >= -80) return 1
	return 0
}

export const getSignalColor = (rssi: number): string => {
	if (rssi >= -60) return colors.success
	if (rssi >= -75) return colors.warning
	return colors.danger
}

export const isBenignDisconnectError = (error: any): boolean => {
	return (
		error?.errorCode === BleErrorCode.DeviceDisconnected ||
		error?.errorCode === BleErrorCode.OperationCancelled ||
		error?.message?.toLowerCase().includes('disconnected') ||
		error?.message?.toLowerCase().includes('cancelled') ||
		error?.message?.toLowerCase().includes('not connected')
	)
}
