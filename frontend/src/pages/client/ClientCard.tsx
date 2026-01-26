import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { useClientStore } from '@/store'
import { api, Card as CardType, RewardRule } from '@/lib/supabase'

const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111' // TODO: Make dynamic

export default function ClientCard() {
  const { qrCode: urlQrCode } = useParams()
  const { clientId, cardId, qrCode, tenantId, setClientData } = useClientStore()
  
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

  const getProgressPercentage = (rule: RewardRule) => {
    const progress = getRuleProgress(rule.id)
    return Math.min((progress.count / rule.buy_count) * 100, 100)
  }

  // Detect device for wallet buttons
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 pb-20">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Fidelix</h1>
          <p className="text-gray-600">La tua carta fedeltà digitale</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* QR Code Card */}
        <div className="card mb-6">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Il tuo QR Code</h2>
            {qrDataUrl && (
              <div className="flex justify-center mb-4">
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">
              Mostra questo codice alla cassa per accumulare premi
            </p>
            <p className="text-xs text-gray-500 font-mono">{qrCode}</p>
          </div>

          {/* Add to Wallet buttons */}
          <div className="mt-6 space-y-3">
            {isIOS && (
              <button className="w-full bg-black text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <span>🍎</span> Aggiungi ad Apple Wallet
              </button>
            )}
            {isAndroid && (
              <button className="w-full bg-black text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <span>📱</span> Aggiungi a Google Wallet
              </button>
            )}
          </div>
        </div>

        {/* Loyalty Progress */}
        <div className="space-y-4">
          <h2 className="text-white text-xl font-bold">I tuoi premi</h2>
          
          {rules.length === 0 ? (
            <div className="card text-center text-gray-600">
              Nessun programma fedeltà attivo
            </div>
          ) : (
            rules.map((rule) => {
              const progress = getRuleProgress(rule.id)
              const percentage = getProgressPercentage(rule)
              
              return (
                <div key={rule.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{rule.name}</h3>
                      {rule.description && (
                        <p className="text-sm text-gray-600">{rule.description}</p>
                      )}
                    </div>
                    {progress.rewards > 0 && (
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {progress.rewards} 🎁
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block text-primary-600">
                          {progress.count} / {rule.buy_count}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-primary-600">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-500"
                      />
                    </div>
                  </div>

                  {progress.rewards > 0 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-semibold">
                        ✨ Hai {progress.rewards} {progress.rewards === 1 ? 'premio' : 'premi'} disponibile!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Mostra questa card alla cassa per riscattarlo
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Info section */}
        <div className="card mt-6 bg-gray-50">
          <h3 className="font-bold mb-2">ℹ️ Come funziona</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Mostra il QR code alla cassa</li>
            <li>• Accumula punti ad ogni acquisto</li>
            <li>• I premi sono specifici per prodotto</li>
            <li>• Aggiungi al Wallet per accesso rapido</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
