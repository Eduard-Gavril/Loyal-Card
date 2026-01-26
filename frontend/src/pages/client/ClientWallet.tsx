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
}

export default function ClientWallet() {
  const navigate = useNavigate()
  const { getAllCards } = useClientStore()
  const [cards, setCards] = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCards()
  }, [])

  const loadCards = async () => {
    try {
      const savedCards = getAllCards()
      
      // Fetch tenant info for each card
      const cardsWithDetails = await Promise.all(
        savedCards.map(async (card) => {
          try {
            const tenant = await api.getTenant(card.tenantId)
            return {
              ...card,
              tenantName: tenant.name,
              tenantLogo: tenant.logo_url,
              brandColor: tenant.brand_color
            }
          } catch (error) {
            console.error('Error loading tenant:', error)
            return {
              ...card,
              tenantName: 'Negozio',
              brandColor: '#6366f1'
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
              <button
                key={card.cardId}
                onClick={() => handleCardClick(card.qrCode)}
                className="w-full bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow cursor-pointer text-left"
                style={{ borderLeft: `6px solid ${card.brandColor}` }}
              >
                <div className="flex items-center gap-4">
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
                      🏪
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">
                      {card.tenantName}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Carta #{card.qrCode.slice(-8).toUpperCase()}
                    </p>
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
                </div>
              </button>
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
