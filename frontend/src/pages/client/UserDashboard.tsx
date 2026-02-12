import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '@/store'
import { api } from '@/lib/supabase'
import DarkVeil from '@/components/DarkVeil'
import LanguageSelector from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/i18n'

export default function UserDashboard() {
  const navigate = useNavigate()
  const { clientId, language } = useClientStore()
  const t = getTranslation(language)
  const [loading, setLoading] = useState(true)
  const [cardCount, setCardCount] = useState(0)
  const [totalStamps, setTotalStamps] = useState(0)
  const [totalRewards, setTotalRewards] = useState(0)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  
  // Email protection state
  const [hasEmail, setHasEmail] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)

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

  const loadStats = async () => {
    setLoading(true)
    try {
      if (!clientId) {
        setCardCount(0)
        setTotalStamps(0)
        setTotalRewards(0)
        setHasEmail(false)
        setLoading(false)
        return
      }

      // Check if client has email
      const client = await api.getClient(clientId)
      setHasEmail(!!client?.email)

      const allCards = await api.getCardsByClient(clientId)
      setCardCount(allCards.length)

      let stamps = 0
      let rewards = 0

      allCards.forEach((card) => {
        const loyaltyState = card.loyalty_state || {}
        Object.values(loyaltyState).forEach((state: any) => {
          stamps += state?.count || 0
          rewards += state?.rewards || 0
        })
      })

      setTotalStamps(stamps)
      setTotalRewards(rewards)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
    setLoading(false)
  }

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !email) return

    setSavingEmail(true)
    setEmailError('')

    try {
      const result = await api.linkEmail(clientId, email)
      if (result.success) {
        setEmailSuccess(true)
        setHasEmail(true)
        setTimeout(() => {
          setShowEmailModal(false)
          setEmailSuccess(false)
        }, 2000)
      }
    } catch (err: any) {
      setEmailError(err.message || t.protection.linkError)
    } finally {
      setSavingEmail(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.3}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 z-10"></div>

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

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {loading ? '...' : cardCount}
                </div>
                <div className="text-xs sm:text-sm text-gray-300">{t.userDashboard.activeCards}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {loading ? '...' : totalStamps}
                </div>
                <div className="text-xs sm:text-sm text-gray-300">{t.userDashboard.totalStamps}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {loading ? '...' : totalRewards}
                </div>
                <div className="text-xs sm:text-sm text-gray-300">{t.userDashboard.rewardsEarned}</div>
              </div>
            </div>

            {/* Protection Banner - only show if client has cards but no email */}
            {clientId && cardCount > 0 && !hasEmail && !loading && (
              <div className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-yellow-200 font-semibold mb-1">{t.protection.title}</h4>
                    <p className="text-yellow-100/80 text-sm mb-2">{t.protection.description}</p>
                    <p className="text-red-300 text-sm font-medium mb-3">{t.protection.warning}</p>
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="px-4 py-2 bg-yellow-500 text-black text-sm font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      {t.protection.addEmail}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Protected Badge - show if email is linked */}
            {clientId && hasEmail && !loading && (
              <div className="mb-6 bg-green-500/10 backdrop-blur-sm rounded-xl p-3 border border-green-500/30 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-green-200 text-sm">{t.protection.accountProtected}</span>
              </div>
            )}

            {/* Action Cards */}
            <div className="space-y-4">
              {/* Get New Card - Main CTA */}
              <button
                onClick={() => navigate('/select-tenant')}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-left hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-600/40 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{t.userDashboard.getNewCard}</h3>
                    <p className="text-primary-100">{t.userDashboard.getNewCardDesc}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* View My Cards */}
              <button
                onClick={() => navigate('/wallet')}
                className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left hover:bg-white/20 transition-all duration-300 border border-white/20 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{t.userDashboard.viewMyCards}</h3>
                    <p className="text-gray-300">{t.userDashboard.viewMyCardsDesc}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Recover Account - always visible for users who need to restore their data */}
              <button
                onClick={() => navigate('/recovery')}
                className="w-full bg-white/5 backdrop-blur-sm rounded-xl p-4 text-left hover:bg-white/10 transition-all duration-300 border border-white/10 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white/80 mb-1">{t.recovery.title}</h3>
                    <p className="text-gray-400 text-sm">{t.recovery.dashboardDesc}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Install App - PWA */}
              {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left hover:bg-white/20 transition-all duration-300 border border-white/20 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{t.userDashboard.installApp}</h3>
                      <p className="text-gray-300">{t.userDashboard.installAppDesc}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Info Section */}
            <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-4">{t.userDashboard.howItWorksTitle}</h4>
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{t.protection.modalTitle}</h3>
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setEmailError('')
                  setEmail('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {emailSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-200 text-lg">{t.protection.emailLinked}</p>
              </div>
            ) : (
              <form onSubmit={handleLinkEmail} className="space-y-4">
                <p className="text-gray-300 text-sm">{t.protection.modalDescription}</p>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {t.protection.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.protection.emailPlaceholder}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                    required
                  />
                </div>

                {emailError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {emailError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false)
                      setEmailError('')
                      setEmail('')
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
                  >
                    {t.wallet.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50"
                  >
                    {savingEmail ? '...' : t.protection.saveEmail}
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
