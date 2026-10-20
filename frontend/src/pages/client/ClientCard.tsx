import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { useClientStore } from '@/store'
import { api, supabase, Card as CardType, RewardRule, Tenant } from '@/lib/supabase'
import ClientShell from '@/components/client/ClientShell'
import { IosIcon } from '@/components/landing/ios'
import { getTranslation } from '@/lib/i18n'

function CategoryIcon({ type, className = 'w-5 h-5' }: { type: string; className?: string }) {
  const paths: Record<string, string> = {
    all:        'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    cafe:       'M17 8h2a2 2 0 010 4h-2M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z',
    restaurant: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    beauty:     'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
    gym:        'M13 10V3L4 14h7v7l9-11h-7z',
    shop:       'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={paths[type] ?? paths.all} />
    </svg>
  )
}

const INIT_ERROR_MESSAGES: Record<string, { body: string; retry: string }> = {
  en: { body: "We couldn't load your card. Please try again.", retry: 'Try again' },
  it: { body: 'Non siamo riusciti a caricare la tua tessera. Riprova.', retry: 'Riprova' },
  ro: { body: 'Nu am putut încărca cardul tău. Încearcă din nou.', retry: 'Încearcă din nou' },
}

// Gold confetti for a completed reward: light gold and dark gold, deterministic
// so the burst looks the same on every render.
const GOLD_LIGHT = ['#FFF1B8', '#F8E08E', '#F0D682']
const GOLD_DARK = ['#B8860B', '#C9A227', '#D4AF37']
const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
  left: 4 + ((i * 37) % 92),
  delay: (i % 8) * 90,
  size: 6 + (i % 4) * 2,
  dx: ((i % 5) - 2) * 18,
  rot: 360 + (i % 3) * 180,
  color: i % 2 === 0 ? GOLD_LIGHT[i % 3] : GOLD_DARK[i % 3],
  round: i % 3 === 0,
}))

// Full-screen variant: more pieces, wider drift, varied fall speed
const SCREEN_CONFETTI = Array.from({ length: 70 }, (_, i) => ({
  left: (i * 53) % 100,
  delay: (i % 12) * 80,
  duration: 3000 + (i % 6) * 350,
  size: 7 + (i % 5) * 2,
  dx: ((i % 7) - 3) * 28,
  rot: 540 + (i % 4) * 180,
  color: i % 2 === 0 ? GOLD_LIGHT[i % 3] : GOLD_DARK[i % 3],
  round: i % 4 === 0,
}))

function categoryLabel(type: string, language: string): string {
  const labels: Record<string, Record<string, string>> = {
    cafe:       { en: 'Café', ro: 'Cafenea', it: 'Caffetteria' },
    restaurant: { en: 'Restaurant', ro: 'Restaurant', it: 'Ristorante' },
    beauty:     { en: 'Beauty', ro: 'Frumusețe', it: 'Bellezza' },
    gym:        { en: 'Gym', ro: 'Fitness', it: 'Palestra' },
    shop:       { en: 'Shop', ro: 'Magazin', it: 'Negozio' },
  }
  return labels[type]?.[language] ?? labels[type]?.en ?? type
}

export default function ClientCard() {
  const { qrCode: urlQrCode } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { clientId, qrCode, tenantId, tenantName, setClientData, clearClientData, language } = useClientStore()
  const t = getTranslation(language)

  const urlTenantId = searchParams.get('tenant')

  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [card, setCard] = useState<CardType | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [rules, setRules] = useState<RewardRule[]>([])
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [qrError, setQrError] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [showRewardsPanel, setShowRewardsPanel] = useState(false)
  const [hasPhone, setHasPhone] = useState<boolean | null>(null)

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
        alert(t.clientCard.iosInstallInstructions)
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

  useEffect(() => {
    async function init() {
      try {
        const activeTenantId = tenantId || urlTenantId

        if (urlQrCode) {
          try {
            const cardData = await api.getCardByQR(urlQrCode)
            setCard(cardData)
            setClientData({
              clientId: cardData.client_id,
              cardId: cardData.id,
              qrCode: cardData.qr_code,
              tenantId: cardData.tenant_id,
              customName: tenantName || undefined,
            })
            const [rulesData, tenantData] = await Promise.all([
              api.getRewardRules(cardData.tenant_id).catch(() => []),
              api.getTenant(cardData.tenant_id).catch(() => null),
            ])
            setRules(rulesData || [])
            setTenant(tenantData)
          } catch (err) {
            console.warn('[ClientCard] getCardByQR blocked by RLS, displaying QR from URL:', err)
          }
          setLoading(false)
          return
        }

        if (!activeTenantId) {
          navigate('/select-tenant')
          return
        }

        // Fetch tenant info in parallel (non-blocking)
        api.getTenant(activeTenantId).then(setTenant).catch((err) => console.warn('[ClientCard] getTenant failed:', err))

        if (clientId) {
          const existingCard = await api.getCardByClientAndTenant(clientId, activeTenantId)
          if (existingCard) {
            setCard(existingCard)
            setClientData({
              clientId: existingCard.client_id,
              cardId: existingCard.id,
              qrCode: existingCard.qr_code,
              tenantId: existingCard.tenant_id,
              customName: tenantName || undefined,
            })
          } else {
            let result
            try {
              result = await api.generateClientId(activeTenantId, clientId)
            } catch (err) {
              // The saved client_id no longer exists server-side (e.g. wiped by
              // the monthly cleanup of phone-less clients). The backend now
              // self-heals this case, but retry once with a clean slate in
              // case it still fails for some other reason.
              console.warn('[ClientCard] generateClientId failed for saved clientId, retrying fresh:', err)
              clearClientData()
              result = await api.generateClientId(activeTenantId)
            }
            if (result.success) {
              setClientData({
                clientId: result.client_id,
                cardId: result.card_id,
                qrCode: result.qr_code,
                tenantId: activeTenantId,
                customName: tenantName || undefined,
              })
              setCard({
                id: result.card_id!,
                client_id: result.client_id!,
                tenant_id: activeTenantId,
                qr_code: result.qr_code!,
                loyalty_state: result.loyalty_state || {},
                active: true,
              } as CardType)
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
              customName: tenantName || undefined,
            })
            setCard({
              id: result.card_id!,
              client_id: result.client_id!,
              tenant_id: activeTenantId,
              qr_code: result.qr_code!,
              loyalty_state: result.loyalty_state || {},
              active: true,
            } as CardType)
          }
        }

        const rulesData = await api.getRewardRules(activeTenantId)
        setRules(rulesData)
      } catch (err) {
        console.error('[ClientCard] init error:', err)
        setInitError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Detect what changed between two card snapshots so the UI can animate it:
  // a rule that had no progress before gets a "new card" reveal, a rule that
  // already had stamps animates only the stamps just added. The first snapshot
  // of a card is only recorded, so loading the page never animates.
  const prevLoyalty = useRef<{ id: string; state: CardType['loyalty_state'] } | null>(null)
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [anim, setAnim] = useState<{
    newRules: string[]
    stamps: Record<string, [number, number]>
    rewards: string[]
  }>({ newRules: [], stamps: {}, rewards: [] })

  // Layout effect: the animation state must be committed before the browser
  // paints, otherwise the new stamp/card flashes in at full size for one frame.
  useLayoutEffect(() => {
    if (!card) return
    const next = card.loyalty_state || {}
    const prev = prevLoyalty.current
    prevLoyalty.current = { id: card.id, state: next }
    if (!prev || prev.id !== card.id) return

    const newRules: string[] = []
    const stamps: Record<string, [number, number]> = {}
    const rewards: string[] = []
    for (const ruleId of Object.keys(next)) {
      const before = prev.state?.[ruleId]?.count ?? 0
      const beforeRewards = prev.state?.[ruleId]?.rewards ?? 0
      const after = next[ruleId]?.count ?? 0
      if (after > before) {
        stamps[ruleId] = [before, after]
        if (before === 0 && beforeRewards === 0) newRules.push(ruleId)
      }
      if ((next[ruleId]?.rewards ?? 0) > beforeRewards) rewards.push(ruleId)
    }
    if (Object.keys(stamps).length === 0 && rewards.length === 0) return

    setAnim({ newRules, stamps, rewards })
    if (animTimer.current) clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => setAnim({ newRules: [], stamps: {}, rewards: [] }), 6000)
  }, [card])

  useEffect(() => () => {
    if (animTimer.current) clearTimeout(animTimer.current)
  }, [])

  // Live stamp updates: when the store scans the card, the row in `cards`
  // changes and Supabase Realtime pushes it here. Failures are non-fatal;
  // the page then behaves as before (manual refresh).
  const cardId = card?.id
  useEffect(() => {
    if (!cardId) return

    const refetch = () => {
      supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single()
        .then(({ data }) => {
          if (data) setCard((prev) => (prev ? { ...prev, ...(data as CardType) } : prev))
        })
    }

    const channel = supabase
      .channel(`card-${cardId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cards', filter: `id=eq.${cardId}` },
        (payload) => {
          setCard((prev) => (prev ? { ...prev, ...(payload.new as Partial<CardType>) } : prev))
        }
      )
      .subscribe((status) => {
        // Events fired while the socket was down (or not yet open) are not replayed
        if (status === 'SUBSCRIBED') refetch()
      })

    // Browsers suspend WebSockets in background tabs: re-read the card on return.
    const handleVisible = () => {
      if (document.visibilityState === 'visible') refetch()
    }
    document.addEventListener('visibilitychange', handleVisible)

    return () => {
      document.removeEventListener('visibilitychange', handleVisible)
      supabase.removeChannel(channel)
    }
  }, [cardId])

  useEffect(() => {
    if (!card?.client_id) return
    api.getClient(card.client_id)
      .then((client) => setHasPhone(!!client?.phone))
      .catch(() => {
        // Non-fatal: the "save your data" reminder just won't show for this session
      })
  }, [card?.client_id])

  useEffect(() => {
    const activeQr = urlQrCode || qrCode
    if (activeQr) {
      QRCode.toDataURL(activeQr, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
        .then((url) => { setQrDataUrl(url); setQrError(false) })
        .catch((err) => {
          console.error('[ClientCard] QR generation failed:', err)
          setQrError(true)
        })
    }
  }, [qrCode, urlQrCode])

  const getRuleProgress = (ruleId: string) => {
    if (!card?.loyalty_state[ruleId]) return { count: 0, rewards: 0 }
    return card.loyalty_state[ruleId]
  }

  const activeRules = rules.filter((rule) => {
    const progress = getRuleProgress(rule.id)
    return progress.count > 0 || progress.rewards > 0
  })

  const brandColor = tenant?.brand_color ?? '#8b5cf6'
  const displayName = tenant?.name ?? tenantName ?? 'Loyalty Card'

  if (loading) {
    return (
      <ClientShell back={{ label: t.wallet.back, to: '/select-tenant' }} narrow>
        <p className="cs-pulse cs-center">{t.card.loading}</p>
      </ClientShell>
    )
  }

  // Both generateClientId attempts failed (backend self-heal included) — show
  // a real error with a way out instead of silently falling through to a
  // card-shaped page with no card, qr code, or stamps in it.
  if (initError && !card) {
    const errorT = INIT_ERROR_MESSAGES[language] || INIT_ERROR_MESSAGES.en
    return (
      <ClientShell back={{ label: t.wallet.back, to: '/select-tenant' }} narrow>
        <div className="cs-glass cs-empty">
          <span className="cs-empty-ico"><IosIcon name="alert" /></span>
          <p>{errorT.body}</p>
          <button className="cs-btn main" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>
            {errorT.retry}
          </button>
        </div>
      </ClientShell>
    )
  }

  return (
    <ClientShell back={{ label: t.wallet.back, to: '/select-tenant' }}>
      {/* Reward completed: gold confetti over the whole screen (portal escapes any transformed ancestor) */}
      {anim.rewards.length > 0 && createPortal(
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden" aria-hidden="true">
          {SCREEN_CONFETTI.map((c, i) => (
            <span
              key={i}
              className="absolute top-0 animate-confetti-screen"
              style={{
                left: `${c.left}%`,
                width: c.size,
                height: c.round ? c.size : c.size * 1.6,
                borderRadius: c.round ? '9999px' : '2px',
                background: `linear-gradient(135deg, ${c.color}, ${i % 2 === 0 ? '#C9A227' : '#F8E08E'})`,
                animationDelay: `${c.delay}ms`,
                animationDuration: `${c.duration}ms`,
                ['--dx' as string]: `${c.dx}px`,
                ['--rot' as string]: `${c.rot}deg`,
              }}
            />
          ))}
        </div>,
        document.body
      )}

      <div className="cs-col">
        <div>

          {/* ── WALLET CARD ── */}
          {qrDataUrl ? (
            <div className="rounded-3xl overflow-hidden shadow-2xl mb-6 relative">
              {/* Branded gradient background */}
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(145deg, ${brandColor}f0 0%, ${brandColor}a0 100%)` }}
              />
              {/* Glossy shine — diagonal light streak from top-left */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,0) 60%)',
                }}
              />
              {/* Soft bottom reflection */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1/3"
                style={{
                  background: 'linear-gradient(to top, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 100%)',
                }}
              />

              {/* Business info */}
              <div className="relative p-6 pb-4">
                <div className="flex items-start gap-4">
                  {tenant?.logo_url ? (
                    <img
                      src={tenant.logo_url}
                      alt={displayName}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl ring-2 ring-white/30 shadow-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                    >
                      <CategoryIcon type={tenant?.metadata?.type ?? 'all'} className="w-8 h-8 text-white" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-bold text-xl leading-tight truncate">{displayName}</h2>
                    {tenant?.metadata?.type && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <CategoryIcon type={tenant.metadata.type} className="w-3.5 h-3.5 text-white/70" />
                        <span className="text-white/70 text-sm">{categoryLabel(tenant.metadata.type, language)}</span>
                      </div>
                    )}
                    {tenant?.metadata?.description && (
                      <p className="text-white/60 text-xs mt-1 line-clamp-1">{tenant.metadata.description}</p>
                    )}
                    {tenant?.address && (
                      <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {tenant.address}{tenant.city ? `, ${tenant.city}` : ''}
                      </p>
                    )}
                  </div>

                  {/* LoyalCard watermark */}
                  <span className="text-white/30 text-[10px] font-bold tracking-widest flex-shrink-0 mt-1">LC</span>
                </div>
              </div>

              {/* QR code — compact, centered */}
              <div className="relative flex flex-col items-center px-6 pb-2">
                <div className="bg-white rounded-2xl p-3 shadow-xl inline-block">
                  <img src={qrDataUrl} alt="QR Code" className="w-44 h-44 sm:w-52 sm:h-52 block" />
                </div>
                <p className="text-white/65 text-xs mt-2.5 text-center font-medium tracking-wide">
                  {language === 'ro'
                    ? 'Arată la casă pentru a acumula timbri'
                    : language === 'it'
                    ? 'Mostra alla cassa per accumulare timbri'
                    : 'Show at checkout to collect stamps'}
                </p>
              </div>

              {/* Card footer */}
              <div className="relative bg-black/25 px-6 py-3 flex items-center justify-between">
                <span className="text-white/50 text-xs font-mono tracking-wide">{urlQrCode || qrCode}</span>
                <span className="text-white/30 text-xs font-semibold tracking-wider">LOYALCARD</span>
              </div>
            </div>
          ) : qrError ? (
            <div className="cs-glass cs-empty mb-6">
              <p style={{ color: '#ffb4ab' }}>QR code failed to generate. Please refresh the page.</p>
              <button className="cs-btn ghost" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          ) : (
            <div className="cs-glass cs-empty mb-6">
              <p>{t.clientCard.noCardYet}</p>
              <button className="cs-btn main" style={{ marginTop: 20 }} onClick={() => navigate('/select-tenant')}>
                {t.clientCard.selectStore}
              </button>
            </div>
          )}

          {/* Save-your-data reminder — the QR screen is what people actually open every
              time, so this is the one place a phone-less client is guaranteed to see it */}
          {hasPhone === false && (
            <button
              onClick={() => navigate('/dashboard', { state: { openPhoneModal: true } })}
              className="cs-alert warn cs-alert-btn"
            >
              <IosIcon name="alert" />
              <span style={{ flex: 1, minWidth: 0 }}>
                <b className="cs-alert-title">
                  {language === 'ro' ? 'Salvează-ți datele' : language === 'it' ? 'Salva i tuoi dati' : 'Save your data'}
                </b>
                <span className="cs-alert-sub">
                  {language === 'ro'
                    ? 'Fără număr de telefon, timbrele se pierd în fiecare lună'
                    : language === 'it'
                    ? 'Senza numero di telefono i timbri si perdono ogni mese'
                    : 'Without a phone number your stamps get lost every month'}
                </span>
              </span>
              <IosIcon name="chev" />
            </button>
          )}

          {/* Rewards Discovery Accordion */}
          {rules.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowRewardsPanel(v => !v)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl transition-all duration-200"
                style={{
                  background: `
                    linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0) 60%),
                    linear-gradient(145deg, ${brandColor}f0 0%, ${brandColor}a8 100%)
                  `.replace(/\s+/g, ' '),
                  border: `1px solid ${brandColor}70`,
                }}
              >
                <span className="text-white/80 text-sm font-medium">
                  {t.clientCard.discoverBtn}
                </span>
                <svg
                  className={`w-4 h-4 text-white/40 flex-shrink-0 transition-transform duration-300 ${showRewardsPanel ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showRewardsPanel && (
                <div
                  className="mt-1.5 rounded-2xl overflow-hidden"
                  style={{
                    background: `
                      linear-gradient(to top, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%),
                      linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0) 60%),
                      linear-gradient(145deg, ${brandColor}e8 0%, ${brandColor}a0 100%)
                    `.replace(/\s+/g, ' '),
                    border: `1px solid ${brandColor}60`,
                  }}
                >
                  {/* Panel header */}
                  <div
                    className="px-5 pt-4 pb-2 flex items-center justify-between"
                    style={{ borderBottom: `1px solid rgba(255,255,255,0.10)` }}
                  >
                    <span className="text-white/40 text-[11px] font-semibold uppercase tracking-widest">
                      {t.clientCard.discoverTitle}
                    </span>
                    <span className="text-white/25 text-[11px]">{rules.length}</span>
                  </div>

                  {/* List — hidden scrollbar */}
                  <div
                    className="max-h-64 overflow-y-auto px-3 pb-3"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    <style>{`div::-webkit-scrollbar{display:none}`}</style>
                    {rules.map((rule, idx) => {
                      // Strip "gratuit/gratuito/gratis/free" variants from the display name
                      const cleanName = rule.name
                        .replace(/\b(gratuit[ăa]?|gratuito|gratis|free|gratu[iī]t)\b/gi, '')
                        .replace(/\s{2,}/g, ' ')
                        .trim()

                      const stampsWord = t.clientCard.discoverStamps

                      let taglineNode: React.ReactNode

                      if (rule.discount_percent) {
                        const text = t.clientCard.discoverDiscount
                          .replace('{{n}}', String(rule.buy_count))
                          .replace('{{stamps}}', stampsWord)
                          .replace('{{pct}}', String(rule.discount_percent))
                        taglineNode = <span className="text-white/70 text-sm">{text}</span>
                      } else {
                        const tpl = t.clientCard.discoverFreeProduct
                          .replace('{{n}}', String(rule.buy_count))
                          .replace('{{stamps}}', stampsWord)
                        const [before, after] = tpl.split('{{name}}')
                        taglineNode = (
                          <span className="text-white/70 text-sm">
                            {before}
                            <span className="text-white font-semibold">{cleanName}</span>
                            {after ?? ''}
                          </span>
                        )
                      }

                      return (
                        <div
                          key={rule.id}
                          className="flex items-center gap-3 px-2 py-3"
                          style={idx !== rules.length - 1 ? { borderBottom: `1px solid rgba(255,255,255,0.08)` } : {}}
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `rgba(255,255,255,0.15)` }}
                          >
                            <span className="text-white/70 text-xs font-bold">{rule.buy_count}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="leading-snug">{taglineNode}</div>
                            {rule.description && (
                              <div className="text-white/30 text-xs mt-0.5 truncate">{rule.description}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add to Home Screen */}
          {showInstallButton && (
            <div className="mb-6">
              <button
                onClick={handleInstallClick}
                className="cs-btn main"
                style={{ width: '100%', padding: '16px 20px' }}
              >
                <IosIcon name="plus" />
                {t.clientCard.addToHomeScreen}
              </button>
            </div>
          )}
        </div>

        {/* Loyalty Progress — only if stamps exist */}
        {activeRules.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-white text-2xl font-bold flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-400/15 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              {t.card.yourRewards}
            </h2>

            {activeRules.map((rule) => {
              const progress = getRuleProgress(rule.id)
              const stamps = Array.from({ length: rule.buy_count }, (_, i) => i < progress.count)
              const pct = Math.round((progress.count / rule.buy_count) * 100)

              return (
                <div
                  key={rule.id}
                  className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
                    anim.newRules.includes(rule.id) ? 'animate-card-reveal' : ''
                  }`}
                  style={{
                    background: `
                      linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 60%),
                      linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.22) 100%)
                    `.replace(/\s+/g, ' '),
                    border: `1px solid ${brandColor}35`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {/* Subtle top accent line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, transparent, ${brandColor}90, transparent)` }}
                  />

                  {/* Ambient glow blob */}
                  <div
                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl pointer-events-none"
                    style={{ background: `${brandColor}18` }}
                  />

                  {/* Reward completed: gold confetti */}
                  {anim.rewards.includes(rule.id) && (
                    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden" aria-hidden="true">
                      {CONFETTI.map((c, i) => (
                        <span
                          key={i}
                          className="absolute top-0 animate-confetti"
                          style={{
                            left: `${c.left}%`,
                            width: c.size,
                            height: c.round ? c.size : c.size * 1.6,
                            borderRadius: c.round ? '9999px' : '2px',
                            background: `linear-gradient(135deg, ${c.color}, ${i % 2 === 0 ? '#C9A227' : '#F8E08E'})`,
                            animationDelay: `${c.delay}ms`,
                            ['--dx' as string]: `${c.dx}px`,
                            ['--rot' as string]: `${c.rot}deg`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="relative p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-base text-white leading-tight">{rule.name}</h3>
                        {rule.description && (
                          <p className="text-xs text-white/45 mt-0.5">{rule.description}</p>
                        )}
                      </div>
                      {progress.rewards > 0 && (
                        <div
                          className="text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 flex-shrink-0 ml-2"
                          style={{
                            background: `linear-gradient(135deg, #f59e0b, #d97706)`,
                            boxShadow: '0 4px 12px rgba(245,158,11,0.45)',
                          }}
                        >
                          {rule.discount_percent ? (
                            <span>{rule.discount_percent}% OFF</span>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <span>{progress.rewards}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white/50">
                          {progress.count} {t.card.of} {rule.buy_count} {t.card.purchases}
                        </span>
                        {progress.count > 0 && progress.count < rule.buy_count && (
                          <span className="text-xs font-semibold" style={{ color: `${brandColor}` }}>
                            {t.card.onlyMore} {rule.buy_count - progress.count}{t.card.moreNeeded}
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${brandColor}a0, ${brandColor})`,
                            boxShadow: pct > 0 ? `0 0 8px ${brandColor}80` : 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Stamps */}
                    <div className="flex flex-wrap gap-2.5">
                      {stamps.map((isFilled, index) => {
                        const range = anim.stamps[rule.id]
                        const isNew = isFilled && !!range && index >= range[0] && index < range[1]
                        // New cards wait for the reveal to finish before stamping
                        const delay = (anim.newRules.includes(rule.id) ? 500 : 0) + (isNew ? (index - range[0]) * 220 : 0)
                        return (
                        <div key={index} className="relative w-11 h-11">
                          {isNew && (
                            <div
                              className="absolute inset-0 rounded-full animate-stamp-ring pointer-events-none"
                              style={{ border: `2px solid ${brandColor}`, animationDelay: `${delay + 150}ms` }}
                            />
                          )}
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden ${
                            isNew ? 'animate-stamp-pop' : ''
                          }`}
                          style={isFilled ? {
                            ...(isNew ? { animationDelay: `${delay}ms` } : {}),
                            border: `2px solid ${brandColor}90`,
                            boxShadow: `0 4px 16px ${brandColor}50, inset 0 1px 0 rgba(255,255,255,0.2)`,
                          } : {
                            background: 'rgba(255,255,255,0.06)',
                            border: '1.5px solid rgba(255,255,255,0.12)',
                          }}
                        >
                          {isFilled ? (
                            tenant?.logo_url ? (
                              <img
                                src={tenant.logo_url}
                                alt=""
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div
                                className="w-full h-full rounded-full flex items-center justify-center"
                                style={{ background: `linear-gradient(135deg, ${brandColor}f0, ${brandColor}a0)` }}
                              >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )
                          ) : (
                            <span className="text-white/20 text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                        </div>
                        )
                      })}
                    </div>

                    {/* Reward ready banner */}
                    {progress.rewards > 0 && (
                      <div
                        className={`mt-4 p-3 rounded-xl flex items-center gap-3 ${
                          anim.rewards.includes(rule.id) ? 'animate-gold-pulse' : ''
                        }`}
                        style={anim.rewards.includes(rule.id) ? {
                          background: 'linear-gradient(135deg, rgba(248,224,142,0.18), rgba(184,134,11,0.18))',
                          border: '1px solid rgba(240,214,130,0.55)',
                        } : {
                          background: 'rgba(34,197,94,0.12)',
                          border: '1px solid rgba(34,197,94,0.25)',
                        }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.2)' }}>
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-green-300">
                            {rule.discount_percent
                              ? `${rule.discount_percent}% ${t.clientCard.discountAvailable}`
                              : `${progress.rewards} ${progress.rewards === 1 ? t.clientCard.rewardAvailable : t.clientCard.rewardsAvailable}`}
                          </p>
                          <p className="text-xs text-green-400/70">{t.clientCard.showCardToRedeem}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* How it works */}
        <div className="cs-glass cs-how mt-6">
          <h3 className="font-bold mb-4 text-lg flex items-center gap-2 text-white">
            <div className="w-7 h-7 bg-amber-400/15 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {t.card.howItWorks}
          </h3>
          <ul className="text-sm text-gray-200 space-y-3">
            {[
              { icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 12h2a1 1 0 001-1v-2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zM17 8h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z', label: t.card.howStep1 },
              { icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', label: t.card.howStep2 },
              { icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z', label: t.card.howStep3 },
              { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: t.card.howStep4 },
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.icon} />
                  </svg>
                </div>
                {step.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ClientShell>
  )
}
