import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api } from '@/lib/supabase'
import { isValidPhoneNumber, normalizePhoneNumber } from '@/lib/phoneUtils'
import PhoneInput from '@/components/PhoneInput'
import ClientShell from '@/components/client/ClientShell'
import Modal from '@/components/client/Modal'
import { IosIcon, Squircle } from '@/components/landing/ios'
import { useL } from '@/components/landing/shared'
import { getTranslation } from '@/lib/i18n'

export default function UserDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clientId, language, clearAll } = useClientStore()
  const t = getTranslation(language)
  const L = useL()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cardCount, setCardCount] = useState(0)
  const [totalStamps, setTotalStamps] = useState(0)
  const [totalRewards, setTotalRewards] = useState(0)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  
  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Phone protection state
  const [hasPhone, setHasPhone] = useState(false)
  const [clientName, setClientName] = useState('')
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneSuccess, setPhoneSuccess] = useState(false)
  const [savingPhone, setSavingPhone] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  // Name update state (for existing users with phone but no name)
  const [showNameModal, setShowNameModal] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)

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
        alert(t.userDashboard.iosInstallInstructions)
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
    loadStats()
  }, [clientId])

  // Opened via the "save your data" reminder on the QR screen
  useEffect(() => {
    if (!loading && !hasPhone && (location.state as any)?.openPhoneModal) {
      setShowPhoneModal(true)
      window.history.replaceState({}, '')
    }
  }, [loading, hasPhone, location.state])

  const loadStats = async () => {
    setLoading(true)
    setLoadError('')
    try {
      if (!clientId) {
        setCardCount(0)
        setTotalStamps(0)
        setTotalRewards(0)
        setHasPhone(false)
        setLoading(false)
        return
      }

      const client = await api.getClient(clientId)
      setHasPhone(!!client?.phone)
      setClientName(client?.name || '')

      const allCards = await api.getCardsByClient(clientId)
      console.debug('[dashboard] clientId:', clientId, '| cards found:', allCards.length)
      setCardCount(allCards.length)

      let stamps = 0
      let rewards = 0

      allCards.forEach((card: any) => {
        const loyaltyState = card.loyalty_state || {}
        Object.values(loyaltyState).forEach((state: any) => {
          stamps += state?.count || 0
          rewards += state?.rewards || 0
        })
      })

      setTotalStamps(stamps)
      setTotalRewards(rewards)
    } catch (error: any) {
      console.error('Error loading stats:', error)
      setLoadError(error?.message || 'Failed to load profile data')
    }
    setLoading(false)
  }

  const handleLinkPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !phone || !pin) return

    // Validate phone number
    if (!isValidPhoneNumber(phone)) {
      setPhoneError(t.protection.linkError + ' Invalid phone number format.')
      return
    }

    // Validate PIN (must be 6 digits)
    if (!/^\d{6}$/.test(pin)) {
      setPhoneError(t.protection.pinSixDigits)
      return
    }

    if (pin !== confirmPin) {
      setPhoneError(t.protection.pinsMismatch)
      return
    }

    setSavingPhone(true)
    setPhoneError('')

    try {
      const result = await api.linkPhone(clientId, normalizePhoneNumber(phone), pin, name.trim() || undefined)
      if (result.success && result.backup_codes) {
        if (name.trim()) setClientName(name.trim())
        setBackupCodes(result.backup_codes)
        setShowBackupCodes(true)
        setPhoneSuccess(true)
        setHasPhone(true)
        // Don't close modal yet - show backup codes first
      }
    } catch (error: any) {
      setPhoneError(error?.message || t.protection.linkError)
    } finally {
      setSavingPhone(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      if (clientId) {
        await api.deleteAccount(clientId)
      }
      clearAll()
      setShowDeleteModal(false)
      navigate('/')
    } catch (err: any) {
      setDeleteError(err?.message ?? 'Failed to delete data. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleCloseBackupCodes = () => {
    setShowBackupCodes(false)
    setShowPhoneModal(false)
    setPhoneSuccess(false)
    setPhone('')
    setName('')
    setPin('')
    setConfirmPin('')
    setBackupCodes([])
  }

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !nameInput.trim()) return
    setSavingName(true)
    setNameError('')
    try {
      await api.updateClientName(clientId, nameInput.trim())
      setClientName(nameInput.trim())
      setNameSuccess(true)
      setTimeout(() => {
        setShowNameModal(false)
        setNameSuccess(false)
        setNameInput('')
      }, 1500)
    } catch (err: any) {
      setNameError(err?.message || t.protection.nameError)
    } finally {
      setSavingName(false)
    }
  }

  // Backup codes: let people copy them instead of retyping (they are shown only once)
  const [copied, setCopied] = useState(false)
  const handleCopyCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable: the codes stay on screen to copy by hand
    }
  }

  const GOLD = 'linear-gradient(160deg,#ffd166,#f5a623)'
  const AMBER = 'linear-gradient(160deg,#ffc447,#e5811a)'
  const COPPER = 'linear-gradient(160deg,#ff9a3d,#e5671c)'

  const stats = [
    { icon: 'wallet' as const, n: cardCount, label: t.userDashboard.activeCards, color: GOLD },
    { icon: 'sparkle' as const, n: totalStamps, label: t.userDashboard.totalStamps, color: AMBER },
    { icon: 'gift' as const, n: totalRewards, label: t.userDashboard.rewardsEarned, color: COPPER },
  ]

  const resetPhoneModal = () => {
    setShowPhoneModal(false)
    setPhoneError('')
    setPhone('')
  }

  return (
    <ClientShell back={{ label: t.appName, to: '/' }} profile={false}>
      <header className="cs-head">
        <h1>{t.userDashboard.welcome}</h1>
        <p>{t.userDashboard.subtitle}</p>
      </header>

      {/* Load error banner */}
      {loadError && (
        <div className="cs-alert err">
          <p style={{ flex: 1 }}>{loadError}</p>
          <button className="cs-mini" onClick={loadStats}>{t.userDashboard.retry || 'Retry'}</button>
        </div>
      )}

      {/* Stats */}
      <div className="cs-stats">
        {stats.map((s) => (
          <div key={s.label} className="cs-glass cs-stat">
            <div className="cs-stat-top">
              <Squircle color={s.color} size={34}><IosIcon name={s.icon} /></Squircle>
              <b>{loading ? <span style={{ opacity: 0.35 }}>—</span> : s.n}</b>
            </div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Protection banner - only show if client has cards but no phone */}
      {clientId && cardCount > 0 && !hasPhone && !loading && (
        <div className="cs-alert warn">
          <IosIcon name="alert" />
          <div>
            <h4>{t.protection.title}</h4>
            <p>{t.protection.description}</p>
            <p className="strong">{t.protection.warning}</p>
            <button className="cs-warn-btn" onClick={() => setShowPhoneModal(true)}>{t.protection.addPhone}</button>
          </div>
        </div>
      )}

      {/* Protected badge - show if phone is linked */}
      {clientId && hasPhone && !loading && (
        <div className="cs-alert ok">
          <IosIcon name="shield" />
          <span>{t.protection.accountProtected}</span>
        </div>
      )}

      {/* Name row - always visible when clientId exists */}
      {clientId && !loading && (
        <div className="cs-glass cs-row">
          <span className="cs-avatar"><IosIcon name="user" /></span>
          {clientName ? <b>{clientName}</b> : <i>{t.protection.addNameTitle}</i>}
          <button
            className="cs-icon-btn"
            onClick={() => { setNameInput(clientName); setNameError(''); setNameSuccess(false); setShowNameModal(true) }}
            title={t.protection.addNameTitle}
            aria-label={t.protection.addNameTitle}
          >
            <IosIcon name="pencil" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="cs-actions">
        <button className="cs-glass cs-act" onClick={() => navigate('/select-tenant')}>
          <Squircle color={AMBER} size={44}><IosIcon name="plus" /></Squircle>
          <span>
            <b>{t.userDashboard.getNewCard}</b>
            <small>{t.userDashboard.getNewCardDesc}</small>
          </span>
        </button>

        <button className="cs-glass cs-act" onClick={() => navigate('/wallet')}>
          <Squircle color={GOLD} size={44}><IosIcon name="wallet" /></Squircle>
          <span>
            <b>{t.userDashboard.viewMyCards}</b>
            <small>{t.userDashboard.viewMyCardsDesc}</small>
          </span>
        </button>

        <button className="cs-glass cs-act" onClick={() => navigate('/recovery')}>
          <Squircle color={COPPER} size={44}><IosIcon name="key" /></Squircle>
          <span>
            <b>{t.recovery.title}</b>
            <small>{t.recovery.dashboardDesc}</small>
          </span>
        </button>

        {showInstallButton ? (
          <button className="cs-glass cs-act" onClick={handleInstallClick}>
            <Squircle color={GOLD} size={44}><IosIcon name="download" /></Squircle>
            <span>
              <b>{t.userDashboard.installApp}</b>
              <small>{t.userDashboard.installAppDesc}</small>
            </span>
          </button>
        ) : (
          <button
            className="cs-glass cs-act danger"
            onClick={() => { setDeleteInput(''); setDeleteError(''); setShowDeleteModal(true) }}
          >
            <Squircle color="linear-gradient(160deg,#ff8a7a,#e5484d)" size={44} className="danger"><IosIcon name="trash" /></Squircle>
            <span>
              <b>{t.userDashboard.deleteAccountTitle}</b>
              <small>{t.userDashboard.deleteAccountSub}</small>
            </span>
          </button>
        )}
      </div>

      {/* Delete account row - only when the install tile is occupying the 4th slot */}
      {showInstallButton && (
        <button
          className="cs-del"
          onClick={() => { setDeleteInput(''); setDeleteError(''); setShowDeleteModal(true) }}
        >
          <Squircle color="linear-gradient(160deg,#ff8a7a,#e5484d)" size={30} className="danger"><IosIcon name="trash" /></Squircle>
          <span>
            <b>{t.userDashboard.deleteAccountTitle}</b>
            <small>{t.userDashboard.deleteAccountSub}</small>
          </span>
          <IosIcon name="chev" />
        </button>
      )}

      {/* Info section */}
      <section className="cs-glass cs-how">
        <h4>{t.userDashboard.howItWorksTitle}</h4>
        <ol>
          {[t.userDashboard.step1, t.userDashboard.step2, t.userDashboard.step3, t.userDashboard.step4].map((step, i) => (
            <li key={i}>
              <span>{i + 1}</span>
              <p style={{ margin: 0 }}>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <Modal tone="danger" title={t.userDashboard.deleteAccountTitle} onClose={() => setShowDeleteModal(false)}>
          <div className="cs-form">
            <div className="cs-alert err" style={{ margin: 0 }}>
              <p>{hasPhone ? t.userDashboard.deleteLinkedWarning : t.userDashboard.deleteUnlinkedWarning}</p>
            </div>

            <div className="cs-field">
              <span className="cs-label">{t.userDashboard.deleteConfirmPrompt}</span>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
                placeholder={t.userDashboard.deleteConfirmWord}
                autoCapitalize="characters"
                autoCorrect="off"
                className={`cs-input confirm${deleteInput === t.userDashboard.deleteConfirmWord ? ' is-ready' : ''}`}
              />
            </div>

            {deleteError && (
              <div className="cs-alert err" style={{ margin: 0 }}>
                <p>{deleteError}</p>
              </div>
            )}

            <button
              className="cs-btn danger"
              onClick={handleDeleteAccount}
              disabled={deleteInput !== t.userDashboard.deleteConfirmWord || deleting}
            >
              {deleting ? (
                <svg className="cs-spin" fill="none" viewBox="0 0 24 24">
                  <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <IosIcon name="trash" />
              )}
              {t.userDashboard.deleteConfirmBtn}
            </button>
            <button className="cs-btn ghost" onClick={() => setShowDeleteModal(false)}>{t.wallet.cancel}</button>
          </div>
        </Modal>
      )}

      {/* Name Modal - for existing users with phone but no name */}
      {showNameModal && (
        <Modal
          title={clientName ? t.protection.editNameTitle : t.protection.addNameTitle}
          onClose={() => { setShowNameModal(false); setNameError('') }}
        >
          {nameSuccess ? (
            <div className="cs-sheet-ok">
              <div className="cs-ok-ico"><IosIcon name="check" /></div>
              <p style={{ margin: 0, fontSize: 18 }}>{t.protection.nameUpdated}</p>
            </div>
          ) : (
            <form onSubmit={handleSaveName} className="cs-form">
              <p className="cs-text">{t.protection.addNameDescription}</p>
              <div className="cs-field">
                <label className="cs-label">{t.protection.nameLabel}</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder={t.protection.namePlaceholder}
                  maxLength={100}
                  autoFocus
                  className="cs-input"
                  required
                />
              </div>

              {nameError && (
                <div className="cs-alert err" style={{ margin: 0 }}>
                  <p>{nameError}</p>
                </div>
              )}

              <div className="cs-btns">
                <button type="button" className="cs-btn ghost" onClick={() => { setShowNameModal(false); setNameError('') }}>
                  {t.wallet.cancel}
                </button>
                <button type="submit" className="cs-btn main" disabled={savingName || !nameInput.trim()}>
                  {savingName ? '...' : t.protection.saveName}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Phone Modal */}
      {showPhoneModal && (
        <Modal title={t.protection.modalTitle} onClose={resetPhoneModal}>
          {showBackupCodes ? (
            <div className="cs-form">
              <div style={{ textAlign: 'center' }}>
                <div className="cs-ok-ico"><IosIcon name="check" /></div>
                <h4 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700 }}>{t.protection.phoneLinked}</h4>
                <p className="cs-text" style={{ color: '#ffe2a8' }}>
                  {L('Salva subito questi codici di backup!', 'Save these backup codes immediately!', 'Salvează imediat aceste coduri de rezervă!')}
                </p>
              </div>

              <div className="cs-codes">
                <p>
                  {L(
                    `I tuoi codici di backup (${backupCodes.length} rimasti)`,
                    `Your backup codes (${backupCodes.length} remaining)`,
                    `Codurile tale de rezervă (${backupCodes.length} rămase)`,
                  )}
                </p>
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="cs-code">{code}</div>
                ))}
                <ul>
                  <li>{L('Ogni codice si può usare una sola volta', 'Each code can only be used once', 'Fiecare cod poate fi folosit o singură dată')}</li>
                  <li>{L('Usali se dimentichi il PIN', 'Use these if you forget your PIN', 'Folosește-le dacă uiți PIN-ul')}</li>
                  <li>{L('Fai uno screenshot o scrivili ORA', 'Screenshot or write them down NOW', 'Fă o captură de ecran sau notează-le ACUM')}</li>
                </ul>
              </div>

              <button type="button" className="cs-btn ghost" onClick={handleCopyCodes}>
                <IosIcon name="copy" />
                {copied ? L('Copiato', 'Copied', 'Copiat') : L('Copia i codici', 'Copy codes', 'Copiază codurile')}
              </button>
              <button type="button" className="cs-btn main" onClick={handleCloseBackupCodes}>
                {L('Ho salvato i codici - Continua', 'I saved my codes - Continue', 'Am salvat codurile - Continuă')}
              </button>
            </div>
          ) : phoneSuccess ? (
            <div className="cs-sheet-ok">
              <div className="cs-ok-ico"><IosIcon name="check" /></div>
              <p style={{ margin: 0, fontSize: 18 }}>{t.protection.phoneLinked}</p>
            </div>
          ) : (
            <form onSubmit={handleLinkPhone} className="cs-form">
              <p className="cs-text">{t.protection.modalDescription}</p>

              <div className="cs-field">
                <label className="cs-label">{t.protection.nameLabel}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.protection.namePlaceholder}
                  maxLength={100}
                  className="cs-input"
                />
              </div>

              <div className="cs-field">
                <label className="cs-label">{t.protection.phoneLabel}</label>
                <PhoneInput value={phone} onChange={setPhone} />
              </div>

              <div className="cs-field">
                <label className="cs-label">
                  {L('PIN di sicurezza (6 cifre)', 'Security PIN (6 digits)', 'PIN de securitate (6 cifre)')}
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  className="cs-input pin"
                  required
                />
                <p className="cs-hint">
                  {L('Scegli un PIN di 6 cifre per proteggere il tuo account', 'Choose a 6-digit PIN to protect your account', 'Alege un PIN de 6 cifre pentru a-ți proteja contul')}
                </p>
              </div>

              <div className="cs-field">
                <label className="cs-label">{L('Conferma PIN', 'Confirm PIN', 'Confirmă PIN')}</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  className="cs-input pin"
                  required
                />
              </div>

              {phoneError && (
                <div className="cs-alert err" style={{ margin: 0 }}>
                  <p>{phoneError}</p>
                </div>
              )}

              <div className="cs-btns">
                <button
                  type="button"
                  className="cs-btn ghost"
                  onClick={() => {
                    setShowPhoneModal(false)
                    setPhoneError('')
                    setPhone('')
                    setPin('')
                    setConfirmPin('')
                  }}
                >
                  {t.wallet.cancel}
                </button>
                <button type="submit" className="cs-btn main" disabled={savingPhone}>
                  {savingPhone ? '...' : t.protection.savePhone}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </ClientShell>
  )
}
