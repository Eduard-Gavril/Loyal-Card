import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api } from '@/lib/supabase'
import { isValidPhoneNumber, normalizePhoneNumber } from '@/lib/phoneUtils'
import PhoneInput from '@/components/PhoneInput'
import StaticBackground from '@/components/StaticBackground'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

export default function UserDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clientId, language, clearAll } = useClientStore()
  const t = getTranslation(language)
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

  return (
    <div className="relative w-full min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <StaticBackground />
      </div>

      {/* Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-10"></div>

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-6 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-lg font-semibold">{t.appName}</span>
            </button>
            <LanguageSelector />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {t.userDashboard.welcome}
              </h1>
              <p className="text-gray-300 text-lg">
                {t.userDashboard.subtitle}
              </p>
            </div>

            {/* Load error banner */}
            {loadError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-400/20 flex items-center justify-between gap-3">
                <p className="text-red-300 text-sm">{loadError}</p>
                <button
                  onClick={loadStats}
                  className="text-xs text-white bg-red-500/30 hover:bg-red-500/50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  {t.userDashboard.retry || 'Retry'}
                </button>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6 sm:mb-8">
              {/* Active Cards */}
              <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-violet-500/15 to-purple-600/10 border border-violet-400/20 backdrop-blur-sm">
                <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-violet-500/10 blur-xl" />
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-500/30">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {loading ? <span className="text-white/30">—</span> : cardCount}
                  </span>
                </div>
                <div className="text-xs text-white/40">{t.userDashboard.activeCards}</div>
              </div>

              {/* Total Stamps */}
              <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-blue-500/15 to-cyan-600/10 border border-blue-400/20 backdrop-blur-sm">
                <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-blue-500/10 blur-xl" />
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/30">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {loading ? <span className="text-white/30">—</span> : totalStamps}
                  </span>
                </div>
                <div className="text-xs text-white/40">{t.userDashboard.totalStamps}</div>
              </div>

              {/* Rewards Earned */}
              <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-500/15 to-orange-600/10 border border-amber-400/20 backdrop-blur-sm">
                <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-amber-500/10 blur-xl" />
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/30">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {loading ? <span className="text-white/30">—</span> : totalRewards}
                  </span>
                </div>
                <div className="text-xs text-white/40">{t.userDashboard.rewardsEarned}</div>
              </div>
            </div>

            {/* Protection Banner - only show if client has cards but no phone */}
            {clientId && cardCount > 0 && !hasPhone && !loading && (
              <div className="save-data-reminder mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/40">
                <style>{`
                  @keyframes saveDataPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(234,179,8,0.45); }
                    50% { box-shadow: 0 0 0 10px rgba(234,179,8,0); }
                  }
                  .save-data-reminder { animation: saveDataPulse 2.2s ease-in-out infinite; }
                `}</style>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-yellow-200 font-semibold mb-1">{t.protection.title}</h4>
                    <p className="text-yellow-100/80 text-sm mb-2">{t.protection.description}</p>
                    <p className="text-red-300 text-sm font-medium mb-3">{t.protection.warning}</p>
                    <button
                      onClick={() => setShowPhoneModal(true)}
                      className="px-4 py-2 bg-yellow-500 text-black text-sm font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      {t.protection.addPhone}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Protected Badge - show if phone is linked */}
            {clientId && hasPhone && !loading && (
              <div className="mb-3 bg-green-500/10 backdrop-blur-sm rounded-xl p-3 border border-green-500/30 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-green-200 text-sm flex-1">{t.protection.accountProtected}</span>
              </div>
            )}

            {/* Name row — always visible when clientId exists */}
            {clientId && !loading && (
              <div className="mb-6 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {clientName ? (
                  <span className="text-white text-sm flex-1 font-medium">{clientName}</span>
                ) : (
                  <span className="text-gray-400 text-sm flex-1 italic">{t.protection.addNameTitle}</span>
                )}
                <button
                  onClick={() => { setNameInput(clientName); setNameError(''); setNameSuccess(false); setShowNameModal(true) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                  title={clientName ? t.protection.addNameTitle : t.protection.addNameTitle}
                >
                  <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Get New Card */}
              <button
                onClick={() => navigate('/select-tenant')}
                className="group relative overflow-hidden rounded-2xl p-4 flex items-start gap-3 bg-gradient-to-br from-violet-500/20 to-purple-600/20 hover:from-violet-500/30 hover:to-purple-600/30 border border-violet-400/20 hover:border-violet-400/40 backdrop-blur-sm hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/30 group-hover:scale-105 transition-transform duration-200 mt-0.5">
                  <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-base leading-snug">{t.userDashboard.getNewCard}</div>
                  <div className="text-white/45 text-xs mt-1 leading-snug">{t.userDashboard.getNewCardDesc}</div>
                </div>
              </button>

              {/* View My Cards */}
              <button
                onClick={() => navigate('/wallet')}
                className="group relative overflow-hidden rounded-2xl p-4 flex items-start gap-3 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 hover:from-blue-500/30 hover:to-cyan-600/30 border border-blue-400/20 hover:border-blue-400/40 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200 mt-0.5">
                  <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-base leading-snug">{t.userDashboard.viewMyCards}</div>
                  <div className="text-white/45 text-xs mt-1 leading-snug">{t.userDashboard.viewMyCardsDesc}</div>
                </div>
              </button>

              {/* Recover Account */}
              <button
                onClick={() => navigate('/recovery')}
                className="group relative overflow-hidden rounded-2xl p-4 flex items-start gap-3 bg-gradient-to-br from-amber-500/20 to-orange-600/20 hover:from-amber-500/30 hover:to-orange-600/30 border border-amber-400/20 hover:border-amber-400/40 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform duration-200 mt-0.5">
                  <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-base leading-snug">{t.recovery.title}</div>
                  <div className="text-white/45 text-xs mt-1 leading-snug">{t.recovery.dashboardDesc}</div>
                </div>
              </button>

              {/* Install App or Delete tile */}
              {showInstallButton ? (
                <button
                  onClick={handleInstallClick}
                  className="group relative overflow-hidden rounded-2xl p-4 flex items-start gap-3 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30 border border-emerald-400/20 hover:border-emerald-400/40 backdrop-blur-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-200 mt-0.5">
                    <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-base leading-snug">{t.userDashboard.installApp}</div>
                    <div className="text-white/45 text-xs mt-1 leading-snug">{t.userDashboard.installAppDesc}</div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => { setDeleteInput(''); setDeleteError(''); setShowDeleteModal(true) }}
                  className="group relative overflow-hidden rounded-2xl p-4 flex items-start gap-3 bg-gradient-to-br from-red-500/10 to-rose-600/10 hover:from-red-500/20 hover:to-rose-600/20 border border-red-500/15 hover:border-red-500/30 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/40 to-rose-600/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 mt-0.5">
                    <svg className="w-[18px] h-[18px] text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-red-300 font-bold text-base leading-snug">{t.userDashboard.deleteAccountTitle}</div>
                    <div className="text-red-400/50 text-xs mt-1 leading-snug">{t.userDashboard.deleteAccountSub}</div>
                  </div>
                </button>
              )}
            </div>

            {/* Delete account row — only when install tile is occupying the 4th slot */}
            {showInstallButton && (
              <button
                onClick={() => { setDeleteInput(''); setDeleteError(''); setShowDeleteModal(true) }}
                className="mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/15 hover:bg-red-500/10 hover:border-red-500/25 backdrop-blur-sm transition-all duration-200 group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-red-400 font-medium text-sm">{t.userDashboard.deleteAccountTitle}</div>
                  <div className="text-red-500/50 text-xs">{t.userDashboard.deleteAccountSub}</div>
                </div>
                <svg className="w-4 h-4 text-red-500/30 group-hover:text-red-400/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Info Section */}
            <div className="mt-6 sm:mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">{t.userDashboard.howItWorksTitle}</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-400 font-bold">1</span>
                  </div>
                  <p className="text-gray-300">{t.userDashboard.step1}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-400 font-bold">2</span>
                  </div>
                  <p className="text-gray-300">{t.userDashboard.step2}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-400 font-bold">3</span>
                  </div>
                  <p className="text-gray-300">{t.userDashboard.step3}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-400 font-bold">4</span>
                  </div>
                  <p className="text-gray-300">{t.userDashboard.step4}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-md border border-red-500/30 shadow-2xl">
            {/* Handle bar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />

            {/* Icon */}
            <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-4">
              {t.userDashboard.deleteAccountTitle}
            </h3>

            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5">
              <p className="text-red-200 text-sm leading-relaxed">
                {hasPhone ? t.userDashboard.deleteLinkedWarning : t.userDashboard.deleteUnlinkedWarning}
              </p>
            </div>

            {/* Confirm input */}
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {t.userDashboard.deleteConfirmPrompt}
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
              placeholder={t.userDashboard.deleteConfirmWord}
              autoCapitalize="characters"
              autoCorrect="off"
              className={`w-full px-4 py-3 rounded-xl border text-white font-bold text-center text-lg tracking-widest mb-4 bg-white/5 focus:outline-none transition-colors ${
                deleteInput === t.userDashboard.deleteConfirmWord
                  ? 'border-red-500 bg-red-500/10 focus:ring-2 focus:ring-red-500/50'
                  : 'border-white/20 focus:border-red-400'
              }`}
            />

            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
                {deleteError}
              </div>
            )}

            {/* Buttons */}
            <button
              onClick={handleDeleteAccount}
              disabled={deleteInput !== t.userDashboard.deleteConfirmWord || deleting}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl mb-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {deleting ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              {t.userDashboard.deleteConfirmBtn}
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white/70 font-semibold rounded-xl transition-colors"
            >
              {t.wallet.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Name Modal - for existing users with phone but no name */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {clientName ? t.protection.editNameTitle : t.protection.addNameTitle}
              </h3>
              <button
                onClick={() => { setShowNameModal(false); setNameError('') }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {nameSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-200 text-lg">{t.protection.nameUpdated}</p>
              </div>
            ) : (
              <form onSubmit={handleSaveName} className="space-y-4">
                <p className="text-gray-300 text-sm">{t.protection.addNameDescription}</p>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {t.protection.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={t.protection.namePlaceholder}
                    maxLength={100}
                    autoFocus
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                    required
                  />
                </div>

                {nameError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {nameError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowNameModal(false); setNameError('') }}
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
                  >
                    {t.wallet.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={savingName || !nameInput.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                  >
                    {savingName ? '...' : t.protection.saveName}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Phone Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{t.protection.modalTitle}</h3>
              <button
                onClick={() => {
                  setShowPhoneModal(false)
                  setPhoneError('')
                  setPhone('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {showBackupCodes ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">{t.protection.phoneLinked}</h4>
                  <p className="text-yellow-300 text-sm mb-4">⚠️ Save these backup codes immediately!</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-2">
                  <p className="text-yellow-200 text-sm font-medium mb-3">
                    🔑 Your Backup Codes ({backupCodes.length} remaining)
                  </p>
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-black/30 rounded-lg px-4 py-2 font-mono text-white text-center">
                      {code}
                    </div>
                  ))}
                  <p className="text-yellow-200 text-xs mt-3">
                    • Each code can only be used once<br/>
                    • Use these if you forget your PIN<br/>
                    • Screenshot or write them down NOW
                  </p>
                </div>

                <button
                  onClick={handleCloseBackupCodes}
                  className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all"
                >
                  I saved my codes - Continue
                </button>
              </div>
            ) : phoneSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-200 text-lg">{t.protection.phoneLinked}</p>
              </div>
            ) : (
              <form onSubmit={handleLinkPhone} className="space-y-4">
                <p className="text-gray-300 text-sm">{t.protection.modalDescription}</p>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {t.protection.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.protection.namePlaceholder}
                    maxLength={100}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {t.protection.phoneLabel}
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    🔒 Security PIN (6 digits)
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 text-center text-2xl tracking-widest"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Choose a 6-digit PIN to protect your account</p>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 text-center text-2xl tracking-widest"
                    required
                  />
                </div>

                {phoneError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {phoneError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhoneModal(false)
                      setPhoneError('')
                      setPhone('')
                      setPin('')
                      setConfirmPin('')
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
                  >
                    {t.wallet.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={savingPhone}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                  >
                    {savingPhone ? '...' : t.protection.savePhone}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
