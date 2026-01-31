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
  const { clientId, qrCode, tenantId, setClientData, language } = useClientStore()
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
        alert('Per aggiungere alla schermata home su iOS:\n\n1. Tocca il pulsante Condividi\n2. Scorri e tocca "Aggiungi a Home"\n3. Tocca "Aggiungi"')
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
        
        console.log('🚀 Init with:', { clientId, tenantId, urlTenantId, activeTenantId, urlQrCode })
        
        // CASO 1: QR code nell'URL (link condiviso)
        if (urlQrCode) {
          console.log('📱 Loading card from shared URL')
          const cardData = await api.getCardByQR(urlQrCode)
          setCard(cardData)
          setClientData({
            clientId: cardData.client_id,
            cardId: cardData.id,
            qrCode: cardData.qr_code,
            tenantId: cardData.tenant_id
          })
          
          // Load rules
          const rulesData = await api.getRewardRules(cardData.tenant_id)
          setRules(rulesData)
          setLoading(false)
          return
        }
        
        // CASO 2: Nessun negozio selezionato → vai a selezionare
        if (!activeTenantId) {
          console.log('❌ No tenant selected (store:', tenantId, 'url:', urlTenantId, '), redirecting')
          navigate('/select-tenant')
          return
        }
        
        console.log('✅ Tenant selected:', activeTenantId)
        
        // CASO 3: Ha selezionato un negozio
        // Controlla se ha già una card per questo negozio
        if (clientId) {
          console.log('� Has clientId:', clientId, 'checking for tenant:', activeTenantId)
          const existingCard = await api.getCardByClientAndTenant(clientId, activeTenantId)
          
          if (existingCard) {
            // Ha già una card per questo negozio
            console.log('✅ REUSING EXISTING CARD:', {
              qr: existingCard.qr_code,
              cardId: existingCard.id,
              clientId: existingCard.client_id,
              tenantId: existingCard.tenant_id
            })
            setCard(existingCard)
            setClientData({
              clientId: existingCard.client_id,
              cardId: existingCard.id,
              qrCode: existingCard.qr_code,
              tenantId: existingCard.tenant_id
            })
          } else {
            // Non ha una card per questo negozio, creala riusando il client
            console.log('📝 NO CARD FOUND - Creating new card with SAME clientId:', clientId)
            const result = await api.generateClientId(activeTenantId, clientId)
            console.log('📝 Result from generateClientId:', result)
            if (result.success) {
              console.log('✅ NEW CARD CREATED:', {
                qr: result.qr_code,
                cardId: result.card_id,
                clientId: result.client_id,
                tenantId: activeTenantId
              })
              setClientData({
                clientId: result.client_id,
                cardId: result.card_id,
                qrCode: result.qr_code,
                tenantId: activeTenantId
              })
              const cardData = await api.getCardByQR(result.qr_code)
              setCard(cardData)
            }
          }
        } else {
          // Utente completamente nuovo - crea client e card
          console.log('🆕 New user, creating client and card')
          const result = await api.generateClientId(activeTenantId)
          if (result.success) {
            console.log('✅ Client and card created:', result.qr_code)
            setClientData({
              clientId: result.client_id,
              cardId: result.card_id,
              qrCode: result.qr_code,
              tenantId: activeTenantId
            })
            const cardData = await api.getCardByQR(result.qr_code)
            setCard(cardData)
          }
        }
        
        // Load reward rules for this tenant
        const rulesData = await api.getRewardRules(activeTenantId)
        setRules(rulesData)
        
      } catch (error) {
        console.error('❌ Error:', error)
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
        .catch(console.error)
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

  return (
    <div className="relative min-h-screen overflow-hidden pb-20">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <DarkVeil hueShift={200} speed={0.4} />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10"></div>
      
      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <header className="pt-6 px-4">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight mb-1">{t.card.title}</h1>
              <p className="text-gray-200">{t.card.subtitle}</p>
            </div>
            <LanguageSelector />
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* QR Code Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 mb-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-white flex items-center justify-center gap-2">
                <span className="text-4xl">📱</span>
                {t.card.qrTitle}
              </h2>
            {qrDataUrl ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-6 rounded-2xl shadow-2xl">
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
                  Non hai ancora una carta fedeltà per questo negozio
                </p>
                <button
                  onClick={() => navigate('/select-tenant')}
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Seleziona un negozio
                </button>
              </div>
            )}
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
                Aggiungi a Schermata Home
              </button>
            </div>
          )}
        </div>

        {/* Loyalty Progress */}
        <div className="space-y-4 px-4 max-w-2xl mx-auto">
          <h2 className="text-white text-3xl font-bold flex items-center gap-2">
            <span className="text-4xl">🎁</span>
            {t.card.yourRewards}
          </h2>
          
          {rules.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 text-center text-gray-200">
              {t.card.noProgram}
            </div>
          ) : (
            rules.map((rule) => {
              const progress = getRuleProgress(rule.id)
              
              // Create array for stamp visualization
              const stamps = Array.from({ length: rule.buy_count }, (_, i) => i < progress.count)
              
              return (
                <div key={rule.id} className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 hover:bg-white/15 hover:shadow-3xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-white">{rule.name}</h3>
                      {rule.description && (
                        <p className="text-sm text-gray-300 mt-1">{rule.description}</p>
                      )}
                    </div>
                    {progress.rewards > 0 && (
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg shadow-yellow-500/50">
                        <span>{progress.rewards}</span>
                        <span className="text-lg">🎁</span>
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
                        <span className="text-2xl">🎉</span>
                        <p className="text-sm text-green-900 font-bold">
                          {progress.rewards} {progress.rewards === 1 ? 'premio' : 'premi'} disponibile!
                        </p>
                      </div>
                      <p className="text-xs text-green-700">
                        Mostra questa card alla cassa per riscattare il tuo premio
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Info section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 mt-6">
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
    </div>
  )
}
