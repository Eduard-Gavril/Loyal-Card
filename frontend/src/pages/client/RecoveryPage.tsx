import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api } from '@/lib/supabase'
import { isValidPhoneNumber, normalizePhoneNumber } from '@/lib/phoneUtils'
import PhoneInput from '@/components/PhoneInput'
import ClientShell from '@/components/client/ClientShell'
import { IosIcon } from '@/components/landing/ios'
import { getTranslation } from '@/lib/i18n'

export default function RecoveryPage() {
  const navigate = useNavigate()
  const { clientId, setClientData, replaceAllCards, language } = useClientStore()
  const t = getTranslation(language)
  
  useEffect(() => {
    const titles: Record<string, string> = {
      en: 'Account Recovery — LoyalCard',
      it: 'Recupero Account — LoyalCard',
      ro: 'Recuperare Cont — LoyalCard'
    }
    document.title = titles[language] || titles.en

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = 'https://loyalcard.net/recovery'
  }, [language])

  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState<'request' | 'verify'>('request')
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current) }
  }, [])

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate phone number
    if (!isValidPhoneNumber(phone)) {
      setError(t.recovery.invalidPhoneFormat)
      setLoading(false)
      return
    }

    try {
      const result = await api.requestRecovery(normalizePhoneNumber(phone))
      
      if (result.success && result.phone_found) {
        setMode('verify')
        setSuccess(t.recovery.checkPhone)
      } else {
        setError(t.recovery.phoneNotFound || 'Phone number not found. Please check and try again.')
      }
    } catch (err: any) {
      setError(err.message || t.recovery.requestError)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!useBackupCode && !pin) {
      setError(t.recovery.enterPin)
      return
    }

    if (useBackupCode && !backupCode) {
      setError(t.recovery.enterBackupCode)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await api.verifyRecovery(
        normalizePhoneNumber(phone),
        useBackupCode ? undefined : pin,
        useBackupCode ? backupCode : undefined,
        clientId || undefined
      )
      
      if (result.success) {
        // Update local storage with recovered client_id
        if (result.client_id) {
          // Get all cards for the recovered client and replace local data
          const cards = await api.getCardsByClient(result.client_id)
          if (cards && cards.length > 0) {
            // Replace all saved cards with the recovered ones
            const recoveredCards = cards.map((card: any) => ({
              clientId: result.client_id,
              cardId: card.id,
              qrCode: card.qr_code,
              tenantId: card.tenant_id
            }))
            replaceAllCards(recoveredCards)
            
            // Set first card as active
            setClientData(recoveredCards[0])
          }
          
          // Show success with merge info
          const mergeInfo = result.cards_merged > 0 || result.cards_transferred > 0
            ? ` (${result.cards_merged || 0} merged, ${result.cards_transferred || 0} transferred)`
            : ''
          setSuccess(t.recovery.accountRecovered.replace('{count}', result.cards_count || '0') + mergeInfo)
          
          // Redirect to dashboard after 2 seconds
          redirectTimerRef.current = setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        }
      }
    } catch (err: any) {
      setError(err.message || t.recovery.verifyError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClientShell back={{ label: t.wallet.back, to: '/dashboard' }} profile={false} narrow>
      {/* Title */}
      <header className="cs-head">
        <span className="cs-hero-ico"><IosIcon name="key" /></span>
        <h1>{t.recovery.title}</h1>
        <p>{t.recovery.subtitle}</p>
      </header>

      {/* Recovery Form */}
      <div className="cs-glass cs-formcard">
        {mode === 'request' ? (
          <form onSubmit={handleRequestRecovery} className="cs-form">
            <div className="cs-field">
              <label className="cs-label">{t.recovery.phoneLabel}</label>
              <PhoneInput value={phone} onChange={setPhone} />
            </div>

            {error && (
              <div className="cs-alert err" style={{ margin: 0 }}>
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="cs-alert ok" style={{ margin: 0 }}>
                <p>{success}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="cs-btn main">
              {loading ? t.recovery.sending : t.recovery.sendButton}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyRecovery} className="cs-form">
            <p className="cs-text" style={{ textAlign: 'center', color: 'var(--text)' }}>
              {t.recovery.pinInstructions}
            </p>

            {!useBackupCode ? (
              <div className="cs-field">
                <label className="cs-label">PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    if (value.length <= 6) setPin(value)
                  }}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  className="cs-input pin"
                  required
                />
              </div>
            ) : (
              <div className="cs-field">
                <label className="cs-label">{t.recovery.backupCodeLabel}</label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    setBackupCode(value)
                  }}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  className="cs-input confirm"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                  required
                />
              </div>
            )}

            {error && (
              <div className="cs-alert err" style={{ margin: 0 }}>
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="cs-alert ok" style={{ margin: 0 }}>
                <p>{success}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="cs-btn main">
              {loading ? t.recovery.verifying : t.recovery.verifyButton}
            </button>

            <button type="button" onClick={() => setUseBackupCode(!useBackupCode)} className="cs-link-btn">
              {useBackupCode ? t.recovery.usePinInstead : t.recovery.forgotPin}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('request')
                setPin('')
                setBackupCode('')
                setUseBackupCode(false)
              }}
              className="cs-link-btn muted"
            >
              {t.recovery.tryDifferentPhone}
            </button>
          </form>
        )}
      </div>

      {/* Info */}
      <p className="cs-foot">
        {t.recovery.noPhone}{' '}
        <button onClick={() => navigate('/dashboard')} className="cs-link-btn inline">
          {t.recovery.createNew}
        </button>
      </p>
    </ClientShell>
  )
}
