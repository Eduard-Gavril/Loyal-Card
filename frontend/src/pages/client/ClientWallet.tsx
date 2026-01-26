import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api } from '@/lib/supabase'

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
  const { getAllCards, updateCardName } = useClientStore()
  const [cards, setCards] = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = async () => {
    try {
      const savedCards = getAllCards()
      
      // Fetch full card data with loyalty state
      const cardsWithDetails = await Promise.all(
        savedCards.map(async (card) => {
          try {
            // Get card data with loyalty state
            const cardData = await api.getCardByQR(card.qrCode)
            const tenant = await api.getTenant(card.tenantId)
            
            // Count total stamps across all products/categories
            const loyaltyState = cardData.loyalty_state || {}
            const totalStamps = Object.values(loyaltyState).reduce(
              (sum: number, count: any) => sum + (typeof count === 'number' ? count : 0), 
              0
            )
            
            return {
              ...card,
              tenantName: tenant.name,
              tenantLogo: tenant.logo_url,
              brandColor: tenant.brand_color,
              loyaltyState,
              totalStamps,
              customName: card.customName
            }
          } catch (error) {
            console.error('Error loading card:', error)
            return {
              ...card,
              tenantName: 'Negozio',
              brandColor: '#6366f1',
              loyaltyState: {},
              totalStamps: 0,
              customName: card.customName
            }
          }
        })
      )

      setCards(cardsWithDetails)
    } catch (error) {
      console.error('Error loading cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (qrCode: string) => {
    navigate(`/card/${qrCode}`)
  }

  const handleAddNewCard = () => {
    navigate('/card/new')
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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold text-white mb-2">💳 Le Tue Carte</h1>
          <p className="text-white/80">Scegli la carta da mostrare</p>
        </div>

        {/* Cards List */}
        {cards.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🎴</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Nessuna carta
            </h2>
            <p className="text-gray-600 mb-6">
              Non hai ancora nessuna carta fedeltà.<br />
              Chiedi al negozio di scansionare il tuo QR!
            </p>
            <button
              onClick={handleAddNewCard}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Crea Nuova Carta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => (
              <div
                key={card.cardId}
                className="w-full bg-white rounded-2xl shadow-xl p-6"
                style={{ borderLeft: `6px solid ${card.brandColor}` }}
              >
                {editingCard === card.qrCode ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="Nome carta"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(card.qrCode)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                      >
                        ✓ Salva
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
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
              className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-2xl p-6 hover:bg-white/30 transition-colors cursor-pointer"
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
                <span className="text-lg font-semibold">Aggiungi Nuova Carta</span>
              </div>
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-white/60 text-sm">
          <p>💡 Ogni carta è specifica per un negozio</p>
          <p className="mt-1">Accumula punti separatamente in ogni esercizio</p>
        </div>
      </div>
    </div>
  )
}
