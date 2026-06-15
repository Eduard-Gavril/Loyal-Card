import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Share, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

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
          router.replace('/(tabs)/')
        },
      },
    ])
  }

  const NAV_GRID = [
    { icon: 'qr-code-outline', label: a.scanCard, route: '/admin/scanner', color: '#7c3aed' },
    { icon: 'cube-outline', label: a.products, route: '/admin/products', color: '#0891b2' },
    { icon: 'people-outline', label: a.clients, route: '/admin/clients', color: '#059669' },
    { icon: 'time-outline', label: a.history, route: '/admin/scan-history', color: '#d97706' },
    { icon: 'bar-chart-outline', label: a.reports, route: '/admin/reports', color: '#7c3aed' },
    { icon: 'settings-outline', label: a.settings, route: '/admin/settings', color: '#6b7280' },
  ]

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>{a.title}</Text>
          <Text style={s.sub}>{user?.email} · {role}</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.exportBtn} onPress={handleExport} disabled={exporting}>
            {exporting
              ? <ActivityIndicator size="small" color="#a78bfa" />
              : <Ionicons name="download-outline" size={20} color="#a78bfa" />}
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#f87171" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <Text style={s.sectionLabel}>{a.summaryLabel}</Text>
        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color="#7c3aed" />
            <Text style={s.loadingText}>{t.loading}</Text>
          </View>
        ) : (
          <View style={s.statsGrid}>
            {[
              { label: a.cardsLabel, value: stats.totalCards, icon: 'card-outline', color: '#7c3aed' },
              { label: a.scansTodayLabel, value: stats.scansToday, icon: 'scan-outline', color: '#059669' },
              { label: a.rewards, value: stats.totalRewards, icon: 'gift-outline', color: '#d97706' },
              { label: a.totalScansLabel, value: stats.totalScans, icon: 'analytics-outline', color: '#0891b2' },
            ].map((stat) => (
              <View key={stat.label} style={[s.statCard, { borderLeftColor: stat.color, borderLeftWidth: 3 }]}>
                <View style={[s.statIcon, { backgroundColor: stat.color + '22' }]}>
                  <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Navigation grid */}
        <Text style={s.sectionLabel}>{a.sectionsLabel}</Text>
        <View style={s.navGrid}>
          {NAV_GRID.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[s.navBtn, { borderColor: item.color + '55', backgroundColor: item.color + '18' }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.65}
            >
              <View style={s.navBtnTop}>
                <View style={[s.navIcon, { backgroundColor: item.color + '30' }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Ionicons name="chevron-forward" size={14} color={item.color + 'aa'} />
              </View>
              <Text style={[s.navLabel, { color: '#fff' }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent activity */}
        {recent.length > 0 && (
          <View style={s.recentSection}>
            <Text style={s.sectionTitle}>{a.recentActivityTitle}</Text>
            {recent.map((e) => (
              <View key={e.id} style={s.recentRow}>
                <View style={[s.recentDot, { backgroundColor: e.reward_applied ? '#d97706' : '#059669' }]} />
                <View style={s.recentBody}>
                  <Text style={s.recentClient} numberOfLines={1}>
                    {(e as any).clients?.name ?? a.anonClient}
                  </Text>
                  <Text style={s.recentProduct} numberOfLines={1}>
                    {(e as any).products?.metadata?.emoji ?? '🛍️'} {(e as any).products?.name ?? a.productDefault}
                    {e.reward_applied && ' · 🎁 ' + a.rewardLabel}
                  </Text>
                </View>
                <Text style={s.recentTime}>
                  {new Date(e.scanned_at).toLocaleTimeString(
                    language === 'ro' ? 'ro-RO' : language === 'en' ? 'en-GB' : 'it-IT',
                    { hour: '2-digit', minute: '2-digit' }
                  )}
                </Text>
              </View>
            ))}
            <TouchableOpacity style={s.seeAllBtn} onPress={() => router.push('/admin/scan-history')}>
              <Text style={s.seeAllText}>{a.viewAllHistory}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0d2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  sub: { color: '#7c6faa', fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  exportBtn: { padding: 8, backgroundColor: 'rgba(167,139,250,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 24, justifyContent: 'center' },
  loadingText: { color: '#a78bfa', fontSize: 14 },
  sectionLabel: { color: '#7c6faa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14, gap: 6, overflow: 'hidden' },
  statIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statValue: { color: '#fff', fontSize: 26, fontWeight: '800' },
  statLabel: { color: '#7c6faa', fontSize: 12 },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  navBtn: { flex: 1, minWidth: '45%', gap: 10, borderRadius: 18, borderWidth: 1.5, padding: 16 },
  navBtnTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontWeight: '700', fontSize: 14 },
  recentSection: { paddingHorizontal: 16, marginBottom: 32 },
  sectionTitle: { color: '#7c6faa', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentBody: { flex: 1 },
  recentClient: { color: '#fff', fontWeight: '600', fontSize: 14 },
  recentProduct: { color: '#6b7280', fontSize: 12, marginTop: 1 },
  recentTime: { color: '#4b5563', fontSize: 12 },
  seeAllBtn: { paddingVertical: 12, alignItems: 'center' },
  seeAllText: { color: '#7c3aed', fontWeight: '600', fontSize: 13 },
})
