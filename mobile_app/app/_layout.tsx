import 'react-native-url-polyfill/auto'
import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows } from '@/theme'

SplashScreen.preventAutoHideAsync()

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
      return (
        <View style={eb.wrap}>
          <View style={eb.iconWrap}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.primary} />
          </View>
          <Text style={eb.title}>Qualcosa è andato storto</Text>
          <Text style={eb.desc}>Si è verificato un errore imprevisto. Riprova.</Text>
          <TouchableOpacity style={eb.btn} onPress={() => this.setState({ error: null })}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={eb.btnText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
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

const eb = StyleSheet.create({
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
})
