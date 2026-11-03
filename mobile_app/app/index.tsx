import { useEffect, useState } from 'react'
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, FadeIn, useReducedMotion } from 'react-native-reanimated'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { colors, continuous } from '@/theme'
import { ScreenFixed } from '@/ui/Screen'
import { EASE_OUT } from '@/ui/motion'
import Button from '@/ui/Button'
import Txt from '@/ui/Txt'

export default function WelcomeScreen() {
  const router = useRouter()
  const { hasOnboarded, savedCards, language, setHasOnboarded } = useClientStore()
  const t = getTranslation(language)
  const reduced = useReducedMotion()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (hasOnboarded || savedCards.length > 0) router.replace('/(tabs)/home')
  }, [hydrated])

  function handleStart() {
    setHasOnboarded()
    router.replace('/(tabs)/partners')
  }

  function handleMyCards() {
    setHasOnboarded()
    router.replace('/(tabs)/dashboard')
  }

  if (!hydrated || hasOnboarded || savedCards.length > 0) {
    return (
      <View style={s.loading}>
        <Image source={require('../assets/logo.png')} style={s.loadingLogo} resizeMode="contain" />
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  // Onboarding is the one place that earns an entrance: occasional, 300ms, ease-out, staggered by 60ms.
  const enter = (i: number) => (reduced ? FadeIn : FadeInDown.delay(i * 60).duration(300).easing(EASE_OUT))

  const FEATURES: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: 'phone-portrait-outline', text: t.welcome.feature1 },
    { icon: 'qr-code-outline', text: t.welcome.feature2 },
    { icon: 'gift-outline', text: t.welcome.feature3 },
  ]

  return (
    <ScreenFixed style={s.page}>
      <Animated.View entering={enter(0)} style={s.hero}>
        <Image source={require('../assets/logo.png')} style={s.logo} resizeMode="contain" />
        <Txt v="largeTitle" style={s.center} accessibilityRole="header">
          {t.appName}
        </Txt>
        <Txt v="body" tone="secondary" style={s.center}>
          {t.welcome.tagline}
        </Txt>
      </Animated.View>

      <View style={s.features}>
        {FEATURES.map((f, i) => (
          <Animated.View key={f.text} entering={enter(i + 1)} style={s.featureRow}>
            <View style={s.featureIcon}>
              <Ionicons name={f.icon} size={24} color={colors.primary} />
            </View>
            <Txt v="callout" style={s.featureText}>
              {f.text}
            </Txt>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={enter(4)} style={s.actions}>
        <Button title={t.welcome.discoverBtn} onPress={handleStart} />
        {savedCards.length > 0 && (
          <Button
            variant="tinted"
            icon="card-outline"
            title={`${t.welcome.myCardsBtn} (${savedCards.length})`}
            onPress={handleMyCards}
          />
        )}
      </Animated.View>
    </ScreenFixed>
  )
}

const s = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  loadingLogo: { width: 96, height: 96 },
  page: { justifyContent: 'space-between', paddingVertical: 24 },
  hero: { alignItems: 'center', gap: 8, marginTop: 40 },
  logo: { width: 104, height: 104, marginBottom: 8 },
  center: { textAlign: 'center' },
  features: { gap: 20, paddingHorizontal: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', ...continuous },
  featureText: { flex: 1 },
  actions: { gap: 10 },
})
