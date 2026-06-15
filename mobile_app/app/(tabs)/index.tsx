import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Image, ScrollView, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api, Tenant, TenantWithDistance } from '@/lib/supabase'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'

const CATEGORIES = ['all', 'cafe', 'food', 'beauty', 'gym', 'shop'] as const

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  all: 'grid-outline',
  cafe: 'cafe-outline',
  food: 'restaurant-outline',
  beauty: 'sparkles-outline',
  gym: 'fitness-outline',
  shop: 'bag-outline',
}

function hasDistance(t: any): t is TenantWithDistance {
  return 'distance_km' in t
}

function getTimeGreeting(t: ReturnType<typeof getTranslation>): string {
  const h = new Date().getHours()
  if (h < 12) return t.home.greetingMorning
  if (h < 18) return t.home.greetingAfternoon
  return t.home.greetingEvening
}

function totalStamps(cards: { loyalty_state?: Record<string, { count: number; rewards: number }> }[]): number {
  return cards.reduce((sum, c) => {
    return sum + Object.values(c.loyalty_state ?? {}).reduce((s, v) => s + (v?.count ?? 0), 0)
  }, 0)
}

export default function TenantSelectorScreen() {
  const router = useRouter()
  const { language, setTenantData, savedCards, displayName } = useClientStore()
  const t = getTranslation(language)

  const [tenants, setTenants] = useState<(Tenant | TenantWithDistance)[]>([])
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => { loadTenants() }, [])

  async function loadTenants(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setLocationLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        const nearest = await api.getNearestTenants(loc.coords.latitude, loc.coords.longitude, 20)
        if (nearest.length > 0) {
          setTenants(nearest)
          setLocationLoading(false)
          setLoading(false)
          setRefreshing(false)
          return
        }
      }
    } catch {}
    setLocationLoading(false)
    try {
      const all = await api.getAllTenants()
      setTenants(all)
    } catch (e: any) {
      console.error('Failed to load tenants:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filtered = tenants.filter((item) => {
    const q = search.toLowerCase()
    const matchSearch =
      item.name.toLowerCase().includes(q) ||
      (item.city ?? '').toLowerCase().includes(q) ||
      (item.address ?? '').toLowerCase().includes(q)
    const matchCat = category === 'all' || item.metadata?.type === category
    return matchSearch && matchCat
  })

  function handleSelect(tenant: Tenant | TenantWithDistance) {
    setTenantData({ tenantId: tenant.id, tenantName: tenant.name, tenantSlug: tenant.slug })
    router.push({ pathname: '/card', params: { tenantId: tenant.id, tenantName: tenant.name } })
  }

  const stamps = totalStamps(savedCards as any)

  // The greeting + search + chips go inside ListHeaderComponent so they scroll with the list
  const ListHeader = (
    <View>
      {/* Greeting banner — only for returning users */}
      {savedCards.length > 0 && (
        <View style={s.greeting}>
          <View style={s.greetingLeft}>
            <Text style={s.greetingHello}>
              {displayName ? `${getTimeGreeting(t)}, ${displayName}!` : `${getTimeGreeting(t)}! 👋`}
            </Text>
            <Text style={s.greetingSub}>
              {t.home.cardCount(savedCards.length)}
              {stamps > 0 ? `  ·  ${stamps} ${t.dashboard.stamps}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={s.myCardsBtn}
            onPress={() => router.push('/(tabs)/dashboard')}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={16} color="#fff" />
            <Text style={s.myCardsBtnText}>{t.tabs.myCards}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section label */}
      <Text style={s.sectionLabel}>
        {locationLoading ? t.locationSearching : t.partnersNearYou}
      </Text>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder={t.searchPlaceholder}
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipsScroll}
        contentContainerStyle={s.chipsContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.chip, category === cat && s.chipActive]}
            onPress={() => setCategory(cat)}
          >
            <Ionicons
              name={CATEGORY_ICONS[cat]}
              size={14}
              color={category === cat ? '#fff' : '#a78bfa'}
            />
            <Text style={[s.chipText, category === cat && s.chipTextActive]}>
              {t.categories[cat as keyof typeof t.categories]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView style={s.safe}>
      {/* Static top bar with app name only */}
      <View style={s.topBar}>
        <Text style={s.appName}>{t.appName}</Text>
        <TouchableOpacity style={s.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person-circle-outline" size={28} color="#a78bfa" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <>
          {ListHeader}
          <View style={s.center}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={s.loadingText}>{t.loading}</Text>
          </View>
        </>
      ) : filtered.length === 0 ? (
        <FlatList
          data={[]}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 48 }}>🔍</Text>
              <Text style={s.emptyTitle}>{t.noPartners}</Text>
              <Text style={s.emptySubtitle}>{t.tryDifferentSearch}</Text>
              {category !== 'all' && (
                <TouchableOpacity style={s.resetBtn} onPress={() => setCategory('all')}>
                  <Text style={s.resetBtnText}>{t.showAll}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          keyExtractor={() => 'empty'}
          renderItem={null as any}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadTenants(true)}
              tintColor="#7c3aed"
              colors={['#7c3aed']}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => handleSelect(item)}>
              {/* Logo */}
              {item.logo_url ? (
                <Image source={{ uri: item.logo_url }} style={s.logo} />
              ) : (
                <View style={[s.logoFallback, { backgroundColor: (item.brand_color ?? '#7c3aed') + '33' }]}>
                  <Ionicons name={CATEGORY_ICONS[item.metadata?.type ?? 'all']} size={26} color="#fff" />
                </View>
              )}

              {/* Info */}
              <View style={s.cardBody}>
                <View style={s.cardTitleRow}>
                  <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
                  {item.metadata?.type && (
                    <View style={[s.badge, { backgroundColor: categoryColor(item.metadata.type) + '33', borderColor: categoryColor(item.metadata.type) + '66' }]}>
                      <Ionicons name={CATEGORY_ICONS[item.metadata.type] ?? 'grid-outline'} size={10} color={categoryColor(item.metadata.type)} />
                      <Text style={[s.badgeText, { color: categoryColor(item.metadata.type) }]}>
                        {t.categories[item.metadata.type as keyof typeof t.categories] ?? item.metadata.type}
                      </Text>
                    </View>
                  )}
                </View>
                {item.metadata?.description && (
                  <Text style={s.cardDesc} numberOfLines={1}>{item.metadata.description}</Text>
                )}
                <View style={s.cardMeta}>
                  {item.address && (
                    <Text style={s.cardAddress} numberOfLines={1}>
                      📍 {item.address}{item.city ? `, ${item.city}` : ''}
                    </Text>
                  )}
                  {hasDistance(item) && (
                    <Text style={s.distance}>📏 {item.distance_km.toFixed(1)} km</Text>
                  )}
                </View>
              </View>

              {/* Arrow */}
              <View style={s.cardArrow}>
                <View style={s.arrowCircle}>
                  <Ionicons name="chevron-forward" size={18} color="#a78bfa" />
                </View>
                <Text style={s.getCardText}>{t.getCard}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

function categoryColor(type: string): string {
  const colors: Record<string, string> = {
    cafe: '#f59e0b', food: '#10b981', beauty: '#ec4899', gym: '#3b82f6', shop: '#8b5cf6',
  }
  return colors[type] ?? '#a78bfa'
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0d2e' },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 },
  appName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  profileBtn: { padding: 2 },

  // Greeting banner
  greeting: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: 'rgba(124,58,237,0.14)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
    padding: 16,
  },
  greetingLeft: { flex: 1, gap: 4 },
  greetingHello: { color: '#fff', fontSize: 17, fontWeight: '800' },
  greetingSub: { color: '#a78bfa', fontSize: 13, fontWeight: '500' },
  myCardsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#7c3aed', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  myCardsBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Section label
  sectionLabel: { color: '#7c6faa', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 16, marginBottom: 10 },

  // Search
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 11, fontSize: 14 },

  // Chips
  chipsScroll: { flexGrow: 0, marginBottom: 14 },
  chipsContent: { paddingHorizontal: 16, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  chipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  chipText: { color: '#a78bfa', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 40 },
  loadingText: { color: '#a78bfa', fontSize: 14 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySubtitle: { color: '#6b7280', fontSize: 13, textAlign: 'center' },
  resetBtn: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 },
  resetBtnText: { color: '#a78bfa', fontWeight: '600' },

  // Partner cards
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 14, gap: 12 },
  logo: { width: 58, height: 58, borderRadius: 14 },
  logoFallback: { width: 58, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardDesc: { color: '#9ca3af', fontSize: 13 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardAddress: { color: '#6b7280', fontSize: 12, flex: 1 },
  distance: { color: '#a78bfa', fontSize: 11, fontWeight: '600', backgroundColor: 'rgba(124,58,237,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  cardArrow: { alignItems: 'center', gap: 4 },
  arrowCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)', alignItems: 'center', justifyContent: 'center' },
  getCardText: { color: '#7c6faa', fontSize: 10, fontWeight: '500' },
})
