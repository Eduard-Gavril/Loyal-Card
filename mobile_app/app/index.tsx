import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { colors, radius, shadows } from '@/theme'

export default function WelcomeScreen() {
  const router = useRouter()
  const { hasOnboarded, savedCards, language, setHasOnboarded } = useClientStore()
  const t = getTranslation(language)
  const [hydrated, setHydrated] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const loadingScale = useRef(new Animated.Value(0.85)).current
  const loadingOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(loadingOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(loadingScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start()
    const timer = setTimeout(() => setHydrated(true), 200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (hasOnboarded || savedCards.length > 0) {
      router.replace('/(tabs)/home')
      return
    }
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
  }, [hydrated])

  function handleStart() {
    setHasOnboarded()
    router.replace('/(tabs)/')
  }

  function handleMyCards() {
    setHasOnboarded()
    router.replace('/(tabs)/dashboard')
  }

  if (!hydrated) {
    return (
      <View style={s.splash}>
        <Animated.View style={{ opacity: loadingOpacity, transform: [{ scale: loadingScale }], alignItems: 'center' }}>
          <Image source={require('../assets/logo.png')} style={s.splashLogo} resizeMode="contain" />
          <Text style={s.splashAppName}>LoyalCard</Text>
        </Animated.View>
        <ActivityIndicator color={colors.primary} size="small" style={s.splashSpinner} />
      </View>
    )
  }

  const FEATURES: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: 'phone-portrait-outline', text: t.welcome.feature1 },
    { icon: 'qr-code-outline', text: t.welcome.feature2 },
    { icon: 'gift-outline', text: t.welcome.feature3 },
  ]

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View style={[s.content, { opacity: fadeAnim }]}>
        {/* Hero */}
        <View style={s.hero}>
          <Image source={require('../assets/logo.png')} style={s.heroLogo} resizeMode="contain" />
          <Text style={s.appName}>{t.appName}</Text>
          <Text style={s.tagline}>{t.welcome.tagline}</Text>
        </View>

        {/* Feature list */}
        <View style={s.features}>
          {FEATURES.map((f) => (
            <View key={f.text} style={s.featureRow}>
              <View style={s.featureIcon}>
                <Ionicons name={f.icon} size={20} color={colors.primary} />
              </View>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.ctas}>
          <TouchableOpacity style={s.primaryBtn} onPress={handleStart} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>{t.welcome.discoverBtn}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          {savedCards.length > 0 && (
            <TouchableOpacity style={s.secondaryBtn} onPress={handleMyCards} activeOpacity={0.85}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
              <Text style={s.secondaryBtnText}>
                {t.welcome.myCardsBtn} ({savedCards.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { width: 132, height: 132, marginBottom: 8 },
  splashAppName: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  splashSpinner: { position: 'absolute', bottom: 80 },

  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingVertical: 32 },

  hero: { alignItems: 'center', gap: 10, marginTop: 24 },
  heroLogo: { width: 120, height: 120 },
  appName: { color: colors.ink, fontSize: 36, fontWeight: '900', letterSpacing: -0.8 },
  tagline: { color: colors.inkSoft, fontSize: 16, textAlign: 'center', lineHeight: 24 },

  features: { gap: 12 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.card,
  },
  featureIcon: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { color: colors.inkMid, fontSize: 14, flex: 1, lineHeight: 20, fontWeight: '500' },

  ctas: { gap: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 16,
    ...shadows.primaryBtn,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  secondaryBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
})
