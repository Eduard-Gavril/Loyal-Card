import { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, Alert, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { colors, continuous } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import PressableScale from '@/ui/PressableScale'
import StampCard from '@/ui/StampCard'
import Button from '@/ui/Button'
import Empty from '@/ui/Empty'
import Txt from '@/ui/Txt'

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

type LoyaltyState = Record<string, { count?: number; rewards?: number } | undefined>
interface TenantRule { id: string; buy_count: number }

// Progress shown per card: the highest-priority rule (rules arrive sorted by
// priority) still in progress — never a sum across rules, which can exceed a
// single rule's target (e.g. "9/6")
function computeStampProgress(state: LoyaltyState, rules: TenantRule[]) {
  if (rules.length === 0) {
    const inProgress = Object.values(state).find((s) => (s?.count ?? 0) > 0)
    return { stamps: Math.min(inProgress?.count ?? 0, 10), maxStamps: 10 }
  }

  const notCompleted = rules.filter((r) => (state[r.id]?.count ?? 0) < r.buy_count)
  const displayRule =
    notCompleted.find((r) => (state[r.id]?.count ?? 0) > 0) ||
    notCompleted[0] ||
    rules.find((r) => (state[r.id]?.count ?? 0) > 0 || (state[r.id]?.rewards ?? 0) > 0)

  return {
    stamps: displayRule ? Math.min(state[displayRule.id]?.count ?? 0, displayRule.buy_count) : 0,
    maxStamps: displayRule?.buy_count ?? 10,
  }
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

export default function DashboardScreen() {
  const router = useRouter()
  const { language, savedCards, setTotalRewards, recordLoyaltyProgress, lifetimeStamps, lifetimeRewards } = useClientStore()
  const t = getTranslation(language)

  const [progress, setProgress] = useState<Record<string, CardProgress>>({})
  const [tenantMeta, setTenantMeta] = useState<Record<string, TenantMeta>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
          .select('id, tenant_id, buy_count')
          .in('tenant_id', tenantIds)
          .eq('active', true)
          .order('priority'),
        supabase
          .from('tenants')
          .select('id, logo_url, brand_color, metadata')
          .in('id', tenantIds),
      ])

      // Active rules per tenant, already sorted by priority
      const rulesByTenant: Record<string, TenantRule[]> = {}
      for (const rule of rulesRes.data ?? []) {
        ;(rulesByTenant[rule.tenant_id] ??= []).push({ id: rule.id, buy_count: rule.buy_count })
      }

      const map: Record<string, CardProgress> = {}
      const stateByQr: Record<string, LoyaltyState> = {}
      let totalR = 0

      for (const card of cardsRes.data ?? []) {
        const state: LoyaltyState = card.loyalty_state ?? {}
        stateByQr[card.qr_code] = state
        const rewards = Object.values(state).reduce((s: number, v) => s + (v?.rewards ?? 0), 0)
        totalR += rewards
        const saved = savedCards.find((c) => c.qrCode === card.qr_code)
        map[card.qr_code] = {
          ...computeStampProgress(state, saved ? (rulesByTenant[saved.tenantId] ?? []) : []),
          rewards,
          lastScanAt: card.last_scan_at ?? null,
        }
      }

      // Feed the persistent lifetime counters (never decrease)
      recordLoyaltyProgress(stateByQr)

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

  // Available rewards drive the highlight; the stat numbers are lifetime totals
  const availableRewards = Object.values(progress).reduce((s, p) => s + p.rewards, 0)

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
    <ScreenScroll
      title={t.dashboard.title}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      {/* Totals */}
      <View style={s.stats} accessibilityRole="summary">
        {[
          { value: savedCards.length, label: t.dashboard.totalCards, highlight: false },
          { value: loading ? '…' : lifetimeStamps, label: t.dashboard.totalStamps, highlight: false },
          { value: loading ? '…' : lifetimeRewards, label: t.dashboard.rewards, highlight: availableRewards > 0 },
        ].map((stat, i) => (
          <View key={i} style={s.stat}>
            <Txt v="title2" tone={stat.highlight ? 'tint' : 'primary'}>
              {stat.value}
            </Txt>
            <Txt v="caption1" tone="secondary" numberOfLines={1}>
              {stat.label}
            </Txt>
          </View>
        ))}
      </View>

      {savedCards.length === 0 ? (
        <Empty
          icon="card-outline"
          title={t.dashboard.noCards}
          message={t.dashboard.noCardsSubtitle}
          actionLabel={t.dashboard.discoverPartners}
          onAction={() => router.navigate('/(tabs)/partners' as any)}
        />
      ) : (
        <>
          {savedCards.map((item) => {
            const p = progress[item.qrCode]
            const stamps = p?.stamps ?? 0
            const max = p?.maxStamps ?? 10
            const rewards = p?.rewards ?? 0
            return (
              <PressableScale
                key={item.qrCode}
                accessibilityRole="button"
                onPress={() => handleOpenCard(item)}
                onLongPress={() => handleDeleteCard(item.qrCode)}
                delayLongPress={450}
                style={s.cardWrap}
              >
                <StampCard
                  compact
                  title={item.customName ?? item.tenantName ?? 'LoyalCard'}
                  subtitle={p?.lastScanAt ? `${t.admin.lastScan}: ${relativeDate(p.lastScanAt, language)}` : `#${item.qrCode.slice(0, 10)}…`}
                  count={stamps}
                  total={max}
                  rewards={rewards}
                  stampsLabel={t.dashboard.stamps}
                  readyLabel={rewards > 0 ? `${rewards} ${t.dashboard.rewards}` : undefined}
                />
              </PressableScale>
            )
          })}
          <Button variant="tinted" icon="add-circle-outline" title={t.dashboard.discoverPartners} onPress={() => router.navigate('/(tabs)/partners' as any)} style={{ marginTop: 4 }} />
        </>
      )}
    </ScreenScroll>
  )
}

const s = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 18, backgroundColor: colors.grouped, ...continuous },
  cardWrap: { marginBottom: 14 },
})
