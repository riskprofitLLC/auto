import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

interface BottomToolbarProps {
	onTpmsPress: () => void
	// Можно добавить другие кнопки в будущем
}

const BottomToolbar: React.FC<BottomToolbarProps> = ({ onTpmsPress }) => {
	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.toolBtn} onPress={onTpmsPress}>
				<Text style={styles.icon}>🛞</Text>
				<Text style={styles.label}>Шины</Text>
			</TouchableOpacity>

			<TouchableOpacity style={styles.toolBtn} disabled>
				<Text style={styles.icon}>⚙️</Text>
				<Text style={styles.label}>Настр.</Text>
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		height: 70,
		backgroundColor: '#fff',
		flexDirection: 'row',
		borderTopWidth: 1,
		borderTopColor: '#eee',
		paddingHorizontal: 20,
		alignItems: 'center',
		justifyContent: 'space-around',
		shadowColor: '#000',
		shadowOpacity: 0.1,
		shadowRadius: 5,
		shadowOffset: { width: 0, height: -2 },
		elevation: 10
	},
	toolBtn: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 10,
		borderRadius: 12,
		backgroundColor: '#F5F5F5',
		width: 80,
		height: 60
	},
	icon: {
		fontSize: 24,
		marginBottom: 4
	},
	label: {
		fontSize: 12,
		fontWeight: '600',
		color: '#555'
	}
})

export default BottomToolbar
