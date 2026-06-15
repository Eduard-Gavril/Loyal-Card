import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Alert, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

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

export default function DashboardScreen() {
  const router = useRouter()
  const { language, savedCards, setTotalRewards } = useClientStore()
  const t = getTranslation(language)

  const [progress, setProgress] = useState<Record<string, CardProgress>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async (isRefresh = false) => {
    if (savedCards.length === 0) { setLoading(false); return }
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const tenantIds = [...new Set(savedCards.map((c) => c.tenantId))]
      const qrCodes = savedCards.map((c) => c.qrCode)

      const [cardsRes, rulesRes] = await Promise.all([
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
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{t.dashboard.title}</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.navigate('/(tabs)/' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats bar — always visible */}
      <View style={s.statsRow}>
        {[
          { value: savedCards.length, label: t.dashboard.totalCards, color: '#a78bfa' },
          { value: loading ? '…' : totalStamps, label: t.dashboard.totalStamps, color: '#60a5fa' },
          { value: loading ? '…' : totalRewardCount, label: t.dashboard.rewards, color: totalRewardCount > 0 ? '#f59e0b' : '#6b7280', highlight: totalRewardCount > 0 },
        ].map((stat, i) => (
          <View key={i} style={s.statCell}>
            <Text style={[s.statN, { color: stat.color }]}>{stat.value}</Text>
            <Text style={s.statL}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {savedCards.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="card-outline" size={64} color="#1f2937" />
          <Text style={s.emptyTitle}>{t.dashboard.noCards}</Text>
          <Text style={s.emptySubtitle}>{t.dashboard.noCardsSubtitle}</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(tabs)/home')}>
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
              tintColor="#7c3aed"
              colors={['#7c3aed']}
            />
          }
          ListFooterComponent={
            <TouchableOpacity
              style={s.addMoreBtn}
              onPress={() => router.navigate('/(tabs)/' as any)}
            >
              <Ionicons name="add-circle-outline" size={18} color="#a78bfa" />
              <Text style={s.addMoreText}>{t.dashboard.discoverPartners}</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const p = progress[item.qrCode]
            const stamps = p?.stamps ?? 0
            const max = p?.maxStamps ?? 10
            const rewards = p?.rewards ?? 0
            const pct = max > 0 ? Math.min(stamps / max, 1) : 0
            const hasReward = rewards > 0

            return (
              <TouchableOpacity
                style={[s.card, hasReward && s.cardGlow]}
                activeOpacity={0.72}
                onPress={() => handleOpenCard(item)}
                onLongPress={() => handleDeleteCard(item.qrCode)}
              >
                {/* Top row */}
                <View style={s.cardTop}>
                  <View style={[s.cardIcon, hasReward && s.cardIconReward]}>
                    <Ionicons
                      name="storefront-outline"
                      size={22}
                      color={hasReward ? '#f59e0b' : '#a78bfa'}
                    />
                  </View>
                  <View style={s.cardMeta}>
                    <Text style={s.cardName} numberOfLines={1}>
                      {item.customName ?? item.tenantName ?? 'LoyalCard'}
                    </Text>
                    {p?.lastScanAt ? (
                      <Text style={s.cardDate}>
                        {t.admin.lastScan}: {relativeDate(p.lastScanAt, language)}
                      </Text>
                    ) : (
                      <Text style={s.cardDate}>#{item.qrCode.slice(0, 10)}…</Text>
                    )}
                  </View>
                  {hasReward ? (
                    <View style={s.rewardPill}>
                      <Text style={s.rewardPillText}>🎁 {rewards}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color="#374151" />
                  )}
                </View>

                {/* Progress bar */}
                <View style={s.progressBlock}>
                  <View style={s.progressTrack}>
                    <View
                      style={[
                        s.progressFill,
                        { width: `${Math.round(pct * 100)}%` as any },
                        hasReward && s.progressFillReward,
                      ]}
                    />
                  </View>
                  <Text style={s.progressText}>
                    {loading
                      ? '…'
                      : `${stamps} / ${max} ${t.dashboard.stamps}`}
                    {hasReward ? `  ·  🎁 ${rewards} ${t.dashboard.rewards}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0d2e' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  statCell: {
    flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4,
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)',
  },
  statN: { fontSize: 26, fontWeight: '800' },
  statL: { color: '#6b7280', fontSize: 11, fontWeight: '600', textAlign: 'center' },

  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    padding: 16, gap: 14,
  },
  cardGlow: {
    borderColor: 'rgba(245,158,11,0.45)',
    backgroundColor: 'rgba(245,158,11,0.07)',
  },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardIconReward: { backgroundColor: 'rgba(245,158,11,0.2)' },
  cardMeta: { flex: 1, gap: 3 },
  cardName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardDate: { color: '#4b5563', fontSize: 11 },
  rewardPill: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
  },
  rewardPillText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },

  progressBlock: { gap: 7 },
  progressTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#7c3aed', borderRadius: 3 },
  progressFillReward: { backgroundColor: '#f59e0b' },
  progressText: { color: '#6b7280', fontSize: 12 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { color: '#6b7280', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 16, marginTop: 4,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 4, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)', borderStyle: 'dashed',
  },
  addMoreText: { color: '#a78bfa', fontWeight: '600', fontSize: 14 },
})
