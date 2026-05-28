export interface BleDevice {
	id: string;
	name: string;
	rssi: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
	visible: boolean;
	message: string;
	type: ToastType;
}