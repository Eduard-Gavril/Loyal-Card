import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

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
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{a.history}</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={loadHistory}>
          <Ionicons name="refresh-outline" size={20} color="#a78bfa" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={s.loadingText}>{t.loading}</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadHistory}>
            <Text style={s.retryText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      ) : records.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="time-outline" size={56} color="#374151" />
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
                  color={isReward ? '#d97706' : '#10b981'}
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
  safe: { flex: 1, backgroundColor: '#0f0d2e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80 },
  backText: { color: '#fff', fontSize: 15 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  refreshBtn: { width: 40, alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { color: '#a78bfa', fontSize: 14 },
  errorText: { color: '#f87171', fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#6b7280', fontSize: 15, textAlign: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  badge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeScan: { backgroundColor: 'rgba(16,185,129,0.15)' },
  badgeReward: { backgroundColor: 'rgba(217,119,6,0.2)' },
  badgeEmoji: { fontSize: 22 },
  rowBody: { flex: 1, gap: 2 },
  clientName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  productName: { color: '#a78bfa', fontSize: 12 },
  rowDate: { color: '#6b7280', fontSize: 11, marginTop: 2 },
})
