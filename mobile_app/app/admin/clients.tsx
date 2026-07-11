import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAdminStore } from '@/store'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { colors, radius, shadows } from '@/theme'

interface ClientRecord {
  id: string
  name: string
  phone: string | null
  created_at: string
  cards: { id: string; loyalty_state: Record<string, { count: number; rewards: number }> }[]
}

export default function ClientsScreen() {
  const router = useRouter()
  const { tenantId } = useAdminStore()
  const { language } = useClientStore()
  const t = getTranslation(language)
  const a = t.admin

  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    setError('')
    try {
      const { data: cards, error: dbErr } = await supabase
        .from('cards')
        .select('id, loyalty_state, clients(id, name, phone, created_at)')
        .eq('tenant_id', tenantId!)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(300)
      if (dbErr) throw dbErr

      const byClient = new Map<string, ClientRecord>()
      for (const card of (cards as any[]) ?? []) {
        const cl = card.clients
        if (!cl) continue
        if (!byClient.has(cl.id)) {
          byClient.set(cl.id, { id: cl.id, name: cl.name, phone: cl.phone, created_at: cl.created_at, cards: [] })
        }
        byClient.get(cl.id)!.cards.push({ id: card.id, loyalty_state: card.loyalty_state ?? {} })
      }
      setClients([...byClient.values()])
    } catch (e: any) {
      setError(e?.message ?? 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }

  function getTotals(cards: ClientRecord['cards']) {
    let stamps = 0
    let rewards = 0
    for (const card of cards) {
      const state = card.loyalty_state ?? {}
      stamps += Object.values(state).reduce((acc: number, v: any) => acc + (v?.count ?? 0), 0)
      rewards += Object.values(state).reduce((acc: number, v: any) => acc + (v?.rewards ?? 0), 0)
    }
    return { stamps, rewards }
  }

  const filtered = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  )

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
          <Text style={s.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{a.clients}</Text>
        <TouchableOpacity style={s.refreshBtn} onPress={loadClients}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.inkFaint} />
        <TextInput
          style={s.searchInput}
          placeholder="Cerca per nome o telefono..."
          placeholderTextColor={colors.inkFaint}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={colors.inkFaint} />
          </TouchableOpacity>
        )}
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
          <TouchableOpacity style={s.retryBtn} onPress={loadClients}>
            <Text style={s.retryText}>Riprova</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="people-outline" size={56} color={colors.inkFaint} />
          <Text style={s.emptyText}>{a.noClients}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const { stamps, rewards } = getTotals(item.cards)
            const hasCards = item.cards.length > 0
            return (
              <View style={s.row}>
                <View style={s.avatar}>
                  <Text style={s.avatarLetter}>
                    {(item.name ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={s.rowBody}>
                  <Text style={s.clientName} numberOfLines={1}>{item.name ?? 'Anonimo'}</Text>
                  {item.phone && (
                    <Text style={s.clientPhone}>{item.phone}</Text>
                  )}
                  <View style={s.statsRow}>
                    <View style={s.stat}>
                      <Text style={s.statNum}>{stamps}</Text>
                      <Text style={s.statLabel}>{a.stamps}</Text>
                    </View>
                    <View style={s.statDivider} />
                    <View style={s.stat}>
                      <Text style={s.statNum}>{rewards}</Text>
                      <Text style={s.statLabel}>{a.rewards}</Text>
                    </View>
                    <View style={s.statDivider} />
                    <View style={s.stat}>
                      <Text style={s.statNum}>{item.cards.length}</Text>
                      <Text style={s.statLabel}>card</Text>
                    </View>
                  </View>
                </View>
                {hasCards && (
                  <TouchableOpacity
                    style={s.stampBtn}
                    onPress={() => router.push('/admin/scanner')}
                  >
                    <Ionicons name="scan-outline" size={18} color="#fff" />
                    <Text style={s.stampBtnText}>Scanner</Text>
                  </TouchableOpacity>
                )}
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
  refreshBtn: { width: 40, alignItems: 'flex-end' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong,
    paddingHorizontal: 12, paddingVertical: 10,
    ...shadows.card,
  },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14, padding: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.inkSoft, fontSize: 14 },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.md },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyText: { color: colors.inkSoft, fontSize: 15, textAlign: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.card,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  rowBody: { flex: 1, gap: 4 },
  clientName: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  clientPhone: { color: colors.inkSoft, fontSize: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  stat: { alignItems: 'center', gap: 1 },
  statNum: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  statLabel: { color: colors.inkFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 20, backgroundColor: colors.border },
  stampBtn: {
    alignItems: 'center', gap: 3,
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  stampBtnText: { color: '#fff', fontSize: 9, fontWeight: '700' },
})
