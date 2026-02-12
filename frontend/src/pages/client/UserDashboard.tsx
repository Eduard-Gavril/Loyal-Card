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
        setLoading(false)
        return
      }

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
    </div>
  )
}
