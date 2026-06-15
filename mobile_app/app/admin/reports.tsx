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

      // Aggregates
      setTotalScans(rows.length)
      setTotalRewards(rows.filter((r) => r.reward_applied).length)
      setUniqueClients(new Set(rows.map((r) => r.card_id)).size)

      // Top products
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

      // Daily breakdown
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
          <Ionicons name="chevron-back" size={22} color="#fff" />
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
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={s.loadingText}>{t.loading}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
          {/* KPI grid */}
          <View style={s.kpiGrid}>
            {[
              { label: a.totalScansLabel, value: totalScans, icon: 'scan-outline', color: '#7c3aed' },
              { label: a.rewardsGivenLabel, value: totalRewards, icon: 'gift-outline', color: '#d97706' },
              { label: a.uniqueClientsLabel, value: uniqueClients, icon: 'people-outline', color: '#059669' },
              { label: a.avgPerDayLabel, value: avgPerDay, icon: 'trending-up-outline', color: '#0891b2' },
              { label: a.rewardRateLabel, value: `${conversionRate}%`, icon: 'trophy-outline', color: '#7c3aed' },
            ].map((kpi) => (
              <View key={kpi.label} style={s.kpiCard}>
                <View style={[s.kpiIcon, { backgroundColor: kpi.color + '22' }]}>
                  <Ionicons name={kpi.icon as any} size={16} color={kpi.color} />
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
              <Ionicons name="bar-chart-outline" size={48} color="#374151" />
              <Text style={s.emptyText}>{a.noScansMsg}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0d2e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80 },
  backText: { color: '#fff', fontSize: 15 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  rangePicker: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  rangeBtn: { flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  rangeBtnActive: { backgroundColor: 'rgba(124,58,237,0.25)', borderColor: '#7c3aed' },
  rangeBtnText: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  rangeBtnTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#a78bfa', fontSize: 14 },
  body: { paddingHorizontal: 16, paddingBottom: 40, gap: 20 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, gap: 5 },
  kpiIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  kpiLabel: { color: '#7c6faa', fontSize: 11 },
  section: { gap: 12 },
  sectionTitle: { color: '#7c6faa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 3, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 10 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: '#7c3aed', borderRadius: 3, minHeight: 3 },
  barLabel: { color: '#4b5563', fontSize: 8 },
  prodRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12 },
  prodRank: { color: '#4b5563', fontWeight: '700', fontSize: 14, width: 24, textAlign: 'center' },
  prodEmoji: { fontSize: 22 },
  prodName: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 14 },
  prodStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prodStat: { color: '#6b7280', fontSize: 12 },
  prodStatNum: { color: '#a78bfa', fontWeight: '700' },
  prodReward: { color: '#d97706', fontSize: 12 },
  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
})
