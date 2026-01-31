import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'

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
  const { clientId, updateCardName } = useClientStore()
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
            
            return {
              clientId: cardData.client_id,
              cardId: cardData.id,
              qrCode: cardData.qr_code,
              tenantId: cardData.tenant_id,
              tenantName: tenant.name,
              tenantLogo: tenant.logo_url,
              brandColor: tenant.brand_color,
              loyaltyState,
              totalStamps
            }
          } catch (error) {
            console.error('Error loading card details for tenant:', cardData.tenant_id, error)
            // Return card even if tenant fetch fails, with fallback values
            return {
              clientId: cardData.client_id,
              cardId: cardData.id,
              qrCode: cardData.qr_code,
              tenantId: cardData.tenant_id,
              tenantName: 'Negozio',
              tenantLogo: undefined,
              brandColor: '#6366f1',
              loyaltyState: cardData.loyalty_state || {},
              totalStamps: Object.values(cardData.loyalty_state || {}).reduce(
                (sum: number, state: any) => sum + (state?.count || 0), 
                0
              )
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
    setEditName(card.customName || 'Fidelix Card')
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
        <div className="relative z-10 text-white text-xl font-semibold animate-pulse">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <DarkVeil hueShift={260} speed={0.4} />
      </div>
      
      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-5xl font-bold text-white mb-3 flex items-center justify-center gap-3">
            <span>💳</span> Le Tue Carte
          </h1>
          <p className="text-white/80 text-lg">Scegli la carta da mostrare</p>
        </div>

        {/* Cards List */}
        {cards.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-10 text-center border border-white/50">
            <div className="text-7xl mb-6">👋</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {!clientId ? 'Benvenuto!' : 'Nessuna carta'}
            </h2>
            <p className="text-gray-700 mb-8 text-lg leading-relaxed">
              {!clientId ? (
                <>
                  Inizia subito a collezionare punti fedeltà!<br />
                  Seleziona il tuo negozio preferito e crea la tua prima carta digitale.
                </>
              ) : (
                <>
                  Non hai ancora nessuna carta fedeltà.<br />
                  Crea una nuova carta per iniziare a collezionare punti!
                </>
              )}
            </p>
            <button
              onClick={handleAddNewCard}
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 mx-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crea Prima Carta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div
                key={card.cardId}
                className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                style={{ borderLeft: `6px solid ${card.brandColor}` }}
              >
                {editingCard === card.qrCode ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-primary-300 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-400 bg-white"
                      placeholder="Nome carta"
                      autoFocus
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSaveEdit(card.qrCode)}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/50"
                      >
                        ✓ Salva
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                      >
                        ✕ Annulla
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
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: card.brandColor + '20' }}
                        >
                          🎴
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          {card.customName || 'Fidelix Card'}
                        </h3>
                        <p className="text-gray-500 text-sm mb-2">
                          {card.tenantName} • #{card.qrCode.slice(-6).toUpperCase()}
                        </p>
                        
                        {/* Progress Indicator */}
                        {card.totalStamps > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[...Array(Math.min(card.totalStamps, 5))].map((_, i) => (
                                <span key={i} className="text-yellow-500 text-lg">⭐</span>
                              ))}
                              {card.totalStamps > 5 && (
                                <span className="text-sm font-semibold text-gray-700">
                                  +{card.totalStamps - 5}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {card.totalStamps} {card.totalStamps === 1 ? 'timbro' : 'timbri'}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Nessun timbro</p>
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
                      title="Rinomina carta"
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
                <span className="text-xl font-bold">Aggiungi Nuova Carta</span>
              </div>
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-white/70 text-sm bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <p className="flex items-center justify-center gap-2">
            <span className="text-lg">💡</span>
            Ogni carta è specifica per un negozio
          </p>
          <p className="mt-2">Accumula punti separatamente in ogni esercizio</p>
        </div>
      </div>
    </div>
  )
}
