import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { useClientStore } from '@/store'
import { api, Card as CardType, RewardRule, Tenant } from '@/lib/supabase'
import StaticBackground from '@/components/StaticBackground'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

function CategoryIcon({ type, className = 'w-5 h-5' }: { type: string; className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={paths[type] ?? paths.all} />
    </svg>
  )
}

function categoryLabel(type: string, language: string): string {
  const labels: Record<string, Record<string, string>> = {
    cafe:       { en: 'Café', ro: 'Cafenea', it: 'Caffetteria' },
    restaurant: { en: 'Restaurant', ro: 'Restaurant', it: 'Ristorante' },
    beauty:     { en: 'Beauty', ro: 'Frumusețe', it: 'Bellezza' },
    gym:        { en: 'Gym', ro: 'Fitness', it: 'Palestra' },
    shop:       { en: 'Shop', ro: 'Magazin', it: 'Negozio' },
  }
  return labels[type]?.[language] ?? labels[type]?.en ?? type
}

export default function ClientCard() {
  const { qrCode: urlQrCode } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { clientId, qrCode, tenantId, tenantName, setClientData, language } = useClientStore()
  const t = getTranslation(language)

  const urlTenantId = searchParams.get('tenant')

  const [loading, setLoading] = useState(true)
  const [card, setCard] = useState<CardType | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [rules, setRules] = useState<RewardRule[]>([])
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
    }
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        alert(t.clientCard.iosInstallInstructions)
      }
      return
    }
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallButton(false)
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const activeTenantId = tenantId || urlTenantId

        if (urlQrCode) {
          const cardData = await api.getCardByQR(urlQrCode)
          setCard(cardData)
          setClientData({
            clientId: cardData.client_id,
            cardId: cardData.id,
            qrCode: cardData.qr_code,
            tenantId: cardData.tenant_id,
            customName: tenantName || undefined,
          })
          try {
            const [rulesData, tenantData] = await Promise.all([
              api.getRewardRules(cardData.tenant_id),
              api.getTenant(cardData.tenant_id),
            ])
            setRules(rulesData || [])
            setTenant(tenantData)
          } catch {}
          setLoading(false)
          return
        }

        if (!activeTenantId) {
          navigate('/select-tenant')
          return
        }

        // Fetch tenant info in parallel (non-blocking)
        api.getTenant(activeTenantId).then(setTenant).catch(() => {})

        if (clientId) {
          const existingCard = await api.getCardByClientAndTenant(clientId, activeTenantId)
          if (existingCard) {
            setCard(existingCard)
            setClientData({
              clientId: existingCard.client_id,
              cardId: existingCard.id,
              qrCode: existingCard.qr_code,
              tenantId: existingCard.tenant_id,
              customName: tenantName || undefined,
            })
          } else {
            const result = await api.generateClientId(activeTenantId, clientId)
            if (result.success) {
              setClientData({
                clientId: result.client_id,
                cardId: result.card_id,
                qrCode: result.qr_code,
                tenantId: activeTenantId,
                customName: tenantName || undefined,
              })
              const cardData = await api.getCardByQR(result.qr_code)
              setCard(cardData)
            }
          }
        } else {
          const result = await api.generateClientId(activeTenantId)
          if (result.success) {
            setClientData({
              clientId: result.client_id,
              cardId: result.card_id,
              qrCode: result.qr_code,
              tenantId: activeTenantId,
              customName: tenantName || undefined,
            })
            const cardData = await api.getCardByQR(result.qr_code)
            setCard(cardData)
          }
        }

        const rulesData = await api.getRewardRules(activeTenantId)
        setRules(rulesData)
      } catch {
        // silently handled
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
        .then(setQrDataUrl)
        .catch(() => {})
    }
  }, [qrCode])

  const getRuleProgress = (ruleId: string) => {
    if (!card?.loyalty_state[ruleId]) return { count: 0, rewards: 0 }
    return card.loyalty_state[ruleId]
  }

  const activeRules = rules.filter((rule) => {
    const progress = getRuleProgress(rule.id)
    return progress.count > 0 || progress.rewards > 0
  })

  const brandColor = tenant?.brand_color ?? '#8b5cf6'
  const displayName = tenant?.name ?? tenantName ?? 'Loyalty Card'

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden"><StaticBackground /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>
        <div className="relative z-20 min-h-screen flex items-center justify-center">
          <div className="text-white text-2xl font-semibold animate-pulse">{t.card.loading}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-auto">
      <div className="fixed inset-0 z-0 overflow-hidden"><StaticBackground /></div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>

      <div className="relative z-20">
        {/* Header */}
        <header className="pt-6 px-4">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>{t.wallet.back}</span>
            </button>
            <LanguageSelector />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">

          {/* ── WALLET CARD ── */}
          {qrDataUrl ? (
            <div className="rounded-3xl overflow-hidden shadow-2xl mb-6 relative">
              {/* Branded gradient background */}
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(145deg, ${brandColor}f0 0%, ${brandColor}a0 100%)` }}
              />
              {/* Glossy shine — diagonal light streak from top-left */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,0) 60%)',
                }}
              />
              {/* Soft bottom reflection */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1/3"
                style={{
                  background: 'linear-gradient(to top, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 100%)',
                }}
              />

              {/* Business info */}
              <div className="relative p-6 pb-4">
                <div className="flex items-start gap-4">
                  {tenant?.logo_url ? (
                    <img
                      src={tenant.logo_url}
                      alt={displayName}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl ring-2 ring-white/30 shadow-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                    >
                      <CategoryIcon type={tenant?.metadata?.type ?? 'all'} className="w-8 h-8 text-white" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-bold text-xl leading-tight truncate">{displayName}</h2>
                    {tenant?.metadata?.type && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <CategoryIcon type={tenant.metadata.type} className="w-3.5 h-3.5 text-white/70" />
                        <span className="text-white/70 text-sm">{categoryLabel(tenant.metadata.type, language)}</span>
                      </div>
                    )}
                    {tenant?.metadata?.description && (
                      <p className="text-white/60 text-xs mt-1 line-clamp-1">{tenant.metadata.description}</p>
                    )}
                    {tenant?.address && (
                      <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {tenant.address}{tenant.city ? `, ${tenant.city}` : ''}
                      </p>
                    )}
                  </div>

                  {/* LoyalCard watermark */}
                  <span className="text-white/30 text-[10px] font-bold tracking-widest flex-shrink-0 mt-1">LC</span>
                </div>
              </div>

              {/* QR code — compact, centered */}
              <div className="relative flex flex-col items-center px-6 pb-2">
                <div className="bg-white rounded-2xl p-3 shadow-xl inline-block">
                  <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 sm:w-52 sm:h-52 block" />
                </div>
                <p className="text-white/65 text-xs mt-2.5 text-center font-medium tracking-wide">
                  {language === 'ro'
                    ? 'Arată la casă pentru a acumula timbri'
                    : language === 'it'
                    ? 'Mostra alla cassa per accumulare timbri'
                    : 'Show at checkout to collect stamps'}
                </p>
              </div>

              {/* Card footer */}
              <div className="relative bg-black/25 px-6 py-3 flex items-center justify-between">
                <span className="text-white/50 text-xs font-mono tracking-wide">{qrCode}</span>
                <span className="text-white/30 text-xs font-semibold tracking-wider">LOYALCARD</span>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 mb-6 text-center">
              <p className="text-gray-200 mb-4">{t.clientCard.noCardYet}</p>
              <button
                onClick={() => navigate('/select-tenant')}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {t.clientCard.selectStore}
              </button>
            </div>
          )}

          {/* Add to Home Screen */}
          {showInstallButton && (
            <div className="mb-6">
              <button
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.clientCard.addToHomeScreen}
              </button>
            </div>
          )}
        </div>

        {/* Loyalty Progress — only if stamps exist */}
        {activeRules.length > 0 && (
          <div className="space-y-4 px-4 max-w-2xl mx-auto">
            <h2 className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              {t.card.yourRewards}
            </h2>

            {activeRules.map((rule) => {
              const progress = getRuleProgress(rule.id)
              const stamps = Array.from({ length: rule.buy_count }, (_, i) => i < progress.count)

              return (
                <div key={rule.id} className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">{rule.name}</h3>
                      {rule.description && (
                        <p className="text-sm text-gray-300 mt-0.5">{rule.description}</p>
                      )}
                    </div>
                    {progress.rewards > 0 && (
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-yellow-500/50 flex-shrink-0 ml-2">
                        {rule.discount_percent ? (
                          <span>{rule.discount_percent}% OFF</span>
                        ) : (
                          <>
                            <span>{progress.rewards}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-gray-200">
                        {progress.count} {t.card.of} {rule.buy_count} {t.card.purchases}
                      </span>
                      {progress.count > 0 && progress.count < rule.buy_count && (
                        <span className="text-xs text-primary-300 font-semibold">
                          {t.card.onlyMore} {rule.buy_count - progress.count}{t.card.moreNeeded}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stamps.map((isFilled, index) => (
                        <div
                          key={index}
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isFilled
                              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                              : 'bg-white/10 border border-white/20 text-gray-400'
                          }`}
                        >
                          {isFilled ? (
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {progress.rewards > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                        </div>
                        <p className="text-sm text-green-900 font-bold">
                          {rule.discount_percent
                            ? `${rule.discount_percent}% ${t.clientCard.discountAvailable}`
                            : `${progress.rewards} ${progress.rewards === 1 ? t.clientCard.rewardAvailable : t.clientCard.rewardsAvailable}`}
                        </p>
                      </div>
                      <p className="text-xs text-green-700">{t.clientCard.showCardToRedeem}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* How it works */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 mt-6 mx-4 max-w-2xl lg:mx-auto mb-8">
          <h3 className="font-bold mb-4 text-lg flex items-center gap-2 text-white">
            <div className="w-7 h-7 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {t.card.howItWorks}
          </h3>
          <ul className="text-sm text-gray-200 space-y-3">
            {[
              { icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 12h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zM17 8h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z', label: t.card.howStep1 },
              { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: t.card.howStep2 },
              { icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z', label: t.card.howStep3 },
              { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: t.card.howStep4 },
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
                  </svg>
                </div>
                {step.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
