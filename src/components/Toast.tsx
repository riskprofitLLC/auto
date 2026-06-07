import React, { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { colors } from '../constants/colors'
import { ToastType } from '../types/bluetooth'

interface ToastProps {
	message: string
	visible: boolean
	type?: ToastType
}

const Toast: React.FC<ToastProps> = ({ message, visible, type = 'info' }) => {
	const fadeAnim = useRef(new Animated.Value(0)).current
	const translateY = useRef(new Animated.Value(60)).current

	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
				Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true })
			]).start()
		} else {
			Animated.parallel([
				Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
				Animated.timing(translateY, { toValue: 60, duration: 300, useNativeDriver: true })
			]).start()
		}
	}, [visible])

	if (!message && !visible) return null

	const bgColor = type === 'error' ? colors.toastError : type === 'success' ? colors.toastSuccess : colors.toastInfo

	return (
		<Animated.View style={[styles.toast, { opacity: fadeAnim, transform: [{ translateY }], backgroundColor: bgColor }]}>
			<Text style={styles.toastText}>{message}</Text>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	toast: {
		position: 'absolute',
		bottom: 30,
		left: 16,
		right: 16,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 12,
		alignItems: 'center',
		elevation: 8,
		shadowColor: '#000',
		shadowOpacity: 0.25,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 4 },
		zIndex: 999
	},
	toastText: {
		color: colors.textPrimary,
		fontSize: 15,
		fontWeight: '500',
		textAlign: 'center'
	}
})

export default Toast
