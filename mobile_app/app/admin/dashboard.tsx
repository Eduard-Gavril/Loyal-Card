import { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Share, Alert } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { colors, continuous } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import Button from '@/ui/Button'
import PressableScale from '@/ui/PressableScale'
import AccountInfo from '@/components/AccountInfo'
import TenantStatusNotice from '@/components/TenantStatusNotice'
import Txt from '@/ui/Txt'

interface Stats {
  totalCards: number
  totalScans: number
  totalRewards: number
  scansToday: number
}

interface RecentEvent {
  id: string
  scanned_at: string
  reward_applied: boolean
  products: { name: string; metadata: any } | null
  clients: { name: string | null } | null
}

export default function AdminDashboardScreen() {
  const router = useRouter()
  const { user, tenantId, role, clearAuth } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin

  const [stats, setStats] = useState<Stats>({ totalCards: 0, totalScans: 0, totalRewards: 0, scansToday: 0 })
  const [recent, setRecent] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0)

      const [cardsRes, scansRes, rewardsRes, todayRes, recentRes] = await Promise.all([
        supabase.from('cards').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId!),
        supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId!),
        supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId!).eq('reward_applied', true),
        supabase.from('scan_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId!).gte('scanned_at', today.toISOString()),
        supabase.from('scan_events')
          .select('id, scanned_at, reward_applied, products(name, metadata), cards(clients(name))')
          .eq('tenant_id', tenantId!)
          .order('scanned_at', { ascending: false })
          .limit(8),
      ])

      setStats({
        totalCards: cardsRes.count ?? 0,
        totalScans: scansRes.count ?? 0,
        totalRewards: rewardsRes.count ?? 0,
        scansToday: todayRes.count ?? 0,
      })
      setRecent((recentRes.data ?? []).map((e: any) => ({
        ...e,
        clients: e.cards?.clients ?? null,
      })))
    } catch (e) {
      console.error('Admin dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    if (!tenantId) return
    setExporting(true)
    try {
      const { data: cards } = await supabase
        .from('cards')
        .select('id, qr_code, created_at, last_scan_at, loyalty_state, clients(name, phone)')
        .eq('tenant_id', tenantId)
        .eq('active', true)

      const { data: scanCounts } = await supabase
        .from('scan_events')
        .select('card_id, reward_applied')
        .eq('tenant_id', tenantId)

      const countMap: Record<string, { total: number; rewards: number }> = {}
      for (const s of scanCounts ?? []) {
        if (!countMap[s.card_id]) countMap[s.card_id] = { total: 0, rewards: 0 }
        countMap[s.card_id].total++
        if (s.reward_applied) countMap[s.card_id].rewards++
      }

      const rows = [
        ['QR Code', 'Nome', 'Telefono', 'Data registrazione', 'Ultima scansione', 'Timbri totali', 'Scansioni', 'Premi'],
        ...(cards ?? []).map((c: any) => {
          const stamps = Object.values(c.loyalty_state ?? {})
            .reduce((acc: number, v: any) => acc + (v?.count ?? 0), 0)
          const counts = countMap[c.id] ?? { total: 0, rewards: 0 }
          return [
            c.qr_code,
            c.clients?.name ?? '',
            c.clients?.phone ?? '',
            c.created_at?.slice(0, 10) ?? '',
            c.last_scan_at?.slice(0, 10) ?? '',
            stamps,
            counts.total,
            counts.rewards,
          ]
        }),
      ]

      const csv = rows.map(r => r.join(',')).join('\n')
      await Share.share({
        title: 'LoyalCard Export',
        message: csv,
      })
    } catch (e: any) {
      Alert.alert('Export error', e?.message ?? 'Errore durante export')
    } finally {
      setExporting(false)
    }
  }

  function handleLogout() {
    Alert.alert(a.logout, a.logoutConfirm, [
      { text: t.dashboard.cancel, style: 'cancel' },
      {
        text: a.logout, style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          clearAuth()
          router.replace('/(tabs)/partners')
        },
      },
    ])
  }

  const timeLocale = language === 'ro' ? 'ro-RO' : language === 'en' ? 'en-GB' : 'it-IT'

  const STATS = [
    { label: a.cardsLabel, value: stats.totalCards, icon: 'card-outline' },
    { label: a.scansTodayLabel, value: stats.scansToday, icon: 'scan-outline' },
    { label: a.rewards, value: stats.totalRewards, icon: 'gift-outline' },
    { label: a.totalScansLabel, value: stats.totalScans, icon: 'analytics-outline' },
  ] as const

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <PressableScale accessibilityRole="button" accessibilityLabel="Export" onPress={handleExport} disabled={exporting} hitSlop={8} style={s.headerBtn}>
              {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="share-outline" size={22} color={colors.primary} />}
            </PressableScale>
          ),
        }}
      />
      <ScreenScroll title={a.title} bottomPad={40}>
        <AccountInfo />
        <TenantStatusNotice />

        {/* One filled button: the thing an admin does most */}
        <Button title={a.scanCard} icon="qr-code-outline" onPress={() => router.push('/admin/scanner')} style={{ marginBottom: 24 }} />

        <Txt v="footnote" tone="secondary" style={s.section}>
          {a.summaryLabel.toUpperCase()}
        </Txt>
        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator color={colors.primary} />
            <Txt v="subhead" tone="secondary">
              {t.loading}
            </Txt>
          </View>
        ) : (
          <View style={s.grid}>
            {STATS.map((stat) => (
              <View key={stat.label} style={s.stat}>
                <Ionicons name={stat.icon} size={18} color={colors.primary} />
                <Txt v="title1">{stat.value}</Txt>
                <Txt v="footnote" tone="secondary" numberOfLines={1}>
                  {stat.label}
                </Txt>
              </View>
            ))}
          </View>
        )}

        <ListGroup header={a.sectionsLabel}>
          <ListRow icon="cube-outline" title={a.products} onPress={() => router.push('/admin/products')} />
          <ListRow icon="people-outline" title={a.clients} onPress={() => router.push('/admin/clients')} />
          <ListRow icon="time-outline" title={a.history} onPress={() => router.push('/admin/scan-history')} />
          <ListRow icon="bar-chart-outline" title={a.reports} onPress={() => router.push('/admin/reports')} />
          <ListRow icon="settings-outline" title={a.settings} onPress={() => router.push('/admin/settings')} />
        </ListGroup>

        {recent.length > 0 && (
          <ListGroup header={a.recentActivityTitle}>
            {recent.map((e) => (
              <ListRow
                key={e.id}
                title={(e as any).clients?.name ?? a.anonClient}
                subtitle={`${(e as any).products?.name ?? a.productDefault}${e.reward_applied ? ' · ' + a.rewardLabel : ''}`}
                value={new Date(e.scanned_at).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}
                right={e.reward_applied ? <Ionicons name="gift" size={16} color={colors.primary} /> : undefined}
              />
            ))}
            <ListRow title={a.viewAllHistory} onPress={() => router.push('/admin/scan-history')} />
          </ListGroup>
        )}

        <ListGroup>
          <ListRow icon="log-out-outline" destructive title={a.logout} onPress={handleLogout} chevron={false} />
        </ListGroup>
      </ScreenScroll>
    </>
  )
}

const s = StyleSheet.create({
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  section: { marginLeft: 16, marginBottom: 6 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  stat: { width: '48.4%', gap: 4, padding: 16, borderRadius: 20, backgroundColor: colors.grouped, ...continuous },
})
