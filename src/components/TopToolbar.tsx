import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

interface TopToolbarProps {
	onTpmsPress: () => void
}

const TopToolbar: React.FC<TopToolbarProps> = ({ onTpmsPress }) => {
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
		flexDirection: 'row',
		justifyContent: 'flex-end', // Кнопки справа
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: '#F8F9FA', // Тот же фон, что у основного экрана
		gap: 10
	},
	toolBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#fff',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 2,
		borderWidth: 1,
		borderColor: '#eee'
	},
	icon: {
		fontSize: 16,
		marginRight: 6
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#555'
	}
})

export default TopToolbar
