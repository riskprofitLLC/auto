// src/utils/settingsStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

const SETTINGS_KEY = '@app_settings';

export const loadSettings = async (): Promise<AppSettings> => {
	try {
		const stored = await AsyncStorage.getItem(SETTINGS_KEY);
		if (stored) {
			return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
		}
	} catch (error) {
		console.error('Failed to load settings:', error);
	}
	return DEFAULT_SETTINGS;
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
	try {
		await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	} catch (error) {
		console.error('Failed to save settings:', error);
		throw error;
	}
};
