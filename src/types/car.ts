// src/types/car.ts

export type ControlType =
	| 'relay'
	| 'steering'
	| 'seat_driver_heat'
	| 'seat_driver_vent'
	| 'seat_passenger_heat'
	| 'seat_passenger_vent'
	| 'trunk'
	| 'bsm';

export type CommandAction = 'on' | 'off';

export interface CarState {
	relay: boolean;
	trunk: boolean;
	steering: boolean;
	bsm: boolean;

	seat_driver_heat: boolean;
	seat_driver_vent: boolean;

	seat_passenger_heat: boolean;
	seat_passenger_vent: boolean;

	// Атмосферная подсветка
	ambientEnabled: boolean;
	ambientColor: string;
	ambientBrightness: number;
}

// ✅ Новый интерфейс для давления в шинах
export interface TirePressure {
	frontLeft: number;   // Левое переднее
	frontRight: number;  // Правое переднее
	rearLeft: number;    // Левое заднее
	rearRight: number;   // Правое заднее
}

export interface CarCommand {
	type: ControlType;
	action: CommandAction;
	timestamp: number;
}