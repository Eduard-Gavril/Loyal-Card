import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StaticBackground from '@/components/StaticBackground'
import LanguageSelector from '@/components/LanguageSelector'
import { useClientStore } from '@/store'
import { api, TenantWithDistance, Tenant } from '@/lib/supabase'
import { getTranslation } from '@/lib/i18n'

const CATEGORIES = [
  'all', 'cafe', 'restaurant', 'beauty', 'gym', 'shop',
] as const

function CategoryIcon({ type, className = 'w-4 h-4' }: { type: string; className?: string }) {
  const paths: Record<string, string> = {
    all:        'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    cafe:       'M17 8h2a2 2 0 010 4h-2M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z',
    restaurant: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    beauty:     'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
    gym:        'M13 10V3L4 14h7v7l9-11h-7z',
    shop:       'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[type] ?? paths.all} />
    </svg>
  )
}

function categoryLabel(key: string, language: string): string {
  const labels: Record<string, Record<string, string>> = {
    all:        { en: 'All', ro: 'Toate', it: 'Tutti' },
    cafe:       { en: 'Cafés', ro: 'Cafenele', it: 'Caffè' },
    restaurant: { en: 'Restaurants', ro: 'Restaurante', it: 'Ristoranti' },
    beauty:     { en: 'Beauty', ro: 'Frumusețe', it: 'Bellezza' },
    gym:        { en: 'Gyms', ro: 'Fitness', it: 'Palestre' },
    shop:       { en: 'Shops', ro: 'Magazine', it: 'Negozi' },
  }
  return labels[key]?.[language] ?? labels[key]?.en ?? key
}

export default function TenantSelector() {
  const navigate = useNavigate()
  const { setTenantData, language } = useClientStore()
  const t = getTranslation(language)

  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const [tenants, setTenants] = useState<(TenantWithDistance | Tenant)[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationError, setLocationError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const titles: Record<string, string> = {
      en: 'Discover Partners — LoyalCard',
      it: 'Scopri i Partner — LoyalCard',
      ro: 'Descoperă Parteneri — LoyalCard',
    }
    document.title = titles[language] || titles.en

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = 'https://loyalcard.net/select-tenant'
  }, [language])

  useEffect(() => {
    requestLocation()
  }, [])

  const requestLocation = async () => {
    setLocationLoading(true)
    setLocationError('')

    if (!navigator.geolocation) {
      setLocationError(t.tenantSelector.geoNotSupported)
      await loadAllTenants()
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        setUserLocation({ lat, lon })

        try {
          const nearestTenants = await api.getNearestTenants(lat, lon, 5)
          if (!nearestTenants || nearestTenants.length === 0) {
            await loadAllTenants()
          } else {
            setTenants(nearestTenants)
          }
        } catch {
          await loadAllTenants()
        } finally {
          setLoading(false)
          setLocationLoading(false)
        }
      },
      async (_error) => {
        setLocationError(t.tenantSelector.geoFailed)
        await loadAllTenants()
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const loadAllTenants = async () => {
    setLoading(true)
    try {
      const allTenants = await api.getAllTenants()
      setTenants(allTenants)
    } catch (error: any) {
      setLocationError(error?.message || t.tenantSelector.locationUnavailable)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTenant = (tenant: TenantWithDistance | Tenant) => {
    setTenantData({
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
    })
    navigate(`/card?tenant=${tenant.id}`)
  }

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.address?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || tenant.metadata?.type === selectedCategory
    return matchesSearch && matchesCategory
  })

  const hasDistance = (tenant: any): tenant is TenantWithDistance =>
    'distance_km' in tenant

  const getCategoryColor = (type: string) => {
    const colors: Record<string, string> = {
      cafe:       'bg-amber-500/20 text-amber-300 border-amber-400/30',
      restaurant: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      beauty:     'bg-pink-500/20 text-pink-300 border-pink-400/30',
      gym:        'bg-blue-500/20 text-blue-300 border-blue-400/30',
      shop:       'bg-purple-500/20 text-purple-300 border-purple-400/30',
    }
    return colors[type] || 'bg-white/10 text-gray-300 border-white/20'
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <StaticBackground />
      </div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      <div className="relative z-20">
        {/* Header */}
        <header className="pt-6 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {language === 'ro' ? 'Înapoi' : language === 'it' ? 'Indietro' : 'Back'}
            </button>
            <LanguageSelector />
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Title */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
              {language === 'ro'
                ? 'Descoperă Partenerii'
                : language === 'it'
                ? 'Scopri i Partner'
                : 'Discover Partners'}
            </h1>
            <p className="text-base sm:text-lg text-gray-200">
              {userLocation
                ? (language === 'ro'
                    ? '📍 Parteneri aproape de tine'
                    : language === 'it'
                    ? '📍 Partner vicino a te'
                    : '📍 Partners near you')
                : (language === 'ro'
                    ? 'Alege un partener și obține cardul tău de fidelitate gratuit'
                    : language === 'it'
                    ? 'Scegli un partner e ottieni la tua carta fedeltà gratuita'
                    : 'Choose a partner and get your free loyalty card')}
            </p>
          </div>

          {/* Location searching */}
          {locationLoading && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/20 mb-4 flex items-center gap-3 text-white">
              <div className="animate-spin text-xl">📍</div>
              <span className="text-sm">{t.tenantSelector.searchingLocation}</span>
            </div>
          )}

          {/* Location error */}
          {locationError && (
            <div className="bg-yellow-500/20 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-yellow-400/50 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-yellow-100 text-sm mb-3">{locationError}</p>
                  <button
                    onClick={requestLocation}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all text-sm font-semibold"
                  >
                    {t.tenantSelector.retry}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder={t.tenantSelector.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* Category filter chips */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-primary-500 border-primary-400 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/20'
                }`}
              >
                <CategoryIcon type={cat} className="w-3.5 h-3.5" />
                <span>{categoryLabel(cat, language)}</span>
              </button>
            ))}
          </div>

          {/* Tenants list */}
          {loading ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 sm:p-12 border border-white/20 text-center">
              <div className="animate-pulse text-white text-lg">{t.tenantSelector.loadingStores}</div>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 sm:p-12 border border-white/20 text-center">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="text-white text-lg mb-1">{t.tenantSelector.noStoresFound}</p>
              <p className="text-gray-300 text-sm">{t.tenantSelector.tryDifferentSearch}</p>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm border border-white/20 transition-all"
                >
                  {language === 'ro' ? 'Arată toți' : language === 'it' ? 'Mostra tutti' : 'Show all'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelectTenant(tenant)}
                  className="w-full bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20 hover:border-primary-400 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary-500/30 text-left"
                >
                  <div className="flex items-start gap-4">
                    {/* Logo or icon */}
                    {tenant.logo_url ? (
                      <img
                        src={tenant.logo_url}
                        alt={tenant.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${tenant.logo_url ? 'hidden' : ''}`}
                      style={{ backgroundColor: (tenant.brand_color ?? '#8b5cf6') + '33' }}
                    >
                      <CategoryIcon type={tenant.metadata?.type ?? 'all'} className="w-7 h-7 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          {tenant.name}
                        </h3>
                        {tenant.metadata?.type && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(tenant.metadata.type)}`}>
                            <CategoryIcon type={tenant.metadata.type} className="w-3 h-3" />
                            {categoryLabel(tenant.metadata.type, language)}
                          </span>
                        )}
                      </div>

                      {tenant.metadata?.description && (
                        <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                          {tenant.metadata.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {tenant.address && (
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <span>📍</span>
                            <span>
                              {tenant.address}
                              {tenant.city && `, ${tenant.city}`}
                            </span>
                          </p>
                        )}
                        {hasDistance(tenant) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-500/20 border border-primary-400/30 rounded-lg text-xs text-primary-300 font-semibold">
                            📏 {tenant.distance_km.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow + CTA hint */}
                    <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-400/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <span className="text-xs text-primary-300 font-medium whitespace-nowrap">
                        {language === 'ro' ? 'Obții cardul' : language === 'it' ? 'Ottieni carta' : 'Get card'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Info box */}
          <div className="mt-8 bg-primary-500/10 backdrop-blur-xl rounded-2xl p-5 border border-primary-400/30">
            <div className="flex items-start gap-3 text-sm text-gray-200">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-semibold text-white mb-1">
                  {language === 'ro' ? 'Cum funcționează?' : language === 'it' ? 'Come funziona?' : 'How does it work?'}
                </p>
                <p>
                  {language === 'ro'
                    ? 'Alege un partener, obții cardul tău de fidelitate gratuit. Acumulează timbre la fiecare vizită și câștigă recompense. Fără aplicație, fără card fizic.'
                    : language === 'it'
                    ? "Scegli un partner, ottieni la tua carta fedeltà gratuita. Accumula timbri ad ogni visita e guadagna premi. Senza app, senza carta fisica."
                    : 'Choose a partner, get your free loyalty card instantly. Collect stamps at every visit and earn rewards. No app, no plastic card.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
