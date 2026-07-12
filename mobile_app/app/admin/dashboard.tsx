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
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

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
  const colors = useTheme()
  const s = themedStyles(colors)
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

  const NAV_GRID: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string }[] = [
    { icon: 'qr-code-outline', label: a.scanCard, route: '/admin/scanner' },
    { icon: 'cube-outline', label: a.products, route: '/admin/products' },
    { icon: 'people-outline', label: a.clients, route: '/admin/clients' },
    { icon: 'time-outline', label: a.history, route: '/admin/scan-history' },
    { icon: 'bar-chart-outline', label: a.reports, route: '/admin/reports' },
    { icon: 'settings-outline', label: a.settings, route: '/admin/settings' },
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
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="download-outline" size={20} color={colors.primary} />}
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <Text style={s.sectionLabel}>{a.summaryLabel}</Text>
        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.loadingText}>{t.loading}</Text>
          </View>
        ) : (
          <View style={s.statsGrid}>
            {([
              { label: a.cardsLabel, value: stats.totalCards, icon: 'card-outline' },
              { label: a.scansTodayLabel, value: stats.scansToday, icon: 'scan-outline' },
              { label: a.rewards, value: stats.totalRewards, icon: 'gift-outline' },
              { label: a.totalScansLabel, value: stats.totalScans, icon: 'analytics-outline' },
            ] as const).map((stat) => (
              <View key={stat.label} style={s.statCard}>
                <View style={s.statIcon}>
                  <Ionicons name={stat.icon} size={17} color={colors.primary} />
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
          {NAV_GRID.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[s.navBtn, i === 0 && s.navBtnPrimary]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[s.navIcon, i === 0 && s.navIconPrimary]}>
                <Ionicons name={item.icon} size={20} color={i === 0 ? '#fff' : colors.primary} />
              </View>
              <Text style={[s.navLabel, i === 0 && s.navLabelPrimary]} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent activity */}
        {recent.length > 0 && (
          <View style={s.recentSection}>
            <Text style={s.sectionLabelInline}>{a.recentActivityTitle}</Text>
            <View style={s.recentCard}>
              {recent.map((e, i) => (
                <View key={e.id} style={[s.recentRow, i < recent.length - 1 && s.recentRowBorder]}>
                  <View style={[s.recentDot, { backgroundColor: e.reward_applied ? colors.violet : colors.success }]} />
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const themedStyles = createThemedStyles((colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  title: { color: colors.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  sub: { color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  exportBtn: {
    padding: 9, backgroundColor: colors.primarySoft, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  logoutBtn: {
    padding: 9, backgroundColor: colors.dangerSoft, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.dangerBorder,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 24, justifyContent: 'center' },
  loadingText: { color: colors.inkSoft, fontSize: 14 },

  sectionLabel: {
    color: colors.inkSoft, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 20, marginBottom: 10, marginTop: 4,
  },
  sectionLabelInline: {
    color: colors.inkSoft, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },

  // Fixed percentage widths: flex+minWidth% doesn't wrap reliably in RN
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    rowGap: 10, paddingHorizontal: 20, marginBottom: 20,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 12, gap: 4,
    ...shadows.card,
  },
  statIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { color: colors.ink, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.inkSoft, fontSize: 11 },

  navGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    rowGap: 10, paddingHorizontal: 20, marginBottom: 24,
  },
  navBtn: {
    width: '31.5%',
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 14, paddingHorizontal: 6,
    alignItems: 'center', gap: 8,
    ...shadows.card,
  },
  navBtnPrimary: {
    backgroundColor: colors.night,
    borderColor: colors.night,
    ...shadows.night,
  },
  navIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  navIconPrimary: { backgroundColor: 'rgba(124,58,237,0.4)' },
  navLabel: { fontWeight: '700', fontSize: 12, color: colors.ink, textAlign: 'center' },
  navLabelPrimary: { color: colors.onNight },

  recentSection: { paddingHorizontal: 20, marginBottom: 32 },
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  recentRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentBody: { flex: 1 },
  recentClient: { color: colors.ink, fontWeight: '600', fontSize: 14 },
  recentProduct: { color: colors.inkSoft, fontSize: 12, marginTop: 1 },
  recentTime: { color: colors.inkFaint, fontSize: 12 },
  seeAllBtn: { paddingVertical: 12, alignItems: 'center' },
  seeAllText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
}))
