import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { useClientStore } from '@/store'
import { api, Card as CardType, RewardRule } from '@/lib/supabase'

interface LoyaltyProgressItem {
  id: string
  name: string
  description?: string
  buy_count: number
  count: number
  rewards: number
}

export function useClientCard() {
  const { qrCode: urlQrCode } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { clientId, qrCode, tenantId, tenantName, setClientData, language } = useClientStore()
  
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

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
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
          } catch (ruleError) {
            // Error silently handled
          }
          setLoading(false)
          return
        }
        
        // CASE 2: No shop selected → go to selection
        if (!activeTenantId) {
          navigate('/select-tenant')
          return
        }
        
        // CASE 3: Shop selected
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
        
        const rulesData = await api.getRewardRules(activeTenantId)
        setRules(rulesData)
        
      } catch (error) {
        // Error silently handled
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

  // Filter rules to show only those with progress
  const activeRules = rules.filter((rule) => {
    const progress = getRuleProgress(rule.id)
    return progress.count > 0 || progress.rewards > 0
  })

  // Fallback: create display data from loyalty_state if rules unavailable
  const hasLoyaltyProgress = card?.loyalty_state && Object.keys(card.loyalty_state).length > 0
  const loyaltyProgressFromState: LoyaltyProgressItem[] = hasLoyaltyProgress 
    ? Object.entries(card!.loyalty_state)
        .filter(([_, state]) => state.count > 0 || state.rewards > 0)
        .map(([ruleId, state]) => {
          const matchingRule = rules.find(r => r.id === ruleId)
          return {
            id: ruleId,
            name: matchingRule?.name || 'Programma Fedeltà',
            description: matchingRule?.description,
            buy_count: matchingRule?.buy_count || 6,
            count: state.count,
            rewards: state.rewards
          }
        })
    : []

  const displayProgress = loyaltyProgressFromState

  return {
    loading,
    card,
    rules,
    activeRules,
    displayProgress,
    qrCode,
    qrDataUrl,
    showInstallButton,
    language,
    getRuleProgress,
    handleInstallClick,
    navigate
  }
}
