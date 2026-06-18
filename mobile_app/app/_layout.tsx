import 'react-native-url-polyfill/auto'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0d2e' },
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaProvider>
  )
}
