import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ClientShell from '@/components/client/ClientShell'
import { IosIcon } from '@/components/landing/ios'
import { useClientStore } from '@/store'
import { api, TenantWithDistance, Tenant } from '@/lib/supabase'
import { getTranslation } from '@/lib/i18n'

const CATEGORIES = [
  'all', 'cafe', 'food', 'beauty', 'gym', 'shop',
] as const

function CategoryIcon({ type, className = 'w-4 h-4' }: { type: string; className?: string }) {
  const paths: Record<string, string> = {
    all:        'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    cafe:       'M17 8h2a2 2 0 010 4h-2M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z',
    food:       'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3M21 15v7',
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
    food:       { en: 'Fast Food', ro: 'Fast Food', it: 'Fast Food' },
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


  return (
    <ClientShell back={{ label: language === 'ro' ? 'Înapoi' : language === 'it' ? 'Indietro' : 'Back', to: '/' }}>
      {/* Title */}
      <header className="cs-head">
        <h1>
          {language === 'ro'
            ? 'Descoperă Partenerii'
            : language === 'it'
            ? 'Scopri i Partner'
            : 'Discover Partners'}
        </h1>
        <p>
          {userLocation ? (
            <span className="cs-inline-ico">
              <IosIcon name="pin" />
              {language === 'ro'
                ? 'Parteneri aproape de tine'
                : language === 'it'
                ? 'Partner vicino a te'
                : 'Partners near you'}
            </span>
          ) : (
            language === 'ro'
              ? 'Alege un partener și obține cardul tău de fidelitate gratuit'
              : language === 'it'
              ? 'Scegli un partner e ottieni la tua carta fedeltà gratuita'
              : 'Choose a partner and get your free loyalty card'
          )}
        </p>
      </header>

      {/* Location searching */}
      {locationLoading && (
        <div className="cs-glass cs-note-row">
          <span className="cs-dot-spin" />
          <span>{t.tenantSelector.searchingLocation}</span>
        </div>
      )}

      {/* Location error */}
      {locationError && (
        <div className="cs-alert warn" style={{ animation: 'none' }}>
          <IosIcon name="alert" />
          <div>
            <p>{locationError}</p>
            <button className="cs-warn-btn" onClick={requestLocation}>{t.tenantSelector.retry}</button>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="cs-search">
        <IosIcon name="search" />
        <input
          type="text"
          placeholder={t.tenantSelector.searchPlaceholder.replace(/^[^\p{L}\p{N}]+/u, '')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="cs-input"
        />
      </div>

      {/* Category filter chips */}
      <div className="cs-chips">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`cs-chip${selectedCategory === cat ? ' is-on' : ''}`}
          >
            <CategoryIcon type={cat} className="w-3.5 h-3.5" />
            <span>{categoryLabel(cat, language)}</span>
          </button>
        ))}
      </div>

      {/* Tenants list */}
      {loading ? (
        <div className="cs-glass cs-empty">
          <p className="cs-pulse">{t.tenantSelector.loadingStores}</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="cs-glass cs-empty">
          <span className="cs-empty-ico"><IosIcon name="search" /></span>
          <p>{t.tenantSelector.noStoresFound}</p>
          <small>{t.tenantSelector.tryDifferentSearch}</small>
          {selectedCategory !== 'all' && (
            <button className="cs-btn ghost" style={{ marginTop: 16 }} onClick={() => setSelectedCategory('all')}>
              {language === 'ro' ? 'Arată toți' : language === 'it' ? 'Mostra tutti' : 'Show all'}
            </button>
          )}
        </div>
      ) : (
        <div className="cs-list">
          {filteredTenants.map((tenant) => (
            <button key={tenant.id} onClick={() => handleSelectTenant(tenant)} className="cs-glass cs-tenant">
              {/* Logo or icon */}
              {tenant.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="cs-tenant-logo"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div
                className={`cs-tenant-logo cs-tenant-fallback${tenant.logo_url ? ' hidden' : ''}`}
                style={{ backgroundColor: (tenant.brand_color ?? '#8b5cf6') + '33' }}
              >
                <CategoryIcon type={tenant.metadata?.type ?? 'all'} className="w-7 h-7" />
              </div>

              {/* Info */}
              <div className="cs-tenant-info">
                <div className="cs-tenant-top">
                  <h3>{tenant.name}</h3>
                  {tenant.metadata?.type && (
                    <span className="cs-pill">
                      <CategoryIcon type={tenant.metadata.type} className="w-3 h-3" />
                      {categoryLabel(tenant.metadata.type, language)}
                    </span>
                  )}
                </div>

                {tenant.metadata?.description && <p className="cs-tenant-desc">{tenant.metadata.description}</p>}

                <div className="cs-tenant-meta">
                  {tenant.address && (
                    <span className="cs-inline-ico">
                      <IosIcon name="pin" />
                      {tenant.address}
                      {tenant.city && `, ${tenant.city}`}
                    </span>
                  )}
                  {hasDistance(tenant) && <span className="cs-pill accent">{tenant.distance_km.toFixed(1)} km</span>}
                </div>
              </div>

              {/* Arrow + CTA hint */}
              <div className="cs-tenant-go">
                <span><IosIcon name="chev" /></span>
                <small>{language === 'ro' ? 'Obții cardul' : language === 'it' ? 'Ottieni carta' : 'Get card'}</small>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Info box */}
      <section className="cs-glass cs-how cs-tip">
        <IosIcon name="info" />
        <div>
          <b>{language === 'ro' ? 'Cum funcționează?' : language === 'it' ? 'Come funziona?' : 'How does it work?'}</b>
          <p>
            {language === 'ro'
              ? 'Alege un partener, obții cardul tău de fidelitate gratuit. Acumulează timbre la fiecare vizită și câștigă recompense. Fără aplicație, fără card fizic.'
              : language === 'it'
              ? "Scegli un partner, ottieni la tua carta fedeltà gratuita. Accumula timbri ad ogni visita e guadagna premi. Senza app, senza carta fisica."
              : 'Choose a partner, get your free loyalty card instantly. Collect stamps at every visit and earn rewards. No app, no plastic card.'}
          </p>
        </div>
      </section>
    </ClientShell>
  )
}
