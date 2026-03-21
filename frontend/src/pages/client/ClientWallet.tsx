import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

interface SavedCard {
  clientId: string
  cardId: string
  qrCode: string
  tenantId: string
  tenantName: string
  tenantLogo?: string
  brandColor: string
  loyaltyState: Record<string, number>
  totalStamps: number
  customName?: string
}

export default function ClientWallet() {
  const navigate = useNavigate()
  const { clientId, updateCardName, getAllCards, language } = useClientStore()
  const t = getTranslation(language)
  const [cards, setCards] = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadCards()
  }, [clientId])

  const loadCards = async () => {
    setLoading(true)
    try {
      if (!clientId) {
        console.log('No clientId found - new user')
        setCards([])
        setLoading(false)
        return
      }

      // Get ALL cards for this client from database
      const allCards = await api.getCardsByClient(clientId)
      console.log('Found cards for client:', allCards)
      
      // Get saved cards from store (with customName)
      const savedCards = getAllCards()
      console.log('Saved cards from store:', savedCards)
      
      // Fetch tenant details for each card
      const cardsWithDetails = await Promise.all(
        allCards.map(async (cardData) => {
          try {
            console.log('Loading tenant for card:', cardData.tenant_id)
            const tenant = await api.getTenant(cardData.tenant_id)
            console.log('Tenant loaded successfully:', tenant)
            
            // Count total stamps/points
            const loyaltyState = cardData.loyalty_state || {}
            const totalStamps = Object.values(loyaltyState).reduce(
              (sum: number, state: any) => sum + (state?.count || 0), 
              0
            )
            
            // Get customName from store if available
            const savedCard = savedCards.find(c => c.qrCode === cardData.qr_code)
            
            return {
              clientId: cardData.client_id,
              cardId: cardData.id,
              qrCode: cardData.qr_code,
              tenantId: cardData.tenant_id,
              tenantName: tenant.name,
              tenantLogo: tenant.logo_url,
              brandColor: tenant.brand_color,
              loyaltyState,
              totalStamps,
              customName: savedCard?.customName
            }
          } catch (error) {
            console.error('Error loading card details for tenant:', cardData.tenant_id, error)
            // Get customName from store if available
            const savedCard = savedCards.find(c => c.qrCode === cardData.qr_code)
            // Return card even if tenant fetch fails, with fallback values
            return {
              clientId: cardData.client_id,
              cardId: cardData.id,
              qrCode: cardData.qr_code,
              tenantId: cardData.tenant_id,
              tenantName: t.wallet.store,
              tenantLogo: undefined,
              brandColor: '#6366f1',
              loyaltyState: cardData.loyalty_state || {},
              totalStamps: Object.values(cardData.loyalty_state || {}).reduce(
                (sum: number, state: any) => sum + (state?.count || 0), 
                0
              ),
              customName: savedCard?.customName
            }
          }
        })
      )

      console.log('Cards with details:', cardsWithDetails)
      setCards(cardsWithDetails.filter(c => c !== null) as SavedCard[])
    } catch (error) {
      console.error('Error loading cards:', error)
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (qrCode: string) => {
    navigate(`/card/${qrCode}`)
  }

  const handleAddNewCard = () => {
    navigate('/select-tenant')
  }

  const handleStartEdit = (card: SavedCard) => {
    setEditingCard(card.qrCode)
    setEditName(card.customName || card.tenantName)
  }

  const handleSaveEdit = (qrCode: string) => {
    updateCardName(qrCode, editName)
    setEditingCard(null)
    loadCards() // Reload to show updated name
  }

  const handleCancelEdit = () => {
    setEditingCard(null)
    setEditName('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <DarkVeil hueShift={260} speed={0.4} />
        </div>
        <div className="relative z-10 text-white text-xl font-semibold animate-pulse">{t.wallet.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <DarkVeil hueShift={260} speed={0.4} />
      </div>
      
      <div className="max-w-lg mx-auto relative z-10">
        {/* Header with Back button */}
        <div className="flex justify-between items-center mt-4 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.wallet.back}
          </button>
          <LanguageSelector />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <span>💳</span> {t.wallet.title}
          </h1>
          <p className="text-white/80 text-lg">{t.wallet.subtitle}</p>
        </div>

        {/* Cards List */}
        {cards.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-10 text-center border border-white/50">
            <div className="text-7xl mb-6">👋</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {!clientId ? t.wallet.welcome : t.wallet.noCards}
            </h2>
            <p className="text-gray-700 mb-8 text-lg leading-relaxed whitespace-pre-line">
              {!clientId ? t.wallet.startCollecting : t.wallet.noCardsYet}
            </p>
            <button
              onClick={handleAddNewCard}
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 mx-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.wallet.createFirstCard}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div
                key={card.cardId}
                className="w-full bg-white/15 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 hover:border-white/30 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300"
                style={{ 
                  borderLeft: `4px solid ${card.brandColor}`,
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                }}
              >
                {editingCard === card.qrCode ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-primary-400/50 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-400/50 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400"
                      placeholder={t.wallet.cardNamePlaceholder}
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSaveEdit(card.qrCode)}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50"
                      >
                        ✓ {t.wallet.save}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-white/10 text-white px-4 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                      >
                        ✕ {t.wallet.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleCardClick(card.qrCode)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      {card.tenantLogo ? (
                        <img
                          src={card.tenantLogo}
                          alt={card.tenantName}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-white/20"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl ring-2 ring-white/20"
                          style={{ backgroundColor: card.brandColor + '30' }}
                        >
                          🎴
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">
                          {card.customName || card.tenantName}
                        </h3>
                        <p className="text-gray-300 text-sm mb-2">
                          {t.wallet.store} • #{card.qrCode.slice(-6).toUpperCase()}
                        </p>
                        
                        {/* Progress Indicator */}
                        {card.totalStamps > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[...Array(Math.min(card.totalStamps, 5))].map((_, i) => (
                                <span key={i} className="text-yellow-400 text-lg">⭐</span>
                              ))}
                              {card.totalStamps > 5 && (
                                <span className="text-sm font-semibold text-white">
                                  +{card.totalStamps - 5}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {card.totalStamps} {card.totalStamps === 1 ? t.wallet.stamp : t.wallet.stamps}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">{t.wallet.noStamps}</p>
                        )}
                      </div>

                      <svg
                        className="w-6 h-6 text-gray-400"
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
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleStartEdit(card)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title={t.wallet.renameCard}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Card Button */}
            <button
              onClick={handleAddNewCard}
              className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/40 rounded-2xl p-6 hover:bg-white/20 hover:border-white/60 transition-all duration-300 cursor-pointer hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center gap-3 text-white">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="text-xl font-bold">{t.wallet.addNew}</span>
              </div>
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-white/70 text-sm bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <p className="flex items-center justify-center gap-2">
            <span className="text-lg">💡</span>
            {t.wallet.cardSpecificInfo}
          </p>
          <p className="mt-2">{t.wallet.earnPointsSeparately}</p>
        </div>
      </div>
    </div>
  )
}
