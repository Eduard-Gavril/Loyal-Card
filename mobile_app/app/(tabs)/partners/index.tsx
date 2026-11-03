import { useState, useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator, Image, ScrollView, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { api, Tenant, TenantWithDistance } from '@/lib/supabase'
import { useClientStore } from '@/store'
import { getTranslation } from '@/lib/i18n'
import { colors, continuous } from '@/theme'
import { ScreenScroll } from '@/ui/Screen'
import { ListGroup, ListRow } from '@/ui/List'
import PressableScale from '@/ui/PressableScale'
import Empty from '@/ui/Empty'
import SearchField from '@/ui/SearchField'
import Txt from '@/ui/Txt'

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

  useEffect(() => {
    loadTenants()
  }, [])

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

  return (
    <>
      <ScreenScroll
        title={t.discoverPartners}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTenants(true)} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <SearchField value={search} onChangeText={setSearch} placeholder={t.searchPlaceholder} />

        {/* Category filter: one tinted chip is selected at a time */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chips}>
          {CATEGORIES.map((cat) => {
            const selected = category === cat
            return (
              <PressableScale
                key={cat}
                haptic="selection"
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCategory(cat)}
                style={[s.chip, selected && s.chipSelected]}
              >
                <Ionicons name={CATEGORY_ICONS[cat]} size={16} color={selected ? colors.onPrimary : colors.labelSecondary} />
                <Txt v="subhead" tone={selected ? 'onTint' : 'secondary'} style={{ fontWeight: selected ? '600' : '400' }}>
                  {t.categories[cat as keyof typeof t.categories]}
                </Txt>
              </PressableScale>
            )
          })}
        </ScrollView>

        <Txt v="footnote" tone="secondary" style={s.section}>
          {(locationLoading ? t.locationSearching : t.partnersNearYou).toUpperCase()}
        </Txt>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Txt v="subhead" tone="secondary">
              {t.loading}
            </Txt>
          </View>
        ) : filtered.length === 0 ? (
          <Empty
            icon="search-outline"
            title={t.noPartners}
            message={t.tryDifferentSearch}
            actionLabel={category !== 'all' ? t.showAll : undefined}
            onAction={category !== 'all' ? () => setCategory('all') : undefined}
          />
        ) : (
          <ListGroup>
            {filtered.map((item: any) => {
              const type = item.metadata?.type as string | undefined
              const category = type ? t.categories[type as keyof typeof t.categories] ?? type : undefined
              const where = [item.address && `${item.address}${item.city ? `, ${item.city}` : ''}`].filter(Boolean).join('')
              const subtitle = [category, item.metadata?.description, where].filter(Boolean).join(' · ')
              return (
                <ListRow
                  key={item.id}
                  leading={
                    item.logo_url ? (
                      <Image source={{ uri: item.logo_url }} style={s.logo} accessibilityIgnoresInvertColors />
                    ) : (
                      <View style={s.logoFallback}>
                        <Ionicons name={CATEGORY_ICONS[type ?? 'all']} size={22} color={colors.primary} />
                      </View>
                    )
                  }
                  title={item.name}
                  subtitle={subtitle || undefined}
                  value={'distance_km' in item ? `${(item as any).distance_km.toFixed(1)} km` : undefined}
                  onPress={() => handleSelect(item)}
                  chevron
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
  chipsScroll: { marginHorizontal: -16, marginBottom: 20 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.fill,
    ...continuous,
  },
  chipSelected: { backgroundColor: colors.primary },
  section: { marginLeft: 16, marginBottom: 6 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  logo: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.fill, ...continuous },
  logoFallback: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', ...continuous },
})
