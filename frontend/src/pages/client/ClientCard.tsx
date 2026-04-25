import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { useClientStore } from '@/store'
import { api, Card as CardType, RewardRule } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

export default function ClientCard() {
  const { qrCode: urlQrCode } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { clientId, qrCode, tenantId, tenantName, setClientData, language } = useClientStore()
  const t = getTranslation(language)
  
  // Get tenant from URL if present (fallback)
  const urlTenantId = searchParams.get('tenant')
  
  const [loading, setLoading] = useState(true)
  const [card, setCard] = useState<CardType | null>(null)
  const [rules, setRules] = useState<RewardRule[]>([])
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  // PWA install prompt handler
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS - show instructions
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

  // Initialize client or load existing
  useEffect(() => {
    async function init() {
      try {
        // Use tenantId from store or URL parameter
        const activeTenantId = tenantId || urlTenantId
        
        // CASE 1: QR code in URL (shared link)
        if (urlQrCode) {
          const cardData = await api.getCardByQR(urlQrCode)
          setCard(cardData)
          setClientData({
            clientId: cardData.client_id,
            cardId: cardData.id,
            qrCode: cardData.qr_code,
            tenantId: cardData.tenant_id,
            customName: tenantName || undefined
          })
          
          try {
            const rulesData = await api.getRewardRules(cardData.tenant_id)
            setRules(rulesData || [])
          } catch {
            // Rules failed to load - non-critical
          }
          setLoading(false)
          return
        }
        
        // CASE 2: No store selected → go select one
        if (!activeTenantId) {
          navigate('/select-tenant')
          return
        }
        
        // CASE 3: Store selected
        if (clientId) {
          const existingCard = await api.getCardByClientAndTenant(clientId, activeTenantId)

          if (existingCard) {
            setCard(existingCard)
            setClientData({
              clientId: existingCard.client_id,
              cardId: existingCard.id,
              qrCode: existingCard.qr_code,
              tenantId: existingCard.tenant_id,
              customName: tenantName || undefined
            })
          } else {
            const result = await api.generateClientId(activeTenantId, clientId)
            if (result.success) {
              setClientData({
                clientId: result.client_id,
                cardId: result.card_id,
                qrCode: result.qr_code,
                tenantId: activeTenantId,
                customName: tenantName || undefined
              })
              const cardData = await api.getCardByQR(result.qr_code)
              setCard(cardData)
            }
          }
        } else {
          // New user - create client and card
          const result = await api.generateClientId(activeTenantId)
          if (result.success) {
            setClientData({
              clientId: result.client_id,
              cardId: result.card_id,
              qrCode: result.qr_code,
              tenantId: activeTenantId,
              customName: tenantName || undefined
            })
            const cardData = await api.getCardByQR(result.qr_code)
            setCard(cardData)
          }
        }
        
        // Load reward rules for this tenant
        const rulesData = await api.getRewardRules(activeTenantId)
        setRules(rulesData)
        
      } catch {
        // Error handled silently
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Generate QR code
  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then(setQrDataUrl)
        .catch(() => {})
    }
  }, [qrCode])

  const getRuleProgress = (ruleId: string) => {
    if (!card?.loyalty_state[ruleId]) {
      return { count: 0, rewards: 0 }
    }
    return card.loyalty_state[ruleId]
  }

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 z-0">
          <DarkVeil hueShift={200} speed={0.4} />
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>
        
        {/* Loading text centered */}
        <div className="relative z-20 min-h-screen flex items-center justify-center">
          <div className="text-white text-2xl font-semibold animate-pulse">{t.card.loading}</div>
        </div>
      </div>
    )
  }

  // Filter rules to show only those with at least some progress or rewards
  const activeRules = rules.filter((rule) => {
    const progress = getRuleProgress(rule.id)
    return progress.count > 0 || progress.rewards > 0
  })

  // Fallback: If rules couldn't be loaded but we have loyalty_state, create display data from it
  const hasLoyaltyProgress = card?.loyalty_state && Object.keys(card.loyalty_state).length > 0
  const loyaltyProgressFromState = hasLoyaltyProgress 
    ? Object.entries(card!.loyalty_state)
        .filter(([_, state]) => state.count > 0 || state.rewards > 0)
        .map(([ruleId, state]) => {
          // Try to find matching rule for name, otherwise use a generic name
          const matchingRule = rules.find(r => r.id === ruleId)
          return {
            id: ruleId,
            name: matchingRule?.name || 'Programma Fedeltà',
            description: matchingRule?.description,
            buy_count: matchingRule?.buy_count || 6, // Default to 6 if unknown
            count: state.count,
            rewards: state.rewards
          }
        })
    : []

  // Use activeRules if available, otherwise fall back to loyalty_state data
  const displayProgress = loyaltyProgressFromState

  // Debug log
  console.log('🎯 ClientCard Debug:', {
    card: card,
    loyalty_state: card?.loyalty_state,
    rules: rules.map(r => ({ id: r.id, name: r.name })),
    activeRules: activeRules.map(r => ({ id: r.id, name: r.name })),
    loyaltyProgressFromState,
    hasLoyaltyProgress
  })

  return (
    <div className="relative min-h-screen overflow-auto">
      {/* Animated background - fixed to cover entire viewport */}
      <div className="fixed inset-0 z-0">
        <DarkVeil hueShift={200} speed={0.4} />
      </div>

      {/* Overlay gradient - also fixed */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>
      
      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <header className="pt-6 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Top row with back button and language selector */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <span className="text-xl">←</span>
                <span>{t.wallet.back}</span>
              </button>
              <LanguageSelector />
            </div>
            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-1">{t.card.title}</h1>
              <p className="text-gray-200">{t.card.subtitle}</p>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          {/* QR Code Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-8 border border-white/20 mb-4 sm:mb-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4 text-white flex items-center justify-center gap-2">
                <span className="text-2xl sm:text-4xl">📱</span>
                {t.card.qrTitle}
              </h2>
            {qrDataUrl ? (
              <>
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl">
                    <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                </div>
                <p className="text-sm text-gray-200 mb-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  {t.card.qrInfo}
                </p>
                <p className="text-xs text-gray-300 font-mono bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg inline-block border border-white/10">{qrCode}</p>
              </>
            ) : (
              <div>
                <p className="text-gray-200 mb-4">
                  {t.clientCard.noCardYet}
                </p>
                <button
                  onClick={() => navigate('/select-tenant')}
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  {t.clientCard.selectStore}
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Add to Home Screen button */}
          {showInstallButton && (
            <div className="mt-6">
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

        {/* Loyalty Progress - Show if there are active rules OR loyalty progress from state */}
        {(activeRules.length > 0 || displayProgress.length > 0) && (
          <div className="space-y-4 px-4 max-w-2xl mx-auto">
            <h2 className="text-white text-3xl font-bold flex items-center gap-2">
              <span className="text-4xl">🎁</span>
              {t.card.yourRewards}
            </h2>
          
            {/* Use activeRules if available, otherwise use displayProgress from loyalty_state */}
            {activeRules.length > 0 ? (
              activeRules.map((rule) => {
                const progress = getRuleProgress(rule.id)
                
                // Create array for stamp visualization
                const stamps = Array.from({ length: rule.buy_count }, (_, i) => i < progress.count)
                
                return (
                  <div key={rule.id} className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-white">{rule.name}</h3>
                        {rule.description && (
                          <p className="text-sm text-gray-300 mt-1">{rule.description}</p>
                        )}
                      </div>
                      {progress.rewards > 0 && (
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg shadow-yellow-500/50">
                          {rule.discount_percent ? (
                            <>
                              <span>{rule.discount_percent}% OFF</span>
                              <span className="text-lg">💰</span>
                            </>
                          ) : (
                            <>
                              <span>{progress.rewards}</span>
                              <span className="text-lg">🎁</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stamps visualization */}
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
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                              isFilled
                                ? 'bg-primary-500 text-white scale-100 shadow-lg shadow-primary-500/50'
                                : 'bg-white/10 border border-white/20 text-gray-400 scale-95'
                            }`}
                          >
                            {isFilled ? '✓' : '○'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {progress.rewards > 0 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{rule.discount_percent ? '💰' : '🎉'}</span>
                          <p className="text-sm text-green-900 font-bold">
                            {rule.discount_percent 
                              ? `Sconto ${rule.discount_percent}% disponibile!`
                              : `${progress.rewards} ${progress.rewards === 1 ? t.clientCard.rewardAvailable : t.clientCard.rewardsAvailable}`
                            }
                          </p>
                        </div>
                        <p className="text-xs text-green-700">
                          {t.clientCard.showCardToRedeem}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              // Fallback: show progress from loyalty_state when rules can't be loaded
              displayProgress.map((item) => {
                const stamps = Array.from({ length: item.buy_count }, (_, i) => i < item.count)
                
                return (
                  <div key={item.id} className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-white">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                        )}
                      </div>
                      {item.rewards > 0 && (
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg shadow-yellow-500/50">
                          <span>{item.rewards}</span>
                          <span className="text-lg">🎁</span>
                        </div>
                      )}
                    </div>

                    {/* Stamps visualization */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-gray-200">
                          {item.count} {t.card.of} {item.buy_count} {t.card.purchases}
                        </span>
                        {item.count > 0 && item.count < item.buy_count && (
                          <span className="text-xs text-primary-300 font-semibold">
                            {t.card.onlyMore} {item.buy_count - item.count}{t.card.moreNeeded}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {stamps.map((isFilled, index) => (
                          <div
                            key={index}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                              isFilled
                                ? 'bg-primary-500 text-white scale-100 shadow-lg shadow-primary-500/50'
                                : 'bg-white/10 border border-white/20 text-gray-400 scale-95'
                            }`}
                          >
                            {isFilled ? '✓' : '○'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {item.rewards > 0 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🎉</span>
                          <p className="text-sm text-green-900 font-bold">
                            {item.rewards} {item.rewards === 1 ? t.clientCard.rewardAvailable : t.clientCard.rewardsAvailable}
                          </p>
                        </div>
                        <p className="text-xs text-green-700">
                          {t.clientCard.showCardToRedeem}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Info section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 mt-6 mx-4 max-w-2xl lg:mx-auto mb-8">
          <h3 className="font-bold mb-3 text-lg flex items-center gap-2 text-white">
            <span className="text-2xl">💡</span>
            {t.card.howItWorks}
          </h3>
          <ul className="text-sm text-gray-200 space-y-2">
            <li className="flex items-center gap-2">{t.card.howStep1}</li>
            <li className="flex items-center gap-2">{t.card.howStep2}</li>
            <li className="flex items-center gap-2">{t.card.howStep3}</li>
            <li className="flex items-center gap-2">{t.card.howStep4}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
