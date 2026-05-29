export type ControlType = 'relay' | 'steering' | 'seat_driver_heat' | 'seat_driver_vent' | 'seat_passenger_heat' | 'seat_passenger_vent'

export type CommandAction = 'on' | 'off'

export interface CarState {
	relay: boolean
	steering: boolean

	// Водитель
	seat_driver_heat: boolean // Подогрев
	seat_driver_vent: boolean // Вентиляция

	// Пассажир
	seat_passenger_heat: boolean // Подогрев
	seat_passenger_vent: boolean // Вентиляция
}

export interface CarCommand {
	type: ControlType
	action: CommandAction
	timestamp: number
}
