import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api, RewardRule } from '@/lib/supabase'
import ClientShell from '@/components/client/ClientShell'
import { IosIcon } from '@/components/landing/ios'
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
      <ClientShell back={{ label: t.wallet.back, to: '/dashboard' }} narrow>
        <p className="cs-pulse cs-center">{t.wallet.loading}</p>
      </ClientShell>
    )
  }

  return (
    <ClientShell back={{ label: t.wallet.back, to: '/dashboard' }} narrow>
      {/* Title */}
      <header className="cs-head">
        <h1>{t.wallet.title}</h1>
        <p>{t.wallet.subtitle}</p>
      </header>

      {/* Cards List */}
      {cards.length === 0 ? (
        <div className="cs-glass cs-empty cs-empty-big">
          {/* Icon stack - multiple cards illustration */}
          <div className="cs-stackart" aria-hidden="true">
            <i className="a3" />
            <i className="a2" />
            <i className="a1"><b /></i>
          </div>

          <h2>{!clientId ? t.wallet.welcome : t.wallet.noCards}</h2>
          <p className="cs-pre">{!clientId ? t.wallet.startCollecting : t.wallet.noCardsYet}</p>

          <button className="cs-btn main" onClick={handleAddNewCard}>
            <IosIcon name="plus" />
            {t.wallet.createFirstCard}
          </button>
        </div>
      ) : (
        <div className="cs-list">
          {cards.map((card) => (
            <div key={card.cardId} className="cs-glass cs-wcard" style={{ borderLeft: `4px solid ${card.brandColor}` }}>
              {editingCard === card.qrCode ? (
                // Edit Mode
                <div className="cs-form">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="cs-input"
                    placeholder={t.wallet.cardNamePlaceholder}
                    autoFocus
                  />
                  <div className="cs-btns">
                    <button className="cs-btn main" onClick={() => handleSaveEdit(card.qrCode)}>
                      <IosIcon name="check" />
                      {t.wallet.save}
                    </button>
                    <button className="cs-btn ghost" onClick={handleCancelEdit}>
                      <IosIcon name="close" />
                      {t.wallet.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="cs-wrow">
                  <button onClick={() => handleCardClick(card.qrCode)} className="cs-wmain">
                    {card.tenantLogo ? (
                      <img src={card.tenantLogo} alt={card.tenantName} className="cs-wlogo" />
                    ) : (
                      <div className="cs-wlogo cs-wlogo-fallback" style={{ backgroundColor: card.brandColor + '30' }}>
                        <IosIcon name="wallet" />
                      </div>
                    )}

                    <div className="cs-winfo">
                      <h3>{card.customName || card.tenantName}</h3>
                      <p>{t.wallet.store} • #{card.qrCode.slice(-6).toUpperCase()}</p>

                      {/* Progress Indicator */}
                      {card.hasProgress ? (
                        <div className="cs-wprog">
                          <div className="cs-stars">
                            {[...Array(card.progressTarget)].map((_, i) => (
                              <svg key={i} viewBox="0 0 20 20" className={i < card.progressCount ? 'on' : ''} aria-hidden="true">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.445a1 1 0 00-1.175 0l-3.367 2.445c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.075 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.274-3.958z" />
                              </svg>
                            ))}
                          </div>
                          <span className="cs-wcount">
                            {card.progressCount}/{card.progressTarget} {t.wallet.stamps}
                          </span>
                          {card.rewardsAvailable > 0 && (
                            <span
                              className="cs-pill accent"
                              title={`${card.rewardsAvailable} ${card.rewardsAvailable === 1 ? t.wallet.rewardReady : t.wallet.rewardsReady}`}
                            >
                              <IosIcon name="gift" />
                              {card.rewardsAvailable}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="cs-wnone">{t.wallet.noStamps}</p>
                      )}
                    </div>

                    <IosIcon name="chev" />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleStartEdit(card)}
                    className="cs-icon-btn"
                    title={t.wallet.renameCard}
                    aria-label={t.wallet.renameCard}
                  >
                    <IosIcon name="pencil" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add New Card Button */}
          <button onClick={handleAddNewCard} className="cs-glass cs-add">
            <IosIcon name="plus" />
            <span>{t.wallet.addNew}</span>
          </button>
        </div>
      )}

      {/* Footer Info */}
      <section className="cs-glass cs-how cs-tip">
        <IosIcon name="info" />
        <div>
          <p style={{ marginTop: 0 }}>{t.wallet.cardSpecificInfo}</p>
          <p>{t.wallet.earnPointsSeparately}</p>
        </div>
      </section>
    </ClientShell>
  )
}
