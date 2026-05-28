export type ControlType = 'relay' | 'steering' | 'seat_driver' | 'seat_passenger'
export type CommandAction = 'on' | 'off'

export interface CarCommand {
	type: ControlType
	action: CommandAction
	timestamp: number
}

export interface ControlButtonProps {
	title: string
	icon: string
	color: string
	onPress: () => void
	disabled?: boolean
	loading?: boolean
}
