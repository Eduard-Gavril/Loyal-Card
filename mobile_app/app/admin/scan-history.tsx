import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { exportExcel } from '@/lib/excel'
import { colors, radius, shadows } from '@/theme'

interface ScanEvent {
  id: string
  scanned_at: string
  reward_applied: boolean
  card_id: string
  products: { name: string; metadata: any } | null
  cards: { qr_code: string; clients: { name: string | null } | null } | null
}

export default function ScanHistoryScreen() {
  const router = useRouter()
  const { tenantId } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin

  const [records, setRecords] = useState<ScanEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadHistory() }, [])

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
    if (records.length === 0) return
    setExporting(true)
    try {
      const rows = records.map((r) => ({
        [a.history + ' — Data']: new Date(r.scanned_at).toLocaleString(
          language === 'en' ? 'en-GB' : language === 'ro' ? 'ro-RO' : 'it-IT'
        ),
        Cliente: (r.cards as any)?.clients?.name ?? a.anonClient,
        Prodotto: (r.products as any)?.name ?? a.productDefault,
        Premio: r.reward_applied ? '✅' : '—',
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
    return new Date(iso).toLocaleString(
      language === 'en' ? 'en-GB' : language === 'ro' ? 'ro-RO' : 'it-IT',
      { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{a.history}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.headerBtn} onPress={loadHistory}>
            <Ionicons name="refresh-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.headerBtn, s.exportBtn, records.length === 0 && { opacity: 0.3 }]}
            onPress={handleExport}
            disabled={records.length === 0 || exporting}
          >
            {exporting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="download-outline" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>{t.loading}</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadHistory}>
            <Text style={s.retryText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      ) : records.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="time-outline" size={56} color={colors.inkFaint} />
          <Text style={s.emptyText}>{a.noHistory}</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const emoji = (item.products as any)?.metadata?.emoji ?? '🛍️'
            const productName = (item.products as any)?.name ?? a.productDefault
            const clientName = (item.cards as any)?.clients?.name ?? a.anonClient
            const isReward = item.reward_applied
            return (
              <View style={s.row}>
                <View style={[s.badge, isReward ? s.badgeReward : s.badgeScan]}>
                  <Text style={s.badgeEmoji}>{isReward ? '🎁' : emoji}</Text>
                </View>
                <View style={s.rowBody}>
                  <Text style={s.clientName} numberOfLines={1}>{clientName}</Text>
                  <Text style={s.productName} numberOfLines={1}>
                    {productName}{isReward ? ' · ' + a.rewardLabel : ''}
                  </Text>
                  <Text style={s.rowDate}>{formatDate(item.scanned_at)}</Text>
                </View>
                <Ionicons
                  name={isReward ? 'gift-outline' : 'checkmark-circle'}
                  size={20}
                  color={isReward ? colors.primary : colors.success}
                />
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 80 },
  backText: { color: colors.ink, fontSize: 15, fontWeight: '500' },
  title: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  headerBtn: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  exportBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { color: colors.inkSoft, fontSize: 14 },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.md },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyText: { color: colors.inkSoft, fontSize: 15, textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.card,
  },
  badge: {
    width: 48, height: 48, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeScan: { backgroundColor: colors.bgDeep },
  badgeReward: { backgroundColor: colors.primarySoft },
  badgeEmoji: { fontSize: 22 },
  rowBody: { flex: 1, gap: 2 },
  clientName: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  productName: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  rowDate: { color: colors.inkFaint, fontSize: 11, marginTop: 2 },
})
