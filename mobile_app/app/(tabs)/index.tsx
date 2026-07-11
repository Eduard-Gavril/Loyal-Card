import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Image, ScrollView, RefreshControl,
  Animated, Easing,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api, Tenant, TenantWithDistance } from '@/lib/supabase'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { colors, radius, shadows } from '@/theme'

const CATEGORIES = ['all', 'cafe', 'food', 'beauty', 'gym', 'shop'] as const

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  all: 'grid-outline',
  cafe: 'cafe-outline',
  food: 'restaurant-outline',
  beauty: 'sparkles-outline',
  gym: 'fitness-outline',
  shop: 'bag-outline',
}

export default function TenantSelectorScreen() {
  const router = useRouter()
  const { language, setTenantData } = useClientStore()
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

  // Search + chips live in the list header so they scroll with the list
  const ListHeader = (
    <View>
      <Text style={s.sectionLabel}>
        {locationLoading ? t.locationSearching : t.partnersNearYou}
      </Text>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.inkFaint} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={colors.inkFaint}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.inkFaint} />
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
              color={category === cat ? '#fff' : colors.inkMid}
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
      {/* Top bar */}
      <View style={s.topBar}>
        <Text style={s.pageTitle}>{t.discoverPartners}</Text>
      </View>

      {loading ? (
        <>
          {ListHeader}
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>{t.loading}</Text>
          </View>
        </>
      ) : filtered.length === 0 ? (
        <FlatList
          data={[]}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={s.center}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="search-outline" size={34} color={colors.inkFaint} />
              </View>
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
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item, index }) => (
            <AnimatedPartnerCard
              item={item}
              index={index}
              onPress={() => handleSelect(item)}
              t={t}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

function AnimatedPartnerCard({ item, index, onPress, t }: {
  item: any; index: number; onPress: () => void
  t: ReturnType<typeof getTranslation>
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(18)).current
  useEffect(() => {
    const delay = Math.min(index * 55, 350)
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start()
  }, [])
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={s.card} activeOpacity={0.75} onPress={onPress}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={s.logo} />
        ) : (
          <View style={s.logoFallback}>
            <Ionicons name={CATEGORY_ICONS[item.metadata?.type ?? 'all']} size={24} color={colors.primary} />
          </View>
        )}
        <View style={s.cardBody}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
            {item.metadata?.type && (
              <View style={s.badge}>
                <Text style={s.badgeText}>
                  {t.categories[item.metadata.type as keyof typeof t.categories] ?? item.metadata.type}
                </Text>
              </View>
            )}
          </View>
          {item.metadata?.description && <Text style={s.cardDesc} numberOfLines={1}>{item.metadata.description}</Text>}
          <View style={s.cardMeta}>
            {item.address && (
              <View style={s.metaItem}>
                <Ionicons name="location-outline" size={12} color={colors.inkFaint} />
                <Text style={s.cardAddress} numberOfLines={1}>
                  {item.address}{item.city ? `, ${item.city}` : ''}
                </Text>
              </View>
            )}
            {'distance_km' in item && (
              <Text style={s.distance}>{(item as any).distance_km.toFixed(1)} km</Text>
            )}
          </View>
        </View>
        <View style={s.arrowCircle}>
          <Ionicons name="chevron-forward" size={17} color={colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  pageTitle: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  // ListHeader (sectionLabel/searchWrap/chips) renders in three different
  // contexts — plain JSX during loading, an empty FlatList with no
  // contentContainerStyle, and the data FlatList (s.list, unpadded — see
  // below) — so it carries its own 20px horizontal inset in all three cases.
  sectionLabel: {
    color: colors.inkSoft, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 20, marginBottom: 10,
  },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    ...shadows.card,
  },
  searchInput: { flex: 1, color: colors.ink, paddingVertical: 12, fontSize: 14 },

  // Chips
  chipsScroll: { flexGrow: 0, marginBottom: 16 },
  chipsContent: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.inkMid, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },

  // List — no horizontal padding here: the header already insets itself
  // (see note above), and card items get their own marginHorizontal below.
  // Padding this container too would double the header's inset relative
  // to the cards.
  list: { paddingBottom: 32, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 48 },
  loadingText: { color: colors.inkSoft, fontSize: 14 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.bgDeep,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  emptySubtitle: { color: colors.inkSoft, fontSize: 13, textAlign: 'center' },
  resetBtn: {
    marginTop: 4, paddingHorizontal: 18, paddingVertical: 9,
    backgroundColor: colors.primarySoft, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  resetBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },

  // Partner cards
  card: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 12,
    ...shadows.card,
  },
  logo: { width: 54, height: 54, borderRadius: radius.md, backgroundColor: colors.bgDeep },
  logoFallback: {
    width: 54, height: 54, borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { color: colors.ink, fontWeight: '700', fontSize: 15, flexShrink: 1 },
  badge: {
    borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  cardDesc: { color: colors.inkSoft, fontSize: 12 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1 },
  cardAddress: { color: colors.inkFaint, fontSize: 12, flexShrink: 1 },
  distance: {
    color: colors.primary, fontSize: 11, fontWeight: '700',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  arrowCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
})
