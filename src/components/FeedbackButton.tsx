import React from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { useFeedback } from './FeedbackContext'

interface FeedbackButtonProps extends TouchableOpacityProps {
	children: React.ReactNode
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onPress, children, ...props }) => {
	const { trigger } = useFeedback()

	const handlePress = (e: any) => {
		trigger()
		onPress?.(e)
	}

	return (
		<TouchableOpacity onPress={handlePress} {...props}>
			{children}
		</TouchableOpacity>
	)
}

export default FeedbackButton
