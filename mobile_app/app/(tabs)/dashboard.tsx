import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Alert, RefreshControl, Image, Animated, Easing,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { colors, radius, shadows } from '@/theme'

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  all: 'grid-outline',
  cafe: 'cafe-outline',
  food: 'restaurant-outline',
  beauty: 'sparkles-outline',
  gym: 'fitness-outline',
  shop: 'bag-outline',
}

interface TenantMeta {
  logo_url: string | null
  brand_color: string | null
  category: string | null
}

interface CardProgress {
  stamps: number
  maxStamps: number
  rewards: number
  lastScanAt: string | null
}

function relativeDate(iso: string | null, language: string): string {
  if (!iso) return ''
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (language === 'it') {
    if (diffDays === 0) return 'Oggi'
    if (diffDays === 1) return 'Ieri'
    if (diffDays < 7) return `${diffDays} giorni fa`
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
  }
  if (language === 'ro') {
    if (diffDays === 0) return 'Azi'
    if (diffDays === 1) return 'Ieri'
    if (diffDays < 7) return `acum ${diffDays} zile`
    return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
  }
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

// ── Animated progress bar ─────────────────────────────────────────
function ProgressBar({ pct, onNight }: { pct: number; onNight: boolean }) {
  const widthAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 700,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [pct])
  const width = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
  return (
    <View style={[s.progressTrack, onNight && s.progressTrackNight]}>
      <Animated.View style={[s.progressFill, { width }, onNight && s.progressFillNight]} />
    </View>
  )
}

// ── Animated list card ────────────────────────────────────────────
function CardItem({
  item, index, progress, tenantMeta, t, language, onPress, onLongPress,
}: {
  item: ReturnType<typeof useClientStore.getState>['savedCards'][0]
  index: number
  progress: CardProgress | undefined
  tenantMeta: TenantMeta | undefined
  t: ReturnType<typeof getTranslation>
  language: string
  onPress: () => void
  onLongPress: () => void
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(24)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 320, delay: index * 70, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, delay: index * 70, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start()
  }, [])

  const stamps = progress?.stamps ?? 0
  const max = progress?.maxStamps ?? 10
  const rewards = progress?.rewards ?? 0
  const pct = max > 0 ? Math.min(stamps / max, 1) : 0
  // Reward ready → premium "night" card
  const night = rewards > 0

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[s.card, night && s.cardNight]}
        activeOpacity={0.75}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={s.cardTop}>
          {tenantMeta?.logo_url ? (
            <Image source={{ uri: tenantMeta.logo_url }} style={s.cardLogo} />
          ) : (
            <View style={[s.cardIcon, night && s.cardIconNight]}>
              <Ionicons
                name={CATEGORY_ICONS[tenantMeta?.category ?? 'all'] ?? 'storefront-outline'}
                size={22}
                color={night ? colors.violetLight : colors.primary}
              />
            </View>
          )}
          <View style={s.cardMeta}>
            <Text style={[s.cardName, night && s.cardNameNight]} numberOfLines={1}>
              {item.customName ?? item.tenantName ?? 'LoyalCard'}
            </Text>
            {progress?.lastScanAt ? (
              <Text style={[s.cardDate, night && s.cardDateNight]}>
                {t.admin.lastScan}: {relativeDate(progress.lastScanAt, language)}
              </Text>
            ) : (
              <Text style={[s.cardDate, night && s.cardDateNight]}>#{item.qrCode.slice(0, 10)}…</Text>
            )}
          </View>
          {night ? (
            <View style={s.rewardPill}>
              <Ionicons name="gift" size={13} color="#fff" />
              <Text style={s.rewardPillText}>{rewards}</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
          )}
        </View>

        <View style={s.progressBlock}>
          <ProgressBar pct={pct} onNight={night} />
          <Text style={[s.progressText, night && s.progressTextNight]}>
            {`${stamps} / ${max} ${t.dashboard.stamps}`}
            {night ? `  ·  ${rewards} ${t.dashboard.rewards}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function DashboardScreen() {
  const router = useRouter()
  const { language, savedCards, setTotalRewards } = useClientStore()
  const t = getTranslation(language)

  const [progress, setProgress] = useState<Record<string, CardProgress>>({})
  const [tenantMeta, setTenantMeta] = useState<Record<string, TenantMeta>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const screenFade = useRef(new Animated.Value(0)).current

  const loadData = useCallback(async (isRefresh = false) => {
    if (savedCards.length === 0) { setLoading(false); return }
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const tenantIds = [...new Set(savedCards.map((c) => c.tenantId))]
      const qrCodes = savedCards.map((c) => c.qrCode)

      const [cardsRes, rulesRes, tenantsRes] = await Promise.all([
        supabase
          .from('cards')
          .select('qr_code, loyalty_state, last_scan_at')
          .in('qr_code', qrCodes),
        supabase
          .from('reward_rules')
          .select('tenant_id, buy_count')
          .in('tenant_id', tenantIds)
          .eq('active', true)
          .order('priority'),
        supabase
          .from('tenants')
          .select('id, logo_url, brand_color, metadata')
          .in('id', tenantIds),
      ])

      // First active rule per tenant → stamp target
      const rulesMap: Record<string, number> = {}
      for (const rule of rulesRes.data ?? []) {
        if (!(rule.tenant_id in rulesMap)) rulesMap[rule.tenant_id] = rule.buy_count
      }

      const map: Record<string, CardProgress> = {}
      let totalR = 0

      for (const card of cardsRes.data ?? []) {
        const state = card.loyalty_state ?? {}
        const stamps = Object.values(state).reduce((s: number, v: any) => s + (v?.count ?? 0), 0)
        const rewards = Object.values(state).reduce((s: number, v: any) => s + (v?.rewards ?? 0), 0)
        totalR += rewards
        const saved = savedCards.find((c) => c.qrCode === card.qr_code)
        map[card.qr_code] = {
          stamps,
          maxStamps: saved ? (rulesMap[saved.tenantId] ?? 10) : 10,
          rewards,
          lastScanAt: card.last_scan_at ?? null,
        }
      }

      const metaMap: Record<string, TenantMeta> = {}
      for (const t of tenantsRes.data ?? []) {
        metaMap[t.id] = {
          logo_url: t.logo_url ?? null,
          brand_color: t.brand_color ?? null,
          category: (t.metadata as any)?.type ?? null,
        }
      }
      setTenantMeta(metaMap)

      setProgress(map)
      setTotalRewards(totalR)
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [savedCards])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    Animated.timing(screenFade, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
  }, [])

  const totalStamps = Object.values(progress).reduce((s, p) => s + p.stamps, 0)
  const totalRewardCount = Object.values(progress).reduce((s, p) => s + p.rewards, 0)

  function handleOpenCard(card: typeof savedCards[0]) {
    router.push({ pathname: '/card', params: { tenantId: card.tenantId, tenantName: card.tenantName ?? '' } })
  }

  function handleDeleteCard(qrCode: string) {
    Alert.alert(t.dashboard.deleteCard, t.dashboard.deleteCardMsg, [
      { text: t.dashboard.cancel, style: 'cancel' },
      {
        text: t.dashboard.delete, style: 'destructive',
        onPress: () => {
          const { savedCards: cards, replaceAllCards } = useClientStore.getState()
          replaceAllCards(cards.filter((c) => c.qrCode !== qrCode))
        },
      },
    ])
  }

  return (
    <SafeAreaView style={s.safe}>
      <Animated.View style={{ flex: 1, opacity: screenFade }}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{t.dashboard.title}</Text>
        </View>

        {/* Stats bar */}
        <View style={s.statsRow}>
          {[
            { value: savedCards.length, label: t.dashboard.totalCards, highlight: false },
            { value: loading ? '…' : totalStamps, label: t.dashboard.totalStamps, highlight: false },
            { value: loading ? '…' : totalRewardCount, label: t.dashboard.rewards, highlight: totalRewardCount > 0 },
          ].map((stat, i) => (
            <View key={i} style={[s.statCell, i < 2 && s.statCellBorder]}>
              <Text style={[s.statN, stat.highlight && { color: colors.primary }]}>{stat.value}</Text>
              <Text style={s.statL}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {savedCards.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="card-outline" size={40} color={colors.inkFaint} />
            </View>
            <Text style={s.emptyTitle}>{t.dashboard.noCards}</Text>
            <Text style={s.emptySubtitle}>{t.dashboard.noCardsSubtitle}</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.navigate('/(tabs)/' as any)}>
              <Ionicons name="compass-outline" size={18} color="#fff" />
              <Text style={s.emptyBtnText}>{t.dashboard.discoverPartners}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={savedCards}
            keyExtractor={(item) => item.qrCode}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListFooterComponent={
              <TouchableOpacity
                style={s.addMoreBtn}
                onPress={() => router.navigate('/(tabs)/' as any)}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={s.addMoreText}>{t.dashboard.discoverPartners}</Text>
              </TouchableOpacity>
            }
            renderItem={({ item, index }) => (
              <CardItem
                item={item}
                index={index}
                progress={progress[item.qrCode]}
                tenantMeta={tenantMeta[item.tenantId]}
                t={t}
                language={language}
                onPress={() => handleOpenCard(item)}
                onLongPress={() => handleDeleteCard(item.qrCode)}
              />
            )}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20, marginVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 3 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  statN: { fontSize: 24, fontWeight: '800', color: colors.ink },
  statL: { color: colors.inkSoft, fontSize: 11, fontWeight: '600', textAlign: 'center' },

  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    padding: 16, gap: 14,
    ...shadows.card,
  },
  cardNight: {
    backgroundColor: colors.night,
    borderColor: colors.nightBorder,
    ...shadows.night,
  },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardLogo: { width: 46, height: 46, borderRadius: radius.md, flexShrink: 0, backgroundColor: colors.bgDeep },
  cardIcon: {
    width: 46, height: 46, borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardIconNight: { backgroundColor: 'rgba(124,58,237,0.28)' },
  cardMeta: { flex: 1, gap: 3 },
  cardName: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  cardNameNight: { color: colors.onNight },
  cardDate: { color: colors.inkFaint, fontSize: 11 },
  cardDateNight: { color: colors.onNightSoft },
  rewardPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.violet,
    borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6,
  },
  rewardPillText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  progressBlock: { gap: 7 },
  progressTrack: {
    height: 6, backgroundColor: colors.bgDeep,
    borderRadius: 3, overflow: 'hidden',
  },
  progressTrackNight: { backgroundColor: 'rgba(255,255,255,0.12)' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressFillNight: { backgroundColor: colors.violetLight },
  progressText: { color: colors.inkSoft, fontSize: 12 },
  progressTextNight: { color: colors.onNightSoft },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.bgDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: radius.lg, marginTop: 6,
    ...shadows.primaryBtn,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 4, padding: 14, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.primaryBorder, borderStyle: 'dashed',
    backgroundColor: colors.primarySoft,
  },
  addMoreText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
})
