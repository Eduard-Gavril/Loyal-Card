import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

export default function WelcomeScreen() {
  const router = useRouter()
  const { hasOnboarded, savedCards, language, setHasOnboarded } = useClientStore()
  const t = getTranslation(language)
  const [hydrated, setHydrated] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const loadingScale = useRef(new Animated.Value(0.85)).current
  const loadingOpacity = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(loadingOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(loadingScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
    ]).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start()
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
          <Animated.View style={[s.splashRing, { transform: [{ scale: pulseAnim }] }]}>
            <Image source={require('../assets/logo.png')} style={s.splashLogo} resizeMode="contain" />
          </Animated.View>
          <Text style={s.splashAppName}>LoyalCard</Text>
        </Animated.View>
        <ActivityIndicator color="#7c3aed" size="small" style={s.splashSpinner} />
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
          <View style={s.logoRing}>
            <View style={s.logoInner}>
              <Ionicons name="card" size={52} color="#a78bfa" />
            </View>
          </View>
          <Text style={s.appName}>{t.appName}</Text>
          <Text style={s.tagline}>{t.welcome.tagline}</Text>
        </View>

        {/* Feature list */}
        <View style={s.features}>
          {FEATURES.map((f) => (
            <View key={f.text} style={s.featureRow}>
              <View style={s.featureIcon}>
                <Ionicons name={f.icon} size={20} color="#a78bfa" />
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
              <Ionicons name="card-outline" size={18} color="#a78bfa" />
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
  splash: { flex: 1, backgroundColor: '#0f0d2e', alignItems: 'center', justifyContent: 'center' },
  splashRing: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.35)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  splashLogo: { width: 90, height: 90 },
  splashAppName: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.3 },
  splashSpinner: { position: 'absolute', bottom: 80 },
  safe: { flex: 1, backgroundColor: '#0f0d2e' },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingVertical: 32 },
  hero: { alignItems: 'center', gap: 12, marginTop: 24 },
  logoRing: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(124,58,237,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -0.5 },
  tagline: { color: '#9ca3af', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  features: { gap: 14 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { color: '#e5e7eb', fontSize: 14, flex: 1, lineHeight: 20 },
  ctas: { gap: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7c3aed', borderRadius: 16,
    paddingVertical: 16,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)',
  },
  secondaryBtnText: { color: '#a78bfa', fontWeight: '600', fontSize: 15 },
})
