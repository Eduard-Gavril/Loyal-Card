import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api, RewardRule } from '@/lib/supabase'
import StaticBackground from '@/components/StaticBackground'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

type LoyaltyState = Record<string, { count: number; rewards: number }>

interface SavedCard {
  clientId: string
  cardId: string
  qrCode: string
  tenantId: string
  tenantName: string
  tenantLogo?: string
  brandColor: string
  loyaltyState: LoyaltyState
  progressCount: number
  progressTarget: number
  hasProgress: boolean
  rewardsAvailable: number
  customName?: string
}

// Progress shown in the wallet list: the highest-priority rule (lowest number,
// rules arrive sorted) still in progress — never a sum across rules, which can
// exceed a single rule's target (e.g. "9/6")
function computeProgress(loyaltyState: LoyaltyState, rules: RewardRule[]) {
  const states = Object.values(loyaltyState)
  const hasProgress = states.some(s => (s?.count || 0) > 0 || (s?.rewards || 0) > 0)
  const rewardsAvailable = states.reduce((sum, s) => sum + (s?.rewards || 0), 0)

  if (rules.length === 0) {
    // Rules unavailable (fetch failed): fall back to the first entry in progress
    const inProgress = states.find(s => (s?.count || 0) > 0)
    return {
      hasProgress,
      rewardsAvailable,
      progressCount: Math.min(inProgress?.count || 0, 6),
      progressTarget: 6,
    }
  }

  const notCompleted = rules.filter(r => (loyaltyState[r.id]?.count || 0) < r.buy_count)
  const displayRule =
    notCompleted.find(r => (loyaltyState[r.id]?.count || 0) > 0) ||
    notCompleted[0] ||
    rules.find(r => {
      const s = loyaltyState[r.id]
      return (s?.count || 0) > 0 || (s?.rewards || 0) > 0
    })

  return {
    hasProgress,
    rewardsAvailable,
    progressCount: displayRule
      ? Math.min(loyaltyState[displayRule.id]?.count || 0, displayRule.buy_count)
      : 0,
    progressTarget: displayRule?.buy_count || 6,
  }
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
        setCards([])
        setLoading(false)
        return
      }

      // Get ALL cards for this client from database
      const allCards = await api.getCardsByClient(clientId)
      
      // Get saved cards from store (with customName)
      const savedCards = getAllCards()
      
      // Fetch tenant details for each card
      const cardsWithDetails = await Promise.all(
        allCards.map(async (cardData: any) => {
          const loyaltyState: LoyaltyState = cardData.loyalty_state || {}
          // Get customName from store if available
          const savedCard = savedCards.find(c => c.qrCode === cardData.qr_code)

          try {
            const [tenant, rules] = await Promise.all([
              api.getTenant(cardData.tenant_id),
              api.getRewardRules(cardData.tenant_id).catch(() => [] as RewardRule[])
            ])

            return {
              clientId: cardData.client_id,
              cardId: cardData.id,
              qrCode: cardData.qr_code,
              tenantId: cardData.tenant_id,
              tenantName: tenant.name,
              tenantLogo: tenant.logo_url,
              brandColor: tenant.brand_color,
              loyaltyState,
              ...computeProgress(loyaltyState, rules || []),
              customName: savedCard?.customName
            }
          } catch (_err) {
            // Return card even if tenant fetch fails, with fallback values
            return {
              clientId: cardData.client_id,
              cardId: cardData.id,
              qrCode: cardData.qr_code,
              tenantId: cardData.tenant_id,
              tenantName: t.wallet.store,
              tenantLogo: undefined,
              brandColor: '#6366f1',
              loyaltyState,
              ...computeProgress(loyaltyState, []),
              customName: savedCard?.customName
            }
          }
        })
      )

      setCards(cardsWithDetails.filter(c => c !== null) as SavedCard[])
    } catch (err) {
      console.error('[ClientWallet] loadCards failed:', err)
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
        <div className="fixed inset-0 z-0 overflow-hidden">
          <StaticBackground />
        </div>
        <div className="relative z-10 text-white text-xl font-semibold animate-pulse">{t.wallet.loading}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 relative overflow-hidden">
      <div className="fixed inset-0 z-0 overflow-hidden">
        <StaticBackground />
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
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 sm:mb-3 flex items-center justify-center gap-2 sm:gap-3">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {t.wallet.title}
          </h1>
          <p className="text-white/80 text-base sm:text-lg">{t.wallet.subtitle}</p>
        </div>

        {/* Cards List */}
        {cards.length === 0 ? (
          <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 sm:p-12 text-center border border-white/20 overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative">
              {/* Icon stack - multiple cards illustration */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
                {/* Card 3 - Background */}
                <div className="absolute top-4 left-8 w-20 h-16 sm:w-24 sm:h-20 bg-gradient-to-br from-purple-400/40 to-purple-500/40 rounded-xl shadow-lg transform rotate-12 backdrop-blur-sm border border-white/10"></div>
                {/* Card 2 - Middle */}
                <div className="absolute top-2 left-4 w-20 h-16 sm:w-24 sm:h-20 bg-gradient-to-br from-blue-400/50 to-blue-500/50 rounded-xl shadow-lg transform rotate-6 backdrop-blur-sm border border-white/20"></div>
                {/* Card 1 - Front (Main) */}
                <div className="absolute top-0 left-0 w-20 h-16 sm:w-24 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-300 border border-white/30">
                  <div className="absolute inset-0 flex flex-col justify-between p-2 sm:p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-3 sm:w-5 sm:h-4 bg-white/30 rounded"></div>
                      <div className="w-4 h-3 sm:w-5 sm:h-4 bg-white/30 rounded"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1 bg-white/40 rounded w-full"></div>
                      <div className="h-1 bg-white/40 rounded w-2/3"></div>
                    </div>
                  </div>
                  {/* Card chip */}
                  <div className="absolute top-2 right-2 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400/90 rounded-sm shadow-lg"></div>
                </div>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
                {!clientId ? t.wallet.welcome : t.wallet.noCards}
              </h2>
              <p className="text-white/80 mb-8 sm:mb-10 text-base sm:text-lg leading-relaxed max-w-md mx-auto whitespace-pre-line">
                {!clientId ? t.wallet.startCollecting : t.wallet.noCardsYet}
              </p>
              
              <button
                onClick={handleAddNewCard}
                className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-bold text-base sm:text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 inline-flex items-center justify-center gap-3 overflow-hidden border border-white/20"
              >
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
                
                <svg className="w-6 h-6 relative z-10 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative z-10">{t.wallet.createFirstCard}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {cards.map((card) => (
              <div
                key={card.cardId}
                className="w-full bg-white/15 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20 hover:border-white/30 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300"
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
                          className="w-16 h-16 rounded-full flex items-center justify-center ring-2 ring-white/20"
                          style={{ backgroundColor: card.brandColor + '30' }}
                        >
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
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
                        {card.hasProgress ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-0.5">
                              {[...Array(card.progressTarget)].map((_, i) => (
                                i < card.progressCount ? (
                                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.075 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.274-3.958z" />
                                  </svg>
                                ) : (
                                  <svg key={i} className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.075 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.274-3.958z" />
                                  </svg>
                                )
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">
                              {card.progressCount}/{card.progressTarget} {t.wallet.stamps}
                            </span>
                            {card.rewardsAvailable > 0 && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold"
                                title={`${card.rewardsAvailable} ${card.rewardsAvailable === 1 ? t.wallet.rewardReady : t.wallet.rewardsReady}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                                {card.rewardsAvailable}
                              </span>
                            )}
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
