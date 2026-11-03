import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing, AppState, AccessibilityInfo, ScrollView } from 'react-native'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import QRCode from 'react-native-qrcode-svg'
import { api, supabase, RewardRule } from '@/lib/supabase'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { colors, continuous, ty } from '@/theme'
import TiltCard from '@/components/TiltCard'
import AmbientBackground from '@/components/AmbientBackground'
import { getExpoPushToken } from '@/lib/push'
import { ListGroup, ListRow } from '@/ui/List'
import Button from '@/ui/Button'
import Txt from '@/ui/Txt'

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
          <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
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

  const header = <Stack.Screen options={{ title: tenantName ?? 'LoyalCard' }} />

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AmbientBackground />
        {header}
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Txt v="subhead" tone="secondary">
            {t.card.generating}
          </Txt>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AmbientBackground />
        {header}
        <View style={s.center}>
          <View style={s.errorIcon}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
          </View>
          <Txt v="body" style={{ textAlign: 'center' }}>
            {error}
          </Txt>
          <Button title={t.card.retry} icon="refresh-outline" onPress={generateCard} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        </View>
      </View>
    )
  }

  if (!qrCode) return header

  return (
    <>
      {header}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {/* The card: tilts in 3D with the phone. QR on a white panel so every scanner reads it. */}
        <TiltCard style={s.cardBox} opacity={qrOpacity} scale={qrScale}>
          <LinearGradient colors={['#C97A1E', '#8A4A12', '#5A300C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cardGradient}>
            <View style={s.cardHeader}>
              <Txt v="caption1" style={s.cardBrand}>
                LOYALCARD
              </Txt>
              <Txt v="headline" style={s.cardName} numberOfLines={1}>
                {tenantName ?? ''}
              </Txt>
            </View>
            <View style={s.qrWrap} accessible accessibilityLabel={t.card.instructions}>
              <QRCode value={qrCode} size={196} backgroundColor="#FFFFFF" color="#1A1000" />
            </View>
            <Txt v="caption2" style={s.cardId} selectable>
              {qrCode}
            </Txt>
          </LinearGradient>
        </TiltCard>

        <View style={s.hint}>
          <Ionicons name="information-circle-outline" size={18} color={colors.labelSecondary} />
          <Txt v="footnote" tone="secondary" style={{ flex: 1 }}>
            {t.card.instructions}
          </Txt>
        </View>

        {/* Per-reward progress */}
        {loyaltyItems.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <Txt v="footnote" tone="secondary" style={s.section}>
              {t.card.progressTitle.toUpperCase()}
            </Txt>
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
                      <Txt v="headline" numberOfLines={1} style={{ flex: 1 }}>
                        {item.name ?? tenantName ?? 'LoyalCard'}
                      </Txt>
                      <Txt v="subhead" tone="secondary">
                        {`${capped} / ${item.buyCount} ${t.card.discoverStamps}`}
                      </Txt>
                    </View>
                    <View style={s.track}>
                      <View style={[s.fill, { width: `${pct * 100}%` }, ready && { backgroundColor: colors.success }]} />
                    </View>
                    <View style={s.stampsRow}>
                      {Array.from({ length: item.buyCount }, (_, i) => {
                        const isNew = !!range && i >= range[0] && i < range[1] && i < capped
                        return <StampDot key={i} index={i} filled={i < capped} anim={isNew ? { delay: (isNewCard ? 500 : 0) + (i - range[0]) * 220 } : null} />
                      })}
                    </View>
                    {ready && (
                      <View style={s.rewardBanner}>
                        <Ionicons name="gift" size={18} color={colors.success} />
                        <View style={{ flex: 1 }}>
                          <Txt v="subhead" tone="success" style={{ fontWeight: '600' }}>
                            {`${item.rewards} ${item.rewards === 1 ? t.card.rewardReady : t.card.rewardsReady}`}
                          </Txt>
                          <Txt v="footnote" tone="secondary">
                            {t.card.showAtCheckout}
                          </Txt>
                        </View>
                      </View>
                    )}
                  </View>
                </RevealView>
              )
            })}
          </View>
        )}

        {/* What you can earn: a disclosure row that expands the list */}
        {rules.length > 0 && (
          <ListGroup>
            <ListRow
              icon="pricetags-outline"
              title={t.card.discoverBtn}
              value={String(rules.length)}
              onPress={() => setShowOffers((v) => !v)}
              right={<Ionicons name={showOffers ? 'chevron-up' : 'chevron-down'} size={16} color={colors.labelTertiary} />}
              chevron={false}
            />
            {showOffers
              ? rules.map((rule) => (
                  <View key={rule.id} style={s.offerRow}>
                    <View style={s.offerBadge}>
                      <Txt v="subhead" tone="tint" style={{ fontWeight: '700' }}>
                        {rule.buy_count}
                      </Txt>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <RuleTagline rule={rule} t={t} />
                      {rule.description ? (
                        <Txt v="footnote" tone="secondary">
                          {rule.description}
                        </Txt>
                      ) : null}
                    </View>
                  </View>
                ))
              : null}
          </ListGroup>
        )}

        <View style={{ gap: 10, marginTop: 4 }}>
          <Button title={t.myDashboard} icon="wallet-outline" onPress={() => router.push('/(tabs)/dashboard')} />
          <Button variant="tinted" title={t.discoverPartners} icon="compass-outline" onPress={() => router.push('/(tabs)/partners')} />
        </View>
      </ScrollView>
      <AmbientBackground style={{ zIndex: -1 }} />
    </>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  errorIcon: { width: 68, height: 68, borderRadius: 22, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', ...continuous },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  cardBox: { marginBottom: 14 },
  cardGradient: { borderRadius: 28, padding: 22, gap: 18, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,226,186,0.35)', overflow: 'hidden', ...continuous },
  cardHeader: { alignSelf: 'stretch', gap: 2 },
  cardBrand: { color: 'rgba(255,255,255,0.78)', letterSpacing: 3, fontWeight: '700' },
  cardName: { color: '#FFFFFF' },
  qrWrap: { padding: 14, backgroundColor: '#FFFFFF', borderRadius: 20, ...continuous },
  cardId: { color: 'rgba(255,255,255,0.62)', letterSpacing: 0.5 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, marginBottom: 24 },

  section: { marginLeft: 16, marginBottom: 6 },
  progressCard: { backgroundColor: colors.grouped, borderRadius: 22, padding: 16, gap: 12, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...continuous },
  progressHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.fill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  stampsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rewardBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: colors.successSoft, ...continuous },

  stampSlot: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stampRing: { position: 'absolute', width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.primary },
  stampDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stampDotFilled: { backgroundColor: colors.primary },
  stampDotEmpty: { borderWidth: 1.5, borderColor: colors.borderStrong },
  stampNumber: { ...ty.footnote, color: colors.labelTertiary, fontWeight: '600' },

  offerRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  offerBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', ...continuous },
  offerTagline: { ...ty.subhead, color: colors.label },
  offerTaglineStrong: { fontWeight: '700', color: colors.primary },
})
