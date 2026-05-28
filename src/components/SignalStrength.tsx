import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getBarsCount, getSignalColor } from '../utils/bleHelpers'

interface SignalStrengthProps {
	rssi: number
}

const SignalStrength: React.FC<SignalStrengthProps> = ({ rssi }) => {
	const barsCount = getBarsCount(rssi)
	const color = getSignalColor(rssi)

	return (
		<View style={styles.signalContainer}>
			{[1, 2, 3, 4].map(bar => (
				<View
					key={bar}
					style={[
						styles.signalBar,
						{
							backgroundColor: bar <= barsCount ? color : '#E0E0E0',
							height: 4 + bar * 3
						}
					]}
				/>
			))}
			<Text style={styles.rssiText}>{rssi} дБм</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	signalContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 2
	},
	signalBar: {
		width: 4,
		borderRadius: 1
	},
	rssiText: {
		fontSize: 10,
		color: '#666',
		marginLeft: 4,
		textAlign: 'center'
	}
})

export default SignalStrength
