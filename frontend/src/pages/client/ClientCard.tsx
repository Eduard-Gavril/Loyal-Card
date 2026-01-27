import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { useClientStore } from '@/store'
import { api, Card as CardType, RewardRule } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111' // TODO: Make dynamic

export default function ClientCard() {
  const { qrCode: urlQrCode } = useParams()
  const { clientId, cardId, qrCode, tenantId, setClientData, language } = useClientStore()
  const t = getTranslation(language)
  
  const [loading, setLoading] = useState(true)
  const [card, setCard] = useState<CardType | null>(null)
  const [rules, setRules] = useState<RewardRule[]>([])
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Initialize client or load existing
  useEffect(() => {
    async function init() {
      try {
        // If URL has QR code, use it
        if (urlQrCode) {
          const cardData = await api.getCardByQR(urlQrCode)
          setCard(cardData)
          setClientData({
            clientId: cardData.client_id,
            cardId: cardData.id,
            qrCode: cardData.qr_code,
            tenantId: cardData.tenant_id
          })
        }
        // If localStorage has data, load card
        else if (clientId && cardId && qrCode) {
          const cardData = await api.getCardByQR(qrCode)
          setCard(cardData)
        }
        // New user - generate client ID
        else {
          const result = await api.generateClientId(DEMO_TENANT_ID)
          if (result.success) {
            setClientData({
              clientId: result.client_id,
              cardId: result.card_id,
              qrCode: result.qr_code,
              tenantId: DEMO_TENANT_ID
            })
            // Load the newly created card
            const cardData = await api.getCardByQR(result.qr_code)
            setCard(cardData)
          }
        }

        // Load reward rules
        const rulesData = await api.getRewardRules(tenantId || DEMO_TENANT_ID)
        setRules(rulesData)
      } catch (error) {
        console.error('Error initializing:', error)
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

  // Detect device for wallet buttons
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)

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
                <p className="text-gray-600 mb-4">
                  Non hai ancora una carta fedeltà
                </p>
                <button
                  onClick={async () => {
                    setLoading(true)
                    try {
                      const result = await api.generateClientId(DEMO_TENANT_ID)
                      if (result.success) {
                        setClientData({
                          clientId: result.client_id,
                          cardId: result.card_id,
                          qrCode: result.qr_code,
                          tenantId: DEMO_TENANT_ID
                        })
                        const cardData = await api.getCardByQR(result.qr_code)
                        setCard(cardData)
                        window.location.reload()
                      }
                    } catch (error) {
                      console.error('Error generating card:', error)
                      alert('Errore durante la generazione della carta')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Genera la tua Carta Fedeltà
                </button>
              </div>
            )}
          </div>

          {/* Add to Wallet buttons */}
          <div className="mt-6 space-y-3">
            {isIOS && (
              <button className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                <span className="text-2xl">🍎</span> {t.card.addAppleWallet}
              </button>
            )}
            {isAndroid && (
              <button className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                <span className="text-2xl">📱</span> {t.card.addGoogleWallet}
              </button>
            )}
          </div>
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
