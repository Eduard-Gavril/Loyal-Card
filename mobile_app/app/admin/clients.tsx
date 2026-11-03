import { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAdminStore, useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { colors } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import PressableScale from '@/ui/PressableScale'
import Empty from '@/ui/Empty'
import SearchField from '@/ui/SearchField'
import Button from '@/ui/Button'
import Txt from '@/ui/Txt'

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

  const filtered = clients.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? '').includes(search))

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <PressableScale accessibilityRole="button" accessibilityLabel="Refresh" onPress={loadClients} hitSlop={6} style={s.headerBtn}>
              <Ionicons name="refresh-outline" size={22} color={colors.primary} />
            </PressableScale>
          ),
        }}
      />
      <ScreenScroll title={a.clients} bottomPad={40}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Cerca per nome o telefono..." />
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
            <Button title="Riprova" onPress={loadClients} style={{ alignSelf: 'stretch' }} />
          </View>
        ) : filtered.length === 0 ? (
          <Empty icon="people-outline" title={a.noClients} />
        ) : (
          <ListGroup footer={`${filtered.length}`}>
            {filtered.map((item) => {
              const { stamps, rewards } = getTotals(item.cards)
              const initial = (item.name ?? '?').charAt(0).toUpperCase()
              return (
                <ListRow
                  key={item.id}
                  leading={
                    <View style={s.avatar}>
                      <Txt v="headline" tone="tint">
                        {initial}
                      </Txt>
                    </View>
                  }
                  title={item.name ?? 'Anonimo'}
                  subtitle={`${item.phone ? item.phone + ' · ' : ''}${stamps} ${a.stamps} · ${rewards} ${a.rewards} · ${item.cards.length} card`}
                  onPress={item.cards.length > 0 ? () => router.push('/admin/scanner') : undefined}
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
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 12, paddingVertical: 48, paddingHorizontal: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
})
