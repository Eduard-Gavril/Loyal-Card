import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { exportExcel } from '@/lib/excel'
import { radius, shadows, useTheme, createThemedStyles } from '@/theme'

type Range = '7d' | '30d' | '90d'

interface ProductStat {
  name: string
  emoji: string
  scans: number
  rewards: number
}

interface DayStat {
  date: string
  scans: number
  rewards: number
}

const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 }
const RANGE_LABELS: Record<Range, string> = { '7d': '7d', '30d': '30d', '90d': '90d' }

export default function AdminReportsScreen() {
  const colors = useTheme()
  const s = themedStyles(colors)
  const router = useRouter()
  const { tenantId } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin

  const [range, setRange] = useState<Range>('30d')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [totalScans, setTotalScans] = useState(0)
  const [totalRewards, setTotalRewards] = useState(0)
  const [uniqueClients, setUniqueClients] = useState(0)
  const [topProducts, setTopProducts] = useState<ProductStat[]>([])
  const [dailyStats, setDailyStats] = useState<DayStat[]>([])

  useEffect(() => { loadData() }, [range])

  async function loadData() {
    setLoading(true)
    try {
      const days = RANGE_DAYS[range]
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceISO = since.toISOString()

      const { data: events } = await supabase
        .from('scan_events')
        .select('id, scanned_at, reward_applied, card_id, products(name, metadata)')
        .eq('tenant_id', tenantId!)
        .gte('scanned_at', sinceISO)
        .order('scanned_at', { ascending: true })

      const rows = (events as any[]) ?? []

      setTotalScans(rows.length)
      setTotalRewards(rows.filter((r) => r.reward_applied).length)
      setUniqueClients(new Set(rows.map((r) => r.card_id)).size)

      const prodMap = new Map<string, ProductStat>()
      for (const e of rows) {
        const name = e.products?.name ?? a.productDefault
        const emoji = e.products?.metadata?.emoji ?? '🛍️'
        if (!prodMap.has(name)) prodMap.set(name, { name, emoji, scans: 0, rewards: 0 })
        const entry = prodMap.get(name)!
        entry.scans++
        if (e.reward_applied) entry.rewards++
      }
      setTopProducts([...prodMap.values()].sort((a, b) => b.scans - a.scans).slice(0, 5))

      const dayMap = new Map<string, DayStat>()
      for (const e of rows) {
        const day = e.scanned_at.slice(0, 10)
        if (!dayMap.has(day)) dayMap.set(day, { date: day, scans: 0, rewards: 0 })
        const entry = dayMap.get(day)!
        entry.scans++
        if (e.reward_applied) entry.rewards++
      }
      setDailyStats([...dayMap.values()].reverse().slice(0, 14))
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const wb = XLSX.utils.book_new()
      const date = new Date().toISOString().slice(0, 10)

      // Sheet 1: KPI Summary
      const kpiRows = [
        { Metrica: a.totalScansLabel, Valore: totalScans },
        { Metrica: a.rewardsGivenLabel, Valore: totalRewards },
        { Metrica: a.uniqueClientsLabel, Valore: uniqueClients },
        { Metrica: a.avgPerDayLabel, Valore: avgPerDay },
        { Metrica: a.rewardRateLabel, Valore: `${conversionRate}%` },
        { Metrica: 'Periodo', Valore: `Ultimi ${RANGE_DAYS[range]} giorni (fino al ${date})` },
      ]
      const wsKpi = XLSX.utils.json_to_sheet(kpiRows)
      wsKpi['!cols'] = [{ wch: 28 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, wsKpi, 'KPI')

      // Sheet 2: Daily Stats
      if (dailyStats.length > 0) {
        const dailyRows = [...dailyStats].reverse().map((d) => ({
          Data: d.date,
          Scansioni: d.scans,
          Premi: d.rewards,
        }))
        const wsDaily = XLSX.utils.json_to_sheet(dailyRows)
        wsDaily['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 10 }]
        XLSX.utils.book_append_sheet(wb, wsDaily, 'Andamento Giornaliero')
      }

      // Sheet 3: Top Products
      if (topProducts.length > 0) {
        const prodRows = topProducts.map((p, i) => ({
          Posizione: i + 1,
          Prodotto: p.name,
          Scansioni: p.scans,
          Premi: p.rewards,
        }))
        const wsProd = XLSX.utils.json_to_sheet(prodRows)
        wsProd['!cols'] = [{ wch: 10 }, { wch: 28 }, { wch: 12 }, { wch: 10 }]
        XLSX.utils.book_append_sheet(wb, wsProd, 'Top Prodotti')
      }

      await exportExcel(wb, `loyalcard_report_${range}_${date}.xlsx`)
    } catch (e: any) {
      Alert.alert('Export Error', e?.message ?? 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const avgPerDay = totalScans > 0
    ? (totalScans / RANGE_DAYS[range]).toFixed(1)
    : '0'
  const conversionRate = totalScans > 0
    ? ((totalRewards / totalScans) * 100).toFixed(1)
    : '0'

  const maxScans = Math.max(...dailyStats.map((d) => d.scans), 1)

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t.admin.reports}</Text>
        <TouchableOpacity
          style={[s.exportBtn, (loading || exporting) && { opacity: 0.4 }]}
          onPress={handleExport}
          disabled={loading || exporting || totalScans === 0}
        >
          {exporting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="download-outline" size={18} color="#fff" />}
          {!exporting && <Text style={s.exportBtnText}>Excel</Text>}
        </TouchableOpacity>
      </View>

      {/* Range picker */}
      <View style={s.rangePicker}>
        {(['7d', '30d', '90d'] as Range[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[s.rangeBtn, range === r && s.rangeBtnActive]}
            onPress={() => setRange(r)}
          >
            <Text style={[s.rangeBtnText, range === r && s.rangeBtnTextActive]}>{RANGE_LABELS[r]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
          {/* KPI grid */}
          <View style={s.kpiGrid}>
            {([
              { label: a.totalScansLabel, value: totalScans, icon: 'scan-outline' },
              { label: a.rewardsGivenLabel, value: totalRewards, icon: 'gift-outline' },
              { label: a.uniqueClientsLabel, value: uniqueClients, icon: 'people-outline' },
              { label: a.avgPerDayLabel, value: avgPerDay, icon: 'trending-up-outline' },
              { label: a.rewardRateLabel, value: `${conversionRate}%`, icon: 'trophy-outline' },
            ] as const).map((kpi) => (
              <View key={kpi.label} style={s.kpiCard}>
                <View style={s.kpiIcon}>
                  <Ionicons name={kpi.icon} size={16} color={colors.primary} />
                </View>
                <Text style={s.kpiValue}>{kpi.value}</Text>
                <Text style={s.kpiLabel}>{kpi.label}</Text>
              </View>
            ))}
          </View>

          {/* Daily chart */}
          {dailyStats.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{a.scanTrendTitle}</Text>
              <View style={s.chartWrap}>
                {dailyStats.map((d) => (
                  <View key={d.date} style={s.barCol}>
                    <View style={s.barTrack}>
                      <View
                        style={[s.barFill, { height: `${Math.round((d.scans / maxScans) * 100)}%` }]}
                      />
                    </View>
                    <Text style={s.barLabel}>{d.date.slice(5)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Top products */}
          {topProducts.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{a.topProductsTitle}</Text>
              {topProducts.map((p, i) => (
                <View key={p.name} style={s.prodRow}>
                  <Text style={s.prodRank}>#{i + 1}</Text>
                  <Text style={s.prodEmoji}>{p.emoji}</Text>
                  <Text style={s.prodName} numberOfLines={1}>{p.name}</Text>
                  <View style={s.prodStats}>
                    <Text style={s.prodStat}>
                      <Text style={s.prodStatNum}>{p.scans}</Text>
                      {' '}scans
                    </Text>
                    {p.rewards > 0 && (
                      <Text style={s.prodReward}>🎁 {p.rewards}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {totalScans === 0 && (
            <View style={s.emptyBox}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.inkFaint} />
              <Text style={s.emptyText}>{a.noScansMsg}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const themedStyles = createThemedStyles((colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm,
    ...shadows.primaryBtn,
  },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 80 },
  backText: { color: colors.ink, fontSize: 15, fontWeight: '500' },
  headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },

  rangePicker: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  rangeBtn: {
    flex: 1, paddingVertical: 9, borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  rangeBtnActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  rangeBtnText: { color: colors.inkMid, fontWeight: '600', fontSize: 13 },
  // Inverse of ink: readable on the ink-filled active button in both themes
  rangeBtnTextActive: { color: colors.bg },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.inkSoft, fontSize: 14 },
  body: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 5,
    ...shadows.card,
  },
  kpiIcon: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  kpiValue: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 4 },
  kpiLabel: { color: colors.inkSoft, fontSize: 11 },

  section: { gap: 12 },
  sectionTitle: { color: colors.inkSoft, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  chartWrap: {
    flexDirection: 'row', alignItems: 'flex-end',
    height: 110, gap: 3,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 12,
    ...shadows.card,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: colors.primary, borderRadius: 3, minHeight: 3 },
  barLabel: { color: colors.inkFaint, fontSize: 8 },

  prodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: 12,
    ...shadows.card,
  },
  prodRank: { color: colors.inkFaint, fontWeight: '800', fontSize: 14, width: 24, textAlign: 'center' },
  prodEmoji: { fontSize: 22 },
  prodName: { flex: 1, color: colors.ink, fontWeight: '600', fontSize: 14 },
  prodStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prodStat: { color: colors.inkSoft, fontSize: 12 },
  prodStatNum: { color: colors.primary, fontWeight: '800' },
  prodReward: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyText: { color: colors.inkSoft, fontSize: 14, textAlign: 'center' },
}))
