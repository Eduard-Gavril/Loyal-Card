import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Animated, Easing, AppState, AccessibilityInfo } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import { api, supabase, RewardRule } from '@/lib/supabase'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'
import TiltCard from '@/components/TiltCard'
import { getExpoPushToken } from '@/lib/push'

type LoyaltyState = Record<string, { count?: number; rewards?: number } | undefined>

interface LoyaltyProgressItem {
  id: string
  name: string | null
  buyCount: number
  count: number
  rewards: number
}

// Strips "gratuit/gratuito/gratis/free" variants from the reward name so it
// reads naturally inside the "Collect N stamps and get X on us" sentence.
function cleanRuleName(name: string): string {
  return name
    .replace(/\b(gratuit[ăa]?|gratuito|gratis|free|gratu[iī]t)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

interface StampAnim { delay: number }

// One stamp slot. When `anim` is set the stamp "hits" the card: it starts big
// and rotated, springs down to size and sends out an expanding ring.
function StampDot({ index, filled, anim }: { index: number; filled: boolean; anim: StampAnim | null }) {
  const colors = useTheme()
  const s = themedStyles(colors)
  const scale = useRef(new Animated.Value(1)).current
  const tilt = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current
  const ring = useRef(new Animated.Value(0)).current
  const animating = !!anim

  useLayoutEffect(() => {
    if (!anim) return
    scale.setValue(2.4)
    tilt.setValue(1)
    opacity.setValue(0)
    ring.setValue(0)
    Animated.sequence([
      Animated.delay(anim.delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        Animated.timing(tilt, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start()
  }, [animating])

  return (
    <View style={s.stampSlot}>
      {animating && (
        <Animated.View
          pointerEvents="none"
          style={[
            s.stampRing,
            {
              opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
              transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.1] }) }],
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          s.stampDot,
          filled ? s.stampDotFilled : s.stampDotEmpty,
          {
            opacity,
            transform: [
              { scale },
              { rotate: tilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-25deg'] }) },
            ],
          },
        ]}
      >
        {filled ? (
          <Ionicons name="checkmark" size={18} color="#fff" />
        ) : (
          <Text style={s.stampNumber}>{index + 1}</Text>
        )}
      </Animated.View>
    </View>
  )
}

// Brand-new reward card: slides up with a small bounce the first time it appears
function RevealView({ reveal, children }: { reveal: boolean; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(reveal ? 0 : 1)).current
  useEffect(() => {
    if (reveal) Animated.spring(v, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }).start()
  }, [])
  return (
    <Animated.View
      style={{
        opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  )
}

function RuleTagline({ rule, t }: { rule: RewardRule; t: ReturnType<typeof getTranslation> }) {
  const colors = useTheme()
  const s = themedStyles(colors)
  const stampsWord = t.card.discoverStamps

  if (rule.discount_percent) {
    const text = t.card.discoverDiscount
      .replace('{{n}}', String(rule.buy_count))
      .replace('{{stamps}}', stampsWord)
      .replace('{{pct}}', String(rule.discount_percent))
    return <Text style={s.offerTagline}>{text}</Text>
  }

  const tpl = t.card.discoverFreeProduct
    .replace('{{n}}', String(rule.buy_count))
    .replace('{{stamps}}', stampsWord)
  const [before, after] = tpl.split('{{name}}')
  return (
    <Text style={s.offerTagline}>
      {before}
      <Text style={s.offerTaglineStrong}>{cleanRuleName(rule.name)}</Text>
      {after ?? ''}
    </Text>
  )
}

export default function CardScreen() {
  const router = useRouter()
  const { tenantId, tenantName } = useLocalSearchParams<{ tenantId: string; tenantName: string }>()
  const { language, savedCards, clientId: storedClientId, setClientData, recordLoyaltyProgress } = useClientStore()
  const t = getTranslation(language)
  const colors = useTheme()
  const s = themedStyles(colors)

  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [rules, setRules] = useState<RewardRule[]>([])
  const [loyaltyState, setLoyaltyState] = useState<LoyaltyState>({})
  const [showOffers, setShowOffers] = useState(false)
  const [anim, setAnim] = useState<{ newRules: string[]; stamps: Record<string, [number, number]> }>({
    newRules: [],
    stamps: {},
  })
  const loyaltyRef = useRef<LoyaltyState | null>(null)
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reduceMotion = useRef(false)
  const qrScale = useRef(new Animated.Value(0.6)).current
  const qrOpacity = useRef(new Animated.Value(0)).current

  const existingCard = savedCards.find((c) => c.tenantId === tenantId)

  useEffect(() => {
    if (existingCard) {
      setQrCode(existingCard.qrCode)
    } else {
      generateCard()
    }
  }, [])

  useEffect(() => {
    if (!tenantId) return
    api.getRewardRules(tenantId).then(setRules).catch(() => {})
  }, [tenantId])

  // Register for push once we know who this device belongs to — covers the
  // "reward earned" / "milestone reached" notifications register-scan sends.
  // Silently does nothing if the user declines the permission prompt.
  useEffect(() => {
    if (!storedClientId) return
    getExpoPushToken().then((token) => {
      if (token) api.registerPushToken(storedClientId, token).catch(() => {})
    })
  }, [storedClientId])

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion.current = v }).catch(() => {})
    return () => { if (animTimer.current) clearTimeout(animTimer.current) }
  }, [])

  // Applies a fresh loyalty_state. With `animate` it diffs against the previous
  // snapshot: a rule going from empty to stamped is a "new card", a rule whose
  // count grew animates only the stamps just added. The first load never animates.
  function applyLoyalty(next: LoyaltyState, animate: boolean) {
    if (!qrCode) return
    const prev = loyaltyRef.current
    loyaltyRef.current = next
    setLoyaltyState(next)
    recordLoyaltyProgress({ [qrCode]: next })
    if (!animate || !prev || reduceMotion.current) return

    const newRules: string[] = []
    const stamps: Record<string, [number, number]> = {}
    for (const ruleId of Object.keys(next)) {
      const before = prev[ruleId]?.count ?? 0
      const beforeRewards = prev[ruleId]?.rewards ?? 0
      const after = next[ruleId]?.count ?? 0
      if (after > before) {
        stamps[ruleId] = [before, after]
        if (before === 0 && beforeRewards === 0) newRules.push(ruleId)
      }
    }
    if (Object.keys(stamps).length === 0) return

    setAnim({ newRules, stamps })
    if (animTimer.current) clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => setAnim({ newRules: [], stamps: {} }), 4500)
  }

  async function fetchLoyalty(animate: boolean) {
    if (!qrCode) return
    const { data, error } = await supabase
      .from('cards')
      .select('loyalty_state')
      .eq('qr_code', qrCode)
      .maybeSingle()
    // A failed read (offline, timeout) must never blank out the stamps on screen
    // or overwrite the progress saved on the device.
    if (error) return
    if (!data && animate) return
    applyLoyalty((data?.loyalty_state as LoyaltyState) ?? {}, animate)
  }

  useEffect(() => {
    if (!qrCode) return
    loyaltyRef.current = null
    fetchLoyalty(false).catch(() => {})

    // Live updates: the store's scan updates this card row, Realtime pushes it here.
    // Failures are non-fatal, the screen then behaves as before.
    const channel = supabase
      .channel(`card-${qrCode}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cards', filter: `qr_code=eq.${qrCode}` },
        (payload) => {
          const next = (payload.new as { loyalty_state?: LoyaltyState }).loyalty_state
          if (next) applyLoyalty(next, true)
        }
      )
      .subscribe((status) => {
        // Events fired while the socket was down (or not yet open) are not replayed
        if (status === 'SUBSCRIBED') fetchLoyalty(true).catch(() => {})
      })

    // The OS suspends the socket in background: re-read the card on return.
    const appStateSub = AppState.addEventListener('change', (st) => {
      if (st === 'active') fetchLoyalty(true).catch(() => {})
    })

    return () => {
      appStateSub.remove()
      supabase.removeChannel(channel)
    }
  }, [qrCode])

  // Per-rule progress, ordered by rule priority (rules arrive sorted); entries
  // whose rule was deleted/deactivated are still shown so stamps never vanish
  const loyaltyItems: LoyaltyProgressItem[] = [
    ...rules
      .filter((r) => (loyaltyState[r.id]?.count ?? 0) > 0 || (loyaltyState[r.id]?.rewards ?? 0) > 0)
      .map((r) => ({
        id: r.id,
        name: r.name,
        buyCount: r.buy_count,
        count: loyaltyState[r.id]?.count ?? 0,
        rewards: loyaltyState[r.id]?.rewards ?? 0,
      })),
    ...Object.entries(loyaltyState)
      .filter(([ruleId, st]) =>
        !rules.some((r) => r.id === ruleId) && ((st?.count ?? 0) > 0 || (st?.rewards ?? 0) > 0))
      .map(([ruleId, st]) => ({
        id: ruleId,
        name: null,
        buyCount: 6,
        count: st?.count ?? 0,
        rewards: st?.rewards ?? 0,
      })),
  ]

  useEffect(() => {
    if (qrCode) {
      Animated.parallel([
        Animated.spring(qrScale, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
        Animated.timing(qrOpacity, { toValue: 1, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start()
    }
  }, [qrCode])

  async function generateCard() {
    if (!tenantId) return
    setLoading(true)
    setError('')
    try {
      const data = await api.generateClientId(tenantId, storedClientId ?? undefined)
      setQrCode(data.qr_code)
      setClientData({
        clientId: data.client_id,
        cardId: data.card_id,
        qrCode: data.qr_code,
        tenantId,
        tenantName: tenantName ?? undefined,
      })
    } catch (e: any) {
      setError(e?.message ?? t.card.errorDefault)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{tenantName ?? 'LoyalCard'}</Text>
        <View style={{ width: 80 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>{t.card.generating}</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <View style={s.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
          </View>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={generateCard}>
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={s.retryText}>{t.card.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : qrCode ? (
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {/* Night loyalty card — tilts in 3D with the phone's motion */}
          <TiltCard style={s.cardBox} opacity={qrOpacity} scale={qrScale}>
            <View style={s.cardBlob1} pointerEvents="none" />
            <View style={s.cardBlob2} pointerEvents="none" />

            <View style={s.cardHeader}>
              <Text style={s.cardBrand}>LOYALCARD</Text>
              <Text style={s.cardLabel} numberOfLines={1}>{tenantName ?? ''}</Text>
            </View>

            <View style={s.qrWrap}>
              <QRCode
                value={qrCode}
                size={196}
                backgroundColor="#FFFFFF"
                color={colors.night}
              />
            </View>

            <Text style={s.cardId} selectable>{qrCode}</Text>
          </TiltCard>

          {/* Instructions */}
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={s.infoText}>{t.card.instructions}</Text>
          </View>

          {/* Per-reward progress */}
          {loyaltyItems.length > 0 && (
            <View style={s.progressSection}>
              <Text style={s.progressSectionTitle}>{t.card.progressTitle}</Text>
              {loyaltyItems.map((item) => {
                const capped = Math.min(item.count, item.buyCount)
                const pct = item.buyCount > 0 ? capped / item.buyCount : 0
                const ready = item.rewards > 0
                const range = anim.stamps[item.id]
                const isNewCard = anim.newRules.includes(item.id)
                return (
                  <RevealView key={item.id} reveal={isNewCard}>
                  <View style={s.progressCard}>
                    <View style={s.progressHeader}>
                      <Text style={s.progressName} numberOfLines={1}>
                        {item.name ?? tenantName ?? 'LoyalCard'}
                      </Text>
                      <Text style={s.progressCountText}>
                        {`${capped} / ${item.buyCount} ${t.card.discoverStamps}`}
                      </Text>
                    </View>
                    <View style={s.progressTrack}>
                      <View
                        style={[
                          s.progressFill,
                          { width: `${pct * 100}%` },
                          ready && s.progressFillDone,
                        ]}
                      />
                    </View>
                    <View style={s.stampsRow}>
                      {Array.from({ length: item.buyCount }, (_, i) => {
                        const isNew = !!range && i >= range[0] && i < range[1] && i < capped
                        return (
                          <StampDot
                            key={i}
                            index={i}
                            filled={i < capped}
                            anim={isNew ? { delay: (isNewCard ? 500 : 0) + (i - range[0]) * 220 } : null}
                          />
                        )
                      })}
                    </View>
                    {ready && (
                      <View style={s.rewardBanner}>
                        <Ionicons name="gift" size={16} color={colors.success} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.rewardBannerTitle}>
                            {`${item.rewards} ${item.rewards === 1 ? t.card.rewardReady : t.card.rewardsReady}`}
                          </Text>
                          <Text style={s.rewardBannerSub}>{t.card.showAtCheckout}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  </RevealView>
                )
              })}
            </View>
          )}

          {/* Offers accordion */}
          {rules.length > 0 && (
            <View style={s.offersSection}>
              <TouchableOpacity
                style={s.offersToggle}
                onPress={() => setShowOffers((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={s.offersToggleIconWrap}>
                  <Ionicons name="pricetags-outline" size={18} color={colors.primary} />
                </View>
                <Text style={s.offersToggleTitle}>{t.card.discoverBtn}</Text>
                <View style={s.offersCountBadge}>
                  <Text style={s.offersCountText}>{rules.length}</Text>
                </View>
                <Ionicons
                  name={showOffers ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.inkFaint}
                />
              </TouchableOpacity>

              {showOffers && (
                <View style={s.offersList}>
                  <Text style={s.offersListLabel}>{t.card.discoverTitle}</Text>
                  {rules.map((rule, idx) => (
                    <View
                      key={rule.id}
                      style={[s.offerRow, idx < rules.length - 1 && s.offerRowBorder]}
                    >
                      <View style={s.offerBadge}>
                        <Text style={s.offerBadgeText}>{rule.buy_count}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <RuleTagline rule={rule} t={t} />
                        {rule.description ? (
                          <Text style={s.offerDesc}>{rule.description}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity style={s.dashBtn} onPress={() => router.push('/(tabs)/dashboard')}>
            <Ionicons name="wallet-outline" size={18} color="#fff" />
            <Text style={s.dashBtnText}>{t.myDashboard}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.backToListBtn} onPress={() => router.push('/(tabs)/')}>
            <Ionicons name="compass-outline" size={18} color={colors.primary} />
            <Text style={s.backToListText}>{t.discoverPartners}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  )
}

const themedStyles = createThemedStyles((colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 80 },
  backText: { color: colors.ink, fontSize: 15, fontWeight: '500' },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 14 },
  loadingText: { color: colors.inkSoft, marginTop: 4, fontSize: 14 },

  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1, borderColor: colors.dangerBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  errorText: { color: colors.inkMid, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22, paddingVertical: 11, borderRadius: radius.md,
    ...shadows.primaryBtn,
  },
  retryText: { color: '#fff', fontWeight: '700' },

  body: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 20, gap: 16,
  },

  // Night card
  cardBox: {
    backgroundColor: colors.night,
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    gap: 18,
    width: '100%',
    overflow: 'hidden',
    ...shadows.night,
  },
  cardBlob1: { position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(124,58,237,0.35)' },
  cardBlob2: { position: 'absolute', bottom: -100, left: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(124,58,237,0.15)' },
  cardHeader: { alignItems: 'center', gap: 4 },
  cardBrand: { color: colors.onNightSoft, fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  cardLabel: { color: colors.onNight, fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  qrWrap: {
    padding: 16, backgroundColor: '#FFFFFF', borderRadius: radius.lg,
  },
  cardId: {
    color: colors.onNightSoft, fontSize: 13, fontFamily: 'monospace',
    letterSpacing: 1, textAlign: 'center',
  },

  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md, padding: 12,
    borderWidth: 1, borderColor: colors.primaryBorder,
    width: '100%',
  },
  infoText: { color: colors.inkMid, fontSize: 13, flex: 1, lineHeight: 18 },

  // Per-reward progress
  progressSection: { width: '100%', gap: 10 },
  progressSectionTitle: {
    color: colors.ink, fontSize: 16, fontWeight: '800', letterSpacing: -0.2, marginBottom: 2,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 10,
    ...shadows.card,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  progressName: { flex: 1, color: colors.ink, fontWeight: '700', fontSize: 14 },
  progressCountText: { color: colors.inkSoft, fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: colors.bgDeep, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressFillDone: { backgroundColor: colors.success },
  stampsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stampSlot: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stampRing: {
    position: 'absolute', width: 34, height: 34, borderRadius: 17,
    borderWidth: 2, borderColor: colors.primary,
  },
  stampDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  stampDotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  stampDotEmpty: { backgroundColor: colors.bgDeep, borderColor: colors.border },
  stampNumber: { color: colors.inkFaint, fontSize: 11, fontWeight: '700' },
  rewardBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.successSoft,
    borderWidth: 1, borderColor: colors.successBorder,
    borderRadius: radius.md, padding: 10,
  },
  rewardBannerTitle: { color: colors.success, fontWeight: '800', fontSize: 13 },
  rewardBannerSub: { color: colors.inkMid, fontSize: 11.5, marginTop: 2, lineHeight: 15 },

  // Offers accordion
  offersSection: { width: '100%' },
  offersToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 13,
    ...shadows.card,
  },
  offersToggleIconWrap: {
    width: 34, height: 34, borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  offersToggleTitle: { flex: 1, color: colors.ink, fontWeight: '700', fontSize: 13.5, lineHeight: 18 },
  offersCountBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  offersCountText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  offersList: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14,
    ...shadows.card,
  },
  offersListLabel: {
    color: colors.inkSoft, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  offerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  offerRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  offerBadge: {
    width: 30, height: 30, borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  offerBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  offerTagline: { color: colors.inkMid, fontSize: 13.5, lineHeight: 19 },
  offerTaglineStrong: { color: colors.ink, fontWeight: '700' },
  offerDesc: { color: colors.inkFaint, fontSize: 12, marginTop: 3 },

  dashBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.lg,
    width: '100%', justifyContent: 'center',
    ...shadows.primaryBtn,
  },
  dashBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  backToListBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 4 },
  backToListText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
}))
