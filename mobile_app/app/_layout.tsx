import 'react-native-url-polyfill/auto'
import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useClientStore } from '@/store'
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

SplashScreen.preventAutoHideAsync()

// Hook-friendly error screen so it follows the active theme; the class
// boundary below only catches and delegates rendering here.
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const colors = useTheme()
  const eb = themedEb(colors)
  return (
    <View style={eb.wrap}>
      <View style={eb.iconWrap}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.primary} />
      </View>
      <Text style={eb.title}>Qualcosa è andato storto</Text>
      <Text style={eb.desc}>Si è verificato un errore imprevisto. Riprova.</Text>
      <TouchableOpacity style={eb.btn} onPress={onRetry}>
        <Ionicons name="refresh-outline" size={18} color="#fff" />
        <Text style={eb.btnText}>Riprova</Text>
      </TouchableOpacity>
    </View>
  )
}

// Catches render-time JS errors: in release builds an uncaught error kills the
// whole app; this shows a recoverable screen instead.
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
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
  const colors = useTheme()
  const darkMode = useClientStore((st) => st.darkMode)

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <ErrorBoundary>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        />
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}

const themedEb = createThemedStyles((colors) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  desc: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: 24, paddingVertical: 13, marginTop: 8,
    ...shadows.primaryBtn,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
}))
