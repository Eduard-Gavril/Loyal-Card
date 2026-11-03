import { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { usePlanUsage } from '@/lib/plan'
import { api, supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { exportExcel } from '@/lib/excel'
import { colors, continuous } from '@/theme'
import ProductIcon from '@/components/ProductIcon'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import Segmented from '@/ui/Segmented'
import PressableScale from '@/ui/PressableScale'
import Empty from '@/ui/Empty'
import Txt from '@/ui/Txt'

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

interface StaffScanCount {
  label: string
  count: number
}

interface RecentScanDetail {
  id: string
  scanned_at: string
  product_name: string
  product_emoji?: string
  client_label: string
  staff_label: string
  reward_applied: boolean
}

const RANGE_DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 }
const RANGE_LABELS: Record<Range, string> = { '7d': '7d', '30d': '30d', '90d': '90d' }

export default function AdminReportsScreen() {
  const { tenantId, user, role } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin
  const { usage: plan } = usePlanUsage(tenantId)
  const isOwner = role === 'owner'

  const [range, setRange] = useState<Range>('30d')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [totalScans, setTotalScans] = useState(0)
  const [totalRewards, setTotalRewards] = useState(0)
  const [uniqueClients, setUniqueClients] = useState(0)
  const [topProducts, setTopProducts] = useState<ProductStat[]>([])
  const [dailyStats, setDailyStats] = useState<DayStat[]>([])
  const [staffScans, setStaffScans] = useState<StaffScanCount[]>([])
  const [recentScans, setRecentScans] = useState<RecentScanDetail[]>([])

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
        .select('id, scanned_at, reward_applied, admin_id, client_id, products(name, metadata), clients(name)')
        .eq('tenant_id', tenantId!)
        .gte('scanned_at', sinceISO)
        .order('scanned_at', { ascending: false })

      const rows = (events as any[]) ?? []

      setTotalScans(rows.length)
      setTotalRewards(rows.filter((r) => r.reward_applied).length)
      setUniqueClients(new Set(rows.map((r) => r.client_id)).size)

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
      setDailyStats([...dayMap.values()].sort((x, y) => x.date.localeCompare(y.date)).slice(-14))

      // Resolve admin_id -> display label: caller's own admin row (owner sees
      // "Tu", staff sees their own email) plus, if owner, every staff account
      // so the breakdown below can name each of them instead of just showing
      // raw ids.
      const youLabel = a.youOwnerLabel
      const staffGeneric = a.staffGenericLabel
      const adminLabels = new Map<string, string>()
      try {
        const { data: ownAdmin } = await supabase.from('admins').select('id').eq('user_id', user?.id).single()
        if (ownAdmin) adminLabels.set(ownAdmin.id, isOwner ? youLabel : (user?.email || staffGeneric))
      } catch {
        // Own admin row lookup failed — staff labels fall back to a generic name.
      }
      if (isOwner) {
        try {
          const staffResult: any = await api.listStaffAdmins()
          ;(staffResult?.staff ?? []).forEach((st: any) => {
            adminLabels.set(st.id, st.email || `${staffGeneric} ${String(st.id).slice(0, 6)}`)
          })
        } catch {
          // Staff list failed to load — per-staff scan breakdown shows generic labels.
        }
      }
      const labelForAdmin = (adminId: string | null) =>
        adminId ? (adminLabels.get(adminId) ?? `${staffGeneric} ${adminId.slice(0, 6)}`) : staffGeneric

      const staffCounts = new Map<string, number>()
      for (const e of rows) {
        const key = e.admin_id ?? 'unknown'
        staffCounts.set(key, (staffCounts.get(key) ?? 0) + 1)
      }
      setStaffScans(
        [...staffCounts.entries()]
          .map(([adminId, count]) => ({ label: labelForAdmin(adminId === 'unknown' ? null : adminId), count }))
          .sort((x, y) => y.count - x.count)
      )

      const clientLabel = (name: string | null | undefined, clientId: string | null | undefined) =>
        name?.trim() || (clientId ? `${a.clientDefault} #${clientId.slice(0, 8)}` : '—')

      setRecentScans(
        rows.slice(0, 15).map((e) => ({
          id: e.id,
          scanned_at: e.scanned_at,
          product_name: e.products?.name ?? a.productDefault,
          product_emoji: e.products?.metadata?.emoji,
          client_label: clientLabel(e.clients?.name, e.client_id),
          staff_label: labelForAdmin(e.admin_id),
          reward_applied: e.reward_applied,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    if (plan && !plan.limits.can_export) { Alert.alert(a.planTitle, a.planExportLocked); return }
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

  const timeLocale = language === 'ro' ? 'ro-RO' : language === 'en' ? 'en-GB' : 'it-IT'

  const KPIS = [
    { label: a.totalScansLabel, value: totalScans, icon: 'scan-outline' },
    { label: a.rewardsGivenLabel, value: totalRewards, icon: 'gift-outline' },
    { label: a.uniqueClientsLabel, value: uniqueClients, icon: 'people-outline' },
    { label: a.avgPerDayLabel, value: avgPerDay, icon: 'trending-up-outline' },
    { label: a.rewardRateLabel, value: `${conversionRate}%`, icon: 'trophy-outline' },
  ] as const

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Excel"
              onPress={handleExport}
              disabled={loading || exporting || totalScans === 0}
              hitSlop={6}
              style={[s.headerBtn, (loading || totalScans === 0) && { opacity: 0.35 }]}
            >
              {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="share-outline" size={22} color={colors.primary} />}
            </PressableScale>
          ),
        }}
      />
      <ScreenScroll title={a.reports} bottomPad={40}>
        <View style={{ marginBottom: 20 }}>
          <Segmented
            options={[
              { value: '7d', label: RANGE_LABELS['7d'] },
              { value: '30d', label: RANGE_LABELS['30d'] },
              { value: '90d', label: RANGE_LABELS['90d'] },
            ]}
            value={range}
            onChange={(v) => setRange(v as Range)}
          />
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Txt v="subhead" tone="secondary">
              {t.loading}
            </Txt>
          </View>
        ) : totalScans === 0 ? (
          <Empty icon="bar-chart-outline" title={a.noScansMsg} />
        ) : (
          <>
            <View style={s.kpiGrid}>
              {KPIS.map((kpi) => (
                <View key={kpi.label} style={s.kpi}>
                  <Ionicons name={kpi.icon} size={18} color={colors.primary} />
                  <Txt v="title2">{kpi.value}</Txt>
                  <Txt v="footnote" tone="secondary" numberOfLines={2}>
                    {kpi.label}
                  </Txt>
                </View>
              ))}
            </View>

            {dailyStats.length > 0 && (
              <View style={s.chartCard}>
                <Txt v="headline" style={{ marginBottom: 14 }}>
                  {a.scanTrendTitle}
                </Txt>
                <View style={s.chart} accessible accessibilityLabel={a.scanTrendTitle}>
                  {dailyStats.map((d) => (
                    <View key={d.date} style={s.barCol}>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { height: `${Math.max(Math.round((d.scans / maxScans) * 100), 4)}%` }]} />
                      </View>
                      <Txt v="caption2" tone="secondary" numberOfLines={1}>
                        {d.date.slice(8)}
                      </Txt>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {topProducts.length > 0 && (
              <ListGroup header={a.topProductsTitle}>
                {topProducts.map((p, i) => (
                  <ListRow
                    key={p.name}
                    leading={
                      <View style={s.rank}>
                        <Txt v="subhead" tone="tint" style={{ fontWeight: '700' }}>
                          {i + 1}
                        </Txt>
                      </View>
                    }
                    title={p.name}
                    subtitle={`${p.scans} scans${p.rewards > 0 ? ` · ${p.rewards} ${a.rewardLabel}` : ''}`}
                    right={<ProductIcon emoji={p.emoji} size={20} color={colors.label} />}
                  />
                ))}
              </ListGroup>
            )}

            {isOwner && staffScans.length > 0 && (
              <ListGroup header={a.scansByStaffTitle}>
                {staffScans.map((st) => (
                  <View key={st.label} style={s.staffRow}>
                    <View style={s.staffTop}>
                      <Txt v="body" numberOfLines={1} style={{ flex: 1 }}>
                        {st.label}
                      </Txt>
                      <Txt v="body" tone="secondary">
                        {st.count}
                      </Txt>
                    </View>
                    <View style={s.staffTrack}>
                      <View style={[s.staffFill, { width: `${Math.round((st.count / (staffScans[0]?.count || 1)) * 100)}%` }]} />
                    </View>
                  </View>
                ))}
              </ListGroup>
            )}

            {recentScans.length > 0 && (
              <ListGroup header={a.recentScansTitle}>
                {recentScans.map((scan) => (
                  <ListRow
                    key={scan.id}
                    leading={
                      <View style={s.badge}>
                        <ProductIcon emoji={scan.product_emoji} size={20} color={colors.label} />
                      </View>
                    }
                    title={`${scan.product_name} · ${scan.client_label}`}
                    subtitle={`${scan.staff_label}${scan.reward_applied ? ' · ' + a.rewardLabel : ''}`}
                    value={new Date(scan.scanned_at).toLocaleString(timeLocale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  />
                ))}
              </ListGroup>
            )}
          </>
        )}
      </ScreenScroll>
    </>
  )
}

const s = StyleSheet.create({
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  kpi: { width: '48.4%', gap: 4, padding: 16, borderRadius: 20, backgroundColor: colors.grouped, ...continuous },
  chartCard: { padding: 16, borderRadius: 22, backgroundColor: colors.grouped, marginBottom: 24, ...continuous },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140 },
  barCol: { flex: 1, height: '100%', alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: colors.primary },
  rank: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', ...continuous },
  badge: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', ...continuous },
  staffRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  staffTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  staffTrack: { height: 6, borderRadius: 3, backgroundColor: colors.fill, overflow: 'hidden' },
  staffFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
})
