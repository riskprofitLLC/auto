import { BleManager } from 'react-native-ble-plx';

let manager: BleManager | null = null;

export const getBleManager = (): BleManager => {
	if (!manager) {
		console.log('🔵 Инициализация BleManager...');
		manager = new BleManager();
	}
	return manager;
};

export const destroyBleManager = () => {
	if (manager) {
		manager.destroy();
		manager = null;
	}
};