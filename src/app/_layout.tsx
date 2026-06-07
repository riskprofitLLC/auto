import React from 'react'
import { Stack } from 'expo-router'
import { FeedbackProvider } from '../components/FeedbackContext'
import { colors } from '../constants/colors'

export default function TabLayout() {
	return (
		<FeedbackProvider>
			<Stack
				screenOptions={{
					headerStyle: {
						backgroundColor: colors.background
					},
					headerTintColor: colors.textPrimary,
					headerTitleStyle: {
						fontWeight: 'bold'
					}
				}}
			>
				<Stack.Screen name='index' options={{ headerShown: false }} />
			</Stack>
		</FeedbackProvider>
	)
}
