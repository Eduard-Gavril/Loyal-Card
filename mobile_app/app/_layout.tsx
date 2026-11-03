import 'react-native-url-polyfill/auto'
import React, { useEffect } from 'react'
import { View, StyleSheet, Appearance } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { colors } from '@/theme'
import Button from '@/ui/Button'
import Txt from '@/ui/Txt'
import { Ionicons } from '@expo/vector-icons'
import { navBase, inlineTitle } from '@/ui/nav'

SplashScreen.preventAutoHideAsync()

// The app is dark only: force the native chrome (bars, keyboard, system backgrounds) to dark even when the phone is in light mode.
Appearance.setColorScheme('dark')

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={s.error}>
      <View style={s.errorIcon}>
        <Ionicons name="alert-circle-outline" size={34} color={colors.primary} />
      </View>
      <Txt v="title3" style={{ textAlign: 'center' }}>
        Qualcosa è andato storto
      </Txt>
      <Txt v="subhead" tone="secondary" style={{ textAlign: 'center' }}>
        Si è verificato un errore imprevisto. Riprova.
      </Txt>
      <Button title="Riprova" icon="refresh-outline" onPress={onRetry} style={{ marginTop: 12, alignSelf: 'stretch' }} />
    </View>
  )
}

// Catches render-time JS errors: in release builds an uncaught error kills the
// whole app; this shows a recoverable screen instead.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <ErrorScreen onRetry={() => this.setState({ error: null })} />
    }
    return this.props.children
  }
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <GestureHandlerRootView style={s.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ErrorBoundary>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'default',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="admin" />
            <Stack.Screen
              name="card"
              options={{ ...(navBase as object), ...(inlineTitle as object), headerShown: true, title: '' }}
            />
          </Stack>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  errorIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
})
