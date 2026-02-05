import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { useClientStore } from '@/store'
import { api, TenantWithDistance, Tenant } from '@/lib/supabase'
import { getTranslation } from '@/lib/i18n'

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

  useEffect(() => {
    requestLocation()
  }, [])

  const requestLocation = async () => {
    setLocationLoading(true)
    setLocationError('')

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('La geolocalizzazione non è supportata dal tuo browser')
      await loadAllTenants()
      setLocationLoading(false)
      return
    }

    // Request user location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        setUserLocation({ lat, lon })
        
        try {
          // Get nearest tenants
          console.log('Requesting nearest tenants for:', { lat, lon })
          const nearestTenants = await api.getNearestTenants(lat, lon, 5)
          console.log('Nearest tenants received:', nearestTenants)
          
          // If no nearby tenants found, load all tenants
          if (!nearestTenants || nearestTenants.length === 0) {
            console.log('No nearby tenants found, loading all tenants')
            await loadAllTenants()
          } else {
            setTenants(nearestTenants)
          }
        } catch (error) {
          console.error('Error fetching nearest tenants:', error)
          await loadAllTenants()
        } finally {
          setLoading(false)
          setLocationLoading(false)
        }
      },
      async (error) => {
        console.error('Geolocation error:', error)
        setLocationError('Non è stato possibile ottenere la tua posizione')
        await loadAllTenants()
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const loadAllTenants = async () => {
    setLoading(true)
    try {
      const allTenants = await api.getAllTenants()
      console.log('All tenants loaded:', allTenants)
      setTenants(allTenants)
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTenant = (tenant: TenantWithDistance | Tenant) => {
    console.log('🏪 Tenant selected:', {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug
    })
    
    // Save selected tenant to store
    setTenantData({
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug
    })
    
    console.log('✅ Tenant data saved, navigating to /card')
    
    // Navigate to card generation with tenant in URL as fallback
    navigate(`/card?tenant=${tenant.id}`)
  }

  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasDistance = (tenant: any): tenant is TenantWithDistance => {
    return 'distance_km' in tenant
  }

  const getTenantIcon = (tenant: Tenant) => {
    const type = tenant.metadata?.type || 'default'
    const icons: Record<string, string> = {
      cafe: '☕',
      gym: '💪',
      beauty: '💅',
      restaurant: '🍽️',
      shop: '🛍️',
      default: '🏪'
    }
    return icons[type] || icons.default
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <DarkVeil hueShift={180} speed={0.4} warpAmount={0.08} />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      {/* Content */}
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
              {t.admin.scanner.back}
            </button>
            <LanguageSelector />
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Title section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t.tenantSelector.chooseStore}
            </h1>
            <p className="text-lg sm:text-xl text-gray-200">
              {userLocation 
                ? '📍 ' + (language === 'ro' ? 'Magazine aproape de tine' : 'Stores near you')
                : t.tenantSelector.allStores}
            </p>
          </div>

          {/* Location status */}
          {locationLoading && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 mb-6">
              <div className="flex items-center gap-3 text-white">
                <div className="animate-spin">📍</div>
                <span>{t.tenantSelector.searchingLocation}</span>
              </div>
            </div>
          )}

          {/* User location info (for debugging) */}
          {userLocation && (
            <div className="bg-blue-500/20 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-blue-400/50 mb-6">
              <div className="flex items-start gap-3 text-sm">
                <span className="text-2xl">📍</span>
                <div className="flex-1 text-blue-100">
                  <p className="font-semibold mb-1">{language === 'ro' ? 'Locație detectată' : 'Location detected'}</p>
                  <p className="text-xs">Lat: {userLocation.lat.toFixed(6)}, Lon: {userLocation.lon.toFixed(6)}</p>
                </div>
              </div>
            </div>
          )}

          {locationError && (
            <div className="bg-yellow-500/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-yellow-400/50 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-200 mb-2">
                    {t.tenantSelector.locationUnavailable}
                  </h3>
                  <p className="text-yellow-100 text-sm mb-3">{locationError}</p>
                  <button
                    onClick={requestLocation}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all duration-300 text-sm font-semibold"
                  >
                    {t.tenantSelector.retry}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder={t.tenantSelector.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tenants list */}
          {loading ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-12 border border-white/20 text-center">
              <div className="animate-pulse text-white text-xl">{t.tenantSelector.loadingStores}</div>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-12 border border-white/20 text-center">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="text-white text-xl">{t.tenantSelector.noStoresFound}</p>
              <p className="text-gray-300 mt-2">{t.tenantSelector.tryDifferentSearch}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelectTenant(tenant)}
                  className="w-full bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 hover:border-primary-400 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-primary-500/30 text-left"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ backgroundColor: tenant.brand_color + '33' }}
                    >
                      {getTenantIcon(tenant)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {tenant.name}
                      </h3>
                      
                      {tenant.metadata?.description && (
                        <p className="text-sm text-gray-300 mb-2">
                          {tenant.metadata.description}
                        </p>
                      )}

                      {tenant.address && (
                        <p className="text-sm text-gray-300 flex items-start gap-2">
                          <span>📍</span>
                          <span>
                            {tenant.address}
                            {tenant.city && `, ${tenant.city}`}
                            {tenant.postal_code && ` ${tenant.postal_code}`}
                          </span>
                        </p>
                      )}

                      {hasDistance(tenant) && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 border border-primary-400/30 rounded-lg">
                          <span className="text-primary-300 text-sm font-semibold">
                            📏 {tenant.distance_km.toFixed(2)} km
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center">
                      <svg 
                        className="w-6 h-6 text-gray-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5l7 7-7 7" 
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Info box */}
          <div className="mt-8 bg-primary-500/10 backdrop-blur-xl rounded-2xl p-6 border border-primary-400/30">
            <div className="flex items-start gap-3 text-sm text-gray-200">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="font-semibold text-white mb-1">
                  {t.card.howItWorks}
                </p>
                <p>
                  {t.tenantSelector.selectStore}
                  {' '}{t.tenantSelector.eachStoreHasRewards}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
