import { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { usePlanUsage } from '@/lib/plan'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { exportExcel } from '@/lib/excel'
import { colors, continuous } from '@/theme'
import ProductIcon from '@/components/ProductIcon'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import PressableScale from '@/ui/PressableScale'
import Empty from '@/ui/Empty'
import Button from '@/ui/Button'
import Txt from '@/ui/Txt'

interface ScanEvent {
  id: string
  scanned_at: string
  reward_applied: boolean
  card_id: string
  products: { name: string; metadata: any } | null
  cards: { qr_code: string; clients: { name: string | null } | null } | null
}

export default function ScanHistoryScreen() {
  const { tenantId } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin
  const { usage: plan } = usePlanUsage(tenantId)

  const [records, setRecords] = useState<ScanEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setLoading(true)
    setError('')
    try {
      const { data, error: dbErr } = await supabase
        .from('scan_events')
        .select('id, scanned_at, reward_applied, card_id, products(name, metadata), cards(qr_code, clients(name))')
        .eq('tenant_id', tenantId!)
        .order('scanned_at', { ascending: false })
        .limit(200)
      if (dbErr) throw dbErr
      setRecords((data as any[]) ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    if (plan && !plan.limits.can_export) { Alert.alert(a.planTitle, a.planExportLocked); return }
    if (records.length === 0) return
    setExporting(true)
    try {
      const rows = records.map((r) => ({
        [a.history + ' — Data']: new Date(r.scanned_at).toLocaleString(language === 'en' ? 'en-GB' : language === 'ro' ? 'ro-RO' : 'it-IT'),
        Cliente: (r.cards as any)?.clients?.name ?? a.anonClient,
        Prodotto: (r.products as any)?.name ?? a.productDefault,
        Premio: r.reward_applied ? 'Si' : '—',
        'QR Code': (r.cards as any)?.qr_code ?? '',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 24 }, { wch: 8 }, { wch: 36 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Scan History')
      const date = new Date().toISOString().slice(0, 10)
      await exportExcel(wb, `loyalcard_scans_${date}.xlsx`)
    } catch (e: any) {
      Alert.alert('Export Error', e?.message ?? 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(language === 'en' ? 'en-GB' : language === 'ro' ? 'ro-RO' : 'it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={s.actions}>
              <PressableScale accessibilityRole="button" accessibilityLabel="Refresh" onPress={loadHistory} hitSlop={6} style={s.headerBtn}>
                <Ionicons name="refresh-outline" size={22} color={colors.primary} />
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Export"
                onPress={handleExport}
                disabled={records.length === 0 || exporting}
                hitSlop={6}
                style={[s.headerBtn, records.length === 0 && { opacity: 0.35 }]}
              >
                {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="share-outline" size={22} color={colors.primary} />}
              </PressableScale>
            </View>
          ),
        }}
      />
      <ScreenScroll title={a.history} bottomPad={40}>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Txt v="subhead" tone="secondary">
              {t.loading}
            </Txt>
          </View>
        ) : error ? (
          <View style={s.center}>
            <Ionicons name="alert-circle-outline" size={44} color={colors.danger} />
            <Txt v="body" tone="danger" style={{ textAlign: 'center' }}>
              {error}
            </Txt>
            <Button title="Riprova" onPress={loadHistory} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : records.length === 0 ? (
          <Empty icon="time-outline" title={a.noHistory} />
        ) : (
          <ListGroup>
            {records.map((item) => {
              const emoji = (item.products as any)?.metadata?.emoji
              const productName = (item.products as any)?.name ?? a.productDefault
              const clientName = (item.cards as any)?.clients?.name ?? a.anonClient
              const isReward = item.reward_applied
              return (
                <ListRow
                  key={item.id}
                  leading={
                    <View style={[s.badge, isReward && { backgroundColor: colors.primarySoft }]}>
                      {isReward ? <Ionicons name="gift" size={20} color={colors.primary} /> : <ProductIcon emoji={emoji} size={20} color={colors.label} />}
                    </View>
                  }
                  title={clientName}
                  subtitle={`${productName}${isReward ? ' · ' + a.rewardLabel : ''}`}
                  value={formatDate(item.scanned_at)}
                />
              )
            })}
          </ListGroup>
        )}
      </ScreenScroll>
    </>
  )
}

const s = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 16 },
  badge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center', ...continuous },
})
