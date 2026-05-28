import React from 'react'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'

export default function TabLayout() {
	const colorScheme = useColorScheme()

	return (
		<Stack
			screenOptions={{
				headerStyle: {
					backgroundColor: colorScheme === 'dark' ? '#000' : '#fff'
				},
				headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
				headerTitleStyle: {
					fontWeight: 'bold'
				}
			}}
		>
			<Stack.Screen name='index' options={{ headerShown: false }} />
		</Stack>
	)
}
